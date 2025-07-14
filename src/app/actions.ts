"use server";

import { suggestRecipe, type SuggestRecipeInput, type SuggestRecipeOutput } from '@/ai/flows/suggest-recipe';
import { textToSpeech, type TextToSpeechInput, type TextToSpeechOutput } from '@/ai/flows/text-to-speech';

export async function getRecipeSuggestion(
  data: SuggestRecipeInput
): Promise<{ success: boolean; data: SuggestRecipeOutput | null; error: string | null; }> {
  try {
    const recipe = await suggestRecipe(data);
    return { success: true, data: recipe, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, data: null, error: `Failed to get recipe suggestion. ${errorMessage}` };
  }
}

export async function getSpeechFromText(
  data: TextToSpeechInput
): Promise<{ success: boolean; data: TextToSpeechOutput | null; error: string | null; }> {
    try {
        const audio = await textToSpeech(data);
        return { success: true, data: audio, error: null };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, data: null, error: `Failed to get speech from text. ${errorMessage}` };
    }
}
