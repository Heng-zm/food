// This file holds the Genkit flow for suggesting recipes based on user-provided ingredients and cuisine preferences.

'use server';

/**
 * @fileOverview Recipe suggestion flow.
 *
 * - suggestRecipe - A function that suggests a recipe based on available ingredients and desired cuisine.
 * - SuggestRecipeInput - The input type for the suggestRecipe function.
 * - SuggestRecipeOutput - The return type for the suggestRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateRecipeImage } from './generate-recipe-image';

const SuggestRecipeInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of available ingredients.'),
  cuisine: z.string().describe('The desired cuisine (e.g., Italian, Mexican).'),
  dietaryRestrictions: z
    .string()
    .optional()
    .describe('Any dietary restrictions or allergies (e.g., vegetarian, gluten-free).'),
});
export type SuggestRecipeInput = z.infer<typeof SuggestRecipeInputSchema>;

const SuggestRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the suggested recipe.'),
  ingredients: z.string().describe('A list of ingredients required for the recipe.'),
  instructions: z.string().describe('Step-by-step instructions for preparing the recipe.'),
  estimatedCookingTime: z.string().describe('Estimated cooking time (e.g., 30 minutes).'),
  nutritionalInformation: z.string().describe('Nutritional information for the recipe.'),
  imageUrl: z.string().optional().describe('URL of an image of the recipe.'),
});
export type SuggestRecipeOutput = z.infer<typeof SuggestRecipeOutputSchema>;

export async function suggestRecipe(input: SuggestRecipeInput): Promise<SuggestRecipeOutput> {
  return suggestRecipeFlow(input);
}

const recipePrompt = ai.definePrompt({
  name: 'recipePrompt',
  input: {schema: SuggestRecipeInputSchema},
  output: {schema: z.object({
    recipeName: z.string().describe('The name of the suggested recipe.'),
    ingredients: z.string().describe('A list of ingredients required for the recipe.'),
    instructions: z.string().describe('Step-by-step instructions for preparing the recipe.'),
    estimatedCookingTime: z.string().describe('Estimated cooking time (e.g., 30 minutes).'),
    nutritionalInformation: z.string().describe('Nutritional information for the recipe.'),
  })},
  prompt: `You are a world-class chef specializing in creating delicious recipes based on available ingredients and cuisine preferences.

  Based on the ingredients and cuisine provided, suggest a detailed recipe including:
  - Recipe Name
  - Ingredients (with quantities)
  - Step-by-step cooking instructions
  - Estimated cooking time
  - Nutritional information

  Ingredients: {{{ingredients}}}
  Cuisine: {{{cuisine}}}
  Dietary Restrictions: {{#if dietaryRestrictions}}{{{dietaryRestrictions}}}{{else}}None{{/if}}
`,
});

const suggestRecipeFlow = ai.defineFlow(
  {
    name: 'suggestRecipeFlow',
    inputSchema: SuggestRecipeInputSchema,
    outputSchema: SuggestRecipeOutputSchema,
  },
  async input => {
    const [recipeDetails, image] = await Promise.all([
      (async () => {
        const {output} = await recipePrompt(input);
        return output!;
      })(),
      generateRecipeImage({recipeName: 'a delicious meal'})
    ]);
    
    const {imageUrl} = await generateRecipeImage({recipeName: recipeDetails.recipeName});

    return {
      ...recipeDetails,
      imageUrl: imageUrl,
    };
  }
);
