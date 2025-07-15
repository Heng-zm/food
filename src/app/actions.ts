"use server";

import { 
  suggestRecipeAndDetails,
  type SuggestRecipeInput, 
  type SuggestRecipeAndDetailsOutput,
} from '@/ai/flows/suggest-recipe';

export async function getRecipeSuggestion(
  data: SuggestRecipeInput
): Promise<{ success: boolean; data: SuggestRecipeAndDetailsOutput | null; error: string | null; }> {
  try {
    const result = await suggestRecipeAndDetails(data);
    return { success: true, data: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, data: null, error: `Failed to get recipe suggestion: ${errorMessage}` };
  }
}
