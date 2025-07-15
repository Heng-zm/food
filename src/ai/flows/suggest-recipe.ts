
'use server';

/**
 * @fileOverview Recipe suggestion, image generation, TTS, and substitution flows.
 *
 * - suggestRecipes - Suggests a list of recipes based on ingredients and cuisine.
 * - generateRecipeImage - Generates an image for a specific recipe name.
 * - synthesizeSpeech - Converts recipe instructions text to speech.
 * - suggestSubstitutions - Suggests substitutes for a given ingredient in a recipe.
 * - SuggestRecipesInput - The input type for the suggestRecipes function.
 * - Recipe - A single recipe object.
 * - SuggestRecipesOutput - The return type for the suggestRecipes function.
 * - GenerateRecipeImageInput - The input type for the generateRecipeImage function.
 * - GenerateRecipeImageOutput - The return type for the generateRecipeImage function.
 * - SynthesizeSpeechInput - The input type for the synthesizeSpeech function.
 * - SynthesizeSpeechOutput - The return type for the synthesizeSpeech function.
 * - SuggestSubstitutionsInput - The input type for the suggestSubstitutions function.
 * - Substitution - A single substitution object.
 * - SuggestSubstitutionsOutput - The return type for the suggestSubstitutions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

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
             return { imageUrl: "" };

        } catch (error) {
             console.error(`Failed to generate image for "${recipeName}":`, error);
             return { imageUrl: "" };
        }
    }
);


// Schemas and flow for Text-to-Speech
const SynthesizeSpeechInputSchema = z.object({
    text: z.string().describe("The text to be converted to speech."),
});
export type SynthesizeSpeechInput = z.infer<typeof SynthesizeSpeechInputSchema>;

const SynthesizeSpeechOutputSchema = z.object({
    audioUrl: z.string().describe("The data URI of the generated audio file in WAV format."),
});
export type SynthesizeSpeechOutput = z.infer<typeof SynthesizeSpeechOutputSchema>;

export async function synthesizeSpeech(input: SynthesizeSpeechInput): Promise<SynthesizeSpeechOutput> {
    return synthesizeSpeechFlow(input);
}

async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

const synthesizeSpeechFlow = ai.defineFlow(
    {
        name: 'synthesizeSpeechFlow',
        inputSchema: SynthesizeSpeechInputSchema,
        outputSchema: SynthesizeSpeechOutputSchema,
    },
    async ({ text }) => {
        try {
            const { media } = await ai.generate({
                model: 'googleai/gemini-2.5-flash-preview-tts',
                config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Algenib' },
                        },
                    },
                },
                prompt: text,
            });

            if (!media?.url) {
                 throw new Error('No audio data returned from TTS model.');
            }

            const audioBuffer = Buffer.from(
                media.url.substring(media.url.indexOf(',') + 1),
                'base64'
            );

            const wavBase64 = await toWav(audioBuffer);
            return { audioUrl: `data:audio/wav;base64,${wavBase64}` };

        } catch (error) {
            console.error('Failed to synthesize speech:', error);
            return { audioUrl: '' };
        }
    }
);

// Schemas and flow for ingredient substitution
const SuggestSubstitutionsInputSchema = z.object({
    recipeName: z.string().describe("The name of the recipe."),
    ingredient: z.string().describe("The ingredient that needs a substitute."),
});
export type SuggestSubstitutionsInput = z.infer<typeof SuggestSubstitutionsInputSchema>;

const SubstitutionSchema = z.object({
    substitute: z.string().describe("The name of the substitute ingredient."),
    amount: z.string().describe("The amount of the substitute to use."),
    notes: z.string().describe("Any additional notes or instructions for using the substitute."),
});
export type Substitution = z.infer<typeof SubstitutionSchema>;

const SuggestSubstitutionsOutputSchema = z.object({
    substitutions: z.array(SubstitutionSchema),
});
export type SuggestSubstitutionsOutput = z.infer<typeof SuggestSubstitutionsOutputSchema>;

export async function suggestSubstitutions(
  input: SuggestSubstitutionsInput
): Promise<SuggestSubstitutionsOutput> {
  return suggestSubstitutionsFlow(input);
}

const substitutionPrompt = ai.definePrompt({
    name: 'substitutionPrompt',
    input: { schema: SuggestSubstitutionsInputSchema },
    output: {
        format: 'json',
        schema: SuggestSubstitutionsOutputSchema,
    },
    prompt: `You are an expert chef. For the recipe "{{recipeName}}", the user needs a substitute for the ingredient "{{ingredient}}".

    Please provide 2-3 common, practical substitutions. For each substitution, provide the amount to use and any relevant notes.

    Please provide the entire response in Khmer (Cambodia).

    Ensure your response is a parsable JSON object that adheres to the provided schema.
    `,
});

const suggestSubstitutionsFlow = ai.defineFlow(
    {
        name: 'suggestSubstitutionsFlow',
        inputSchema: SuggestSubstitutionsInputSchema,
        outputSchema: SuggestSubstitutionsOutputSchema,
    },
    async (input) => {
        const { output } = await substitutionPrompt(input);
        return output!;
    }
);
