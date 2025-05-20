
"use client";

import { useState, useEffect, useCallback } from 'react';
import { InputConfigSection } from '@/components/input-config-section';
import { StreamControlSection } from '@/components/stream-control-section';
import { SubtitleDisplaySection } from '@/components/subtitle-display-section';
import { VideoPlayerPlaceholder } from '@/components/video-player-placeholder';
import { EditStreamDialog } from '@/components/edit-stream-dialog';
import { translateSubtitles, type TranslateSubtitlesOutput } from '@/ai/flows/translate-subtitles';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tv, XCircle, Languages, Globe, Pencil } from 'lucide-react'; // Removed AudioLines, ListVideo as they are used in sub-components

// Mock subtitles, can be expanded or moved to a separate file
const MOCK_ENGLISH_SUBTITLES = [
  "Hello and welcome to the show.", "Today we have a very special guest.", "Let's give a warm welcome to Dr. Smith.",
  "Thank you for having me.", "The weather is quite nice today, isn't it?", "Indeed, a perfect day for a broadcast.",
  "We'll be discussing recent advancements in technology.", "Stay tuned for more exciting content.",
  "And now, a word from our sponsors.", "We'll be right back after the break."
];
const MOCK_GERMAN_SUBTITLES = [
  "Hallo und willkommen zur Show.", "Heute haben wir einen ganz besonderen Gast.", "Begrüßen wir Dr. Schmidt herzlich.",
  "Danke für die Einladung.", "Das Wetter ist heute ziemlich schön, nicht wahr?", "In der Tat, ein perfekter Tag für eine Sendung.",
  "Wir werden die neuesten technologischen Fortschritte diskutieren.", "Bleiben Sie dran für weitere spannende Inhalte.",
  "Und nun ein Wort von unseren Sponsoren.", "Wir sind gleich nach der Pause wieder da."
];
const MOCK_SPANISH_SUBTITLES = [
  "Hola y bienvenidos al programa.", "Hoy tenemos un invitado muy especial.", "Demos una cálida bienvenida al Dr. García.",
  "Gracias por invitarme.", "El tiempo está bastante agradable hoy, ¿verdad?", "Efectivamente, un día perfecto para una transmisión.",
  "Discutiremos los avances recientes en tecnología.", "Estén atentos para más contenido emocionante.",
  "Y ahora, unas palabras de nuestros patrocinadores.", "Volveremos después de la pausa."
];

const ALL_MOCK_SUBTITLES: Record<string, string[]> = {
  'en': MOCK_ENGLISH_SUBTITLES,
  'de': MOCK_GERMAN_SUBTITLES,
  'es': MOCK_SPANISH_SUBTITLES,
};

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese (Simplified)' },
];

export const SUBTITLE_SOURCES = [
  { code: 'mock', name: 'Mock Data' },
  { code: 'teletext', name: 'Embedded Teletext' },
  { code: 'audio', name: 'Audio Track (Speech-to-Text)' },
];

export interface StreamInstanceConfig {
  streamUrl: string;
  inputLanguage: string;
  outputLanguage: string;
  subtitleSource: 'mock' | 'teletext' | 'audio';
  sourceTrackId?: string;
}
export interface StreamInstance extends StreamInstanceConfig {
  id: string;
  inputLanguageName: string;
  outputLanguageName: string;
  subtitleSourceName: string;
  isConnected: boolean;
  isLoadingConnection: boolean;
  isPlaying: boolean;
  originalSubtitles: string[];
  translatedSubtitles: string[];
  currentBurnInSubtitle: string;
  subtitleIndex: number;
  isLoadingTranslation: boolean;
  intervalId?: NodeJS.Timeout;
  hlsOutputUrl?: string;
}

export default function CaptionCastUI() {
  const [streams, setStreams] = useState<StreamInstance[]>([]);
  const { toast } = useToast();
  const [editingStream, setEditingStream] = useState<StreamInstance | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const addStream = useCallback((config: StreamInstanceConfig) => {
    const inputLang = LANGUAGES.find(l => l.code === config.inputLanguage);
    const outputLang = LANGUAGES.find(l => l.code === config.outputLanguage);
    const subSource = SUBTITLE_SOURCES.find(s => s.code === config.subtitleSource);

    if (!inputLang || !outputLang || !subSource) {
      toast({ title: "Error", description: "Invalid language or subtitle source selection.", variant: "destructive" });
      return;
    }
     if (!config.streamUrl) {
      toast({ title: "Error", description: "Stream URL (UDP/SRT) cannot be empty.", variant: "destructive" });
      return;
    }

    const newStream: StreamInstance = {
      id: Math.random().toString(36).substr(2, 9),
      ...config,
      inputLanguageName: inputLang.name,
      outputLanguageName: outputLang.name,
      subtitleSourceName: subSource.name,
      isConnected: false,
      isLoadingConnection: false,
      isPlaying: false,
      originalSubtitles: [],
      translatedSubtitles: [],
      currentBurnInSubtitle: '',
      subtitleIndex: 0,
      isLoadingTranslation: false,
      hlsOutputUrl: undefined,
    };
    setStreams(prev => [...prev, newStream]);
    toast({ title: "Stream Added", description: `Configuration for ${config.streamUrl} added.` });
  }, [toast]);

  const removeStream = useCallback((streamId: string) => {
    setStreams(prev => {
      const streamToRemove = prev.find(s => s.id === streamId);
      if (streamToRemove?.intervalId) {
        clearInterval(streamToRemove.intervalId);
      }
      return prev.filter(s => s.id !== streamId);
    });
    toast({ title: "Stream Removed", description: "Stream configuration removed." });
  }, [toast]);

  const handleOpenEditDialog = (streamId: string) => {
    const streamToEdit = streams.find(s => s.id === streamId);
    if (streamToEdit) {
      setEditingStream(streamToEdit);
      setIsEditDialogOpen(true);
    }
  };

  const handleCloseEditDialog = () => {
    setEditingStream(null);
    setIsEditDialogOpen(false);
  };

  const handleUpdateStream = (updatedConfig: StreamInstanceConfig & { id: string }) => {
    const inputLang = LANGUAGES.find(l => l.code === updatedConfig.inputLanguage);
    const outputLang = LANGUAGES.find(l => l.code === updatedConfig.outputLanguage);
    const subSource = SUBTITLE_SOURCES.find(s => s.code === updatedConfig.subtitleSource);

    if (!inputLang || !outputLang || !subSource) {
      toast({ title: "Error", description: "Invalid language or subtitle source selection for update.", variant: "destructive" });
      return;
    }
     if (!updatedConfig.streamUrl) {
      toast({ title: "Error", description: "Stream URL (UDP/SRT) cannot be empty for update.", variant: "destructive" });
      return;
    }

    setStreams(prevStreams => prevStreams.map(stream => {
      if (stream.id === updatedConfig.id) {
        // If crucial settings like URL or subtitle source change, reset connection state
        const shouldResetConnection = stream.streamUrl !== updatedConfig.streamUrl ||
                                    stream.subtitleSource !== updatedConfig.subtitleSource ||
                                    stream.sourceTrackId !== updatedConfig.sourceTrackId ||
                                    stream.inputLanguage !== updatedConfig.inputLanguage;
        
        if (stream.intervalId) clearInterval(stream.intervalId);

        return {
          ...stream,
          ...updatedConfig,
          inputLanguageName: inputLang.name,
          outputLanguageName: outputLang.name,
          subtitleSourceName: subSource.name,
          ...(shouldResetConnection && { // Conditionally reset connection/playback state
            isConnected: false,
            isLoadingConnection: false,
            isPlaying: false,
            originalSubtitles: [],
            translatedSubtitles: [],
            currentBurnInSubtitle: '',
            subtitleIndex: 0,
            intervalId: undefined,
            hlsOutputUrl: undefined,
          })
        };
      }
      return stream;
    }));
    toast({ title: "Stream Updated", description: `Configuration for ${updatedConfig.streamUrl} updated. Connection may need to be re-established if critical settings changed.` });
    handleCloseEditDialog();
  };


  const handleConnectToggle = useCallback((streamId: string) => {
    let toastMessage = "";
    let toastType: "default" | "destructive" = "default";
    let streamUrlForToast = ""; // To capture URL before state update

    setStreams(prevStreams => {
        const streamToToggle = prevStreams.find(s => s.id === streamId);
        if (!streamToToggle) return prevStreams;
        streamUrlForToast = streamToToggle.streamUrl; // Capture before update

        if (streamToToggle.isConnected) {
            // DISCONNECTING
            if (streamToToggle.intervalId) clearInterval(streamToToggle.intervalId);
            toastMessage = `Disconnected from ${streamUrlForToast}`;
            toastType = "default";
            return prevStreams.map(stream =>
                stream.id === streamId ? {
                    ...stream,
                    isConnected: false,
                    isPlaying: false,
                    isLoadingConnection: false,
                    originalSubtitles: [],
                    translatedSubtitles: [],
                    currentBurnInSubtitle: '',
                    subtitleIndex: 0,
                    intervalId: undefined,
                    hlsOutputUrl: undefined,
                } : stream
            );
        } else {
            // CONNECTING
            if (!streamUrlForToast) {
                toastMessage = "Stream URL (UDP/SRT) cannot be empty.";
                toastType = "destructive";
                // Return prevStreams because this toast should appear without a state change that attempts connection
                // The toast will be shown after this function completes.
                return prevStreams; 
            }
            toastMessage = `Attempting to connect to ${streamUrlForToast}`;
            toastType = "default"; // For the initial "Attempting to connect" message
            return prevStreams.map(stream =>
                stream.id === streamId ? { ...stream, isLoadingConnection: true } : stream
            );
        }
    });

    // Show toast after setStreams has been called
    if (toastMessage) {
      if(toastType === "destructive" && !streamUrlForToast){ // Special case for empty URL toast
        toast({ title: "Error", description: toastMessage, variant: "destructive" });
        return; // Don't proceed with connection attempt logic
      }
      toast({ title: toastType === "default" ? "Stream Status" : "Error", description: toastMessage, variant: toastType });
    }
    
    // If connecting, simulate delay and then update state
    const streamToConnect = streams.find(s => s.id === streamId); // Re-fetch for current state.
    if (streamToConnect && !streamToConnect.isConnected && streamToConnect.isLoadingConnection) {
      setTimeout(() => {
        let connectedSuccessfully = false;
        let finalStreamUrlForToastMessage = '';
        let connectionToastMessage = '';
        let connectionToastType: "default" | "destructive" = "default";
        
        setStreams(currentStreams => {
          const streamExists = currentStreams.some(s => s.id === streamId);
          if (!streamExists) { 
            return currentStreams; 
          }
          return currentStreams.map(currentS => {
            if (currentS.id === streamId) {
              connectedSuccessfully = true; 
              finalStreamUrlForToastMessage = currentS.streamUrl;
              return { 
                ...currentS, 
                isConnected: true, 
                isLoadingConnection: false, 
                isPlaying: true, 
                hlsOutputUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 
              };
            }
            return currentS;
          });
        });

        if (connectedSuccessfully) {
            connectionToastMessage = `Connected to ${finalStreamUrlForToastMessage || streamUrlForToast}`;
            connectionToastType = "default";
        } else {
            connectionToastMessage = `Failed to connect to ${finalStreamUrlForToastMessage || streamUrlForToast}`;
            connectionToastType = "destructive";
        }
        if (connectionToastMessage) { 
           toast({ title: connectionToastType === "default" ? "Success" : "Error", description: connectionToastMessage, variant: connectionToastType });
        }
      }, 1500);
    }
  }, [streams, toast]); // streams dependency is important here

 const handlePlay = useCallback((streamId: string) => {
    let playToastMessage = "";
    let playToastType: "default" | "destructive" = "default";

    setStreams(prevStreams => {
        const updatedStreams = prevStreams.map(stream => {
            if (stream.id === streamId) {
                if (!stream.isConnected) {
                    playToastMessage = "Not connected to a stream.";
                    playToastType = "destructive";
                    return stream; 
                }
                if (stream.isPlaying) { // Already playing
                    return stream;
                }
                playToastMessage = "Stream resumed.";
                playToastType = "default";
                return { ...stream, isPlaying: true };
            }
            return stream;
        });
        
        // Defer toast call
        if (playToastMessage) {
            setTimeout(() => toast({ title: playToastType === "default" ? "Stream Control" : "Error", description: playToastMessage, variant: playToastType }), 0);
        }
        return updatedStreams;
    });
  }, [toast]); 

  const handlePause = useCallback((streamId: string) => {
    setStreams(prevStreams => prevStreams.map(stream => {
      if (stream.id === streamId && stream.isPlaying) { // Only update if actually pausing
        setTimeout(() => toast({ title: "Stream Control", description: "Stream paused." }),0);
        return { ...stream, isPlaying: false };
      }
      return stream;
    }));
  }, [toast]);

  const handleStop = useCallback((streamId: string) => {
     setStreams(prevStreams => prevStreams.map(stream => {
      if (stream.id === streamId) {
        // Get the correct mock subtitles array length for resetting the index
        const mockSubtitlesForInputLang = ALL_MOCK_SUBTITLES[stream.inputLanguage] || MOCK_ENGLISH_SUBTITLES;
        setTimeout(() => toast({ title: "Stream Control", description: "Stream stopped. Output might clear." }),0);
        return { ...stream, isPlaying: false, currentBurnInSubtitle: '', subtitleIndex: mockSubtitlesForInputLang.length };
      }
      return stream;
    }));
  }, [toast]);

  useEffect(() => {
    streams.forEach(stream => {
      if (stream.isConnected && stream.isPlaying && !stream.intervalId) {
        const mockSubtitlesForInputLang = ALL_MOCK_SUBTITLES[stream.inputLanguage] || MOCK_ENGLISH_SUBTITLES;

        const newIntervalId = setInterval(async () => {
          setStreams(prevSs => prevSs.map(s => {
            if (s.id === stream.id && s.isConnected && s.isPlaying) { 
              let currentSubIndex = s.subtitleIndex;
              if (currentSubIndex >= mockSubtitlesForInputLang.length) {
                currentSubIndex = 0; 
              }
              
              const newEngSub = mockSubtitlesForInputLang[currentSubIndex];
              const updatedStream = { ...s, originalSubtitles: [...s.originalSubtitles.slice(-9), newEngSub], isLoadingTranslation: true };
              
              translateSubtitles({ 
                subtitlesToTranslate: newEngSub, 
                inputLanguage: s.inputLanguageName, 
                outputLanguage: s.outputLanguageName 
              })
              .then(translationOutput => {
                const newTranslatedSub = translationOutput.translatedSubtitles;
                setStreams(currentUpdatedStreams => currentUpdatedStreams.map(streamToUpdate => {
                  if (streamToUpdate.id === stream.id) {
                    return {
                      ...streamToUpdate,
                      translatedSubtitles: [...streamToUpdate.translatedSubtitles.slice(-9), newTranslatedSub],
                      currentBurnInSubtitle: newTranslatedSub,
                      isLoadingTranslation: false,
                      subtitleIndex: currentSubIndex + 1
                    };
                  }
                  return streamToUpdate;
                }));
              })
              .catch(error => {
                console.error("Translation error for stream " + s.id + ":", error);
                toast({ title: "Translation Error", description: `Stream ${s.streamUrl}: Failed to translate.`, variant: "destructive" });
                setStreams(currentErroredStreams => currentErroredStreams.map(streamToUpdate => {
                  if (streamToUpdate.id === stream.id) {
                    return {
                      ...streamToUpdate,
                      translatedSubtitles: [...streamToUpdate.translatedSubtitles.slice(-9), "[Translation Failed]"],
                      currentBurnInSubtitle: "[Translation Failed]",
                      isLoadingTranslation: false,
                      subtitleIndex: currentSubIndex + 1
                    };
                  }
                  return streamToUpdate;
                }));
              });
              return updatedStream; 
            }
            return s;
          }));
        }, 6000); 

        setStreams(prevSs => prevSs.map(s => s.id === stream.id ? { ...s, intervalId: newIntervalId, subtitleIndex: s.subtitleIndex < mockSubtitlesForInputLang.length ? s.subtitleIndex : 0 } : s));
      
      } else if ((!stream.isConnected || !stream.isPlaying) && stream.intervalId) {
        clearInterval(stream.intervalId);
        setStreams(prevSs => prevSs.map(s => s.id === stream.id ? { ...s, intervalId: undefined } : s));
      }
    });

    return () => {
      streams.forEach(s => {
        if (s.intervalId) {
          clearInterval(s.intervalId);
        }
      });
    };
  }, [streams, toast]); 


  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 selection:bg-primary selection:text-primary-foreground">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <Tv className="h-10 w-10 text-primary mr-3" />
          <h1 className="text-4xl font-bold tracking-tight">CaptionCast</h1>
        </div>
        <p className="text-lg text-muted-foreground">Multi-Stream Real-time Subtitle Translation & Broadcast Simulation</p>
      </header>

      <main className="space-y-8 max-w-7xl mx-auto">
        <InputConfigSection onAddStream={addStream} languages={LANGUAGES} subtitleSources={SUBTITLE_SOURCES} />
        
        <Separator className="my-6 bg-border/50" />

        {streams.length === 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Globe className="mr-2 h-5 w-5 text-muted-foreground"/>No Streams Configured</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Use the section above to add a new input stream.</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-12">
          {streams.map((stream) => (
            <Card key={stream.id} className="shadow-xl overflow-hidden">
              <CardHeader className="bg-card-foreground/5">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-1">Stream: {stream.streamUrl || "Not Set"}</CardTitle>
                    <CardDescription className="space-y-0.5">
                      <div>Translate from {stream.inputLanguageName} to {stream.outputLanguageName}</div>
                      <div>Subtitle Source: {stream.subtitleSourceName}
                        {stream.subtitleSource === 'teletext' && stream.sourceTrackId && ` (Page: ${stream.sourceTrackId})`}
                        {stream.subtitleSource === 'audio' && stream.sourceTrackId && ` (Track ID: ${stream.sourceTrackId})`}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                     <Button 
                        onClick={() => handleConnectToggle(stream.id)} 
                        disabled={stream.isLoadingConnection || !stream.streamUrl} 
                        variant={stream.isConnected ? "outline" : "default"} 
                        className={`${stream.isConnected ? 'border-green-500 text-green-500 hover:bg-green-500/10' : 'bg-primary hover:bg-primary/90 text-primary-foreground'} transition-all duration-150 ease-in-out`}
                        size="sm"
                      >
                        {stream.isLoadingConnection ? <Languages className="mr-2 h-4 w-4 animate-spin" /> : (stream.isConnected ? <Globe className="mr-2 h-4 w-4" /> : <Globe className="mr-2 h-4 w-4" />)}
                        {stream.isLoadingConnection ? 'Connecting...' : stream.isConnected ? 'Disconnect' : 'Connect'}
                      </Button>
                    <Button variant="outline" size="icon" onClick={() => handleOpenEditDialog(stream.id)} className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                      <Pencil className="h-5 w-5" />
                      <span className="sr-only">Edit Stream</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeStream(stream.id)} className="text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                      <XCircle className="h-5 w-5" />
                      <span className="sr-only">Remove Stream</span>
                    </Button>
                  </div>
                </div>
                 {stream.isLoadingConnection && <p className="text-sm text-accent animate-pulse mt-2">Attempting to connect...</p>}
                 {!stream.isLoadingConnection && stream.isConnected && <p className="text-sm text-green-400 mt-2">Successfully connected. HLS Output: {stream.hlsOutputUrl ? 'Active' : 'Pending'}</p>}
                 {!stream.isConnected && !stream.isLoadingConnection && <p className="text-sm text-muted-foreground mt-2">Status: Disconnected</p>}
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {stream.isConnected && (
                  <>
                    <VideoPlayerPlaceholder 
                      hlsStreamUrl={stream.hlsOutputUrl}
                      currentSubtitle={stream.currentBurnInSubtitle} 
                      isPlaying={stream.isPlaying} 
                    />
                    <SubtitleDisplaySection
                      originalSubtitles={stream.originalSubtitles}
                      translatedSubtitles={stream.translatedSubtitles}
                      isLoadingTranslation={stream.isLoadingTranslation}
                      inputLanguageName={stream.inputLanguageName}
                      outputLanguageName={stream.outputLanguageName}
                    />
                    <StreamControlSection
                      isPlaying={stream.isPlaying}
                      onPlay={() => handlePlay(stream.id)}
                      onPause={() => handlePause(stream.id)}
                      onStop={() => handleStop(stream.id)}
                      isStreamActive={stream.isConnected}
                    />
                  </>
                )}
                {!stream.isConnected && (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Connect to the stream to view player and subtitles.</p>
                     <p className="text-xs text-muted-foreground/80 mt-1">
                        Subtitle Source: {stream.subtitleSourceName}
                        {stream.subtitleSource === 'teletext' && stream.sourceTrackId && ` (Page: ${stream.sourceTrackId})`}
                        {stream.subtitleSource === 'audio' && stream.sourceTrackId && ` (Track ID: ${stream.sourceTrackId})`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      {editingStream && (
        <EditStreamDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          streamData={editingStream}
          onSave={handleUpdateStream}
          languages={LANGUAGES}
          subtitleSources={SUBTITLE_SOURCES}
        />
      )}
      <footer className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CaptionCast. All rights reserved.</p>
        <p>This is a demonstration application.</p>
      </footer>
    </div>
  );
}
