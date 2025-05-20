
// src/ai/flows/translate-subtitles.ts
'use server';

/**
 * @fileOverview Translates subtitles from a specified input language to a specified output language.
 *
 * - translateSubtitles - A function that translates subtitles.
 * - TranslateSubtitlesInput - The input type for the translateSubtitles function.
 * - TranslateSubtitlesOutput - The return type for the translateSubtitles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateSubtitlesInputSchema = z.object({
  subtitlesToTranslate: z
    .string()
    .describe('The subtitles to translate.'),
  inputLanguage: z
    .string()
    .describe('The language of the subtitlesToTranslate (e.g., "English", "Spanish").'),
  outputLanguage: z
    .string()
    .describe('The language to translate the subtitles to (e.g., "German", "French").'),
});
export type TranslateSubtitlesInput = z.infer<typeof TranslateSubtitlesInputSchema>;

const TranslateSubtitlesOutputSchema = z.object({
  translatedSubtitles: z.string().describe('The translated subtitles.'),
});
export type TranslateSubtitlesOutput = z.infer<typeof TranslateSubtitlesOutputSchema>;

export async function translateSubtitles(
  input: TranslateSubtitlesInput
): Promise<TranslateSubtitlesOutput> {
  return translateSubtitlesFlow(input);
}

const translateSubtitlesPrompt = ai.definePrompt({
  name: 'translateSubtitlesPrompt',
  input: {schema: TranslateSubtitlesInputSchema},
  output: {schema: TranslateSubtitlesOutputSchema},
  prompt: `Translate the following text from {{inputLanguage}} to {{outputLanguage}}:\n\n{{subtitlesToTranslate}}`,
});

const translateSubtitlesFlow = ai.defineFlow(
  {
    name: 'translateSubtitlesFlow',
    inputSchema: TranslateSubtitlesInputSchema,
    outputSchema: TranslateSubtitlesOutputSchema,
  },
  async (input): Promise<TranslateSubtitlesOutput> => {
    // Await the prompt. If this throws (e.g., API error, network issue),
    // the error will propagate and should be caught by the .catch() in CaptionCastUI.
    const promptResponse = await translateSubtitlesPrompt(input);
    const output = promptResponse.output; // `output` is of type TranslateSubtitlesOutput | null

    if (output && typeof output.translatedSubtitles === 'string') {
      return output; // Success, valid structured output
    }
    
    // If promptResponse.output is null or output.translatedSubtitles is not a string,
    // it means the API call itself was successful, but the model's response
    // did not conform to the expected schema.
    // We must return something that matches TranslateSubtitlesOutputSchema.
    console.warn(
      `Translation model did not return the expected structured output for input: "${input.subtitlesToTranslate}". Received output:`,
      output
    );
    return { translatedSubtitles: "[Translation Error: Malformed Response]" };
  }
);

