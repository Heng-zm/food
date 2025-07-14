"use client";

import { useState } from "react";
import { ChefHat, Heart } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/use-local-storage";
import RecipeSuggestion from "@/components/recipe-suggestion";
import FavoritesList from "@/components/favorites-list";
import type { SuggestRecipeOutput } from "@/ai/flows/suggest-recipe";

export default function Home() {
  const [favorites, setFavorites] = useLocalStorage<SuggestRecipeOutput[]>(
    "gourmand-favorites",
    []
  );

  const handleToggleFavorite = (recipe: SuggestRecipeOutput) => {
    setFavorites((prevFavorites) => {
      const isFavorited = prevFavorites.some(
        (fav) => fav.recipeName === recipe.recipeName
      );
      if (isFavorited) {
        return prevFavorites.filter(
          (fav) => fav.recipeName !== recipe.recipeName
        );
      } else {
        return [...prevFavorites, recipe];
      }
    });
  };

  return (
    <main className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-3">
          <ChefHat className="h-10 w-10 text-primary" />
          <h1 className="font-headline text-4xl font-bold tracking-tight text-primary md:text-5xl">
            GourmandAI
          </h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Turn your pantry staples into delightful meals. Tell us what you have, and we'll whip up a recipe just for you.
        </p>
      </header>

      <Tabs defaultValue="suggestion" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="suggestion">
            <ChefHat className="mr-2 h-4 w-4" />
            Suggest Recipe
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Heart className="mr-2 h-4 w-4" />
            Favorites
          </TabsTrigger>
        </TabsList>
        <TabsContent value="suggestion">
          <RecipeSuggestion
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        </TabsContent>
        <TabsContent value="favorites">
          <FavoritesList
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
