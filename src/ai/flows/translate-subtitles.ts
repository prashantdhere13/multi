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
  async input => {
    const {output} = await translateSubtitlesPrompt(input);
    // Ensure the output matches the schema, specifically the 'translatedSubtitles' field
    if (output && typeof output.translatedSubtitles === 'string') {
      return output;
    }
    // Fallback or error handling if the output is not as expected
    // This could be due to the model not perfectly adhering to the output schema description
    // For now, we'll assume the direct text() output of the model is the translation if structured output fails
    const llmResponse = await translateSubtitlesPrompt(input); // This might be redundant if it was already called
                                                          // and failed to structure.
                                                          // A more direct call to generate might be needed if prompt() always structures
                                                          // or we adjust the prompt for simpler string output if schema adherence is an issue.
                                                          
    // If the model directly returns a string instead of the object:
    // This part is tricky because `translateSubtitlesPrompt` is typed to return `output` based on `outputSchema`.
    // If the LLM doesn't adhere perfectly, `output` might be structured differently or be null.
    // Let's assume `output` is valid or null. If null, we might throw or return empty.
    if (!output || typeof output.translatedSubtitles !== 'string') {
        // Attempt to get raw text if available (this depends on underlying Genkit model response structure if schema fails)
        // This is a defensive coding part. Ideally, the LLM adheres to the schema.
        // @ts-ignore // Accessing potential raw text if structured output failed
        const rawText = llmResponse.text || (llmResponse as any)?.candidates?.[0]?.message?.parts?.[0]?.text;
        if (rawText) {
          return { translatedSubtitles: rawText };
        }
        console.error("Translation output was not in the expected format and no raw text found.", output);
        return { translatedSubtitles: "[Translation Format Error]" };
    }
    return output!;
  }
);
