
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
import { Tv, XCircle, Languages, Globe, Pencil } from 'lucide-react';

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
  { code: 'teletext', name: 'Embedded Teletext' },
  { code: 'audio', name: 'Audio Track (Speech-to-Text)' },
];

export interface StreamInstanceConfig {
  streamUrl: string;
  inputLanguage: string;
  outputLanguage: string;
  subtitleSource: 'teletext' | 'audio'; // Removed 'mock'
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
  isLoadingTranslation: boolean;
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
      setTimeout(() => toast({ title: "Error", description: "Invalid language or subtitle source selection.", variant: "destructive" }), 0);
      return;
    }
     if (!config.streamUrl) {
      setTimeout(() => toast({ title: "Error", description: "Stream URL (UDP/SRT) cannot be empty.", variant: "destructive" }), 0);
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
      isLoadingTranslation: false,
      hlsOutputUrl: undefined,
    };
    setStreams(prev => [...prev, newStream]);
    setTimeout(() => toast({ title: "Stream Added", description: `Configuration for ${config.streamUrl} added.` }), 0);
  }, [toast]);

  const removeStream = useCallback((streamId: string) => {
    setStreams(prev => prev.filter(s => s.id !== streamId));
    setTimeout(() => toast({ title: "Stream Removed", description: "Stream configuration removed." }), 0);
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
      setTimeout(() => toast({ title: "Error", description: "Invalid language or subtitle source selection for update.", variant: "destructive" }), 0);
      return;
    }
     if (!updatedConfig.streamUrl) {
      setTimeout(() => toast({ title: "Error", description: "Stream URL (UDP/SRT) cannot be empty for update.", variant: "destructive" }), 0);
      return;
    }

    setStreams(prevStreams => prevStreams.map(stream => {
      if (stream.id === updatedConfig.id) {
        const shouldResetConnection = stream.streamUrl !== updatedConfig.streamUrl ||
                                    stream.subtitleSource !== updatedConfig.subtitleSource ||
                                    stream.sourceTrackId !== updatedConfig.sourceTrackId ||
                                    stream.inputLanguage !== updatedConfig.inputLanguage;
        
        return {
          ...stream,
          ...updatedConfig,
          inputLanguageName: inputLang.name,
          outputLanguageName: outputLang.name,
          subtitleSourceName: subSource.name,
          ...(shouldResetConnection && { 
            isConnected: false,
            isLoadingConnection: false,
            isPlaying: false,
            originalSubtitles: [],
            translatedSubtitles: [],
            currentBurnInSubtitle: '',
            hlsOutputUrl: undefined,
          })
        };
      }
      return stream;
    }));
    setTimeout(() => toast({ title: "Stream Updated", description: `Configuration for ${updatedConfig.streamUrl} updated. Connection may need to be re-established if critical settings changed.` }),0);
    handleCloseEditDialog();
  };


  const handleConnectToggle = useCallback((streamId: string) => {
    let toastMessage = "";
    let toastType: "default" | "destructive" = "default";
    let streamUrlForToast = "";

    setStreams(prevStreams => {
        const streamToToggle = prevStreams.find(s => s.id === streamId);
        if (!streamToToggle) return prevStreams;
        streamUrlForToast = streamToToggle.streamUrl;

        if (streamToToggle.isConnected) {
            // DISCONNECTING
            toastMessage = `Disconnected from ${streamUrlForToast}`;
            toastType = "default";
            return prevStreams.map(stream =>
                stream.id === streamId ? {
                    ...stream,
                    isConnected: false,
                    isPlaying: false,
                    isLoadingConnection: false,
                    originalSubtitles: [], // Clear subtitles on disconnect
                    translatedSubtitles: [],
                    currentBurnInSubtitle: '',
                    hlsOutputUrl: undefined, // Clear HLS URL
                } : stream
            );
        } else {
            // ATTEMPTING TO CONNECT
            if (!streamUrlForToast) {
                toastMessage = "Stream URL (UDP/SRT) cannot be empty.";
                toastType = "destructive";
                return prevStreams; 
            }
            toastMessage = `Attempting to connect to ${streamUrlForToast}...`;
            toastType = "default";
            // In a real app, this would trigger a backend connection.
            // For UI purposes, we optimistically set connected.
            return prevStreams.map(stream =>
                stream.id === streamId ? { 
                    ...stream, 
                    isLoadingConnection: false, // No loading simulation
                    isConnected: true,
                    isPlaying: true // Assume play on connect for simplicity here
                                    // hlsOutputUrl would be set by a backend
                } : stream
            );
        }
    });
    
    // Show toast after state update is scheduled
    setTimeout(() => {
        if (toastMessage) {
            toast({ title: toastType === "default" ? "Stream Status" : "Error", description: toastMessage, variant: toastType });
        }
        if (toastType === "default" && !streams.find(s => s.id === streamId)?.isConnected) { // if connecting successfully
             const connectedStream = streams.find(s => s.id === streamId && s.isConnected);
             if(connectedStream) { // Check if stream is found and connected
                toast({ title: "Success", description: `Connected to ${streamUrlForToast}. Waiting for data.`});
             }
        }
    }, 0);

  }, [toast, streams]); // Added streams to dependency array as its state is read for toast

 const handlePlay = useCallback((streamId: string) => {
    let playToastMessage = "";
    let playToastType: "default" | "destructive" = "default";
    let shouldToast = false;

    setStreams(prevStreams => {
        const updatedStreams = prevStreams.map(stream => {
            if (stream.id === streamId) {
                if (!stream.isConnected) {
                    playToastMessage = "Not connected to a stream.";
                    playToastType = "destructive";
                    shouldToast = true;
                    return stream; 
                }
                if (stream.isPlaying) { 
                    return stream;
                }
                playToastMessage = "Stream resumed.";
                playToastType = "default";
                shouldToast = true;
                return { ...stream, isPlaying: true };
            }
            return stream;
        });
        
        if (shouldToast && playToastMessage) {
            setTimeout(() => toast({ title: playToastType === "default" ? "Stream Control" : "Error", description: playToastMessage, variant: playToastType }), 0);
        }
        return updatedStreams;
    });
  }, [toast]); 

  const handlePause = useCallback((streamId: string) => {
    setStreams(prevStreams => prevStreams.map(stream => {
      if (stream.id === streamId && stream.isPlaying) { 
        setTimeout(() => toast({ title: "Stream Control", description: "Stream paused." }),0);
        return { ...stream, isPlaying: false };
      }
      return stream;
    }));
  }, [toast]);

  const handleStop = useCallback((streamId: string) => {
     setStreams(prevStreams => prevStreams.map(stream => {
      if (stream.id === streamId) {
        setTimeout(() => toast({ title: "Stream Control", description: "Stream stopped." }),0);
        return { ...stream, isPlaying: false, currentBurnInSubtitle: '' }; // Keep subtitles, just stop playback indication
      }
      return stream;
    }));
  }, [toast]);

  useEffect(() => {
    streams.forEach(stream => {
      if (stream.isConnected && stream.isPlaying && stream.originalSubtitles.length > 0) {
        const lastOriginalSubtitle = stream.originalSubtitles[stream.originalSubtitles.length - 1];
        
        // Only translate if the last original subtitle doesn't have a corresponding translation yet
        // or if there are more original subtitles than translated ones.
        const needsTranslation = stream.translatedSubtitles.length < stream.originalSubtitles.length;

        if (needsTranslation && !stream.isLoadingTranslation) {
          setStreams(prevSs => prevSs.map(s => {
            if (s.id === stream.id) {
              return { ...s, isLoadingTranslation: true };
            }
            return s;
          }));

          translateSubtitles({
            subtitlesToTranslate: lastOriginalSubtitle,
            inputLanguage: stream.inputLanguageName,
            outputLanguage: stream.outputLanguageName
          })
          .then(translationOutput => {
            const newTranslatedSub = translationOutput.translatedSubtitles;
            setStreams(currentUpdatedStreams => currentUpdatedStreams.map(streamToUpdate => {
              if (streamToUpdate.id === stream.id) {
                const updatedTranslatedSubs = [...streamToUpdate.translatedSubtitles.slice(-9), newTranslatedSub];
                return {
                  ...streamToUpdate,
                  translatedSubtitles: updatedTranslatedSubs,
                  currentBurnInSubtitle: newTranslatedSub,
                  isLoadingTranslation: false,
                };
              }
              return streamToUpdate;
            }));
          })
          .catch(error => {
            console.error("Translation error for stream " + stream.id + ":", error);
            setTimeout(() => toast({ title: "Translation Error", description: `Stream ${stream.streamUrl || 'Unknown'}: Failed to translate.`, variant: "destructive" }), 0);
            setStreams(currentErroredStreams => currentErroredStreams.map(streamToUpdate => {
              if (streamToUpdate.id === stream.id) {
                 const updatedTranslatedSubs = [...streamToUpdate.translatedSubtitles.slice(-9), "[Translation Failed]"];
                return {
                  ...streamToUpdate,
                  translatedSubtitles: updatedTranslatedSubs,
                  currentBurnInSubtitle: "[Translation Failed]",
                  isLoadingTranslation: false,
                };
              }
              return streamToUpdate;
            }));
          });
        }
      }
    });
  }, [streams, toast]);


  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 selection:bg-primary selection:text-primary-foreground">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <Tv className="h-10 w-10 text-primary mr-3" />
          <h1 className="text-4xl font-bold tracking-tight">CaptionCast</h1>
        </div>
        <p className="text-lg text-muted-foreground">Multi-Stream Real-time Subtitle Translation & Broadcast</p>
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
                 {!stream.isLoadingConnection && stream.isConnected && <p className="text-sm text-green-400 mt-2">Status: Connected. {stream.hlsOutputUrl ? `HLS Output: Active (${stream.hlsOutputUrl})` : 'HLS Output: Not available (requires backend)'}</p>}
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
        <p>This application requires a backend for full functionality.</p>
      </footer>
    </div>
  );
}
