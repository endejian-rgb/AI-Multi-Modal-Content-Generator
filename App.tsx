
import React, { useState, useCallback } from 'react';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { Style, OutputTab, GeneratedContent, GroundingSource, StoryboardScene, AspectRatio } from './types';
import { generateInitialContent, convertText, generateVideoStoryboard } from './services/geminiService';

function App() {
  const [topic, setTopic] = useState<string>('');
  const [style, setStyle] = useState<Style>(Style.Informational);
  const [personalStyle, setPersonalStyle] = useState<string>('');
  const [image, setImage] = useState<{ file: File, dataUrl: string, base64: string, mimeType: string } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SixteenNine);
  
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<OutputTab>(OutputTab.Article);

  const [storyboard, setStoryboard] = useState<StoryboardScene[] | null>(null);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState<boolean>(false);
  const [storyboardError, setStoryboardError] = useState<string | null>(null);


  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const dataUrl = URL.createObjectURL(file);
        const base64 = await fileToBase64(file);
        setImage({ file, dataUrl, base64, mimeType: file.type });
    }
  };

  const clearImage = () => {
    if (image) {
        URL.revokeObjectURL(image.dataUrl);
    }
    setImage(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setGroundingSources([]);
    setStoryboard(null);
    setStoryboardError(null);

    try {
      const imagePart = image ? { inlineData: { data: image.base64, mimeType: image.mimeType } } : null;
      const { content, groundingSources, finishReason } = await generateInitialContent(topic, style, personalStyle, imagePart);
      
      if (finishReason === 'SAFETY') {
        setError("The response was blocked due to safety concerns. Please adjust your topic or style.");
        return;
      }

      setGeneratedContent(content);
      setGroundingSources(groundingSources);
      setActiveTab(OutputTab.Article); 
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, style, personalStyle, image]);

  const handleConvert = useCallback(async (target: 'script' | 'summary') => {
    if (!generatedContent) return;

    const sourceText = target === 'script' ? generatedContent.article : generatedContent.script;
    if (!sourceText) {
        setError(`Source content for conversion is empty.`);
        return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
        const result = await convertText(sourceText, target);
        if (target === 'script') {
            setGeneratedContent(prev => prev ? { ...prev, script: result } : null);
            setActiveTab(OutputTab.Script);
        } else {
            setGeneratedContent(prev => prev ? { ...prev, article: result } : null);
            setActiveTab(OutputTab.Article);
        }
    } catch (e: any) {
        console.error(e);
        setError(e.message || 'An unexpected error occurred during conversion.');
    } finally {
        setIsLoading(false);
    }
  }, [generatedContent]);

  const handleGenerateStoryboard = useCallback(async () => {
    if (!generatedContent?.script) return;
    
    setIsGeneratingStoryboard(true);
    setStoryboardError(null);
    setStoryboard(null);

    try {
        const result = await generateVideoStoryboard(generatedContent.script, aspectRatio);
        if (result.length === 0) {
            setStoryboardError("Could not generate storyboard from the script. Try regenerating content or adjusting the script format.");
        } else {
            setStoryboard(result);
            setActiveTab(OutputTab.Storyboard);
        }
    } catch (e: any) {
        console.error(e);
        setStoryboardError(e.message || 'An unexpected error occurred while creating the storyboard.');
    } finally {
        setIsGeneratingStoryboard(false);
    }
  }, [generatedContent, aspectRatio]);


  return (
    <div className="flex flex-col lg:flex-row h-screen font-sans bg-gray-100">
      <InputPanel
        topic={topic}
        setTopic={setTopic}
        style={style}
        setStyle={setStyle}
        personalStyle={personalStyle}
        setPersonalStyle={setPersonalStyle}
        generatedContent={generatedContent}
        isLoading={isLoading}
        handleGenerate={handleGenerate}
        handleConvert={handleConvert}
        image={image}
        handleImageChange={handleImageChange}
        clearImage={clearImage}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
      />
      <main className="flex-1 flex flex-col h-full">
         <OutputPanel
            isLoading={isLoading}
            error={error}
            generatedContent={generatedContent}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            groundingSources={groundingSources}
            storyboard={storyboard}
            handleGenerateStoryboard={handleGenerateStoryboard}
            isGeneratingStoryboard={isGeneratingStoryboard}
            storyboardError={storyboardError}
        />
      </main>
    </div>
  );
}

export default App;