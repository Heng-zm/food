"use client";

import Image from "next/image";
import { useState } from "react";
import { Clock, Flame, Heart, Printer, UtensilsCrossed, BookOpen, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getSpeechFromText } from "@/app/actions";
import type { SuggestRecipeOutput } from "@/ai/flows/suggest-recipe";

interface RecipeCardProps {
  recipe: SuggestRecipeOutput;
  isFavorite: boolean;
  onToggleFavorite: (recipe: SuggestRecipeOutput) => void;
}

const RecipeCard = ({ recipe, isFavorite, onToggleFavorite }: RecipeCardProps) => {
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  const parseList = (text: string) => {
    if(!text) return [];
    return text.split('\n').map(item => item.trim().replace(/^-/,'').trim()).filter(Boolean);
  }
  
  const handleReadAloud = async () => {
    setIsReadingAloud(true);
    const textToRead = `ការណែនាំ៖\n${recipe.instructions}`;
    const result = await getSpeechFromText({ text: textToRead });
    setIsReadingAloud(false);

    if (result.success && result.data?.audioUrl) {
      const audio = new Audio(result.data.audioUrl);
      audio.play();
    } else {
      toast({
        variant: "destructive",
        title: "មានបញ្ហាក្នុងការបង្កើតសំឡេង",
        description: result.error || "មិនអាចបង្កើតការអានឮៗបានទេ។",
      });
    }
  };

  const ingredientsList = parseList(recipe.ingredients);
  const instructionsList = parseList(recipe.instructions);

  return (
    <Card className="w-full overflow-hidden printable-area">
      <CardHeader className="p-0">
        <div className="relative h-64 w-full">
          <Image
            src={recipe.imageUrl || "https://placehold.co/600x400/C45720/F5F5DC"}
            alt={recipe.recipeName}
            layout="fill"
            objectFit="cover"
            data-ai-hint="gourmet food"
            className="bg-muted"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <CardTitle className="font-headline text-3xl font-bold text-white">
              {recipe.recipeName}
            </CardTitle>
          </div>
          <div className="absolute top-4 right-4 flex gap-2 no-print">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onToggleFavorite(recipe)}
              aria-label={isFavorite ? "ដកចេញពីចំណូលចិត្ត" : "បន្ថែមទៅចំណូលចិត្ត"}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-primary"}`} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handlePrint}
              aria-label="បោះពុម្ពរូបមន្ត"
            >
              <Printer className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6 grid grid-cols-1 gap-4 text-center sm:grid-cols-2">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">
              {recipe.estimatedCookingTime}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">
              {recipe.nutritionalInformation}
            </span>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-headline text-xl font-bold">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
              គ្រឿងផ្សំ
            </h3>
            <ul className="space-y-2">
              {ingredientsList.map((ingredient, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 mt-1 block h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-headline text-xl font-bold">
                <BookOpen className="h-6 w-6 text-primary" />
                ការណែនាំ
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReadAloud}
                disabled={isReadingAloud}
                aria-label="អានការណែនាំឮៗ"
                className="no-print"
              >
                {isReadingAloud ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Volume2 className="h-5 w-5 text-primary" />
                )}
              </Button>
            </div>
            <ol className="space-y-4">
               {instructionsList.map((instruction, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
