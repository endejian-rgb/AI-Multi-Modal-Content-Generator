
import React, { useState } from 'react';
import { Style, GeneratedContent, AspectRatio, Language, Voice, ComplianceProfile } from '../types';
import { Icon } from './Icons';

interface InputPanelProps {
  topic: string;
  setTopic: (topic: string) => void;
  style: Style;
  setStyle: (style: Style) => void;
  personalStyleSamples: string[];
  setPersonalStyleSamples: (samples: string[]) => void;
  autoLearnStyle: boolean;
  setAutoLearnStyle: (autoLearn: boolean) => void;
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
  voice: Voice;
  setVoice: (voice: Voice) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  speakingRate: number;
  setSpeakingRate: (rate: number) => void;
  ideaField: string;
  setIdeaField: (field: string) => void;
  ideaTrendSource: string;
  setIdeaTrendSource: (source: string) => void;
  generatedIdeas: string[];
  setGeneratedIdeas: (ideas: string[]) => void;
  isGeneratingIdeas: boolean;
  handleGenerateIdeas: () => void;
  ideaError: string | null;
  complianceProfile: ComplianceProfile;
  setComplianceProfile: (profile: ComplianceProfile) => void;
}

const InputSection: React.FC<{ title: string, children: React.ReactNode, action?: React.ReactNode }> = React.memo(({ title, children, action }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
        <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
            {action}
        </div>
        {children}
    </div>
));


const InputPanelComponent: React.FC<InputPanelProps> = ({
  topic,
  setTopic,
  style,
  setStyle,
  personalStyleSamples,
  setPersonalStyleSamples,
  autoLearnStyle,
  setAutoLearnStyle,
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
  voice,
  setVoice,
  pitch,
  setPitch,
  speakingRate,
  setSpeakingRate,
  ideaField,
  setIdeaField,
  ideaTrendSource,
  setIdeaTrendSource,
  generatedIdeas,
  setGeneratedIdeas,
  isGeneratingIdeas,
  handleGenerateIdeas,
  ideaError,
  complianceProfile,
  setComplianceProfile,
}) => {
  const [showIdeaGenerator, setShowIdeaGenerator] = useState(false);

  const handleSampleChange = (index: number, value: string) => {
    const newSamples = [...personalStyleSamples];
    newSamples[index] = value;
    setPersonalStyleSamples(newSamples);
  };

  const addSample = () => {
    setPersonalStyleSamples([...personalStyleSamples, '']);
  };

  const removeSample = (index: number) => {
    const newSamples = personalStyleSamples.filter((_, i) => i !== index);
    setPersonalStyleSamples(newSamples);
  };


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
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="idea-field" className="block text-xs font-medium text-gray-600">Enter a general field</label>
                            <input
                                id="idea-field"
                                value={ideaField}
                                onChange={(e) => setIdeaField(e.target.value)}
                                placeholder="e.g., cooking, tech"
                                className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                disabled={isGeneratingIdeas}
                            />
                        </div>
                        <div>
                            <label htmlFor="trend-source" className="block text-xs font-medium text-gray-600">Trend Source</label>
                            <select
                                id="trend-source"
                                value={ideaTrendSource}
                                onChange={(e) => setIdeaTrendSource(e.target.value)}
                                className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                disabled={isGeneratingIdeas}
                            >
                                <option>General</option>
                                <option>Social Media Trends</option>
                                <option>Industry News</option>
                            </select>
                        </div>
                    </div>
                     <button
                        onClick={handleGenerateIdeas}
                        disabled={isGeneratingIdeas || !ideaField.trim()}
                        className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        {isGeneratingIdeas ? (
                           <><svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Analyzing Trends...</>
                        ) : 'Get Topic Ideas'}
                    </button>
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

        <InputSection title="3. Customize Style & Voice">
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
                 <div className="pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Learn from Your Style</label>
                    <div className="space-y-3">
                        {personalStyleSamples.map((sample, index) => (
                            <div key={index} className="flex items-start space-x-2">
                                <textarea
                                  value={sample}
                                  onChange={(e) => handleSampleChange(index, e.target.value)}
                                  placeholder={`Paste writing sample #${index + 1}...`}
                                  className="w-full h-24 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                  disabled={isLoading || autoLearnStyle}
                                />
                                <button onClick={() => removeSample(index)} disabled={isLoading || autoLearnStyle} className="p-2 text-gray-400 hover:text-red-500 disabled:text-gray-300">
                                    <Icon name="remove-circle" className="w-6 h-6" />
                                </button>
                            </div>
                        ))}
                        <button onClick={addSample} disabled={isLoading || autoLearnStyle} className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400">
                           <Icon name="add-circle" className="w-5 h-5"/>
                           <span>Add another sample</span>
                        </button>
                    </div>
                    <div className="mt-3 flex items-center">
                        <input type="checkbox" id="auto-learn" checked={autoLearnStyle} onChange={(e) => setAutoLearnStyle(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="auto-learn" className="ml-2 block text-sm text-gray-700">Auto-learn from my generation history</label>
                    </div>
                     {autoLearnStyle && <p className="text-xs text-gray-500 mt-1">Using the last 3 generated articles as style samples.</p>}
                </div>

                <div className="pt-4 border-t">
                    <label htmlFor="aspect-ratio-select" className="block text-sm font-medium text-gray-600 mb-1">Video Aspect Ratio</label>
                    <select
                        id="aspect-ratio-select"
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                        disabled={isLoading}
                    >
                        <option value={AspectRatio.SixteenNine}>16:9 (Widescreen)</option>
                        <option value={AspectRatio.NineSixteen}>9:16 (Vertical)</option>
                    </select>
                </div>
                <div className="pt-4 border-t border-gray-200 space-y-4">
                    <div>
                        <label htmlFor="voice-select" className="block text-sm font-medium text-gray-600 mb-1">Storyboard Voice</label>
                        <select
                            id="voice-select"
                            value={voice}
                            onChange={(e) => setVoice(e.target.value as Voice)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                            disabled={isLoading}
                        >
                            {Object.values(Voice).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="pitch-slider" className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                            <span>Voice Pitch</span>
                            <span className="font-normal text-gray-500">{pitch.toFixed(1)}</span>
                        </label>
                        <input
                            id="pitch-slider"
                            type="range"
                            min="-20"
                            max="20"
                            step="0.1"
                            value={pitch}
                            onChange={(e) => setPitch(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="speed-slider" className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                            <span>Speaking Rate</span>
                            <span className="font-normal text-gray-500">{speakingRate.toFixed(2)}x</span>
                        </label>
                        <input
                            id="speed-slider"
                            type="range"
                            min="0.25"
                            max="4"
                            step="0.05"
                            value={speakingRate}
                            onChange={(e) => setSpeakingRate(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>
        </InputSection>
        
        <InputSection title="4. Compliance & Safety">
            <div>
                <label htmlFor="compliance-profile" className="block text-sm font-medium text-gray-600 mb-1">Compliance Profile</label>
                <select
                    id="compliance-profile"
                    value={complianceProfile}
                    onChange={(e) => setComplianceProfile(e.target.value as ComplianceProfile)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    disabled={isLoading}
                >
                    {Object.values(ComplianceProfile).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                 <p className="text-xs text-gray-500 mt-2">The AI will adjust its output to adhere to the guidelines of the selected profile.</p>
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
export const InputPanel = React.memo(InputPanelComponent);
