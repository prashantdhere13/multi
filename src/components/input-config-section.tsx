
"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cable, PlusCircle, ListVideo, AudioLines } from 'lucide-react';
import type { LANGUAGES, SUBTITLE_SOURCES, StreamInstanceConfig } from './caption-cast-ui';

interface InputConfigSectionProps {
  onAddStream: (config: StreamInstanceConfig) => void;
  languages: typeof LANGUAGES;
  subtitleSources: typeof SUBTITLE_SOURCES;
}

export function InputConfigSection({ onAddStream, languages, subtitleSources }: InputConfigSectionProps) {
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [inputLanguage, setInputLanguage] = useState<string>(languages.find(l => l.code === 'en')?.code || languages[0]?.code || '');
  const [outputLanguage, setOutputLanguage] = useState<string>(languages.find(l => l.code === 'de')?.code || languages[1]?.code || '');
  const [subtitleSource, setSubtitleSource] = useState<'mock' | 'teletext' | 'audio'>(subtitleSources[0]?.code || 'mock');
  const [sourceTrackId, setSourceTrackId] = useState<string>('');


  const handleSubmit = () => {
    // Basic validation for streamUrl as it's always required
    if (!streamUrl) {
        alert("Stream URL (UDP/SRT) cannot be empty.");
        return;
    }
    if (!inputLanguage || !outputLanguage || !subtitleSource) {
      alert("Please fill in all required fields: Input Language, Output Language, and Subtitle Source.");
      return;
    }
    onAddStream({ 
      streamUrl, 
      inputLanguage, 
      outputLanguage, 
      subtitleSource, 
      sourceTrackId: subtitleSource !== 'mock' ? sourceTrackId : undefined 
    });
    setStreamUrl(''); 
    setSourceTrackId('');
    // Optionally reset languages or subtitleSource, or keep them for faster multiple additions
  };

  const getSourceTrackLabel = () => {
    if (subtitleSource === 'teletext') return "Teletext Page Number";
    if (subtitleSource === 'audio') return "Audio Track ID/Language";
    return "Source Track ID/Language";
  };

  const getSourceTrackPlaceholder = () => {
    if (subtitleSource === 'teletext') return "e.g., 888";
    if (subtitleSource === 'audio') return "e.g., 'eng', 'Track 2'";
    return "e.g., 'eng', 'PID 101'";
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Cable className="mr-3 h-6 w-6 text-primary" />
          Add New Stream Configuration
        </CardTitle>
        <CardDescription>Configure a new input stream (UDP or SRT) with its translation and subtitle source settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="newStreamUrl" className="text-sm font-medium">
            Live Stream URL (UDP/SRT)
          </Label>
          <Input
            id="newStreamUrl"
            type="url"
            placeholder="udp://... or srt://..."
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            className="bg-background border-border focus:ring-primary placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inputLanguage" className="text-sm font-medium">Input Language (of content)</Label>
            <Select value={inputLanguage} onValueChange={setInputLanguage}>
              <SelectTrigger id="inputLanguage" className="bg-background border-border focus:ring-primary">
                <SelectValue placeholder="Select input language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={`in-${lang.code}`} value={lang.code}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outputLanguage" className="text-sm font-medium">Output Language (for translation)</Label>
            <Select value={outputLanguage} onValueChange={setOutputLanguage}>
              <SelectTrigger id="outputLanguage" className="bg-background border-border focus:ring-primary">
                <SelectValue placeholder="Select output language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={`out-${lang.code}`} value={lang.code} disabled={lang.code === inputLanguage}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subtitleSource" className="text-sm font-medium">Subtitle Source</Label>
            <Select value={subtitleSource} onValueChange={(value) => setSubtitleSource(value as 'mock' | 'teletext' | 'audio')}>
              <SelectTrigger id="subtitleSource" className="bg-background border-border focus:ring-primary">
                <SelectValue placeholder="Select subtitle source" />
              </SelectTrigger>
              <SelectContent>
                {subtitleSources.map(source => (
                  <SelectItem key={`subsource-${source.code}`} value={source.code}>
                    {source.code === 'teletext' && <ListVideo className="inline h-4 w-4 mr-2" />}
                    {source.code === 'audio' && <AudioLines className="inline h-4 w-4 mr-2" />}
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
            
          {subtitleSource !== 'mock' && (
            <div className="space-y-2">
              <Label htmlFor="sourceTrackId" className="text-sm font-medium">
                {getSourceTrackLabel()} <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="sourceTrackId"
                type="text"
                placeholder={getSourceTrackPlaceholder()}
                value={sourceTrackId}
                onChange={(e) => setSourceTrackId(e.target.value)}
                className="bg-background border-border focus:ring-primary placeholder:text-muted-foreground/70"
              />
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleSubmit} 
          disabled={!streamUrl || !inputLanguage || !outputLanguage || !subtitleSource} 
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Stream
        </Button>
      </CardContent>
    </Card>
  );
}
