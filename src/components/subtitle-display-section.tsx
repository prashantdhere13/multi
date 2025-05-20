
"use client";

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, MessageSquareText, ArrowRightLeft } from 'lucide-react';

interface SubtitleDisplaySectionProps {
  originalSubtitles: string[];
  translatedSubtitles: string[];
  isLoadingTranslation: boolean;
  inputLanguageName: string;
  outputLanguageName: string;
}

export function SubtitleDisplaySection({ 
  originalSubtitles, 
  translatedSubtitles, 
  isLoadingTranslation,
  inputLanguageName,
  outputLanguageName 
}: SubtitleDisplaySectionProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center text-foreground">
            <MessageSquareText className="mr-2 h-5 w-5 text-primary" />
            Original ({inputLanguageName})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 w-full rounded-md border border-border p-4 bg-background/50">
            {originalSubtitles.length === 0 && !isLoadingTranslation && <p className="text-muted-foreground italic text-center py-4">Waiting for subtitles...</p>}
            {originalSubtitles.map((sub, index) => (
              <p key={`orig-${index}`} className="mb-1.5 text-sm text-foreground leading-relaxed">{sub}</p>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center text-foreground">
            <Languages className="mr-2 h-5 w-5 text-primary" />
            Translated ({outputLanguageName})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 w-full rounded-md border border-border p-4 bg-background/50">
            {isLoadingTranslation && translatedSubtitles.length === 0 && <p className="text-accent animate-pulse text-center py-4">Translating...</p>}
            {!isLoadingTranslation && translatedSubtitles.length === 0 && <p className="text-muted-foreground italic text-center py-4">Waiting for translation...</p>}
            {translatedSubtitles.map((sub, index) => (
              <p key={`trans-${index}`} className="mb-1.5 text-sm text-foreground leading-relaxed">{sub}</p>
            ))}
             {isLoadingTranslation && translatedSubtitles.length > 0 && <p className="text-accent animate-pulse text-center pt-2">Translating next line...</p>}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
