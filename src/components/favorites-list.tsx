
"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import RecipeCard from "@/components/recipe-card";
import type { Recipe } from "@/ai/flows/suggest-recipe";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FavoritesListProps {
  favorites: Recipe[];
  onToggleFavorite: (recipe: Recipe) => void;
}

const FavoritesList = ({ favorites, onToggleFavorite }: FavoritesListProps) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedRecipe(null);
    }
  }

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

  const RecipeDetailView = ({ recipe }: { recipe: Recipe }) => (
    <ScrollArea className="h-[85vh]">
      <RecipeCard 
        recipe={recipe}
        isFavorite={true}
        onToggleFavorite={onToggleFavorite}
        showRemoveConfirm={true}
      />
    </ScrollArea>
  );

  const renderFavoriteItem = (recipe: Recipe) => (
    <Card 
      className="group cursor-pointer overflow-hidden transition-transform duration-200 hover:-translate-y-1"
      onClick={() => handleSelectRecipe(recipe)}
    >
      <CardHeader>
          <CardTitle className="truncate group-hover:text-accent">{recipe.recipeName}</CardTitle>
          <CardDescription>{recipe.estimatedCookingTime}</CardDescription>
      </CardHeader>
      <CardContent>
          <p className="text-muted-foreground text-sm line-clamp-3">{recipe.description}</p>
      </CardContent>
    </Card>
  );

  if (isDesktop) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((recipe) => (
          <Dialog key={recipe.recipeName} open={selectedRecipe?.recipeName === recipe.recipeName} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              {renderFavoriteItem(recipe)}
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto p-0 sm:max-w-3xl">
               <DialogHeader className="p-6 pb-0">
                  <DialogTitle>{recipe.recipeName}</DialogTitle>
               </DialogHeader>
               <RecipeDetailView recipe={recipe} />
            </DialogContent>
          </Dialog>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
       {favorites.map((recipe) => (
          <Drawer key={recipe.recipeName} open={selectedRecipe?.recipeName === recipe.recipeName} onOpenChange={handleOpenChange}>
            <DrawerTrigger asChild>
               {renderFavoriteItem(recipe)}
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>{recipe.recipeName}</DrawerTitle>
              </DrawerHeader>
              <RecipeDetailView recipe={recipe} />
            </DrawerContent>
          </Drawer>
        ))}
    </div>
  );
};

export default FavoritesList;
