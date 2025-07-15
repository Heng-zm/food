"use server";

import { 
  suggestRecipes,
  type SuggestRecipesInput, 
  type SuggestRecipesOutput,
  generateRecipeImage,
  type GenerateRecipeImageInput,
  type GenerateRecipeImageOutput,
  synthesizeSpeech,
  type SynthesizeSpeechInput,
  type SynthesizeSpeechOutput,
  suggestSubstitutions,
  type SuggestSubstitutionsInput,
  type SuggestSubstitutionsOutput,
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

export async function getRecipeImage(
  data: GenerateRecipeImageInput
): Promise<{ success: boolean; data: GenerateRecipeImageOutput | null; error: string | null; }> {
   try {
    const result = await generateRecipeImage(data);
    return { success: true, data: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, data: null, error: `Failed to get recipe image: ${errorMessage}` };
  }
}

export async function getTextToSpeech(
  data: SynthesizeSpeechInput
): Promise<{ success: boolean; data: SynthesizeSpeechOutput | null; error: string | null; }> {
  try {
    const result = await synthesizeSpeech(data);
    return { success: true, data: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, data: null, error: `Failed to get recipe speech: ${errorMessage}` };
  }
}

export async function getIngredientSubstitution(
  data: SuggestSubstitutionsInput
): Promise<{ success: boolean; data: SuggestSubstitutionsOutput | null; error: string | null; }> {
  try {
    const result = await suggestSubstitutions(data);
    return { success: true, data: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, data: null, error: `Failed to get ingredient substitution: ${errorMessage}` };
  }
}
