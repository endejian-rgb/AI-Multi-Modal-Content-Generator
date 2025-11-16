
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GeneratedContent, Style, StoryboardScene, AspectRatio, Language, Voice, InfographicGenerationResponse, ComplianceProfile, SeoAnalysisResult, ImageQuality, ImageStyle } from '../types';

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
    personalStyleSamples: string[], 
    imagePart: {inlineData: {data: string, mimeType: string}} | null,
    language: Language,
    complianceProfile: ComplianceProfile,
) => {
  const styleDescription = {
    [Style.Informational]: "Objective, data-driven, and educational. Like a news report or encyclopedia entry.",
    [Style.Personal]: "Subjective, anecdotal, and relatable. Sharing a personal story or opinion.",
    [Style.Entertainment]: "Witty, humorous, and engaging. Designed to amuse and captivate the audience.",
    [Style.Professional]: "Formal, structured, and authoritative. Suitable for business reports, whitepapers, or corporate communications.",
    [Style.Technical]: "Detailed, precise, and expert-driven. Focuses on technical specifics and how-to instructions for a knowledgeable audience.",
  };

  const learningStylePrompt = personalStyleSamples.length > 0
    ? `Critically, you MUST learn from and emulate the user's provided writing style(s) below:
--- USER STYLE EXAMPLES ---
${personalStyleSamples.join('\n\n---\n\n')}
-------------------------`
    : "Use a general, engaging, and widely appealing style.";

  const complianceInstructions = {
    [ComplianceProfile.Standard]: "Ensure content is generally safe and appropriate for a broad audience.",
    [ComplianceProfile.COPPA]: "All content generated MUST be suitable for children under 13 and compliant with COPPA guidelines. Avoid mature themes, user data collection references, and direct calls to action that involve personal information.",
    [ComplianceProfile.GDPR]: "Content must adhere to GDPR principles. Avoid any examples or text that imply collection of user data without explicit consent. Emphasize data privacy and user rights where relevant.",
    [ComplianceProfile.Healthcare]: "Content related to healthcare must be cautious, evidence-based, and avoid making unsubstantiated medical claims. Frame advice as general information, not a diagnosis. Comply with general principles of HIPAA regarding patient privacy in any examples.",
  };

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
      systemInstruction: complianceInstructions[complianceProfile],
      tools: [{ googleSearch: {} }],
    },
  });

  const content = parseResponse(response.text);
  const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const finishReason = response.candidates?.[0]?.finishReason || 'UNKNOWN';
  
  return { content, groundingSources, finishReason };
};

export const generateTopicIdeas = async (field: string, language: Language, trendSource: string): Promise<string[]> => {
    if (!field.trim()) {
        return [];
    }
    
    const trendContext = {
        'General': 'The ideas should be generally appealing and evergreen.',
        'Social Media Trends': 'The ideas should be highly relevant to current social media trends, hot topics, and viral challenges related to the field. Use Google Search to find what is currently trending.',
        'Industry News': 'The ideas should be based on recent news, breakthroughs, or important developments within the industry. Use Google Search to find recent and relevant news.'
    };

    const prompt = `Generate 5 unique and engaging content topic ideas related to the field of '${field}'. ${trendContext[trendSource]} The ideas should be suitable for blog posts or short videos. The response must be in ${language}.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: trendSource !== 'General' ? [{ googleSearch: {} }] : [],
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

export const analyzeSeoTrends = async (topic: string, titlesAndTags: string): Promise<SeoAnalysisResult> => {
    const prompt = `
Act as a world-class SEO analysis tool like Ahrefs or SEMrush. Your task is to provide a strategic analysis of the given topic and associated keywords/titles.

**Topic:**
${topic}

**Generated Titles & Tags:**
${titlesAndTags}

---

Based on the information above and your access to Google Search for real-time trends, generate a JSON response with the following structure. Do not provide any text outside of the JSON object.

1.  **keywordDifficulty**: An estimated score from 0-100 representing how difficult it would be to rank for the primary keywords.
2.  **searchVolumeTrend**: A string indicating the general search interest trend. Must be one of: 'Rising', 'Stable', 'Falling'.
3.  **competitorAnalysis**: A concise paragraph (2-3 sentences) summarizing the likely competition for this topic. Mention the types of sites currently ranking (e.g., major publications, niche blogs, e-commerce sites).
4.  **contentStrategy**: A paragraph (2-3 sentences) of actionable advice. Recommend a specific angle or format that could help this content stand out and rank well.
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keywordDifficulty: { type: Type.INTEGER, description: "Score from 0 to 100." },
                    searchVolumeTrend: { type: Type.STRING, description: "One of: 'Rising', 'Stable', 'Falling'." },
                    competitorAnalysis: { type: Type.STRING, description: "Summary of competition." },
                    contentStrategy: { type: Type.STRING, description: "Actionable strategic advice." },
                },
                required: ["keywordDifficulty", "searchVolumeTrend", "competitorAnalysis", "contentStrategy"],
            },
        },
    });

    try {
        const jsonText = response.text;
        return JSON.parse(jsonText) as SeoAnalysisResult;
    } catch (e) {
        console.error("Failed to parse SEO analysis JSON:", e);
        throw new Error("The AI returned an invalid data structure for the SEO analysis.");
    }
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

async function processPromisesBatch<T>(
  promiseFactories: (() => Promise<T>)[],
  concurrencyLimit: number,
): Promise<T[]> {
  const results: T[] = new Array(promiseFactories.length);
  let taskIndex = 0;
  
  const worker = async () => {
    while (taskIndex < promiseFactories.length) {
      const currentIndex = taskIndex++;
      const promiseFactory = promiseFactories[currentIndex];
      if (promiseFactory) {
        try {
          results[currentIndex] = await promiseFactory();
        } catch (error) {
          console.error(`Error processing task at index ${currentIndex}:`, error);
          results[currentIndex] = null as any; 
        }
      }
    }
  };

  const workers = Array(concurrencyLimit).fill(null).map(worker);
  await Promise.all(workers);
  return results;
}


export const generateVideoStoryboard = async (
    script: string, 
    aspectRatio: AspectRatio,
    voice: Voice,
    pitch: number,
    speakingRate: number,
): Promise<StoryboardScene[]> => {
    const scenes = parseScriptToScenes(script);
    if (!scenes.length) {
        return [];
    }

    const scenePromiseFactories = scenes.map((scene) => async () => {
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
                                prebuiltVoiceConfig: { voiceName: voice },
                                pitch: pitch,
                                speakingRate: speakingRate,
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

    const results = await processPromisesBatch(scenePromiseFactories, 5); // Concurrently process 5 scenes at a time
    return results.filter((scene): scene is StoryboardScene => scene !== null);
};

export const generateImageFromText = async (
    prompt: string,
    aspectRatio: string,
    quality: ImageQuality,
    style: ImageStyle,
    negativePrompt: string,
): Promise<string> => {
    if (!prompt.trim()) {
        throw new Error("Prompt cannot be empty.");
    }

    let finalPrompt = prompt;

    const stylePrefixes = {
        [ImageStyle.Photorealistic]: 'Photorealistic, hyper-detailed photograph of ',
        [ImageStyle.Cartoon]: 'Playful cartoon style, vibrant colors, clear outlines, ',
        [ImageStyle.Abstract]: 'Abstract art, expressive, non-representational, focusing on colors and shapes, ',
        [ImageStyle.Anime]: 'Anime manga style, dynamic, cinematic, detailed characters, ',
        [ImageStyle.Fantasy]: 'Epic fantasy art, detailed, imaginative, cinematic lighting, ',
        [ImageStyle.None]: '',
    };
    finalPrompt = stylePrefixes[style] + finalPrompt;

    if (quality === ImageQuality.HD) {
        finalPrompt += ', 4K, ultra high definition, sharp focus, intricate details';
    }

    if (negativePrompt.trim()) {
        finalPrompt += `. Negative prompt: avoid ${negativePrompt.trim()}`;
    }

    // Add specific instructions for rendering Chinese characters accurately if they exist.
    const chineseCharRegex = /[\u4e00-\u9fa5]/;
    if (chineseCharRegex.test(prompt)) {
        finalPrompt += '. CRITICAL INSTRUCTION: This prompt contains Chinese characters. You MUST render these characters accurately and legibly. Pay extreme attention to the exact strokes and shapes of each character.';
    }

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio as '1:1' | '3:4' | '4:3' | '9:16' | '16:9',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Image generation failed. The model did not return an image.");
    }

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return base64ImageBytes;
};

export const generateInfographicText = async (
    sourceText: string,
): Promise<InfographicGenerationResponse> => {
    if (!sourceText.trim()) {
        throw new Error("Source text cannot be empty.");
    }

    const prompt = `You are an expert data visualizer and content strategist. Your task is to compress the following text into a structured format suitable for an infographic.

Follow these instructions precisely:
1.  **Analyze the Text**: Read and understand the core concepts of the provided text.
2.  **Modularize**: Automatically generate 6–10 distinct modules.
3.  **Module Titles**: Each module must have a concise, visual-friendly title.
4.  **Bullet Points**: Each module must contain 3–6 short, high-density bullet points that are easy to understand at a glance.
5.  **Module Type Identification**: For each module, you MUST identify its type from this specific list: 'scale', 'phenomenon', 'impact', 'mechanism', 'risk', 'recommendation', 'limitation', 'conclusion'.
6.  **Output Format**: You MUST return a single, valid JSON object. Do not add any text before or after the JSON object. The JSON object must conform to the provided schema.

--- TEXT TO ANALYZE ---
${sourceText}
-----------------------
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    modularSummary: {
                        type: Type.STRING,
                        description: "A markdown-formatted string with module names as headings and bullets underneath."
                    },
                    structuredJSON: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "A concise title for the infographic."},
                            modules: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        type: { type: Type.STRING },
                                        bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    },
                                    required: ["name", "type", "bullets"]
                                }
                            },
                            summary: { type: Type.STRING, description: "A final one-sentence conclusion."}
                        },
                        required: ["title", "modules", "summary"]
                    },
                    infographicScript: {
                        type: Type.STRING,
                        description: "A final, well-formatted text script ready to be pasted into a design tool."
                    }
                },
                required: ["modularSummary", "structuredJSON", "infographicScript"]
            },
        },
    });

    try {
        const jsonText = response.text;
        const result: InfographicGenerationResponse = JSON.parse(jsonText);
        // Basic validation
        if (!result.modularSummary || !result.structuredJSON || !result.infographicScript) {
            throw new Error("The AI response is missing required fields.");
        }
        return result;
    } catch (e) {
        console.error("Failed to parse infographic JSON:", e);
        throw new Error("The AI returned an invalid data structure. Please try again.");
    }
}
