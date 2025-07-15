
"use client";

import { Clock, Heart, Printer, UtensilsCrossed, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Recipe } from "@/ai/flows/suggest-recipe";
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
import { Badge } from "@/components/ui/badge";

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (recipe: Recipe) => void;
  showRemoveConfirm?: boolean;
}

const RecipeCard = ({ recipe, isFavorite, onToggleFavorite, showRemoveConfirm = false }: RecipeCardProps) => {

  const handlePrint = () => {
    window.print();
  };

  const parseList = (text: string) => {
    if(!text) return [];
    return text.split('\n').map(item => item.trim().replace(/^-/,'').trim()).filter(Boolean);
  }

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
    <div className="w-full overflow-hidden printable-area">
      <CardHeader className="p-6">
          <div className="flex items-start justify-between">
            <CardTitle className="font-headline text-3xl font-bold text-primary">
              {recipe.recipeName}
            </CardTitle>
            <div className="flex gap-2 no-print">
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
      <CardContent className="p-6 pt-0">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Badge variant="secondary" className="text-sm">
            <Clock className="mr-2 h-4 w-4 text-primary" />
            {recipe.estimatedCookingTime}
          </Badge>
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
    </div>
  );
};

export default RecipeCard;
