
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
import type { StreamInstance, LANGUAGES } from './caption-cast-ui'; // Import types

interface EditStreamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  streamData: StreamInstance | null;
  onSave: (updatedConfig: { id: string; streamUrl: string; inputLanguage: string; outputLanguage: string }) => void;
  languages: typeof LANGUAGES;
}

export function EditStreamDialog({ isOpen, onClose, streamData, onSave, languages }: EditStreamDialogProps) {
  const [currentStreamUrl, setCurrentStreamUrl] = useState('');
  const [currentInputLanguage, setCurrentInputLanguage] = useState('');
  const [currentOutputLanguage, setCurrentOutputLanguage] = useState('');

  useEffect(() => {
    if (streamData) {
      setCurrentStreamUrl(streamData.streamUrl);
      setCurrentInputLanguage(streamData.inputLanguage);
      setCurrentOutputLanguage(streamData.outputLanguage);
    }
  }, [streamData, isOpen]); // Re-initialize when dialog opens or streamData changes

  const handleSaveChanges = () => {
    if (!streamData) return;
    if (!currentStreamUrl || !currentInputLanguage || !currentOutputLanguage) {
      // Basic validation, consider using toast for errors
      alert("Please fill in all fields: Stream URL, Input Language, and Output Language.");
      return;
    }
    onSave({
      id: streamData.id,
      streamUrl: currentStreamUrl,
      inputLanguage: currentInputLanguage,
      outputLanguage: currentOutputLanguage,
    });
  };

  if (!isOpen || !streamData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle>Edit Stream Configuration</DialogTitle>
          <DialogDescription>
            Make changes to your stream URL and language settings. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editStreamUrl" className="text-right col-span-1">
              Stream URL
            </Label>
            <Input
              id="editStreamUrl"
              value={currentStreamUrl}
              onChange={(e) => setCurrentStreamUrl(e.target.value)}
              className="col-span-3 bg-background border-border focus:ring-primary placeholder:text-muted-foreground/70"
              placeholder="udp://... or srt://..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editInputLanguage" className="text-right col-span-1">
              Input Lang
            </Label>
            <Select value={currentInputLanguage} onValueChange={setCurrentInputLanguage}>
              <SelectTrigger id="editInputLanguage" className="col-span-3 bg-background border-border focus:ring-primary">
                <SelectValue placeholder="Select input language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={`edit-in-${lang.code}`} value={lang.code}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editOutputLanguage" className="text-right col-span-1">
              Output Lang
            </Label>
            <Select value={currentOutputLanguage} onValueChange={setCurrentOutputLanguage}>
              <SelectTrigger id="editOutputLanguage" className="col-span-3 bg-background border-border focus:ring-primary">
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveChanges} className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
