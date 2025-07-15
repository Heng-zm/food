"use server";

import { 
  suggestRecipes,
  type SuggestRecipesInput, 
  type SuggestRecipesOutput,
} from '@/ai/flows/suggest-recipe';

export async function getRecipeSuggestion(
  data: SuggestRecipesInput
): Promise<{ success: boolean; data: SuggestRecipesOutput | null; error: string | null; }> {
  try {
    const result = await suggestRecipes(data);
    return { success: true, data: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, data: null, error: `Failed to get recipe suggestion: ${errorMessage}` };
  }
}
