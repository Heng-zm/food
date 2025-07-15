// This file holds the Genkit flow for suggesting recipes based on user-provided ingredients and cuisine preferences.

'use server';

/**
 * @fileOverview Recipe suggestion flow.
 *
 * - suggestRecipes - A function that suggests a list of recipes based on available ingredients and desired cuisine.
 * - SuggestRecipesInput - The input type for the suggestRecipes function.
 * - Recipe - A single recipe object.
 * - SuggestRecipesOutput - The return type for the suggestRecipes function.
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
});
export type Recipe = z.infer<typeof RecipeSchema>;

const SuggestRecipesOutputSchema = z.object({
  recipes: z.array(RecipeSchema),
});
export type SuggestRecipesOutput = z.infer<typeof SuggestRecipesOutputSchema>;

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
