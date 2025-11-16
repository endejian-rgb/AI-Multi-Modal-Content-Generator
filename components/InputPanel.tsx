
import React, { useState } from 'react';
import { Style, GeneratedContent, AspectRatio } from '../types';
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
  ideaField: string;
  setIdeaField: (field: string) => void;
  generatedIdeas: string[];
  setGeneratedIdeas: (ideas: string[]) => void;
  isGeneratingIdeas: boolean;
  handleGenerateIdeas: () => void;
  ideaError: string | null;
}

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
    <div className="w-full lg:w-1/3 xl:w-2/5 p-6 bg-white overflow-y-auto h-full space-y-6">
      <div className="flex items-center space-x-3">
        <Icon name="google" className="w-8 h-8" />
        <h1 className="text-2xl font-bold text-gray-800">AI Content Generator</h1>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700">Topic or Source Material</label>
            <button
                onClick={() => setShowIdeaGenerator(!showIdeaGenerator)}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                title="Get topic ideas from AI"
                aria-expanded={showIdeaGenerator}
            >
                <Icon name="idea" className="w-5 h-5" />
                <span>Get Ideas</span>
            </button>
        </div>

        {showIdeaGenerator && (
            <div className="p-4 bg-gray-50 border rounded-md space-y-3 transition-all animate-[fadeIn_0.3s_ease-out]">
                <label htmlFor="idea-field" className="block text-xs font-medium text-gray-600">Enter a general field (e.g., cooking, tech)</label>
                <div className="flex space-x-2">
                    <input
                        id="idea-field"
                        value={ideaField}
                        onChange={(e) => setIdeaField(e.target.value)}
                        placeholder="Your field of interest"
                        className="flex-grow p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 transition"
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
                        <p className="text-xs font-medium text-gray-600">Click an idea to use it:</p>
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
        )}

        <textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., The future of renewable energy"
          className="w-full h-24 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700">Upload Image (Optional)</label>
        {image ? (
            <div className="relative group">
                <img src={image.dataUrl} alt="Upload preview" className="w-full h-40 object-cover rounded-lg"/>
                <button onClick={clearImage} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon name="clear" className="w-5 h-5" />
                </button>
            </div>
        ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                <Icon name="upload" className="w-8 h-8 text-gray-400"/>
                <span className="flex items-center space-x-2">
                    <span className="font-medium text-gray-600">
                        Click to upload
                        <span className="hidden md:inline"> or drag and drop</span>
                    </span>
                </span>
                <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="style-select" className="block text-sm font-medium text-gray-700">Content Style</label>
        <select
            id="style-select"
            value={style}
            onChange={(e) => setStyle(e.target.value as Style)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={isLoading}
        >
            {Object.values(Style).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="aspect-ratio-select" className="block text-sm font-medium text-gray-700">Video Aspect Ratio</label>
        <select
            id="aspect-ratio-select"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={isLoading}
        >
            <option value={AspectRatio.SixteenNine}>16:9 (YouTube, Widescreen)</option>
            <option value={AspectRatio.NineSixteen}>9:16 (Shorts, TikTok, Vertical)</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="style" className="block text-sm font-medium text-gray-700">Learn from Your Style (Optional)</label>
        <textarea
          id="style"
          value={personalStyle}
          onChange={(e) => setPersonalStyle(e.target.value)}
          placeholder="Paste 1-3 paragraphs of your own writing here. The AI will learn your tone, phrasing, and complexity to generate content that sounds like you."
          className="w-full h-24 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
          disabled={isLoading}
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={isLoading || !topic.trim()}
        className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
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
          'Generate Content'
        )}
      </button>

      {generatedContent && (
        <div className="pt-4 border-t space-y-3">
          <h3 className="text-sm font-medium text-gray-700">One-Click Conversion</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => handleConvert('script')}
              disabled={isLoading || !generatedContent.article}
              className="flex-1 flex items-center justify-center py-2 px-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="convert" className="w-5 h-5 mr-2" /> Article → Script
            </button>
            <button
              onClick={() => handleConvert('summary')}
              disabled={isLoading || !generatedContent.script}
              className="flex-1 flex items-center justify-center py-2 px-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="convert" className="w-5 h-5 mr-2 transform scale-x-[-1]" /> Script → Article
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
