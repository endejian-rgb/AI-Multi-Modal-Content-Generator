
import React, { useState, useCallback, useEffect } from 'react';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { Style, OutputTab, GeneratedContent, GroundingSource, StoryboardScene, AspectRatio, Language, Voice, ComplianceProfile, SeoAnalysisResult } from './types';
import { generateInitialContent, convertText, generateVideoStoryboard, generateTopicIdeas, analyzeSeoTrends } from './services/geminiService';
import { ImageStudio } from './components/ImageStudio';
import { Icon } from './components/Icons';

const NavButton: React.FC<{
  label: string;
  iconName: 'google' | 'image-studio';
  isActive: boolean;
  onClick: () => void;
}> = ({ label, iconName, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
      isActive
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-200'
    }`}
  >
    <Icon name={iconName} className="w-5 h-5" />
    <span className="font-semibold">{label}</span>
  </button>
);


function App() {
  const [activeView, setActiveView] = useState<'generator' | 'studio'>('generator');

  // State for Content Generator
  const [topic, setTopic] = useState<string>('');
  const [style, setStyle] = useState<Style>(Style.Informational);
  const [personalStyleSamples, setPersonalStyleSamples] = useState<string[]>(['']);
  const [autoLearnStyle, setAutoLearnStyle] = useState<boolean>(false);
  const [image, setImage] = useState<{ file: File, dataUrl: string, base64: string, mimeType: string } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SixteenNine);
  const [language, setLanguage] = useState<Language>(Language.English);
  const [voice, setVoice] = useState<Voice>(Voice.Kore);
  const [pitch, setPitch] = useState<number>(0);
  const [speakingRate, setSpeakingRate] = useState<number>(1);
  const [complianceProfile, setComplianceProfile] = useState<ComplianceProfile>(ComplianceProfile.Standard);
  
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<OutputTab>(OutputTab.Article);

  const [storyboard, setStoryboard] = useState<StoryboardScene[] | null>(null);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState<boolean>(false);
  const [storyboardError, setStoryboardError] = useState<string | null>(null);

  const [ideaField, setIdeaField] = useState<string>('');
  const [ideaTrendSource, setIdeaTrendSource] = useState('General');
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false);
  const [ideaError, setIdeaError] = useState<string | null>(null);

  const [isAnalyzingSeo, setIsAnalyzingSeo] = useState<boolean>(false);
  const [seoAnalysis, setSeoAnalysis] = useState<SeoAnalysisResult | null>(null);
  const [isSeoModalOpen, setIsSeoModalOpen] = useState<boolean>(false);
  const [seoError, setSeoError] = useState<string | null>(null);


  // Effect for auto-learn from history (using localStorage to simulate)
  useEffect(() => {
    if (generatedContent?.article) {
        try {
            const history = JSON.parse(localStorage.getItem('generationHistory') || '[]');
            const newHistory = [generatedContent.article, ...history].slice(0, 3);
            localStorage.setItem('generationHistory', JSON.stringify(newHistory));
        } catch (e) {
            console.error("Could not update generation history:", e);
        }
    }
  }, [generatedContent?.article]);


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

  const handleGenerateIdeas = useCallback(async () => {
    if (!ideaField.trim()) return;

    setIsGeneratingIdeas(true);
    setIdeaError(null);
    setGeneratedIdeas([]);

    try {
      const ideas = await generateTopicIdeas(ideaField, language, ideaTrendSource);
      if (ideas.length === 0 || ideas[0].startsWith('Failed')) {
        setIdeaError(ideas[0] || "Could not generate ideas. Try a different field.");
        setGeneratedIdeas([]);
      } else {
        setGeneratedIdeas(ideas);
      }
    } catch (e: any) {
      console.error(e);
      setIdeaError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, [ideaField, language, ideaTrendSource]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setGroundingSources([]);
    setStoryboard(null);
    setStoryboardError(null);
    setSeoAnalysis(null);
    setSeoError(null);

    let finalStyleSamples = personalStyleSamples.filter(s => s.trim() !== '');
    if (autoLearnStyle) {
        try {
            const history = JSON.parse(localStorage.getItem('generationHistory') || '[]');
            finalStyleSamples = [...history, ...finalStyleSamples];
        } catch (e) {
            console.error("Could not load generation history for auto-learn:", e);
        }
    }

    try {
      const imagePart = image ? { inlineData: { data: image.base64, mimeType: image.mimeType } } : null;
      const { content, groundingSources, finishReason } = await generateInitialContent(topic, style, finalStyleSamples, imagePart, language, complianceProfile);
      
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
  }, [topic, style, personalStyleSamples, autoLearnStyle, image, language, complianceProfile]);

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
        const result = await convertText(sourceText, target, language);
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
  }, [generatedContent, language]);

  const handleGenerateStoryboard = useCallback(async () => {
    if (!generatedContent?.script) return;
    
    setIsGeneratingStoryboard(true);
    setStoryboardError(null);
    setStoryboard(null);

    try {
        const result = await generateVideoStoryboard(generatedContent.script, aspectRatio, voice, pitch, speakingRate);
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
  }, [generatedContent, aspectRatio, voice, pitch, speakingRate]);

  const handleAnalyzeSeo = useCallback(async () => {
    if (!generatedContent?.titles) return;
    setIsAnalyzingSeo(true);
    setSeoAnalysis(null);
    setSeoError(null);
    setIsSeoModalOpen(true);
    try {
        const result = await analyzeSeoTrends(topic, generatedContent.titles);
        setSeoAnalysis(result);
    } catch (e: any) {
        console.error(e);
        setSeoError(e.message || 'An unexpected error occurred during SEO analysis.');
    } finally {
        setIsAnalyzingSeo(false);
    }
  }, [topic, generatedContent]);


  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100">
        <header className="bg-white shadow-sm z-10 border-b">
            <nav className="mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-center items-center space-x-2 sm:space-x-4">
                <NavButton
                    label="Content Generator"
                    iconName="google"
                    isActive={activeView === 'generator'}
                    onClick={() => setActiveView('generator')}
                />
                <NavButton
                    label="Image Studio"
                    iconName="image-studio"
                    isActive={activeView === 'studio'}
                    onClick={() => setActiveView('studio')}
                />
            </nav>
        </header>

      {activeView === 'generator' && (
        <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
          <InputPanel
            topic={topic}
            setTopic={setTopic}
            style={style}
            setStyle={setStyle}
            personalStyleSamples={personalStyleSamples}
            setPersonalStyleSamples={setPersonalStyleSamples}
            autoLearnStyle={autoLearnStyle}
            setAutoLearnStyle={setAutoLearnStyle}
            generatedContent={generatedContent}
            isLoading={isLoading}
            handleGenerate={handleGenerate}
            handleConvert={handleConvert}
            image={image}
            handleImageChange={handleImageChange}
            clearImage={clearImage}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            language={language}
            setLanguage={setLanguage}
            voice={voice}
            setVoice={setVoice}
            pitch={pitch}
            setPitch={setPitch}
            speakingRate={speakingRate}
            setSpeakingRate={setSpeakingRate}
            ideaField={ideaField}
            setIdeaField={setIdeaField}
            ideaTrendSource={ideaTrendSource}
            setIdeaTrendSource={setIdeaTrendSource}
            generatedIdeas={generatedIdeas}
            setGeneratedIdeas={setGeneratedIdeas}
            isGeneratingIdeas={isGeneratingIdeas}
            handleGenerateIdeas={handleGenerateIdeas}
            ideaError={ideaError}
            complianceProfile={complianceProfile}
            setComplianceProfile={setComplianceProfile}
          />
          <main className="flex-1 flex flex-col h-full overflow-hidden">
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
                aspectRatio={aspectRatio}
                handleAnalyzeSeo={handleAnalyzeSeo}
                isAnalyzingSeo={isAnalyzingSeo}
                seoAnalysis={seoAnalysis}
                isSeoModalOpen={isSeoModalOpen}
                setIsSeoModalOpen={setIsSeoModalOpen}
                seoError={seoError}
            />
          </main>
        </div>
      )}
      
      {activeView === 'studio' && (
        <div className="flex-1 flex h-full overflow-hidden">
            <ImageStudio />
        </div>
      )}

    </div>
  );
}

export default App;
