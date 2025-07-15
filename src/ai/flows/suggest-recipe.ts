// This file holds the Genkit flow for suggesting recipes based on user-provided ingredients and cuisine preferences.

'use server';

/**
 * @fileOverview Recipe suggestion flow.
 *
 * - suggestRecipe - A function that suggests recipes based on available ingredients and desired cuisine.
 * - getRecipeDetails - A function that gets the image for a specific recipe.
 * - suggestRecipeAndDetails - A function that suggests recipes and fetches their details (images).
 * - SuggestRecipeInput - The input type for the suggestRecipe function.
 * - Recipe - A single recipe object.
 * - SuggestRecipeOutput - The return type for the suggestRecipe function.
 * - GetRecipeDetailsInput - The input type for the getRecipeDetails function.
 * - GetRecipeDetailsOutput - The return type for the getRecipeDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRecipeInputSchema = z.object({
  ingredients: z
    .string()
    .describe('បញ្ជីគ្រឿងផ្សំដែលមាន រាយដោយមានសញ្ញាក្បៀស។'),
  cuisine: z.string().describe('ប្រភេទម្ហូបដែលចង់បាន (ឧ. ខ្មែរ, អ៊ីតាលី)។'),
});
export type SuggestRecipeInput = z.infer<typeof SuggestRecipeInputSchema>;

const RecipeSchema = z.object({
  recipeName: z.string().describe('ឈ្មោះរូបមន្តដែលបានណែនាំ។'),
  ingredients: z.string().describe('បញ្ជីគ្រឿងផ្សំដែលត្រូវការសម្រាប់រូបមន្ត។ បំបែកធាតុនីមួយៗដោយសញ្ញាបន្ទាត់ថ្មី (\\n)។'),
  instructions: z.string().describe('ការណែនាំអំពីការរៀបចំរូបមន្តមួយជំហានម្តងៗ។ បំបែកជំហាននីមួយៗដោយសញ្ញាបន្ទាត់ថ្មី (\\n)។'),
  estimatedCookingTime: z.string().describe('ពេលវេលាចម្អិនអាហារប៉ាន់ស្មាន (ឧ. 30 នាទី)។'),
  imageUrl: z.string().optional().describe('URL នៃរូបភាពនៃរូបមន្ត។'),
});
export type Recipe = z.infer<typeof RecipeSchema>;

const SuggestRecipeOutputSchema = z.object({
  recipes: z.array(RecipeSchema.omit({ imageUrl: true })).describe('បញ្ជីរូបមន្តដែលបានណែនាំចំនួន 5 ។'),
});
export type SuggestRecipeOutput = z.infer<typeof SuggestRecipeOutputSchema>;

const SuggestRecipeAndDetailsOutputSchema = z.object({
    recipes: z.array(RecipeSchema).describe('បញ្ជីរូបមន្តដែលបានណែនាំចំនួន 5 ជាមួយរូបភាព។'),
});
export type SuggestRecipeAndDetailsOutput = z.infer<typeof SuggestRecipeAndDetailsOutputSchema>;


export async function suggestRecipe(input: SuggestRecipeInput): Promise<SuggestRecipeOutput> {
  return suggestRecipeFlow(input);
}

const recipePrompt = ai.definePrompt({
  name: 'recipePrompt',
  input: {schema: SuggestRecipeInputSchema},
  output: {
    format: 'json',
    schema: SuggestRecipeOutputSchema,
  },
  prompt: `អ្នកគឺជាចុងភៅលំដាប់ពិភពលោក ដែលមានជំនាញក្នុងការបង្កើតរូបមន្តឆ្ងាញ់ៗ ដោយផ្អែកលើគ្រឿងផ្សំដែលមាន និងចំណូលចិត្តម្ហូប។

  សូមផ្តល់ការឆ្លើយតបទាំងមូលជាភាសាខ្មែរ (កម្ពុជា)។

  ដោយផ្អែកលើគ្រឿងផ្សំ និងម្ហូបដែលបានផ្តល់ សូមណែនាំរូបមន្តលម្អិតចំនួន 5 ។

  គ្រឿងផ្សំ៖ {{{ingredients}}}
  ម្ហូប៖ {{{cuisine}}}

  ត្រូវប្រាកដថាការឆ្លើយតបរបស់អ្នកជាទម្រង់ JSON ដែលអាចញែកបាន ដែលគោរពតាម schema ដែលបានផ្តល់ឱ្យ។
`,
});

const suggestRecipeFlow = ai.defineFlow(
  {
    name: 'suggestRecipeFlow',
    inputSchema: SuggestRecipeInputSchema,
    outputSchema: SuggestRecipeOutputSchema,
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
  imageUrl: z.string().describe('URL នៃរូបភាពនៃរូបមន្ត។'),
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
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a photorealistic, beautifully plated, and delicious-looking image of the Khmer food dish: '${recipeName}'. The background should be clean and simple to emphasize the food.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media.url) {
      throw new Error('Image generation failed.');
    }
    
    return {
      imageUrl: media.url,
    };
  }
);

// New flow that combines recipe suggestion and image generation
export async function suggestRecipeAndDetails(input: SuggestRecipeInput): Promise<SuggestRecipeAndDetailsOutput> {
  return suggestRecipeAndDetailsFlow(input);
}

const suggestRecipeAndDetailsFlow = ai.defineFlow(
  {
    name: 'suggestRecipeAndDetailsFlow',
    inputSchema: SuggestRecipeInputSchema,
    outputSchema: SuggestRecipeAndDetailsOutputSchema,
  },
  async (input) => {
    const suggestionResult = await suggestRecipeFlow(input);

    const recipesWithDetails = await Promise.all(
      suggestionResult.recipes.map(async (recipe) => {
        try {
          const details = await getRecipeDetailsFlow({ recipeName: recipe.recipeName });
          return { ...recipe, imageUrl: details.imageUrl };
        } catch (error) {
          console.error(`Failed to get details for ${recipe.recipeName}`, error);
          // Return the recipe with a placeholder if fetching fails
          return { ...recipe, imageUrl: "https://placehold.co/600x400.png" };
        }
      })
    );

    return { recipes: recipesWithDetails };
  }
);
