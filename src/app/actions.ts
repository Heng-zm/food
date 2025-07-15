"use server";

import { 
  suggestRecipe, 
  getRecipeDetails,
  getAudioForRecipe,
  type SuggestRecipeInput, 
  type SuggestRecipeOutput,
  type GetRecipeDetailsInput,
  type GetRecipeDetailsOutput,
  type GetAudioForRecipeInput,
  type GetAudioForRecipeOutput,
} from '@/ai/flows/suggest-recipe';

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

export async function getRecipeDetailsAction(
  data: GetRecipeDetailsInput
): Promise<{ success: boolean; data: GetRecipeDetailsOutput | null; error: string | null; }> {
  try {
    const details = await getRecipeDetails(data);
    return { success: true, data: details, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, data: null, error: `Failed to get recipe details. ${errorMessage}` };
  }
}

export async function getAudioForRecipeAction(
  data: GetAudioForRecipeInput
): Promise<{ success: boolean; data: GetAudioForRecipeOutput | null; error: string | null; }> {
  try {
    const details = await getAudioForRecipe(data);
    return { success: true, data: details, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, data: null, error: `Failed to get audio. ${errorMessage}` };
  }
}