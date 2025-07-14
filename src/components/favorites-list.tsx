"use client";

import { Heart } from "lucide-react";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import RecipeCard from "@/components/recipe-card";
import type { Recipe } from "@/ai/flows/suggest-recipe";

interface FavoritesListProps {
  favorites: Recipe[];
  onToggleFavorite: (recipe: Recipe) => void;
}

const FavoritesList = ({ favorites, onToggleFavorite }: FavoritesListProps) => {
  if (favorites.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-headline text-xl font-semibold">មិនទាន់មានចំណូលចិត្ត</h3>
        <p className="mt-2 text-muted-foreground">
          រូបមន្តដែលអ្នកចូលចិត្តនឹងបង្ហាញនៅទីនេះ។ ស្វែងរករូបមន្តដែលអ្នកស្រលាញ់ ហើយចុចលើរូបបេះដូងដើម្បីរក្សាទុកវា!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((recipe) => (
        <Dialog key={recipe.recipeName}>
          <DialogTrigger asChild>
            <div className="group cursor-pointer overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-transform duration-200 hover:-translate-y-1">
              <div className="relative h-40 w-full">
                <Image
                  src={recipe.imageUrl || "https://placehold.co/400x300/C45720/F5F5DC"}
                  alt={recipe.recipeName}
                  fill
                  objectFit="cover"
                  data-ai-hint="gourmet food"
                  className="transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30" />
              </div>
              <div className="p-4">
                <h3 className="font-headline text-lg font-semibold truncate">{recipe.recipeName}</h3>
                <p className="text-sm text-muted-foreground truncate">{recipe.estimatedCookingTime}</p>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-h-[90svh] overflow-y-auto p-0 sm:max-w-3xl">
             <DialogHeader className="p-6 pb-0">
                <DialogTitle>{recipe.recipeName}</DialogTitle>
             </DialogHeader>
             <RecipeCard 
                recipe={recipe}
                isFavorite={true}
                onToggleFavorite={onToggleFavorite}
                showRemoveConfirm={true}
             />
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};

export default FavoritesList;
