
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mic, MicOff, Sparkles, ChefHat, RefreshCw, ImageOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RecipeCard from "@/components/recipe-card";
import { getRecipeSuggestion, getRecipeDetailsAction } from "@/app/actions";
import type { Recipe } from "@/ai/flows/suggest-recipe";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object({
  ingredients: z.string().min(3, {
    message: "សូម​បញ្ចូល​គ្រឿង​ផ្សំ​យ៉ាង​ហោច​ណាស់​មួយ។",
  }),
  cuisine: z.string().min(2, {
    message: "សូមជ្រើសរើសប្រភេទម្ហូប។",
  }),
});

interface RecipeSuggestionProps {
  favorites: Recipe[];
  onToggleFavorite: (recipe: Recipe) => void;
}

const cuisineOptions = [
  "ខ្មែរ",
  "ថៃ",
  "វៀតណាម",
  "ចិន",
  "ជប៉ុន",
  "កូរ៉េ",
  "ឥណ្ឌា",
  "អ៊ីតាលី",
  "ម៉ិកស៊ិក",
  "បារាំង",
];

const allRecommendedDishes = [
    "សម្លរកកូរ",
    "អាម៉ុកត្រី",
    "គុយទាវ",
    "សម្លរម្ជូរគ្រឿងសាច់គោ",
    "ឆាក្តៅសាច់មាន់",
    "បាយសាច់ជ្រូក",
    "ឡុកឡាក់សាច់គោ",
    "ការីសាច់មាន់",
    "សម្លរម្ជូរយួន",
    "ឆាខ្ញីសាច់មាន់",
    "ត្រីចៀនជូរអែម",
    "ខសាច់ជ្រូក",
];

const RecipeSuggestion = ({ favorites, onToggleFavorite }: RecipeSuggestionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingRecipeDetails, setFetchingRecipeDetails] = useState<Record<string, boolean>>({});
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[] | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const [recommendedDishes, setRecommendedDishes] = useState<string[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: "",
      cuisine: "",
    },
  });

  useEffect(() => {
    // Randomize dishes on client-side to avoid hydration mismatch
    const shuffled = [...allRecommendedDishes].sort(() => 0.5 - Math.random());
    setRecommendedDishes(shuffled.slice(0, 5));

    const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setIsSpeechRecognitionSupported(supported);
  }, []);

  useEffect(() => {
    if (!isSpeechRecognitionSupported) return;
  
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'km-KH';
    recognition.interimResults = false;
    recognitionRef.current = recognition;
  
    recognition.onstart = () => {
      setIsListening(true);
    };
  
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const currentIngredients = form.getValues("ingredients");
      form.setValue("ingredients", currentIngredients ? `${currentIngredients}, ${transcript}` : transcript);
    };
  
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      let errorMessage = "មិនអាចដំណើរការការបញ្ចូលដោយសំឡេងបានទេ។ សូមព្យាយាមម្តងទៀត។";
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMessage = "ការចូលប្រើមីក្រូហ្វូនត្រូវបានបដិសេធ។ សូមអនុញ្ញាតឱ្យប្រើមីក្រូហ្វូននៅក្នុងការកំណត់កម្មវិធីរុករករបស់អ្នក។";
      }
      toast({
        variant: "destructive",
        title: "បញ្ហាក្នុងការស្គាល់សំឡេង",
        description: errorMessage,
      });
      setIsListening(false);
    };
  
    recognition.onend = () => {
      setIsListening(false);
    };
  
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [form, toast, isSpeechRecognitionSupported]);

  const toggleListening = () => {
    if (!isSpeechRecognitionSupported) {
       toast({
        variant: "destructive",
        title: "មុខងារមិនគាំទ្រ",
        description: "ការស្គាល់សំឡេងមិនត្រូវបានគាំទ្រនៅលើកម្មវិធីរុករកនេះទេ។",
      });
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Could not start recognition", e);
        if (e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
             toast({
                variant: "destructive",
                title: "ការចូលប្រើមីក្រូហ្វូនត្រូវបានបដិសេធ",
                description: "សូមអនុញ្ញាតឱ្យប្រើមីក្រូហ្វូននៅក្នុងការកំណត់កម្មវិធីរុករករបស់អ្នក។",
            });
        } else {
            toast({
                variant: "destructive",
                title: "បញ្ហាក្នុងការចាប់ផ្តើម",
                description: "មិនអាចចាប់ផ្តើមការស្តាប់បានទេ។ សូមព្យាយាមម្តងទៀត។",
            });
        }
        setIsListening(false);
      }
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSuggestedRecipes(null);
    setSelectedRecipe(null);
    const result = await getRecipeSuggestion(values);
    setIsLoading(false);

    if (result.success && result.data) {
      setSuggestedRecipes(result.data.recipes);
      // Eagerly fetch details for all suggested recipes
      result.data.recipes.forEach(recipe => {
        fetchDetailsForRecipe(recipe);
      });
    } else {
      toast({
        variant: "destructive",
        title: "មានបញ្ហាអ្វីមួយកើតឡើង!",
        description: result.error || "មានបញ្ហាជាមួយសំណើរបស់អ្នក។",
      });
    }
  }
  
  const fetchDetailsForRecipe = async (recipe: Recipe) => {
    if (recipe.imageUrl) return; // Don't fetch if image already exists

    setFetchingRecipeDetails(prev => ({...prev, [recipe.recipeName]: true}));

    const result = await getRecipeDetailsAction({ recipeName: recipe.recipeName });

    if (result.success && result.data) {
        const fullRecipe = { ...recipe, imageUrl: result.data.imageUrl };
        setSuggestedRecipes(prev => 
            prev?.map(r => r.recipeName === recipe.recipeName ? fullRecipe : r) || null
        );
    } else {
        console.error(`Failed to get details for ${recipe.recipeName}:`, result.error);
        // We can optionally update the state to show an error for this specific card
    }
    setFetchingRecipeDetails(prev => ({...prev, [recipe.recipeName]: false}));
  };

  const handleRecommendedDishClick = (dish: string) => {
    form.setValue("ingredients", dish);
    form.setValue("cuisine", "ខ្មែរ");
    form.handleSubmit(onSubmit)();
  };

  const handleAudioUpdate = (audioUrl: string) => {
    const updateRecipe = (recipeToUpdate: Recipe) => {
        if (recipeToUpdate) {
            const updatedRecipe = { ...recipeToUpdate, audioUrl };
            setSuggestedRecipes(prev => 
                prev?.map(r => r.recipeName === recipeToUpdate.recipeName ? updatedRecipe : r) || null
            );
            if (selectedRecipe && selectedRecipe.recipeName === recipeToUpdate.recipeName) {
                setSelectedRecipe(updatedRecipe);
            }
        }
    };
    if (selectedRecipe) {
        updateRecipe(selectedRecipe);
    }
  }

  const handleNewSearch = () => {
    setSelectedRecipe(null);
    setSuggestedRecipes(null);
    form.reset();
  }

  const LoadingSkeleton = () => (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
            <Skeleton className="h-40 w-full" />
            <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
            </CardContent>
        </Card>
      ))}
    </div>
  );
  
  const renderRecipeThumbnail = (recipe: Recipe) => {
    const isFetching = fetchingRecipeDetails[recipe.recipeName];
    const hasImage = !!recipe.imageUrl;

    return (
      <div className="relative h-40 w-full">
        {isFetching && !hasImage && (
            <div className="flex h-full w-full items-center justify-center bg-muted">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        )}
        {!isFetching && !hasImage && (
            <div className="flex h-full w-full flex-col items-center justify-center bg-muted text-muted-foreground">
                <ImageOff className="h-8 w-8" />
            </div>
        )}
        {hasImage && (
             <Image
                src={recipe.imageUrl!}
                alt={recipe.recipeName}
                fill
                objectFit="cover"
                data-ai-hint="gourmet food"
                className="transition-transform duration-300 group-hover:scale-105"
            />
        )}
         <div className="absolute inset-0 bg-black/30" />
      </div>
    );
  }

  return (
    <div className="mt-6">
      {!suggestedRecipes && (
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
                         <div className="relative">
                          <FormControl>
                            <Textarea
                              placeholder="ឧ., សាច់មាន់, ប៉េងប៉ោះ, ខ្ទឹមបារាំង, ខ្ទឹមស"
                              {...field}
                              rows={4}
                            />
                          </FormControl>
                           <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={toggleListening}
                            className="absolute bottom-2 right-2"
                            aria-label={isListening ? 'បញ្ឈប់ការស្តាប់' : 'ចាប់ផ្តើមការស្តាប់'}
                            disabled={!isSpeechRecognitionSupported}
                          >
                            {isListening ? (
                              <MicOff className="h-5 w-5 text-red-500 animate-pulse" />
                            ) : (
                              <Mic className="h-5 w-5 text-primary" />
                            )}
                          </Button>
                        </div>
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
                          <FormLabel>ប្រភេទម្ហូប</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="ជ្រើសរើសប្រភេទម្ហូប" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cuisineOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

            <div className="mt-8 pt-6 border-t">
               <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Sparkles className="h-4 w-4"/>
                  ឬសាកល្បងមុខម្ហូបណាមួយក្នុងចំណោមមុខម្ហូបទាំងនេះ
              </h3>
              <div className="flex flex-wrap gap-2">
                  {recommendedDishes.map((dish) => (
                      <Badge 
                          key={dish}
                          variant="outline"
                          onClick={() => handleRecommendedDishClick(dish)}
                          className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                          tabIndex={0}
                      >
                          {dish}
                      </Badge>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        {isLoading && <LoadingSkeleton />}
        {suggestedRecipes && (
            <>
            <div className="mb-6 flex flex-col items-center gap-4 text-center md:flex-row md:justify-between">
                <div>
                    <h2 className="font-headline text-2xl font-bold md:text-3xl">លទ្ធផលរូបមន្ត</h2>
                    <p className="text-muted-foreground">នេះគឺជាមុខម្ហូបមួយចំនួនដែលអ្នកអាចធ្វើបាន</p>
                </div>
                <Button variant="outline" onClick={handleNewSearch}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    ស្វែងរក​រូបមន្ត​ថ្មី
                </Button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {suggestedRecipes.map((recipe, index) => (
                <div
                    key={recipe.recipeName}
                    className="animate-in fade-in-0 zoom-in-95"
                    style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                >
                    <Card 
                        className="group cursor-pointer overflow-hidden transition-transform duration-200 hover:-translate-y-1"
                        onClick={() => setSelectedRecipe(recipe)}
                    >
                        {renderRecipeThumbnail(recipe)}
                        <CardContent className="p-4">
                            <h3 className="font-headline text-lg font-semibold truncate">{recipe.recipeName}</h3>
                            <p className="text-sm text-muted-foreground truncate">{recipe.estimatedCookingTime}</p>
                        </CardContent>
                    </Card>
                </div>
              ))}
            </div>
            </>
        )}
        
        {selectedRecipe && (
           <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && setSelectedRecipe(null)}>
            <DialogContent className="max-h-[90svh] overflow-y-auto p-0 sm:max-w-3xl">
              <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between">
                <DialogTitle>{selectedRecipe.recipeName}</DialogTitle>
              </DialogHeader>
              <RecipeCard
                recipe={selectedRecipe}
                isFavorite={favorites.some(fav => fav.recipeName === selectedRecipe.recipeName)}
                onToggleFavorite={onToggleFavorite}
                onAudioUpdate={handleAudioUpdate}
                isFetchingDetails={fetchingRecipeDetails[selectedRecipe.recipeName]}
              />
            </DialogContent>
          </Dialog>
        )}

      </div>
    </div>
  );
};

export default RecipeSuggestion;
