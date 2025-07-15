
"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, Heart, Printer, UtensilsCrossed, BookOpen, Trash2, Image as ImageIcon, Loader2, ImageOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Recipe } from "@/ai/flows/suggest-recipe";
import { getRecipeImage, getTextToSpeech } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (recipe: Recipe) => void;
  showRemoveConfirm?: boolean;
}

const RecipeCard = ({ recipe, isFavorite, onToggleFavorite, showRemoveConfirm = false }: RecipeCardProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  const parseList = (text: string) => {
    if(!text) return [];
    return text.split('\n').map(item => item.trim().replace(/^-/,'').trim()).filter(Boolean);
  }

  const ingredientsList = parseList(recipe.ingredients);
  const instructionsList = parseList(recipe.instructions);

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    setImageError(null);
    const result = await getRecipeImage({ recipeName: recipe.recipeName });
    setIsGeneratingImage(false);

    if (result.success && result.data?.imageUrl) {
      setImageUrl(result.data.imageUrl);
    } else {
      const errorMsg = result.error || "An unknown error occurred while generating the image.";
      setImageError(errorMsg);
      toast({
        variant: "destructive",
        title: "Image Generation Failed",
        description: errorMsg,
      });
    }
  };
  
  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    setAudioError(null);
    const result = await getTextToSpeech({ text: recipe.instructions });
    setIsGeneratingAudio(false);

    if (result.success && result.data?.audioUrl) {
      setAudioUrl(result.data.audioUrl);
    } else {
      const errorMsg = result.error || "An unknown error occurred while generating audio.";
      setAudioError(errorMsg);
      toast({
        variant: "destructive",
        title: "Audio Generation Failed",
        description: errorMsg,
      });
    }
  };

  const hasQuotaError = imageError && imageError.toLowerCase().includes('quota');

  const FavoriteButton = () => (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => onToggleFavorite(recipe)}
      aria-label={isFavorite ? "ដកចេញពីចំណូលចិត្ត" : "បន្ថែមទៅចំណូលចិត្ត"}
    >
      <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-primary"}`} />
    </Button>
  );

  const RemoveFavoriteButton = () => (
     <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="icon"
          aria-label="ដកចេញពីចំណូលចិត្ត"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>តើអ្នកប្រាកដទេ?</AlertDialogTitle>
          <AlertDialogDescription>
            សកម្មភាពនេះនឹងដក "{recipe.recipeName}" ចេញពីបញ្ជីចំណូលចិត្តរបស់អ្នកជាអចិន្ត្រៃយ៍។
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>បោះបង់</AlertDialogCancel>
          <AlertDialogAction onClick={() => onToggleFavorite(recipe)}>
            ដកចេញ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  
  const getErrorMessage = () => {
    if (hasQuotaError) {
      return "កូតាបង្កើតរូបភាពត្រូវបានប្រើអស់ហើយ។ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ។";
    }
    return imageError;
  }

  return (
    <div className="w-full overflow-hidden printable-area">
       {isGeneratingImage && (
         <div className="p-6">
            <Skeleton className="h-48 w-full" />
         </div>
       )}
       {imageError && !isGeneratingImage && (
        <div className="p-6">
          <Alert variant="destructive">
            <ImageOff className="h-4 w-4" />
            <AlertTitle>Image Failed</AlertTitle>
            <AlertDescription>{getErrorMessage()}</AlertDescription>
          </Alert>
        </div>
       )}
       {imageUrl && !isGeneratingImage && (
        <div className="relative mb-4 h-56 w-full">
            <Image
              src={imageUrl}
              alt={`Image of ${recipe.recipeName}`}
              layout="fill"
              objectFit="cover"
              className="rounded-t-lg"
              onError={() => setImageError("Failed to load the generated image.")}
            />
        </div>
      )}

      <CardHeader className="p-6">
          <div className="flex items-start justify-between">
            <CardTitle className="font-headline text-3xl font-bold text-primary">
              {recipe.recipeName}
            </CardTitle>
            <div className="flex gap-2 no-print">
              {isFavorite && showRemoveConfirm ? <RemoveFavoriteButton /> : <FavoriteButton />}
              <Button
                variant="secondary"
                size="icon"
                onClick={handlePrint}
                aria-label="បោះពុម្ពរូបមន្ត"
              >
                <Printer className="h-5 w-5 text-primary" />
              </Button>
            </div>
          </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Badge variant="secondary" className="text-sm">
            <Clock className="mr-2 h-4 w-4 text-primary" />
            {recipe.estimatedCookingTime}
          </Badge>
          {!imageUrl && !isGeneratingImage && (
            <Button variant="outline" size="sm" onClick={handleGenerateImage} disabled={isGeneratingImage || hasQuotaError}>
              {isGeneratingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  មើលរូបម្ហូប
                </>
              )}
            </Button>
          )}
        </div>
        
        <Separator className="my-6" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-headline text-xl font-bold">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
              គ្រឿងផ្សំ
            </h3>
            <ul className="space-y-2">
              {ingredientsList.map((ingredient, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 mt-1 block h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-headline text-xl font-bold">
                <BookOpen className="h-6 w-6 text-primary" />
                ការណែនាំ
              </h3>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAudio}
                  disabled={isGeneratingAudio || !!audioUrl}
                  className="no-print"
                >
                  {isGeneratingAudio ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Volume2 className="mr-2 h-4 w-4" />
                  )}
                  {audioUrl ? 'បានបង្កើត' : 'ស្តាប់ការណែនាំ'}
                </Button>
            </div>
             {audioUrl && (
              <div className="mb-4 no-print">
                <audio controls src={audioUrl} className="w-full">
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
             {audioError && (
              <Alert variant="destructive" className="mb-4 no-print">
                <AlertTitle>Audio Failed</AlertTitle>
                <AlertDescription>{audioError}</AlertDescription>
              </Alert>
            )}
            <ol className="space-y-4">
               {instructionsList.map((instruction, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default RecipeCard;
