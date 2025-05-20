
"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cable, PlusCircle } from 'lucide-react';
import type { LANGUAGES } from './caption-cast-ui'; // Import LANGUAGES type

interface InputConfigSectionProps {
  onAddStream: (config: { srtUrl: string; inputLanguage: string; outputLanguage: string }) => void;
  languages: typeof LANGUAGES;
}

export function InputConfigSection({ onAddStream, languages }: InputConfigSectionProps) {
  const [srtUrl, setSrtUrl] = useState<string>('');
  const [inputLanguage, setInputLanguage] = useState<string>(languages.find(l => l.code === 'en')?.code || languages[0]?.code || ''); // Default to English or first available
  const [outputLanguage, setOutputLanguage] = useState<string>(languages.find(l => l.code === 'de')?.code || languages[1]?.code || ''); // Default to German or second available

  const handleSubmit = () => {
    if (!srtUrl || !inputLanguage || !outputLanguage) {
      // Basic validation, toast can be added here if needed, or rely on parent
      alert("Please fill in all fields: SRT URL, Input Language, and Output Language.");
      return;
    }
    onAddStream({ srtUrl, inputLanguage, outputLanguage });
    setSrtUrl(''); // Reset URL for next input
    // Optionally reset languages or keep them for faster multiple additions with same languages
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Cable className="mr-3 h-6 w-6 text-primary" />
          Add New Stream Configuration
        </CardTitle>
        <CardDescription>Configure a new SRT input stream with its translation language pair.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="newSrtUrl" className="text-sm font-medium">
            Live SRT Stream URL
          </Label>
          <Input
            id="newSrtUrl"
            type="url"
            placeholder="srt://example.com:1234"
            value={srtUrl}
            onChange={(e) => setSrtUrl(e.target.value)}
            className="bg-background border-border focus:ring-primary placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inputLanguage" className="text-sm font-medium">Input Language</Label>
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
            <Label htmlFor="outputLanguage" className="text-sm font-medium">Output Language</Label>
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
        
        <Button 
          onClick={handleSubmit} 
          disabled={!srtUrl || !inputLanguage || !outputLanguage} 
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Stream
        </Button>
      </CardContent>
    </Card>
  );
}
