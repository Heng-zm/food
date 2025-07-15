
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mic, MicOff, Sparkles, RefreshCw, ChefHat } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RecipeCard from "@/components/recipe-card";
import { getRecipeSuggestion } from "@/app/actions";
import type { Recipe } from "@/ai/flows/suggest-recipe";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";


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
  const [suggestedRecipe, setSuggestedRecipe] = useState<Recipe | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const [recommendedDishes, setRecommendedDishes] = useState<string[]>([]);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [excludedRecipes, setExcludedRecipes] = useState<string[]>([]);
  
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

  const handleSuggestionRequest = async (values: z.infer<typeof formSchema>, isNewRequest: boolean = true) => {
    setIsLoading(true);
    
    // If it's a brand new search, clear the old recipe and exclusion list
    if (isNewRequest) {
      setSuggestedRecipe(null);
      setExcludedRecipes([]);
    }

    const result = await getRecipeSuggestion({ 
      ...values, 
      excludeRecipes: isNewRequest ? [] : excludedRecipes 
    });
    
    setIsLoading(false);

    if (result.success && result.data?.recipe) {
      const newRecipe = result.data.recipe;
      setSuggestedRecipe(newRecipe);
      // Add the new recipe to the exclusion list for the next request
      setExcludedRecipes(prev => [...prev, newRecipe.recipeName]);
    } else {
      toast({
        variant: "destructive",
        title: "មានបញ្ហាអ្វីមួយកើតឡើង!",
        description: result.error || "មានបញ្ហាជាមួយសំណើរបស់អ្នក។ សូមសាកល្បងម្ដងទៀត។",
      });
      if (!isNewRequest) {
        // If getting another suggestion fails, don't clear the current one
        setIsLoading(false);
      }
    }
  }

  const handleRecommendedDishClick = (dish: string) => {
    form.setValue("ingredients", dish);
    form.setValue("cuisine", "ខ្មែរ");
    handleSuggestionRequest(form.getValues(), true);
  };

  const handleNewSearch = () => {
    setSuggestedRecipe(null);
    setExcludedRecipes([]);
    form.reset();
  }

  const handleTryAnother = () => {
    const values = form.getValues();
    if (values.ingredients && values.cuisine) {
      handleSuggestionRequest(values, false);
    } else {
       toast({
        variant: "destructive",
        title: "ត្រូវការគ្រឿងផ្សំ",
        description: "សូមប្រាកដថាអ្នកបានបញ្ចូលគ្រឿងផ្សំ និងប្រភេទម្ហូប។",
      });
    }
  }

  const LoadingSkeleton = () => (
    <div className="mt-8">
      <Card>
        <Skeleton className="h-64 w-full" />
        <CardContent className="p-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-px w-full mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-5 w-5/6 mb-2" />
                <Skeleton className="h-5 w-full" />
              </div>
               <div>
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-5 w-5/6 mb-2" />
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
  
  const RecipeDetailView = () => {
    if (!suggestedRecipe) return null;

    return (
      <div className="max-h-[85vh] overflow-y-auto">
        <RecipeCard
          recipe={suggestedRecipe}
          isFavorite={favorites.some(fav => fav.recipeName === suggestedRecipe.recipeName)}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
    );
  };
  
  const renderInitialView = () => (
     <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => handleSuggestionRequest(values, true))} className="space-y-6">
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
                   <>
                    <ChefHat className="mr-2 h-4 w-4" />
                    ណែនាំរូបមន្ត
                   </>
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
  );

  const renderResultView = () => (
     <>
      <div className="mb-6 flex flex-col items-center gap-4 text-center md:flex-row md:justify-between">
          <div>
              <h2 className="font-headline text-2xl font-bold md:text-3xl">លទ្ធផលរូបមន្ត</h2>
              <p className="text-muted-foreground">នេះគឺជាមុខម្ហូបដែលអ្នកអាចធ្វើបាន</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={handleNewSearch}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  ស្វែងរក​រូបមន្ត​ថ្មី
              </Button>
              <Button onClick={handleTryAnother} disabled={isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
                 {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    "សាកល្បងម្ហូបផ្សេង"
                  )}
              </Button>
          </div>
      </div>
      <div className="animate-in fade-in-0 zoom-in-95">
        <RecipeDetailView />
      </div>
    </>
  );

  return (
    <div className="mt-6">
      {!suggestedRecipe && !isLoading && renderInitialView()}
      {isLoading && <LoadingSkeleton />}
      {suggestedRecipe && !isLoading && renderResultView()}
    </div>
  );
};

export default RecipeSuggestion;
