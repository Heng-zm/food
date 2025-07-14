import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-recipe.ts';
import '@/ai/flows/generate-recipe-image.ts';
import '@/ai/flows/text-to-speech.ts';
