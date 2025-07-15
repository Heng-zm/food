
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mic, MicOff, Sparkles, ChefHat, Plus, Minus } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle as CardTitlePrimitive } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RecipeCard from "@/components/recipe-card";
import { getRecipeSuggestion } from "@/app/actions";
import type { Recipe } from "@/ai/flows/suggest-recipe";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";

const INITIAL_RECIPES_TO_SHOW = 4;

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
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
  const [recipesToShow, setRecipesToShow] = useState(INITIAL_RECIPES_TO_SHOW);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const [recommendedDishes, setRecommendedDishes] = useState<string[]>([]);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setSuggestedRecipes([]);
    const result = await getRecipeSuggestion(values);
    setIsLoading(false);

    if (result.success && result.data?.recipes) {
      setSuggestedRecipes(result.data.recipes);
      setRecipesToShow(INITIAL_RECIPES_TO_SHOW);
    } else {
      toast({
        variant: "destructive",
        title: "មានបញ្ហាអ្វីមួយកើតឡើង!",
        description: result.error || "មានបញ្ហាជាមួយសំណើរបស់អ្នក។ សូមសាកល្បងម្ដងទៀត។",
      });
    }
  };

  const handleRecommendedDishClick = (dish: string) => {
    form.setValue("ingredients", dish);
    form.setValue("cuisine", "ខ្មែរ");
    onSubmit(form.getValues());
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedRecipe(null);
    }
  }

  const LoadingSkeleton = () => (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
  
  const RecipeDetailView = ({ recipe }: { recipe: Recipe }) => (
     <ScrollArea className="h-[70vh]">
      <RecipeCard 
        recipe={recipe}
        isFavorite={favorites.some(fav => fav.recipeName === recipe.recipeName)}
        onToggleFavorite={onToggleFavorite}
      />
    </ScrollArea>
  );

  const renderRecipeItem = (recipe: Recipe) => (
    <Card 
      className="group cursor-pointer overflow-hidden transition-transform duration-200 hover:-translate-y-1"
      onClick={() => handleSelectRecipe(recipe)}
    >
      <CardHeader>
          <CardTitlePrimitive className="truncate group-hover:text-accent">{recipe.recipeName}</CardTitlePrimitive>
          <CardDescription>{recipe.estimatedCookingTime}</CardDescription>
      </CardHeader>
      <CardContent>
          <p className="text-muted-foreground text-sm line-clamp-3">{recipe.description}</p>
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
                       <div className="relative">
                        <FormControl>
                          <Textarea
                            placeholder="ឧ., សាច់មាន់, ប៉េងប៉ោះ, ខ្ទឹមបារាំង, ខ្ទឹមស"
                            {...field}
                            rows={4}
                            className="bg-muted"
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
                            <SelectTrigger className="bg-muted">
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
                        variant="secondary"
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

      {isLoading && <LoadingSkeleton />}
      
      {!isLoading && suggestedRecipes.length > 0 && (
          <div className="mt-8">
              <h2 className="mb-6 font-headline text-2xl font-bold md:text-3xl">លទ្ធផលរូបមន្ត</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedRecipes.slice(0, recipesToShow).map((recipe) => (
                      isDesktop ? (
                          <Dialog key={recipe.recipeName} open={selectedRecipe?.recipeName === recipe.recipeName} onOpenChange={handleOpenChange}>
                              <DialogTrigger asChild>
                                  {renderRecipeItem(recipe)}
                              </DialogTrigger>
                              <DialogContent className="max-h-[90svh] overflow-y-auto p-0 sm:max-w-3xl">
                                  {selectedRecipe && (
                                    <>
                                      <DialogHeader className="p-6 pb-0">
                                          <DialogTitle>{selectedRecipe.recipeName}</DialogTitle>
                                      </DialogHeader>
                                      <RecipeDetailView recipe={selectedRecipe} />
                                    </>
                                  )}
                              </DialogContent>
                          </Dialog>
                      ) : (
                          <Drawer key={recipe.recipeName} open={selectedRecipe?.recipeName === recipe.recipeName} onOpenChange={handleOpenChange}>
                              <DrawerTrigger asChild>
                                  {renderRecipeItem(recipe)}
                              </DrawerTrigger>
                              <DrawerContent>
                                {selectedRecipe && (
                                  <>
                                    <DrawerHeader className="text-left">
                                        <DrawerTitle>{selectedRecipe.recipeName}</DrawerTitle>
                                    </DrawerHeader>
                                    <RecipeDetailView recipe={selectedRecipe} />
                                  </>
                                )}
                              </DrawerContent>
                          </Drawer>
                      )
                  ))}
              </div>
              {suggestedRecipes.length > INITIAL_RECIPES_TO_SHOW && (
                <div className="mt-6 flex justify-center">
                  {recipesToShow < suggestedRecipes.length ? (
                    <Button variant="outline" onClick={() => setRecipesToShow(suggestedRecipes.length)}>
                      <Plus className="mr-2 h-4 w-4" />
                      បង្ហាញបន្ថែម
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setRecipesToShow(INITIAL_RECIPES_TO_SHOW)}>
                      <Minus className="mr-2 h-4 w-4" />
                      បង្ហាញតិច
                    </Button>
                  )}
                </div>
              )}
          </div>
      )}
    </div>
  );
};

export default RecipeSuggestion;
