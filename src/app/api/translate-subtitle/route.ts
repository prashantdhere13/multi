
import { NextResponse, type NextRequest } from 'next/server';
import { translateSubtitles, type TranslateSubtitlesInput, type TranslateSubtitlesOutput } from '@/ai/flows/translate-subtitles';
import { z } from 'zod';

// Define the expected request body schema for validation
const ApiTranslateSubtitlesInputSchema = z.object({
  subtitlesToTranslate: z.string(),
  inputLanguage: z.string(),
  outputLanguage: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = ApiTranslateSubtitlesInputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validationResult.error.flatten() }, { status: 400 });
    }

    const { subtitlesToTranslate, inputLanguage, outputLanguage } = validationResult.data;

    if (!subtitlesToTranslate || !inputLanguage || !outputLanguage) {
      return NextResponse.json({ error: 'Missing required fields: subtitlesToTranslate, inputLanguage, outputLanguage' }, { status: 400 });
    }

    const translationInput: TranslateSubtitlesInput = {
      subtitlesToTranslate,
      inputLanguage,
      outputLanguage,
    };

    const translationOutput: TranslateSubtitlesOutput = await translateSubtitles(translationInput);

    if (translationOutput && typeof translationOutput.translatedSubtitles === 'string') {
      return NextResponse.json({ translatedSubtitles: translationOutput.translatedSubtitles });
    } else {
      // This case should ideally be handled within the translateSubtitles flow itself by returning a structured error
      // For robustness, we handle it here as well.
      console.error('API Route: Translation flow returned unexpected output:', translationOutput);
      return NextResponse.json({ error: 'Translation failed or returned malformed data' }, { status: 500 });
    }

  } catch (error) {
    console.error('API Route: Error during subtitle translation:', error);
    // Check if the error is an instance of Error to safely access the message property
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during translation.';
    // Consider if the error might contain sensitive details before passing it to the client
    return NextResponse.json({ error: 'Failed to translate subtitles', details: errorMessage }, { status: 500 });
  }
}
