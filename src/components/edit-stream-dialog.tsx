
"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListVideo, AudioLines } from 'lucide-react';
import type { StreamInstance, LANGUAGES, SUBTITLE_SOURCES, StreamInstanceConfig } from './caption-cast-ui';

interface EditStreamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  streamData: StreamInstance | null;
  onSave: (updatedConfig: StreamInstanceConfig & { id: string }) => void;
  languages: typeof LANGUAGES;
  subtitleSources: typeof SUBTITLE_SOURCES;
}

export function EditStreamDialog({ 
  isOpen, 
  onClose, 
  streamData, 
  onSave, 
  languages, 
  subtitleSources 
}: EditStreamDialogProps) {
  const [currentStreamUrl, setCurrentStreamUrl] = useState('');
  const [currentInputLanguage, setCurrentInputLanguage] = useState('');
  const [currentOutputLanguage, setCurrentOutputLanguage] = useState('');
  const [currentSubtitleSource, setCurrentSubtitleSource] = useState<'mock' | 'teletext' | 'audio'>('mock');
  const [currentSourceTrackId, setCurrentSourceTrackId] = useState('');

  useEffect(() => {
    if (streamData) {
      setCurrentStreamUrl(streamData.streamUrl);
      setCurrentInputLanguage(streamData.inputLanguage);
      setCurrentOutputLanguage(streamData.outputLanguage);
      setCurrentSubtitleSource(streamData.subtitleSource);
      setCurrentSourceTrackId(streamData.sourceTrackId || '');
    }
  }, [streamData, isOpen]); // Re-initialize when dialog opens or streamData changes

  const handleSaveChanges = () => {
    if (!streamData) return;
    if (!currentStreamUrl || !currentInputLanguage || !currentOutputLanguage || !currentSubtitleSource) {
      alert("Please fill in all required fields: Stream URL, Input Language, Output Language, and Subtitle Source.");
      return;
    }
    onSave({
      id: streamData.id,
      streamUrl: currentStreamUrl,
      inputLanguage: currentInputLanguage,
      outputLanguage: currentOutputLanguage,
      subtitleSource: currentSubtitleSource,
      sourceTrackId: currentSubtitleSource !== 'mock' ? currentSourceTrackId : undefined,
    });
  };

  if (!isOpen || !streamData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Edit Stream Configuration</DialogTitle>
          <DialogDescription>
            Make changes to your stream URL, languages, and subtitle source settings. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="editStreamUrl" className="text-sm">
              Stream URL (UDP/SRT)
            </Label>
            <Input
              id="editStreamUrl"
              value={currentStreamUrl}
              onChange={(e) => setCurrentStreamUrl(e.target.value)}
              className="bg-background border-border focus:ring-primary placeholder:text-muted-foreground/70"
              placeholder="udp://... or srt://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="editInputLanguage" className="text-sm">Input Lang</Label>
              <Select value={currentInputLanguage} onValueChange={setCurrentInputLanguage}>
                <SelectTrigger id="editInputLanguage" className="bg-background border-border focus:ring-primary">
                  <SelectValue placeholder="Select input language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={`edit-in-${lang.code}`} value={lang.code}>{lang.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="editOutputLanguage" className="text-sm">Output Lang</Label>
              <Select value={currentOutputLanguage} onValueChange={setCurrentOutputLanguage}>
                <SelectTrigger id="editOutputLanguage" className="bg-background border-border focus:ring-primary">
                  <SelectValue placeholder="Select output language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={`edit-out-${lang.code}`} value={lang.code} disabled={lang.code === currentInputLanguage}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="editSubtitleSource" className="text-sm">Subtitle Source</Label>
            <Select value={currentSubtitleSource} onValueChange={(value) => setCurrentSubtitleSource(value as 'mock' | 'teletext' | 'audio')}>
              <SelectTrigger id="editSubtitleSource" className="bg-background border-border focus:ring-primary">
                <SelectValue placeholder="Select subtitle source" />
              </SelectTrigger>
              <SelectContent>
                {subtitleSources.map(source => (
                   <SelectItem key={`edit-subsource-${source.code}`} value={source.code}>
                    {source.code === 'teletext' && <ListVideo className="inline h-4 w-4 mr-2" />}
                    {source.code === 'audio' && <AudioLines className="inline h-4 w-4 mr-2" />}
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentSubtitleSource !== 'mock' && (
            <div className="space-y-1">
              <Label htmlFor="editSourceTrackId" className="text-sm">
                Source Track ID/Language <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="editSourceTrackId"
                value={currentSourceTrackId}
                onChange={(e) => setCurrentSourceTrackId(e.target.value)}
                className="bg-background border-border focus:ring-primary placeholder:text-muted-foreground/70"
                placeholder="e.g., 'eng', 'PID 101'"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveChanges} className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
