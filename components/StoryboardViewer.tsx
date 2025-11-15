
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StoryboardScene } from '../types';
import { Icon } from './Icons';

// Audio decoding utilities
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length; // Mono audio
  const buffer = ctx.createBuffer(1, frameCount, 24000); // 24kHz sample rate, mono

  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}


interface StoryboardViewerProps {
    scenes: StoryboardScene[];
}

const StoryboardViewer: React.FC<StoryboardViewerProps> = ({ scenes }) => {
    const [activeSceneIndex, setActiveSceneIndex] = useState<number | null>(null);
    const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        sceneRefs.current = sceneRefs.current.slice(0, scenes.length);
     }, [scenes]);
    
    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        return () => { 
            audioSourceRef.current?.stop();
            audioContextRef.current?.close();
        }
    }, []);

    const stopPlayback = useCallback(() => {
        audioSourceRef.current?.stop();
        audioSourceRef.current = null;
        setActiveSceneIndex(null);
        setIsPlayingAll(false);
    }, []);

    const playAudio = useCallback(async (base64Audio: string, sceneIndex: number) => {
        if (!audioContextRef.current) return;
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }
        stopPlayback();
        setActiveSceneIndex(sceneIndex);

        try {
            const decoded = decode(base64Audio);
            const audioBuffer = await decodeAudioData(decoded, audioContextRef.current);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();
            audioSourceRef.current = source;
            
            source.onended = () => {
                if (isPlayingAll && sceneIndex < scenes.length - 1) {
                    playAudio(scenes[sceneIndex + 1].audio, sceneIndex + 1);
                } else {
                    stopPlayback();
                }
            };
        } catch (error) {
            console.error("Error playing audio:", error);
            stopPlayback();
        }
    }, [isPlayingAll, scenes, stopPlayback]);

    useEffect(() => {
        if(isPlayingAll) {
            if (scenes.length > 0) {
              playAudio(scenes[0].audio, 0);
            }
        } else {
            stopPlayback();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlayingAll, scenes]);

    useEffect(() => {
        if (activeSceneIndex !== null) {
            sceneRefs.current[activeSceneIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeSceneIndex]);

    const handlePlayAllClick = () => {
        setIsPlayingAll(prev => !prev);
    };


    return (
        <div className="space-y-4">
             <div className="flex justify-end mb-4">
                <button
                    onClick={handlePlayAllClick}
                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                    <Icon name={isPlayingAll ? 'pause' : 'play'} className="w-5 h-5"/>
                    <span>{isPlayingAll ? 'Stop Playback' : 'Play All Scenes'}</span>
                </button>
            </div>
            {scenes.map((scene, index) => (
                <div 
                    key={index} 
                    ref={el => sceneRefs.current[index] = el}
                    className={`p-4 rounded-lg transition-all duration-300 ${activeSceneIndex === index ? 'bg-blue-100 shadow-lg ring-2 ring-blue-500' : 'bg-gray-50 border'}`}
                >
                    <img 
                        src={`data:image/jpeg;base64,${scene.image}`} 
                        alt={`Scene ${index + 1}`} 
                        className="w-full h-auto object-cover rounded-md mb-4" 
                    />
                    <div className="flex items-start space-x-4">
                         <button 
                            onClick={() => {
                                setIsPlayingAll(false);
                                if (activeSceneIndex === index) {
                                    stopPlayback();
                                } else {
                                    playAudio(scene.audio, index);
                                }
                            }} 
                            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Icon name={activeSceneIndex === index ? 'pause' : 'play'} className="w-6 h-6"/>
                         </button>
                        <p className="text-gray-700 flex-1 pt-1">{scene.text}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default StoryboardViewer;
