
import React, { useState } from 'react';
import { Style, GeneratedContent, AspectRatio, Language } from '../types';
import { Icon } from './Icons';

interface InputPanelProps {
  topic: string;
  setTopic: (topic: string) => void;
  style: Style;
  setStyle: (style: Style) => void;
  personalStyle: string;
  setPersonalStyle: (style: string) => void;
  generatedContent: GeneratedContent | null;
  isLoading: boolean;
  handleGenerate: () => void;
  handleConvert: (target: 'script' | 'summary') => void;
  image: { file: File; dataUrl: string } | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  ideaField: string;
  setIdeaField: (field: string) => void;
  generatedIdeas: string[];
  setGeneratedIdeas: (ideas: string[]) => void;
  isGeneratingIdeas: boolean;
  handleGenerateIdeas: () => void;
  ideaError: string | null;
}

const InputSection: React.FC<{ title: string, children: React.ReactNode, action?: React.ReactNode }> = ({ title, children, action }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
        <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
            {action}
        </div>
        {children}
    </div>
);


export const InputPanel: React.FC<InputPanelProps> = ({
  topic,
  setTopic,
  style,
  setStyle,
  personalStyle,
  setPersonalStyle,
  generatedContent,
  isLoading,
  handleGenerate,
  handleConvert,
  image,
  handleImageChange,
  clearImage,
  aspectRatio,
  setAspectRatio,
  language,
  setLanguage,
  ideaField,
  setIdeaField,
  generatedIdeas,
  setGeneratedIdeas,
  isGeneratingIdeas,
  handleGenerateIdeas,
  ideaError,
}) => {
  const [showIdeaGenerator, setShowIdeaGenerator] = useState(false);

  return (
    <div className="w-full lg:w-1/3 xl:w-2/5 p-4 md:p-6 bg-gray-50 overflow-y-auto h-full">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-600 p-2 rounded-lg">
            <Icon name="google" className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Content Brain</h1>
      </div>
      
      <div className="space-y-4">
        <InputSection 
            title="1. Define Your Topic"
            action={
                <button
                    onClick={() => setShowIdeaGenerator(!showIdeaGenerator)}
                    className="flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    title="Get topic ideas from AI"
                    aria-expanded={showIdeaGenerator}
                >
                    <Icon name="idea" className="w-5 h-5" />
                    <span>Get Ideas</span>
                </button>
            }
        >
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showIdeaGenerator ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-3 bg-gray-100/80 border rounded-md space-y-3 mb-3">
                    <label htmlFor="idea-field" className="block text-xs font-medium text-gray-600">Enter a general field (e.g., cooking, tech)</label>
                    <div className="flex space-x-2">
                        <input
                            id="idea-field"
                            value={ideaField}
                            onChange={(e) => setIdeaField(e.target.value)}
                            placeholder="Your field of interest"
                            className="flex-grow p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                            disabled={isGeneratingIdeas}
                        />
                        <button
                            onClick={handleGenerateIdeas}
                            disabled={isGeneratingIdeas || !ideaField.trim()}
                            className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-12"
                        >
                            {isGeneratingIdeas ? (
                               <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Go'}
                        </button>
                    </div>
                    {ideaError && <p className="text-xs text-red-600">{ideaError}</p>}
                    {generatedIdeas.length > 0 && (
                        <div className="pt-3 border-t space-y-2">
                            <ul className="space-y-1">
                                {generatedIdeas.map((idea, index) => (
                                    <li key={index}>
                                        <button
                                            onClick={() => {
                                                setTopic(idea);
                                                setGeneratedIdeas([]);
                                                setShowIdeaGenerator(false);
                                            }}
                                            className="w-full text-left text-sm p-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                                        >
                                            {idea}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., The future of renewable energy..."
              className="w-full h-28 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
              disabled={isLoading}
            />
        </InputSection>
        
        <InputSection title="2. Add Media (Optional)">
             {image ? (
                <div className="relative group">
                    <img src={image.dataUrl} alt="Upload preview" className="w-full h-40 object-cover rounded-lg"/>
                    <button onClick={clearImage} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
                        <Icon name="clear" className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-500 focus:outline-none">
                    <Icon name="upload" className="w-8 h-8 text-gray-400"/>
                    <span className="mt-2 font-medium text-sm text-gray-600">
                        Click to upload an image
                    </span>
                    <span className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</span>
                    <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
            )}
        </InputSection>

        <InputSection title="3. Customize Style">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="style-select" className="block text-sm font-medium text-gray-600 mb-1">Content Style</label>
                        <select
                            id="style-select"
                            value={style}
                            onChange={(e) => setStyle(e.target.value as Style)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                            disabled={isLoading}
                        >
                            {Object.values(Style).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="language-select" className="block text-sm font-medium text-gray-600 mb-1">Output Language</label>
                        <select
                            id="language-select"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                            disabled={isLoading}
                        >
                            <option value={Language.English}>English</option>
                            <option value={Language.Chinese}>Chinese (中文)</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="aspect-ratio-select" className="block text-sm font-medium text-gray-600 mb-1">Video Aspect Ratio</label>
                    <select
                        id="aspect-ratio-select"
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                        disabled={isLoading}
                    >
                        <option value={AspectRatio.SixteenNine}>16:9 (Widescreen)</option>
                        <option value={AspectRatio.NineSixteen}>9:16 (Vertical)</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="style" className="block text-sm font-medium text-gray-600 mb-1">Learn from Your Style (Optional)</label>
                    <textarea
                      id="style"
                      value={personalStyle}
                      onChange={(e) => setPersonalStyle(e.target.value)}
                      placeholder="Paste a sample of your writing here..."
                      className="w-full h-24 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-sm"
                      disabled={isLoading}
                    />
                </div>
            </div>
        </InputSection>
        
        <div className="pt-2 space-y-4">
            <button
                onClick={handleGenerate}
                disabled={isLoading || !topic.trim()}
                className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
            >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Generate Content Package'
                )}
            </button>

            {generatedContent && (
                <div className="pt-4 border-t border-gray-200 space-y-3 animate-[fadeIn_0.5s_ease-out]">
                  <h3 className="text-sm font-medium text-gray-700 text-center">One-Click Conversion</h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleConvert('script')}
                      disabled={isLoading || !generatedContent.article}
                      className="flex-1 flex items-center justify-center py-2 px-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors transform hover:scale-105 disabled:scale-100"
                    >
                      <Icon name="convert" className="w-5 h-5 mr-2" /> Article → Script
                    </button>
                    <button
                      onClick={() => handleConvert('summary')}
                      disabled={isLoading || !generatedContent.script}
                      className="flex-1 flex items-center justify-center py-2 px-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors transform hover:scale-105 disabled:scale-100"
                    >
                      <Icon name="convert" className="w-5 h-5 mr-2 transform scale-x-[-1]" /> Script → Article
                    </button>
                  </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};