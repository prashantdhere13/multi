
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Square, Settings2, MonitorPlay } from 'lucide-react';

interface StreamControlSectionProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  isStreamActive: boolean;
}

export function StreamControlSection({ isPlaying, onPlay, onPause, onStop, isStreamActive }: StreamControlSectionProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <MonitorPlay className="mr-3 h-6 w-6 text-primary" />
          Stream Control & Output Destinations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 justify-center mb-6">
          <Button onClick={onPlay} disabled={!isStreamActive || isPlaying} variant="outline" size="lg" aria-label="Play Stream" className="flex-1 sm:flex-none hover:bg-accent hover:text-accent-foreground">
            <Play className="h-5 w-5 mr-2" /> Play
          </Button>
          <Button onClick={onPause} disabled={!isStreamActive || !isPlaying} variant="outline" size="lg" aria-label="Pause Stream" className="flex-1 sm:flex-none hover:bg-accent hover:text-accent-foreground">
            <Pause className="h-5 w-5 mr-2" /> Pause
          </Button>
          <Button onClick={onStop} disabled={!isStreamActive} variant="destructive" size="lg" aria-label="Stop Stream" className="flex-1 sm:flex-none">
            <Square className="h-5 w-5 mr-2" /> Stop
          </Button>
          {/* Example Settings Button - future use
          <Button variant="ghost" size="icon" aria-label="Stream Settings" className="hover:text-primary">
            <Settings2 className="h-5 w-5" />
          </Button> 
          */}
        </div>
        
        <div className="pt-4 border-t border-border/50">
          <h3 className="text-lg font-semibold text-muted-foreground mb-3">Example Output Destinations (User to configure)</h3>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-background rounded-md border border-border/70">
              <span className="font-semibold text-foreground">UDP Output Example:</span>
              <span className="ml-2 text-muted-foreground truncate block sm:inline">udp://your-output-server:port</span>
              <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${isStreamActive && isPlaying ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                {isStreamActive && isPlaying ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="p-3 bg-background rounded-md border border-border/70">
              <span className="font-semibold text-foreground">HLS Output Example:</span>
              <span className="ml-2 text-muted-foreground truncate block sm:inline">https://your-cdn-server/live/stream.m3u8</span>
               <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${isStreamActive && isPlaying ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                {isStreamActive && isPlaying ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/80 mt-1">Note: These are example output destinations. You will need to configure your actual output streams separately.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
