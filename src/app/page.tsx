"use client";

import { useState } from "react";
import { ChefHat, Heart } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/use-local-storage";
import RecipeSuggestion from "@/components/recipe-suggestion";
import FavoritesList from "@/components/favorites-list";
import type { Recipe } from "@/ai/flows/suggest-recipe";

export default function Home() {
  const [favorites, setFavorites] = useLocalStorage<Recipe[]>(
    "gourmand-favorites",
    []
  );

  const handleToggleFavorite = (recipe: Recipe) => {
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
          ប្រែក្លាយគ្រឿងផ្សំក្នុងផ្ទះបាយរបស់អ្នកទៅជាអាហារដ៏ឈ្ងុយឆ្ងាញ់។ ប្រាប់យើងពីអ្វីដែលអ្នកមាន ហើយយើងនឹងបង្កើតរូបមន្តសម្រាប់អ្នក។
        </p>
      </header>

      <Tabs defaultValue="suggestion" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-lg bg-muted p-1">
          <TabsTrigger value="suggestion" className="data-[state=active]:bg-card">
            <ChefHat className="mr-2 h-4 w-4" />
            ណែនាំរូបមន្ត
          </TabsTrigger>
          <TabsTrigger value="favorites" className="data-[state=active]:bg-card">
            <Heart className="mr-2 h-4 w-4" />
            ចំណូលចិត្ត
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
