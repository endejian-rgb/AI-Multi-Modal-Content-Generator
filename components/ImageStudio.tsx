
import React, { useState, useEffect, useCallback } from 'react';
import { AspectRatio, InfographicGenerationResponse, ImageQuality, ImageStyle } from '../types';
import { generateImageFromText, generateInfographicText } from '../services/geminiService';
import { Icon } from './Icons';
import Loader from './Loader';
import ReactMarkdown from 'react-markdown';

type StudioTab = 'text-to-image' | 'text-to-infographic';

interface TextToImageStudioProps {
  initialPrompt?: string;
  onClearInitialPrompt: () => void;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
    };

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    return (
        <button 
            onClick={handleCopy}
            className="absolute top-2 right-2 bg-gray-600 text-white hover:bg-gray-700 px-3 py-1 rounded-md text-sm font-medium flex items-center transition-all"
        >
            <Icon name="copy" className="w-4 h-4 mr-2"/>
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
};

const TextToImageStudioComponent: React.FC<TextToImageStudioProps> = ({ initialPrompt, onClearInitialPrompt }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SixteenNine);
    const [quality, setQuality] = useState<ImageQuality>(ImageQuality.Standard);
    const [style, setStyle] = useState<ImageStyle>(ImageStyle.None);
    const [negativePrompt, setNegativePrompt] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInfographicMode, setIsInfographicMode] = useState(false);
    const [infographicColorPalette, setInfographicColorPalette] = useState('Pastel, calming, minimalist');
    const [infographicVisualStyle, setInfographicVisualStyle] = useState('Flat icons, clean layout');

    const updatePromptForInfographic = useCallback((baseScript: string) => {
        setPrompt(`Create a visually appealing, professional infographic based on the following content.
- Use a color palette described as: "${infographicColorPalette}".
- The visual style should be: "${infographicVisualStyle}".
- The layout should be organized into distinct modules as described below.
- Ensure typography is clean and readable.
- Do not include any text that says "Infographic Script". Just generate the image of the infographic itself.

--- INFOGRAPHIC CONTENT ---
${baseScript}
---------------------------`);
    }, [infographicColorPalette, infographicVisualStyle]);

    useEffect(() => {
        if (initialPrompt) {
            setPrompt(initialPrompt);
            setAspectRatio(AspectRatio.NineSixteen); // Default to portrait for infographics
            setIsInfographicMode(true);
            updatePromptForInfographic(initialPrompt);
        } else {
            setIsInfographicMode(false);
        }
    }, [initialPrompt, updatePromptForInfographic]);
    
    useEffect(() => {
        if (isInfographicMode && initialPrompt) {
            updatePromptForInfographic(initialPrompt);
        }
    }, [infographicColorPalette, infographicVisualStyle, isInfographicMode, initialPrompt, updatePromptForInfographic]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const imageB64 = await generateImageFromText(prompt, aspectRatio, quality, style, negativePrompt);
            setGeneratedImage(imageB64);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "An unexpected error occurred during image generation.");
        } finally {
            setIsLoading(false);
        }
        onClearInitialPrompt(); // Clear the one-time prompt after generation
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${generatedImage}`;
        link.download = 'ai-generated-image.jpeg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const Spinner = () => (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    return (
        <div className="w-full h-full flex items-start justify-center p-4 md:p-8 overflow-y-auto">
            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="flex flex-col space-y-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                        <label htmlFor="prompt" className="text-base font-semibold text-gray-800">1. Describe Your Image</label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => {
                                setPrompt(e.target.value);
                                if (isInfographicMode) {
                                    setIsInfographicMode(false);
                                    onClearInitialPrompt();
                                }
                            }}
                            placeholder="e.g., A cinematic shot of a lone astronaut looking at a swirling nebula, vibrant colors, detailed spacesuit..."
                            className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                            disabled={isLoading}
                        />
                    </div>
                     {isInfographicMode && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-3 animate-[fadeIn_0.3s_ease-out]">
                             <h3 className="text-base font-semibold text-purple-800">Infographic Design Options</h3>
                             <div>
                                 <label htmlFor="color-palette" className="block text-sm font-medium text-gray-700 mb-1">Color Palette</label>
                                 <input id="color-palette" value={infographicColorPalette} onChange={(e) => setInfographicColorPalette(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                             </div>
                             <div>
                                 <label htmlFor="visual-style" className="block text-sm font-medium text-gray-700 mb-1">Visual Style</label>
                                 <input id="visual-style" value={infographicVisualStyle} onChange={(e) => setInfographicVisualStyle(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                             </div>
                        </div>
                     )}
                     <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                        <h2 className="text-base font-semibold text-gray-800">2. Basic Settings</h2>
                        <label htmlFor="aspect-ratio-select-studio" className="block text-sm font-medium text-gray-700">Aspect Ratio</label>
                        <select
                            id="aspect-ratio-select-studio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                            disabled={isLoading}
                        >
                            <option value={AspectRatio.NineSixteen}>9:16 (Portrait)</option>
                            <option value={AspectRatio.SixteenNine}>16:9 (Landscape)</option>
                            <option value={AspectRatio.OneOne}>1:1 (Square)</option>
                            <option value={AspectRatio.FourThree}>4:3 (Standard)</option>
                            <option value={AspectRatio.ThreeFour}>3:4 (Tall)</option>
                        </select>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
                        <h2 className="text-base font-semibold text-gray-800">3. Advanced Options</h2>
                        <div>
                            <label htmlFor="style-select-studio" className="block text-sm font-medium text-gray-700 mb-1">Style Preset</label>
                            <select
                                id="style-select-studio"
                                value={style}
                                onChange={(e) => setStyle(e.target.value as ImageStyle)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                                disabled={isLoading}
                            >
                                {Object.values(ImageStyle).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="quality-select-studio" className="block text-sm font-medium text-gray-700 mb-1">Image Quality</label>
                            <select
                                id="quality-select-studio"
                                value={quality}
                                onChange={(e) => setQuality(e.target.value as ImageQuality)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                                disabled={isLoading}
                            >
                                <option value={ImageQuality.Standard}>Standard</option>
                                <option value={ImageQuality.HD}>HD (High Detail)</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-700 mb-1">Negative Prompt (what to avoid)</label>
                            <input
                                id="negative-prompt"
                                value={negativePrompt}
                                onChange={(e) => setNegativePrompt(e.target.value)}
                                placeholder="e.g., text, watermarks, ugly, deformed"
                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                        className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                    >
                       {isLoading ? <><Spinner /> Generating...</> : 'Generate Image'}
                    </button>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col items-center justify-center min-h-[400px] lg:min-h-[500px] sticky top-8">
                    {isLoading && <Loader />}
                    {error && (
                        <div className="text-center text-red-600 p-4">
                            <p className="font-semibold">Generation Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    {!isLoading && !generatedImage && !error && (
                        <div className="text-center text-gray-400">
                             <Icon name="upload" className="w-16 h-16 mx-auto text-gray-300" />
                            <h3 className="mt-4 text-lg font-medium">Your generated image will appear here</h3>
                            <p className="text-sm">Describe your vision and click "Generate".</p>
                        </div>
                    )}
                    {generatedImage && !isLoading && (
                        <div className="w-full h-full relative group animate-[fadeIn_0.5s_ease-out]">
                            <img src={`data:image/jpeg;base64,${generatedImage}`} alt={prompt} className="w-full h-full object-contain rounded-md max-h-[calc(100vh-12rem)]"/>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button onClick={handleDownload} className="flex items-center space-x-2 bg-black/60 text-white px-3 py-1.5 rounded-lg hover:bg-black/80">
                                    <Icon name="download" className="w-5 h-5"/>
                                    <span>Download</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
const TextToImageStudio = React.memo(TextToImageStudioComponent);

interface TextToInfographicStudioProps {
    onGenerationSuccess: (script: string) => void;
    onGenerateImageClick: () => void;
}

const TextToInfographicStudioComponent: React.FC<TextToInfographicStudioProps> = ({ onGenerationSuccess, onGenerateImageClick }) => {
    const [inputText, setInputText] = useState('');
    const [output, setOutput] = useState<InfographicGenerationResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeOutputTab, setActiveOutputTab] = useState<'summary' | 'json' | 'script'>('summary');
    
    const handleGenerate = async () => {
        if (!inputText.trim()) return;
        setIsLoading(true);
        setError(null);
        setOutput(null);

        try {
            const result = await generateInfographicText(inputText);
            setOutput(result);
            setActiveOutputTab('summary');
            onGenerationSuccess(result.infographicScript);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const Spinner = () => (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    const OutputTabButton: React.FC<{label: string, value: typeof activeOutputTab}> = ({label, value}) => (
        <button
            onClick={() => setActiveOutputTab(value)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeOutputTab === value ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="w-full h-full flex items-start justify-center p-4 md:p-8 overflow-y-auto">
             <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Panel */}
                <div className="flex flex-col space-y-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                        <label htmlFor="infographic-text" className="text-base font-semibold text-gray-800">1. Paste Your Text</label>
                         <textarea
                            id="infographic-text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste your article, report, or any long-form text here..."
                            className="w-full h-80 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                            disabled={isLoading}
                        />
                    </div>
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading || !inputText.trim()}
                        className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                    >
                       {isLoading ? <><Spinner /> Generating...</> : 'Generate Infographic Text'}
                    </button>
                </div>
                {/* Right Panel */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col min-h-[400px] lg:min-h-[500px] sticky top-8">
                     {isLoading && <Loader />}
                    {error && (
                        <div className="text-center text-red-600 p-4 m-auto">
                            <p className="font-semibold">Generation Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    {!isLoading && !output && !error && (
                        <div className="text-center text-gray-400 m-auto">
                             <Icon name="infographic" className="w-16 h-16 mx-auto text-gray-300" />
                            <h3 className="mt-4 text-lg font-medium">Your infographic text will appear here</h3>
                            <p className="text-sm">Paste your content and click "Generate".</p>
                        </div>
                    )}
                    {output && !isLoading && (
                        <div className="w-full h-full flex flex-col animate-[fadeIn_0.5s_ease-out]">
                            <div className="flex space-x-2 border-b pb-2 mb-4">
                               <OutputTabButton label="Modular Summary" value="summary" />
                               <OutputTabButton label="Structured JSON" value="json" />
                               <OutputTabButton label="Infographic Script" value="script" />
                            </div>
                            <div className="relative flex-grow overflow-y-auto">
                                {activeOutputTab === 'summary' && (
                                     <div className="prose max-w-none p-2">
                                        <ReactMarkdown>{output.modularSummary}</ReactMarkdown>
                                    </div>
                                )}
                                {activeOutputTab === 'json' && (
                                    <div className="relative">
                                        <CopyButton text={JSON.stringify(output.structuredJSON, null, 2)} />
                                        <pre className="bg-gray-800 text-white p-4 rounded-md text-sm overflow-x-auto"><code>{JSON.stringify(output.structuredJSON, null, 2)}</code></pre>
                                    </div>
                                )}
                                {activeOutputTab === 'script' && (
                                    <div className="relative">
                                         <CopyButton text={output.infographicScript} />
                                         <div className="prose max-w-none p-2 whitespace-pre-wrap">{output.infographicScript}</div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 pt-4 border-t">
                                <button
                                    onClick={onGenerateImageClick}
                                    className="w-full flex items-center justify-center py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all duration-300 transform hover:scale-105"
                                >
                                    <Icon name="image-generation" className="w-5 h-5 mr-2" />
                                    Generate Infographic Image
                                </button>
                            </div>
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};
const TextToInfographicStudio = React.memo(TextToInfographicStudioComponent);


export const ImageStudio: React.FC = () => {
    const [activeTab, setActiveTab] = useState<StudioTab>('text-to-image');
    const [infographicScriptForImage, setInfographicScriptForImage] = useState<string | null>(null);

    const handleGenerateImageFromInfographic = useCallback(() => {
        setActiveTab('text-to-image');
    }, []);

    const StudioTabButton: React.FC<{label: string, value: StudioTab, icon: 'image-studio' | 'infographic'}> = ({label, value, icon}) => (
        <button
            onClick={() => setActiveTab(value)}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${activeTab === value ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
            <Icon name={icon} className="w-5 h-5"/>
            <span>{label}</span>
        </button>
    );

    return (
        <div className="w-full h-full flex flex-col bg-gray-50">
             <div className="p-4 md:px-8 border-b bg-white/80 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Image Studio</h1>
                        <p className="text-sm text-gray-600">Advanced tools for visual content creation.</p>
                    </div>
                    <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
                        <StudioTabButton label="Text to Image" value="text-to-image" icon="image-studio" />
                        <StudioTabButton label="Text to Infographic" value="text-to-infographic" icon="infographic" />
                    </div>
                </div>
            </div>
            {activeTab === 'text-to-image' && <TextToImageStudio 
                initialPrompt={infographicScriptForImage || undefined}
                onClearInitialPrompt={() => setInfographicScriptForImage(null)}
            />}
            {activeTab === 'text-to-infographic' && <TextToInfographicStudio 
                onGenerationSuccess={setInfographicScriptForImage}
                onGenerateImageClick={handleGenerateImageFromInfographic}
            />}
        </div>
    )
};
