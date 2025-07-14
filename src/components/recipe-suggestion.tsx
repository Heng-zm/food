"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mic, MicOff, Sparkles } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RecipeCard from "@/components/recipe-card";
import { getRecipeSuggestion } from "@/app/actions";
import type { SuggestRecipeOutput } from "@/ai/flows/suggest-recipe";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  ingredients: z.string().min(3, {
    message: "សូម​បញ្ចូល​គ្រឿង​ផ្សំ​យ៉ាង​ហោច​ណាស់​មួយ។",
  }),
  cuisine: z.string().min(2, {
    message: "សូមជ្រើសរើសប្រភេទម្ហូប។",
  }),
  dietaryRestrictions: z.string().optional(),
});

interface RecipeSuggestionProps {
  favorites: SuggestRecipeOutput[];
  onToggleFavorite: (recipe: SuggestRecipeOutput) => void;
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

const recommendedDishes = [
    "សម្លរកកូរ",
    "អាម៉ុកត្រី",
    "ក๋วยเตี๋ยว (គុយទាវ)",
    "សម្លរម្ជូរគ្រឿងសាច់គោ",
    "ឆាក្តៅសាច់មាន់",
    "ឡុកឡាក់សាច់គោ",
    "បាយសាច់ជ្រូក",
    "សម្លរការីសាច់មាន់",
    "ឆាខ្ញីសាច់មាន់",
    "ត្រីអាំងអំបិលម្ទេស",
];


const RecipeSuggestion = ({ favorites, onToggleFavorite }: RecipeSuggestionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedRecipe, setSuggestedRecipe] = useState<SuggestRecipeOutput | null>(null);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: "",
      cuisine: "",
      dietaryRestrictions: "",
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang = 'km-KH';
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          const currentIngredients = form.getValues("ingredients");
          form.setValue("ingredients", currentIngredients ? `${currentIngredients}, ${transcript}`: transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
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
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

      }
    }
  }, [form, toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
       toast({
        variant: "destructive",
        title: "មុខងារមិនគាំទ្រ",
        description: "ការស្គាល់សំឡេងមិនត្រូវបានគាំទ្រនៅលើកម្មវិធីរុករកនេះទេ។",
      });
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Could not start recognition", e);
        toast({
            variant: "destructive",
            title: "បញ្ហាក្នុងការចាប់ផ្តើម",
            description: "មិនអាចចាប់ផ្តើមការស្តាប់បានទេ។ សូមព្យាយាមម្តងទៀត។",
        });
        setIsListening(false);
      }
    }
  };


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

  const handleRecommendedDishClick = (dish: string) => {
    form.setValue("ingredients", dish);
    form.setValue("cuisine", "ខ្មែរ");
    form.handleSubmit(onSubmit)();
  };

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

    