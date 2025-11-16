
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StoryboardScene, AspectRatio } from '../types';
import { Icon } from './Icons';
import JSZip from 'jszip';
import jsPDF from 'jspdf';

type VideoTheme = 'Default' | 'Corporate Blue' | 'Vibrant Sunset' | 'Monochrome';

interface VideoExportOptions {
    addSubtitles: boolean;
    theme: VideoTheme;
}

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
    aspectRatio: AspectRatio;
}

const StoryboardViewer: React.FC<StoryboardViewerProps> = ({ scenes, aspectRatio }) => {
    const [activeSceneIndex, setActiveSceneIndex] = useState<number | null>(null);
    const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<string | null>(null); // 'zip', 'pdf', or 'video'
    const [exportProgress, setExportProgress] = useState<string>('');
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);
    const audioBufferCache = useRef<Map<string, AudioBuffer>>(new Map());
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [videoExportOptions, setVideoExportOptions] = useState<VideoExportOptions>({
        addSubtitles: true,
        theme: 'Default',
    });


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
            audioBufferCache.current.clear();
        }
    }, []);

    const stopPlayback = useCallback(() => {
        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.stop();
            } catch (e) {
                // Ignore error if stop is called more than once
            }
            audioSourceRef.current = null;
        }
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
            let audioBuffer: AudioBuffer;
            if (audioBufferCache.current.has(base64Audio)) {
                audioBuffer = audioBufferCache.current.get(base64Audio)!;
            } else {
                const decoded = decode(base64Audio);
                audioBuffer = await decodeAudioData(decoded, audioContextRef.current);
                audioBufferCache.current.set(base64Audio, audioBuffer);
            }
            
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

    const handleExportZip = async () => {
        setIsExporting('zip');
        try {
            const zip = new JSZip();
            
            const textContent = scenes.map((scene, index) => {
                return `Scene ${index + 1}\n-----------------\n${scene.text}\n\n`;
            }).join('');
            zip.file("storyboard_script.txt", textContent);
    
            scenes.forEach((scene, index) => {
                zip.file(`scene_${index + 1}.jpeg`, scene.image, { base64: true });
            });
    
            const content = await zip.generateAsync({ type: "blob" });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "storyboard.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
    
        } catch (error) {
            console.error("Failed to export as ZIP:", error);
        } finally {
            setIsExporting(null);
        }
    };

    const handleExportPdf = async () => {
        setIsExporting('pdf');
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidth = pageWidth - margin * 2;
            
            for (let i = 0; i < scenes.length; i++) {
                if (i > 0) {
                    doc.addPage();
                }
                const scene = scenes[i];
                const imgData = `data:image/jpeg;base64,${scene.image}`;
    
                const getImageDimensions = (dataUrl: string): Promise<{ width: number, height: number }> => 
                    new Promise(resolve => {
                        const img = new Image();
                        img.onload = () => resolve({ width: img.width, height: img.height });
                        img.onerror = () => resolve({ width: 0, height: 0 });
                        img.src = dataUrl;
                    });
                
                let y = margin;
                doc.setFontSize(16);
                doc.text(`Scene ${i + 1}`, margin, y);
                y += 10;
                
                const { width: imgWidth, height: imgHeight } = await getImageDimensions(imgData);
                if (imgWidth > 0 && imgHeight > 0) {
                    const aspectRatio = imgWidth / imgHeight;
                    let newWidth = contentWidth;
                    let newHeight = newWidth / aspectRatio;
                    
                    const imageMaxHeight = (pageHeight / 2) - y;
                    if (newHeight > imageMaxHeight) {
                        newHeight = imageMaxHeight;
                        newWidth = newHeight * aspectRatio;
                    }
        
                    const x = (pageWidth - newWidth) / 2;
                    doc.addImage(imgData, 'JPEG', x, y, newWidth, newHeight);
                    y += newHeight + 10;
                }
    
                doc.setFontSize(12);
                const textLines = doc.splitTextToSize(scene.text, contentWidth);
                doc.text(textLines, margin, y);
            }
            
            doc.save("storyboard.pdf");
        } catch (error) {
            console.error("Failed to export as PDF:", error);
        } finally {
            setIsExporting(null);
        }
    };

    const handleInitiateVideoExport = () => {
        setIsExportModalOpen(true);
    };

    const handleConfirmVideoExport = () => {
        setIsExportModalOpen(false);
        handleExportVideo(videoExportOptions);
    };

    const handleExportVideo = async (options: VideoExportOptions) => {
        setIsExporting('video');
        setExportProgress(`(0/${scenes.length})`);

        try {
            const localAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // 1. Decode all audio and get durations
            const audioProcessingPromises = scenes.map(scene => 
                decodeAudioData(decode(scene.audio), localAudioContext)
            );
            const audioBuffers = await Promise.all(audioProcessingPromises);
            const sceneDurations = audioBuffers.map(b => b.duration);

            // 2. Stitch audio
            const totalDuration = sceneDurations.reduce((acc, dur) => acc + dur, 0);
            const totalLength = Math.ceil(totalDuration * localAudioContext.sampleRate);
            const stitchedBuffer = localAudioContext.createBuffer(1, totalLength, localAudioContext.sampleRate);
            const channelData = stitchedBuffer.getChannelData(0);
            let offset = 0;
            for (const buffer of audioBuffers) {
                channelData.set(buffer.getChannelData(0), offset);
                offset += buffer.length;
            }
            
            // 3. Setup audio stream
            const audioDestination = localAudioContext.createMediaStreamDestination();
            const stitchedSource = localAudioContext.createBufferSource();
            stitchedSource.buffer = stitchedBuffer;
            stitchedSource.connect(audioDestination);
            const audioTrack = audioDestination.stream.getAudioTracks()[0];
            
            // 4. Setup canvas video stream
            const canvas = document.createElement('canvas');
            const isSixteenNine = aspectRatio === AspectRatio.SixteenNine;
            canvas.width = isSixteenNine ? 1280 : 720;
            canvas.height = isSixteenNine ? 720 : 1280;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");

            const videoStream = canvas.captureStream(30);
            const videoTrack = videoStream.getVideoTracks()[0];
            
            // 5. Combine and record
            const combinedStream = new MediaStream([videoTrack, audioTrack]);
            const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
            const chunks: Blob[] = [];
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'storyboard.webm';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                setIsExporting(null);
                setExportProgress('');
                localAudioContext.close();
            };

            recorder.start();
            stitchedSource.start();
            
            // 6. Preload images and draw frames
            const images = await Promise.all(scenes.map(scene => new Promise<HTMLImageElement>(resolve => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = `data:image/jpeg;base64,${scene.image}`;
            })));
            
            const themeColors = {
                'Default': { overlay: 'rgba(0, 0, 0, 0)', textBg: 'rgba(0, 0, 0, 0.5)', textColor: '#FFFFFF' },
                'Corporate Blue': { overlay: 'rgba(10, 30, 80, 0.1)', textBg: 'rgba(0, 51, 102, 0.7)', textColor: '#FFFFFF' },
                'Vibrant Sunset': { overlay: 'rgba(255, 100, 0, 0.1)', textBg: 'rgba(215, 55, 7, 0.7)', textColor: '#FFFFFF' },
                'Monochrome': { overlay: 'rgba(0, 0, 0, 0)', textBg: 'rgba(0, 0, 0, 0.6)', textColor: '#FFFFFF' },
            };
            const currentTheme = themeColors[options.theme];

            let currentSceneIndex = 0;
            const scheduleNextScene = () => {
                if (currentSceneIndex >= scenes.length) {
                    setTimeout(() => recorder.stop(), 200);
                    return;
                }
                
                setExportProgress(`(${currentSceneIndex + 1}/${scenes.length})`);
                const scene = scenes[currentSceneIndex];
                
                // Draw image (cover/center-crop)
                const img = images[currentSceneIndex];
                const canvasAspect = canvas.width / canvas.height;
                const imgAspect = img.width / img.height;

                let sx, sy, sWidth, sHeight;
                if (imgAspect > canvasAspect) {
                    sHeight = img.height;
                    sWidth = sHeight * canvasAspect;
                    sx = (img.width - sWidth) / 2;
                    sy = 0;
                } else {
                    sWidth = img.width;
                    sHeight = sWidth / canvasAspect;
                    sx = 0;
                    sy = (img.height - sHeight) / 2;
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
                
                // Apply theme filter/overlay
                if (options.theme === 'Monochrome') {
                    ctx.globalCompositeOperation = 'color';
                    ctx.fillStyle = 'gray';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.globalCompositeOperation = 'source-over'; // reset
                }
                ctx.fillStyle = currentTheme.overlay;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw subtitles if enabled
                if (options.addSubtitles) {
                    const fontSize = Math.max(20, Math.floor(canvas.width / 40));
                    ctx.font = `bold ${fontSize}px Arial`;
                    ctx.textAlign = 'center';
                    const textPadding = fontSize * 0.5;
                    const maxLineWidth = canvas.width * 0.9;
                    
                    // Function to wrap text
                    const words = scene.text.split(' ');
                    let line = '';
                    const lines = [];
                    for(let n = 0; n < words.length; n++) {
                      const testLine = line + words[n] + ' ';
                      const metrics = ctx.measureText(testLine);
                      const testWidth = metrics.width;
                      if (testWidth > maxLineWidth && n > 0) {
                        lines.push(line);
                        line = words[n] + ' ';
                      } else {
                        line = testLine;
                      }
                    }
                    lines.push(line);
                    
                    const textBlockHeight = lines.length * (fontSize * 1.2);
                    const yStart = canvas.height - textBlockHeight - (fontSize * 2);

                    ctx.fillStyle = currentTheme.textBg;
                    ctx.fillRect(0, yStart - textPadding, canvas.width, textBlockHeight + (textPadding * 2));
                    
                    ctx.fillStyle = currentTheme.textColor;
                    lines.forEach((l, i) => {
                        ctx.fillText(l.trim(), canvas.width / 2, yStart + (i * (fontSize * 1.2)) + (fontSize / 2));
                    });
                }
                
                const durationMs = sceneDurations[currentSceneIndex] * 1000;
                currentSceneIndex++;
                setTimeout(scheduleNextScene, durationMs);
            };
            
            scheduleNextScene();

        } catch (error) {
            console.error("Failed to export as video:", error);
            setIsExporting(null);
            setExportProgress('');
        }
    };


    const Spinner = () => (
        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    const ExportModal = () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsExportModalOpen(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-[fadeIn_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Video Export Options</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="video-theme" className="block text-sm font-medium text-gray-700">Color Theme</label>
                        <select
                            id="video-theme"
                            value={videoExportOptions.theme}
                            onChange={(e) => setVideoExportOptions(prev => ({ ...prev, theme: e.target.value as VideoTheme }))}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option>Default</option>
                            <option>Corporate Blue</option>
                            <option>Vibrant Sunset</option>
                            <option>Monochrome</option>
                        </select>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="add-subtitles"
                            type="checkbox"
                            checked={videoExportOptions.addSubtitles}
                            onChange={(e) => setVideoExportOptions(prev => ({ ...prev, addSubtitles: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="add-subtitles" className="ml-2 block text-sm text-gray-900">Auto-add subtitles</label>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleConfirmVideoExport} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Confirm & Export</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            {isExportModalOpen && <ExportModal />}
             <div className="flex flex-wrap justify-end gap-2 mb-4">
                <button
                    onClick={handleInitiateVideoExport}
                    disabled={!!isExporting}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400"
                >
                    {isExporting === 'video' ? <Spinner /> : <Icon name="video" className="w-5 h-5"/>}
                    <span>{isExporting === 'video' ? `Generating... ${exportProgress}` : 'Export as Video'}</span>
                </button>
                <button
                    onClick={handleExportZip}
                    disabled={!!isExporting}
                    className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400"
                >
                    {isExporting === 'zip' ? <Spinner /> : <Icon name="download" className="w-5 h-5"/>}
                    <span>{isExporting === 'zip' ? 'Exporting...' : 'Export as ZIP'}</span>
                </button>
                <button
                    onClick={handleExportPdf}
                    disabled={!!isExporting}
                    className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400"
                >
                    {isExporting === 'pdf' ? <Spinner /> : <Icon name="download" className="w-5 h-5"/>}
                    <span>{isExporting === 'pdf' ? 'Exporting...' : 'Export as PDF'}</span>
                </button>
                <button
                    onClick={handlePlayAllClick}
                    disabled={!!isExporting}
                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400"
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
