"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import RecipeCard from "@/components/recipe-card";
import { getRecipeSuggestion } from "@/app/actions";
import type { SuggestRecipeOutput } from "@/ai/flows/suggest-recipe";

const formSchema = z.object({
  ingredients: z.string().min(3, {
    message: "Please enter at least one ingredient.",
  }),
  cuisine: z.string().min(2, {
    message: "Cuisine must be at least 2 characters.",
  }),
  dietaryRestrictions: z.string().optional(),
});

interface RecipeSuggestionProps {
  favorites: SuggestRecipeOutput[];
  onToggleFavorite: (recipe: SuggestRecipeOutput) => void;
}

const RecipeSuggestion = ({ favorites, onToggleFavorite }: RecipeSuggestionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedRecipe, setSuggestedRecipe] = useState<SuggestRecipeOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: "",
      cuisine: "",
      dietaryRestrictions: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSuggestedRecipe(null);
    const result = await getRecipeSuggestion(values);
    setIsLoading(false);

    if (result.success && result.data) {
      setSuggestedRecipe(result.data);
    } else {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: result.error || "There was a problem with your request.",
      });
    }
  }

  const LoadingSkeleton = () => (
    <Card className="mt-8 w-full">
      <CardContent className="p-6">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="mt-6">
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Ingredients</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., chicken breast, tomatoes, onion, garlic"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="cuisine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desired Cuisine</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Italian, Mexican, Indian" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dietaryRestrictions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dietary Restrictions (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Vegetarian, Gluten-Free" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Suggest Recipe"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-8">
        {isLoading && <LoadingSkeleton />}
        {suggestedRecipe && (
          <RecipeCard
            recipe={suggestedRecipe}
            isFavorite={favorites.some(fav => fav.recipeName === suggestedRecipe.recipeName)}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </div>
    </div>
  );
};

export default RecipeSuggestion;
