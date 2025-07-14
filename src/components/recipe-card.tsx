"use client";

import Image from "next/image";
import { useState } from "react";
import { Clock, Flame, Heart, Printer, UtensilsCrossed, BookOpen, Volume2, Loader2, Trash2, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { SuggestRecipeOutput } from "@/ai/flows/suggest-recipe";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RecipeCardProps {
  recipe: SuggestRecipeOutput;
  isFavorite: boolean;
  onToggleFavorite: (recipe: SuggestRecipeOutput) => void;
  showRemoveConfirm?: boolean;
}

const RecipeCard = ({ recipe, isFavorite, onToggleFavorite, showRemoveConfirm = false }: RecipeCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(() => (typeof Audio !== 'undefined' && recipe.audioUrl) ? new Audio(recipe.audioUrl) : null);
  const { toast } = useToast();

  if (audio) {
    audio.onended = () => setIsPlaying(false);
  }

  const handlePrint = () => {
    window.print();
  };

  const parseList = (text: string) => {
    if(!text) return [];
    return text.split('\n').map(item => item.trim().replace(/^-/,'').trim()).filter(Boolean);
  }
  
  const handleReadAloud = async () => {
    if (!audio) {
      toast({
        variant: "destructive",
        title: "មិនអាចចាក់សំឡេងបានទេ",
        description: "ឯកសារអូឌីយ៉ូមិនមានសម្រាប់រូបមន្តនេះទេ។",
      });
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const ingredientsList = parseList(recipe.ingredients);
  const instructionsList = parseList(recipe.instructions);

  const FavoriteButton = () => (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => onToggleFavorite(recipe)}
      aria-label={isFavorite ? "ដកចេញពីចំណូលចិត្ត" : "បន្ថែមទៅចំណូលចិត្ត"}
    >
      <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-primary"}`} />
    </Button>
  );

  const RemoveFavoriteButton = () => (
     <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="icon"
          aria-label="ដកចេញពីចំណូលចិត្ត"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>តើអ្នកប្រាកដទេ?</AlertDialogTitle>
          <AlertDialogDescription>
            សកម្មភាពនេះនឹងដក "{recipe.recipeName}" ចេញពីបញ្ជីចំណូលចិត្តរបស់អ្នកជាអចិន្ត្រៃយ៍។
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>បោះបង់</AlertDialogCancel>
          <AlertDialogAction onClick={() => onToggleFavorite(recipe)}>
            ដកចេញ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

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
            {isFavorite && showRemoveConfirm ? <RemoveFavoriteButton /> : <FavoriteButton />}
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
                disabled={!recipe.audioUrl}
                aria-label="អានការណែនាំឮៗ"
                className="no-print"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-primary" />
                ) : (
                  <Play className="h-5 w-5 text-primary" />
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
