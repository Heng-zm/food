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
    message: "សូម​បញ្ចូល​គ្រឿង​ផ្សំ​យ៉ាង​ហោច​ណាស់​មួយ។",
  }),
  cuisine: z.string().min(2, {
    message: "ប្រភេទម្ហូបត្រូវតែមានយ៉ាងហោចណាស់ 2 តួអក្សរ។",
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
        title: "មានបញ្ហាអ្វីមួយកើតឡើង!",
        description: result.error || "មានបញ្ហាជាមួយសំណើរបស់អ្នក។",
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
                      <FormLabel>គ្រឿងផ្សំដែលមាន</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="ឧ., សាច់មាន់, ប៉េងប៉ោះ, ខ្ទឹមបារាំង, ខ្ទឹមស"
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
                        <FormLabel>ប្រភេទម្ហូបที่ต้องการ</FormLabel>
                        <FormControl>
                          <Input placeholder="ឧ., ខ្មែរ, អ៊ីតាលី, ឥណ្ឌា" {...field} />
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
                        <FormLabel>ការរឹតបន្តឹងរបបអាហារ (ស្រេចចិត្ត)</FormLabel>
                        <FormControl>
                          <Input placeholder="ឧ., បួស, គ្មានជាតិស្អិត" {...field} />
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
                    កំពុងបង្កើត...
                  </>
                ) : (
                  "ណែនាំរូបមន្ត"
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
