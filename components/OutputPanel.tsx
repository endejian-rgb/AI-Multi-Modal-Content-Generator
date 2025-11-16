
import React, { useState, useEffect } from 'react';
import { GeneratedContent, OutputTab, GroundingSource, StoryboardScene, AspectRatio, SeoAnalysisResult } from '../types';
import Loader from './Loader';
import { Icon } from './Icons';
import ReactMarkdown from 'react-markdown';
import StoryboardViewer from './StoryboardViewer';

interface OutputPanelProps {
  isLoading: boolean;
  error: string | null;
  generatedContent: GeneratedContent | null;
  activeTab: OutputTab;
  setActiveTab: (tab: OutputTab) => void;
  groundingSources: GroundingSource[];
  storyboard: StoryboardScene[] | null;
  handleGenerateStoryboard: () => void;
  isGeneratingStoryboard: boolean;
  storyboardError: string | null;
  aspectRatio: AspectRatio;
  handleAnalyzeSeo: () => void;
  isAnalyzingSeo: boolean;
  seoAnalysis: SeoAnalysisResult | null;
  isSeoModalOpen: boolean;
  setIsSeoModalOpen: (isOpen: boolean) => void;
  seoError: string | null;
}

const TabButton: React.FC<{
  label: OutputTab;
  iconName: 'article' | 'script' | 'tags' | 'storyboard';
  activeTab: OutputTab;
  onClick: (tab: OutputTab) => void;
}> = React.memo(({ label, iconName, activeTab, onClick }) => (
  <button
    onClick={() => onClick(label)}
    className={`flex items-center space-x-2 py-2 px-4 rounded-t-lg font-medium transition-colors ${
      activeTab === label
        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
        : 'text-gray-500 hover:bg-gray-100'
    }`}
  >
    <Icon name={iconName} className="w-5 h-5" />
    <span>{label}</span>
  </button>
));

const CopyButton: React.FC<{ text: string }> = React.memo(({ text }) => {
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
            className="absolute top-4 right-4 bg-gray-200 text-gray-700 hover:bg-gray-300 px-3 py-1 rounded-md text-sm font-medium flex items-center transition-colors"
        >
            <Icon name="copy" className="w-4 h-4 mr-2"/>
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
});

const SeoAnalysisModal: React.FC<{ 
    isOpen: boolean, 
    onClose: () => void, 
    analysis: SeoAnalysisResult | null,
    error: string | null 
}> = React.memo(({ isOpen, onClose, analysis, error }) => {
    if (!isOpen) return null;

    const TrendIndicator: React.FC<{ trend: 'Rising' | 'Stable' | 'Falling' }> = ({ trend }) => {
        const styles = {
            Rising: { icon: '▲', color: 'text-green-500' },
            Stable: { icon: '▬', color: 'text-yellow-500' },
            Falling: { icon: '▼', color: 'text-red-500' },
        };
        const { icon, color } = styles[trend];
        return <span className={`font-bold ${color}`}>{icon} {trend}</span>;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 animate-[fadeIn_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center"><Icon name="analytics" className="w-6 h-6 mr-2 text-blue-600"/>SEO Trend Analysis</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="clear" className="w-6 h-6"/></button>
                </div>
                {error && <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
                {analysis && (
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-500">Keyword Difficulty</h3>
                                <p className="text-3xl font-bold text-gray-800">{analysis.keywordDifficulty} <span className="text-lg font-normal text-gray-600">/ 100</span></p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-500">Search Volume Trend</h3>
                                <p className="text-3xl"><TrendIndicator trend={analysis.searchVolumeTrend} /></p>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-700">Competitor Analysis</h3>
                            <p className="text-gray-600 mt-1">{analysis.competitorAnalysis}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-700">Content Strategy</h3>
                            <p className="text-gray-600 mt-1">{analysis.contentStrategy}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});


const OutputPanelComponent: React.FC<OutputPanelProps> = ({
  isLoading,
  error,
  generatedContent,
  activeTab,
  setActiveTab,
  groundingSources,
  storyboard,
  handleGenerateStoryboard,
  isGeneratingStoryboard,
  storyboardError,
  aspectRatio,
  handleAnalyzeSeo,
  isAnalyzingSeo,
  seoAnalysis,
  isSeoModalOpen,
  setIsSeoModalOpen,
  seoError,
}) => {
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);

  const renderContent = () => {
    if (!generatedContent) return null;

    switch (activeTab) {
      case OutputTab.Article:
        return <ReactMarkdown className="prose max-w-none">{generatedContent.article}</ReactMarkdown>;
      case OutputTab.Script:
        return <ReactMarkdown className="prose max-w-none">{generatedContent.script}</ReactMarkdown>;
      case OutputTab.Titles:
        return <ReactMarkdown className="prose max-w-none">{generatedContent.titles}</ReactMarkdown>;
      case OutputTab.Storyboard:
        if (isGeneratingStoryboard) return <Loader />;
        if (storyboard) return <StoryboardViewer scenes={storyboard} aspectRatio={aspectRatio} />;
        return <div className="text-center text-gray-500">Generate a storyboard from the script tab.</div>;
      default:
        return null;
    }
  };

  const getContentForCopy = () => {
    if (!generatedContent) return '';
    switch (activeTab) {
        case OutputTab.Article: return generatedContent.article;
        case OutputTab.Script: return generatedContent.script;
        case OutputTab.Titles: return generatedContent.titles;
        default: return '';
    }
  }

  const hasContent = generatedContent && !isLoading && !error;

  return (
    <div className="w-full lg:w-2/3 xl:w-3/5 p-6 md:p-8 overflow-y-auto h-full">
      <SeoAnalysisModal 
        isOpen={isSeoModalOpen} 
        onClose={() => setIsSeoModalOpen(false)} 
        analysis={seoAnalysis}
        error={seoError}
      />
      {isLoading && <Loader />}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {!isLoading && !generatedContent && !error && (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
          <div className="w-24 h-24 text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold">Your generated content will appear here</h2>
          <p className="mt-1">Fill in the details on the left and click "Generate Content" to start.</p>
        </div>
      )}
      {hasContent && (
        <div className="flex flex-col h-full">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton label={OutputTab.Article} iconName="article" activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton label={OutputTab.Script} iconName="script" activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton label={OutputTab.Titles} iconName="tags" activeTab={activeTab} onClick={setActiveTab} />
                    {storyboard && (
                      <TabButton label={OutputTab.Storyboard} iconName="storyboard" activeTab={activeTab} onClick={setActiveTab} />
                    )}
                </nav>
            </div>
            <div className="relative bg-white p-6 rounded-b-lg rounded-r-lg shadow-sm flex-grow overflow-y-auto">
                {activeTab !== OutputTab.Storyboard && <CopyButton text={getContentForCopy()} />}
                <div className="pt-8">
                    {renderContent()}
                     {activeTab === OutputTab.Script && (
                      <div className="mt-8 pt-6 border-t">
                        <button
                          onClick={handleGenerateStoryboard}
                          disabled={isGeneratingStoryboard}
                          className="w-full flex items-center justify-center py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
                        >
                          {isGeneratingStoryboard ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating Storyboard...
                            </>
                          ) : (
                            'Generate Video Storyboard'
                          )}
                        </button>
                        {storyboardError && <p className="text-sm text-red-600 mt-2 text-center">{storyboardError}</p>}
                      </div>
                    )}
                     {activeTab === OutputTab.Titles && (
                        <div className="mt-8 pt-6 border-t">
                            <button
                                onClick={handleAnalyzeSeo}
                                disabled={isAnalyzingSeo}
                                className="w-full flex items-center justify-center py-3 px-4 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-400 transition-colors"
                            >
                                {isAnalyzingSeo ? (
                                    <>
                                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                     Analyzing...
                                    </>
                                ) : (
                                    <><Icon name="analytics" className="w-5 h-5 mr-2"/>Analyze SEO Trends</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {groundingSources.length > 0 && (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                    <button 
                        onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                        className="w-full flex justify-between items-center text-sm font-semibold text-gray-700"
                        aria-expanded={isSourcesExpanded}
                    >
                        <span className="flex items-center">
                            <Icon name="link" className="w-4 h-4 mr-2" />
                            Sources from Google Search ({groundingSources.length})
                        </span>
                        <Icon 
                            name="chevron-down" 
                            className={`w-5 h-5 transition-transform ${isSourcesExpanded ? 'rotate-180' : ''}`} 
                        />
                    </button>
                    {isSourcesExpanded && (
                        <ul className="mt-3 space-y-1 text-sm animate-[fadeIn_0.3s_ease-out]">
                            {groundingSources.map((source, index) => (
                                source.web && <li key={index}>
                                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                        {source.web.title || source.web.uri}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
      )}
    </div>
  );
};
export const OutputPanel = React.memo(OutputPanelComponent);
