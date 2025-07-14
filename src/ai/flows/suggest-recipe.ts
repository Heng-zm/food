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
import { textToSpeech } from './text-to-speech';

const SuggestRecipeInputSchema = z.object({
  ingredients: z
    .string()
    .describe('បញ្ជីគ្រឿងផ្សំដែលមាន រាយដោយមានសញ្ញាក្បៀស។'),
  cuisine: z.string().describe('ប្រភេទម្ហូបដែលចង់បាន (ឧ. ខ្មែរ, អ៊ីតាលី)។'),
  dietaryRestrictions: z
    .string()
    .optional()
    .describe('ការរឹតបន្តឹង ឬអាឡែរហ្ស៊ីលើរបបអាហារណាមួយ (ឧ. បួស, គ្មានជាតិស្អិត gluten)'),
});
export type SuggestRecipeInput = z.infer<typeof SuggestRecipeInputSchema>;

const SuggestRecipeOutputSchema = z.object({
  recipeName: z.string().describe('ឈ្មោះរូបមន្តដែលបានណែនាំ។'),
  ingredients: z.string().describe('បញ្ជីគ្រឿងផ្សំដែលត្រូវការសម្រាប់រូបមន្ត។'),
  instructions: z.string().describe('ការណែនាំអំពីការរៀបចំរូបមន្តមួយជំហានម្តងៗ។'),
  estimatedCookingTime: z.string().describe('ពេលវេលាចម្អិនអាហារប៉ាន់ស្មាន (ឧ. 30 នាទី)។'),
  nutritionalInformation: z.string().describe('ព័ត៌មានអាហារូបត្ថម្ភសម្រាប់រូបមន្ត។'),
  imageUrl: z.string().optional().describe('URL នៃរូបភាពនៃរូបមន្ត។'),
  audioUrl: z.string().optional().describe("URL ទិន្នន័យនៃសំឡេងនៃការណែនាំ។"),
});
export type SuggestRecipeOutput = z.infer<typeof SuggestRecipeOutputSchema>;

export async function suggestRecipe(input: SuggestRecipeInput): Promise<SuggestRecipeOutput> {
  return suggestRecipeFlow(input);
}

const recipePrompt = ai.definePrompt({
  name: 'recipePrompt',
  input: {schema: SuggestRecipeInputSchema},
  output: {
    format: 'json',
    schema: z.object({
    recipeName: z.string().describe('ឈ្មោះរូបមន្តដែលបានណែនាំ។'),
    ingredients: z.string().describe('បញ្ជីគ្រឿងផ្សំដែលត្រូវការសម្រាប់រូបមន្ត។ បំបែកធាតុនីមួយៗដោយសញ្ញាបន្ទាត់ថ្មី (\\n)។'),
    instructions: z.string().describe('ការណែនាំអំពីការរៀបចំរូបមន្តមួយជំហានម្តងៗ។ បំបែកជំហាននីមួយៗដោយសញ្ញាបន្ទាត់ថ្មី (\\n)។'),
    estimatedCookingTime: z.string().describe('ពេលវេលាចម្អិនអាហារប៉ាន់ស្មាន (ឧ. 30 នាទី)។'),
    nutritionalInformation: z.string().describe('ព័ត៌មានអាហារូបត្ថម្ភសម្រាប់រូបមន្ត។'),
  })},
  prompt: `អ្នកគឺជាចុងភៅលំដាប់ពិភពលោក ដែលមានជំនាញក្នុងការបង្កើតរូបមន្តឆ្ងាញ់ៗ ដោយផ្អែកលើគ្រឿងផ្សំដែលមាន និងចំណូលចិត្តម្ហូប។

  សូមផ្តល់ការឆ្លើយតបទាំងមូលជាភាសាខ្មែរ (កម្ពុជា)។

  ដោយផ្អែកលើគ្រឿងផ្សំ និងម្ហូបដែលបានផ្តល់ សូមណែនាំរូបមន្តលម្អិត។

  គ្រឿងផ្សំ៖ {{{ingredients}}}
  ម្ហូប៖ {{{cuisine}}}
  ការរឹតបន្តឹងរបបអាហារ៖ {{#if dietaryRestrictions}}{{{dietaryRestrictions}}}{{else}}គ្មាន{{/if}}

  ត្រូវប្រាកដថាការឆ្លើយតបរបស់អ្នកជាទម្រង់ JSON ដែលអាចញែកបាន។
`,
});

const suggestRecipeFlow = ai.defineFlow(
  {
    name: 'suggestRecipeFlow',
    inputSchema: SuggestRecipeInputSchema,
    outputSchema: SuggestRecipeOutputSchema,
  },
  async input => {
    const recipeDetails = await (async () => {
        const {output} = await recipePrompt(input);
        return output!;
    })();
    
    const [imageResult, audioResult] = await Promise.all([
      generateRecipeImage({recipeName: recipeDetails.recipeName}),
      textToSpeech({text: `ការណែនាំ៖\n${recipeDetails.instructions}`})
    ]);

    return {
      ...recipeDetails,
      imageUrl: imageResult.imageUrl,
      audioUrl: audioResult.audioUrl,
    };
  }
);
