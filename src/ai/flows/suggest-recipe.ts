// This file holds the Genkit flow for suggesting recipes based on user-provided ingredients and cuisine preferences.

'use server';

/**
 * @fileOverview Recipe suggestion flow.
 *
 * - suggestRecipes - A function that suggests a list of recipes based on available ingredients and desired cuisine.
 * - getRecipeDetails - A function that gets the image for a specific recipe.
 * - suggestRecipeAndDetails - A function that suggests recipes and fetches their details (images).
 * - SuggestRecipesInput - The input type for the suggestRecipes function.
 * - Recipe - A single recipe object.
 * - SuggestRecipeAndDetailsOutput - The return type for the suggestRecipeAndDetails function.
 * - GetRecipeDetailsInput - The input type for the getRecipeDetails function.
 * - GetRecipeDetailsOutput - The return type for the getRecipeDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRecipesInputSchema = z.object({
  ingredients: z
    .string()
    .describe('បញ្ជីគ្រឿងផ្សំដែលមាន រាយដោយមានសញ្ញាក្បៀស។'),
  cuisine: z.string().describe('ប្រភេទម្ហូបដែលចង់បាន (ឧ. ខ្មែរ, អ៊ីតាលី)។'),
});
export type SuggestRecipesInput = z.infer<typeof SuggestRecipesInputSchema>;

const RecipeSchema = z.object({
  recipeName: z.string().describe('ឈ្មោះរូបមន្តដែលបានណែនាំ។'),
  ingredients: z.string().describe('បញ្ជីគ្រឿងផ្សំដែលត្រូវការសម្រាប់រូបមន្ត។ បំបែកធាតុនីមួយៗដោយសញ្ញាបន្ទាត់ថ្មី (\\n)។'),
  instructions: z.string().describe('ការណែនាំអំពីការរៀបចំរូបមន្តមួយជំហានម្តងៗ។ បំបែកជំហាននីមួយៗដោយសញ្ញាបន្ទាត់ថ្មី (\\n)។'),
  estimatedCookingTime: z.string().describe('ពេលវេលាចម្អិនអាហារប៉ាន់ស្មាន (ឧ. 30 នាទី)។'),
  imageUrl: z.string().nullable().describe('URL នៃរូបភាពនៃរូបមន្ត។'),
});
export type Recipe = z.infer<typeof RecipeSchema>;

const SuggestRecipesOutputSchema = z.object({
  recipes: z.array(RecipeSchema.omit({ imageUrl: true })),
});
export type SuggestRecipesOutput = z.infer<typeof SuggestRecipesOutputSchema>;

const SuggestRecipeAndDetailsOutputSchema = z.object({
  recipes: z.array(RecipeSchema).describe('The suggested recipes with their images.'),
});
export type SuggestRecipeAndDetailsOutput = z.infer<typeof SuggestRecipeAndDetailsOutputSchema>;

export async function suggestRecipes(input: SuggestRecipesInput): Promise<SuggestRecipesOutput> {
  return suggestRecipesFlow(input);
}

const recipePrompt = ai.definePrompt({
  name: 'recipePrompt',
  input: {schema: SuggestRecipesInputSchema},
  output: {
    format: 'json',
    schema: SuggestRecipesOutputSchema,
  },
  prompt: `You are a world-class chef specializing in creating delicious recipes based on available ingredients and cuisine preferences.

  Please provide the entire response in Khmer (Cambodia).

  Based on the provided ingredients and cuisine, suggest 5 distinct, excellent, detailed recipes.

  Ingredients: {{{ingredients}}}
  Cuisine: {{{cuisine}}}

  Ensure your response is a parsable JSON object that adheres to the provided schema.
`,
});

const suggestRecipesFlow = ai.defineFlow(
  {
    name: 'suggestRecipesFlow',
    inputSchema: SuggestRecipesInputSchema,
    outputSchema: SuggestRecipesOutputSchema,
  },
  async input => {
    const {output} = await recipePrompt(input);
    return output!;
  }
);

// Flow to get details (image) for a single recipe
const GetRecipeDetailsInputSchema = z.object({
  recipeName: z.string(),
});
export type GetRecipeDetailsInput = z.infer<typeof GetRecipeDetailsInputSchema>;

const GetRecipeDetailsOutputSchema = z.object({
  imageUrl: z.string().nullable().describe('URL នៃរូបភាពនៃរូបមន្ត។'),
});
export type GetRecipeDetailsOutput = z.infer<typeof GetRecipeDetailsOutputSchema>;

export async function getRecipeDetails(input: GetRecipeDetailsInput): Promise<GetRecipeDetailsOutput> {
  return getRecipeDetailsFlow(input);
}

const getRecipeDetailsFlow = ai.defineFlow(
  {
    name: 'getRecipeDetailsFlow',
    inputSchema: GetRecipeDetailsInputSchema,
    outputSchema: GetRecipeDetailsOutputSchema,
  },
  async ({ recipeName }) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Generate a photorealistic, beautifully plated, and delicious-looking image of the Khmer food dish: '${recipeName}'. The background should be clean and simple to emphasize the food.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media.url) {
        throw new Error('Image generation failed to return a URL.');
      }
      
      return {
        imageUrl: media.url,
      };
    } catch (error) {
       console.error(`Failed to generate image for ${recipeName}:`, error);
       // Return null on failure to avoid breaking the whole list
       return { imageUrl: null };
    }
  }
);

// New flow that combines recipe suggestion and image generation
export async function suggestRecipeAndDetails(input: SuggestRecipesInput): Promise<SuggestRecipeAndDetailsOutput> {
  return suggestRecipeAndDetailsFlow(input);
}

const suggestRecipeAndDetailsFlow = ai.defineFlow(
  {
    name: 'suggestRecipeAndDetailsFlow',
    inputSchema: SuggestRecipesInputSchema,
    outputSchema: SuggestRecipeAndDetailsOutputSchema,
  },
  async (input) => {
    let suggestionResult: SuggestRecipesOutput | null = null;
    
    // Retry logic for recipe suggestion
    for (let i = 0; i < 2; i++) {
      try {
        suggestionResult = await suggestRecipesFlow(input);
        if (suggestionResult?.recipes?.length > 0) {
          break; // Success, exit loop
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} to get recipe suggestion failed:`, error);
        if (i === 1) { // If it's the last attempt, re-throw the error
          throw error;
        }
      }
    }
    
    if (!suggestionResult || !suggestionResult.recipes || suggestionResult.recipes.length === 0) {
      throw new Error("Failed to get any recipe suggestions after multiple attempts.");
    }
    
    const recipesWithDetails: Recipe[] = [];

    // Use a sequential for...of loop to avoid rate limiting
    for (const recipe of suggestionResult.recipes) {
        const details = await getRecipeDetailsFlow({ recipeName: recipe.recipeName });
        recipesWithDetails.push({ ...recipe, imageUrl: details.imageUrl });
    }

    return { recipes: recipesWithDetails };
  }
);