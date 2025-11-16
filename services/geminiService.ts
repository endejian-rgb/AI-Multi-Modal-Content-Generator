
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GeneratedContent, Style, StoryboardScene, AspectRatio, Language } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseResponse = (text: string): GeneratedContent => {
  const articleMatch = text.match(/## Image-Text Article([\s\S]*?)## Video Script/);
  const scriptMatch = text.match(/## Video Script([\s\S]*?)## Titles & Tags/);
  const titlesMatch = text.match(/## Titles & Tags([\s\S]*)/);

  return {
    article: articleMatch ? articleMatch[1].trim() : 'Could not parse article.',
    script: scriptMatch ? scriptMatch[1].trim() : 'Could not parse script.',
    titles: titlesMatch ? titlesMatch[1].trim() : 'Could not parse titles and tags.',
  };
};

export const generateInitialContent = async (
    topic: string, 
    style: Style, 
    personalStyle: string, 
    imagePart: {inlineData: {data: string, mimeType: string}} | null,
    language: Language
) => {
  const styleDescription = {
    [Style.Informational]: "Objective, data-driven, and educational. Like a news report or encyclopedia entry.",
    [Style.Personal]: "Subjective, anecdotal, and relatable. Sharing a personal story or opinion.",
    [Style.Entertainment]: "Witty, humorous, and engaging. Designed to amuse and captivate the audience.",
    [Style.Professional]: "Formal, structured, and authoritative. Suitable for business reports, whitepapers, or corporate communications.",
    [Style.Technical]: "Detailed, precise, and expert-driven. Focuses on technical specifics and how-to instructions for a knowledgeable audience.",
  };

  const learningStylePrompt = personalStyle 
    ? `Critically, you MUST learn from and emulate the user's provided writing style below:
--- USER STYLE EXAMPLES ---
${personalStyle}
-------------------------`
    : "Use a general, engaging, and widely appealing style.";

  const prompt = `
You are an expert content creator and SEO strategist. Your task is to generate a complete content package based on the user's topic and provided media. You MUST use Google Search to get up-to-date and accurate information for your response.
You MUST write the entire response in ${language}.

The user's topic is: "${topic}"
${imagePart ? "The user has also provided an image for context. Analyze it carefully." : ""}

Please adhere to the following style and tone:
- Style: ${styleDescription[style]}
- ${learningStylePrompt}

Generate the following three sections, clearly separated by the specified markdown headings. Do not include any other text, introductions, or summaries before the first heading or after the last one.

## Image-Text Article
[Write a detailed, well-structured article suitable for a blog post or social media. ${imagePart ? "Integrate observations from the provided image naturally into the text." : ""} Use markdown for formatting like bold text, italics, and lists.]

## Video Script
[Write a concise and engaging video script based on the article. Include suggestions for visuals where appropriate, like "[Visual: ...]". ${imagePart ? "Reference the provided image or similar visuals in your suggestions." : ""} Format it with speaker labels if necessary, like "Narrator:".]

## Titles & Tags
[Assume the persona of a world-class SEO strategist and viral content marketer. Your goal is to maximize discoverability and click-through rate. Analyze the provided topic and grounded search data to perform the following:

1.  **Titles (Provide 5 options):**
    *   Generate 5 unique, highly click-worthy titles.
    *   Use a variety of proven formulas (e.g., "The Ultimate Guide to X," "Y Mistakes You're Making in Z," "How to [Achieve Desired Outcome]," "Is [Topic] Really [Controversial Claim]?").
    *   Incorporate power words and emotional triggers (e.g., "Effortless," "Proven," "Secret," "Warning").
    *   Ensure titles are concise (under 60 characters) and reflect the core search intent (informational, transactional, etc.).

2.  **Tags & Keywords (Provide a comprehensive list):**
    *   **Primary Keywords (3-5):** The main search terms people will use.
    *   **Long-Tail Keywords (5-7):** More specific, multi-word phrases that target niche audiences.
    *   **LSI Keywords (5-7):** Semantically related terms and concepts that help search engines understand the context (e.g., if the topic is "baking bread," LSI keywords might be "sourdough starter," "yeast," "proofing," "flour types").
    *   **Platform-Specific Tags (e.g., for YouTube/Blog, provide 5):** Hashtags or categories relevant to platforms where this content might be shared.
    *   Format this section clearly with subheadings for each keyword type.
]
`;

  const contents = imagePart ? { parts: [{text: prompt}, imagePart] } : prompt;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const content = parseResponse(response.text);
  const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const finishReason = response.candidates?.[0]?.finishReason || 'UNKNOWN';
  
  return { content, groundingSources, finishReason };
};

export const generateTopicIdeas = async (field: string, language: Language): Promise<string[]> => {
    if (!field.trim()) {
        return [];
    }

    const prompt = `Generate 5 unique and engaging content topic ideas related to the field of '${field}'. The ideas should be suitable for blog posts or short videos. The response must be in ${language}.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    ideas: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING,
                        }
                    }
                }
            },
        },
    });

    try {
        const jsonText = response.text;
        const result = JSON.parse(jsonText);
        return result.ideas || [];
    } catch (e) {
        console.error("Failed to parse topic ideas JSON:", e);
        // Attempt to return a graceful failure if the AI gives a text response instead of JSON
        return [`Failed to get ideas. The AI said: ${response.text}`];
    }
}

export const convertText = async (sourceText: string, targetFormat: 'script' | 'summary', language: Language) => {
  const prompt = targetFormat === 'script' 
    ? `Convert the following article into a concise and engaging video script. Include suggestions for visuals where appropriate, like "[Visual: ...]". The output script MUST be in ${language}.\n\nArticle:\n${sourceText}`
    : `Summarize the following video script into a well-structured image-text article suitable for a blog post. The output article MUST be in ${language}.\n\nScript:\n${sourceText}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
        tools: [{ googleSearch: {} }],
    }
  });

  return response.text;
};

const parseScriptToScenes = (script: string): { text: string; visual: string }[] => {
    const scenes: { text: string; visual: string }[] = [];
    const narrationBlocks = script.split(/\n\s*\n/); 

    for (const block of narrationBlocks) {
        if (!block.trim()) continue;

        const textParts: string[] = [];
        let visualCue = '';

        const lines = block.split('\n');
        for (const line of lines) {
            if (line.trim().startsWith('[Visual:')) {
                visualCue = line.replace('[Visual:', '').replace(']', '').trim();
            } else {
                textParts.push(line.replace(/^[a-zA-Z]+:\s*/, '').trim());
            }
        }
        const narrationText = textParts.filter(Boolean).join(' ');
        if(narrationText) {
            scenes.push({ text: narrationText, visual: visualCue });
        }
    }
    return scenes;
};

export const generateVideoStoryboard = async (script: string, aspectRatio: AspectRatio): Promise<StoryboardScene[]> => {
    const scenes = parseScriptToScenes(script);
    if (!scenes.length) {
        return [];
    }

    const scenePromises = scenes.map(async (scene) => {
        try {
            const imagePrompt = `Generate a highly detailed and cinematic image for a video storyboard with a ${aspectRatio} aspect ratio. The image must visually represent the following scene. Be specific and descriptive with visual elements like camera angles (e.g., close-up, wide shot), lighting (e.g., soft light, dramatic shadows), composition, colors, and any characters' expressions or actions. Scene: "${scene.visual || scene.text}"`;

            const [imageResponse, audioResponse] = await Promise.all([
                ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [{ text: imagePrompt }],
                    },
                    config: {
                        responseModalities: [Modality.IMAGE],
                    },
                }),
                ai.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text: scene.text }] }],
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: 'Kore' },
                            },
                        },
                    },
                })
            ]);

            const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            const audioPart = audioResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

            if (!imagePart?.inlineData?.data || !audioPart?.inlineData?.data) {
                console.warn('Missing image or audio data for scene:', scene.text);
                return null;
            }
            
            return {
                text: scene.text,
                image: imagePart.inlineData.data,
                audio: audioPart.inlineData.data,
            };
        } catch (error) {
            console.error('Failed to generate scene:', scene.text, error);
            return null;
        }
    });

    const results = await Promise.all(scenePromises);
    return results.filter((scene): scene is StoryboardScene => scene !== null);
};