
'use server';

/**
 * @fileOverview Recipe suggestion and image generation flows.
 *
 * - suggestRecipes - Suggests a list of recipes based on ingredients and cuisine.
 * - generateRecipeImage - Generates an image for a specific recipe name.
 * - SuggestRecipesInput - The input type for the suggestRecipes function.
 * - Recipe - A single recipe object.
 * - SuggestRecipesOutput - The return type for the suggestRecipes function.
 * - GenerateRecipeImageInput - The input type for the generateRecipeImage function.
 * - GenerateRecipeImageOutput - The return type for the generateRecipeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schema for recipe suggestion input
const SuggestRecipesInputSchema = z.object({
  ingredients: z
    .string()
    .describe('បញ្ជីគ្រឿងផ្សំដែលមាន រាយដោយមានសញ្ញាក្បៀស។'),
  cuisine: z.string().describe('ប្រភេទម្ហូបដែលចង់បាន (ឧ. ខ្មែរ, អ៊ីតាលី)។'),
});
export type SuggestRecipesInput = z.infer<typeof SuggestRecipesInputSchema>;

// Schema for a single recipe
const RecipeSchema = z.object({
  recipeName: z.string().describe('ឈ្មោះរូបមន្តដែលបានណែនាំ។'),
  description: z.string().describe('ការពិពណ៌នាសង្ខេប និងទាក់ទាញអំពីម្ហូប (១-២ ប្រយោគ)។'),
  ingredients: z.string().describe('បញ្ជីគ្រឿងផ្សំដែលត្រូវការសម្រាប់រូបមន្ត។ បំបែកធាតុនីមួយៗដោយសញ្ញាបន្ទាត់ថ្មី (\\n)។'),
  instructions: z.string().describe('ការណែនាំអំពីការរៀបចំរូបមន្តមួយជំហានម្តងៗ។ បំបែកជំហាននីមួយៗដោយសញ្ញាបន្ទាត់ថ្មី (\\n)។'),
  estimatedCookingTime: z.string().describe('ពេលវេលាចម្អិនអាហារប៉ាន់ស្មាន (ឧ. 30 នាទី)។'),
});
export type Recipe = z.infer<typeof RecipeSchema>;

// Schema for the output of the recipe suggestion flow
const SuggestRecipesOutputSchema = z.object({
  recipes: z.array(RecipeSchema),
});
export type SuggestRecipesOutput = z.infer<typeof SuggestRecipesOutputSchema>;

// Main function to suggest recipes
export async function suggestRecipes(
  input: SuggestRecipesInput
): Promise<SuggestRecipesOutput> {
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

  Based on the provided ingredients and cuisine, suggest 5 distinct, excellent, detailed recipes. For each recipe, include a short, enticing description.

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


// Schemas and flow for generating a recipe image
const GenerateRecipeImageInputSchema = z.object({
    recipeName: z.string().describe("The name of the recipe to generate an image for."),
});
export type GenerateRecipeImageInput = z.infer<typeof GenerateRecipeImageInputSchema>;

const GenerateRecipeImageOutputSchema = z.object({
    imageUrl: z.string().describe("The data URI of the generated image."),
});
export type GenerateRecipeImageOutput = z.infer<typeof GenerateRecipeImageOutputSchema>;


export async function generateRecipeImage(input: GenerateRecipeImageInput): Promise<GenerateRecipeImageOutput> {
    return generateRecipeImageFlow(input);
}

const generateRecipeImageFlow = ai.defineFlow(
    {
        name: 'generateRecipeImageFlow',
        inputSchema: GenerateRecipeImageInputSchema,
        outputSchema: GenerateRecipeImageOutputSchema,
    },
    async ({ recipeName }) => {
        const prompt = `A photorealistic, beautifully lit, appetizing photo of a finished plate of ${recipeName}, traditional Khmer style.`;
        
        try {
            const { media } = await ai.generate({
                model: 'googleai/gemini-2.0-flash-preview-image-generation',
                prompt: prompt,
                config: {
                    responseModalities: ['IMAGE'],
                },
            });

            if (media?.url) {
                return { imageUrl: media.url };
            }
             // On failure, return an empty string to satisfy the schema.
             return { imageUrl: "" };

        } catch (error) {
             console.error(`Failed to generate image for "${recipeName}":`, error);
              // On error, return an empty string to satisfy the schema.
             return { imageUrl: "" };
        }
    }
);
