
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Clock, Flame, Heart, Printer, UtensilsCrossed, BookOpen, Play, Pause, Trash2, ImageOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Recipe } from "@/ai/flows/suggest-recipe";
import { getAudioForRecipeAction } from "@/app/actions";
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

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (recipe: Recipe) => void;
  showRemoveConfirm?: boolean;
  onAudioUpdate?: (audioUrl: string) => void;
  isFetchingDetails?: boolean;
}

const RecipeCard = ({ recipe, isFavorite, onToggleFavorite, showRemoveConfirm = false, onAudioUpdate, isFetchingDetails = false }: RecipeCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const { toast } = useToast();
  const [isImageLoading, setIsImageLoading] = useState(!!recipe.imageUrl);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let audioInstance: HTMLAudioElement | null = null;
    if (recipe.audioUrl) {
      audioInstance = new Audio(recipe.audioUrl);
      audioInstance.onended = () => setIsPlaying(false);
      setAudio(audioInstance);
    }

    return () => {
      if (audioInstance) {
        audioInstance.pause();
        audioInstance.onended = null;
      }
      setAudio(null);
    };
  }, [recipe.audioUrl]);
  
  useEffect(() => {
    setIsImageLoading(!!recipe.imageUrl && !imageError);
  }, [recipe.imageUrl, imageError]);


  const handlePrint = () => {
    window.print();
  };

  const parseList = (text: string) => {
    if(!text) return [];
    return text.split('\n').map(item => item.trim().replace(/^-/,'').trim()).filter(Boolean);
  }
  
  const handleReadAloud = async () => {
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().catch(e => {
          console.error("Error playing audio:", e);
          toast({
            variant: "destructive",
            title: "បញ្ហាក្នុងការចាក់សំឡេង",
            description: "មិនអាចចាក់ឯកសារអូឌីយ៉ូបានទេ។ សូមព្យាយាមម្តងទៀត។",
          });
        });
        setIsPlaying(true);
      }
      return;
    }

    if (isFetchingAudio) return;

    setIsFetchingAudio(true);
    const result = await getAudioForRecipeAction({ instructions: recipe.instructions });
    setIsFetchingAudio(false);

    if (result.success && result.data?.audioUrl) {
      if(onAudioUpdate) {
          onAudioUpdate(result.data.audioUrl);
      }
      const newAudio = new Audio(result.data.audioUrl);
      newAudio.onended = () => setIsPlaying(false);
      setAudio(newAudio);
      newAudio.play().catch(e => console.error("Error playing new audio:", e));
      setIsPlaying(true);
    } else {
      toast({
        variant: "destructive",
        title: "មិនអាចបង្កើតសំឡេងបានទេ",
        description: result.error || "មានបញ្ហាក្នុងការបង្កើតឯកសារអូឌីយ៉ូ។",
      });
    }
  };

  const ingredientsList = parseList(recipe.ingredients);
  const instructionsList = parseList(recipe.instructions);

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

  const renderImageContent = () => {
    if (isFetchingDetails) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center bg-muted text-muted-foreground">
                <Loader2 className="h-8 w-8 mb-2 animate-spin text-primary" />
                <p>កំពុង​ទាញ​យក​រូបភាព...</p>
            </div>
        );
    }
    if (imageError) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center bg-muted text-muted-foreground">
                <ImageOff className="h-8 w-8 mb-2 text-destructive" />
                <p>មិនអាចផ្ទុករូបភាពបានទេ។</p>
            </div>
        );
    }
    if (recipe.imageUrl) {
        return (
            <>
                {isImageLoading && (
                    <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-muted text-muted-foreground">
                        <Loader2 className="h-8 w-8 mb-2 animate-spin text-primary" />
                        <p>កំពុង​ផ្ទុក​រូបភាព...</p>
                    </div>
                )}
                <Image
                    src={recipe.imageUrl}
                    alt={recipe.recipeName}
                    fill
                    objectFit="cover"
                    data-ai-hint="gourmet food"
                    className="bg-muted transition-opacity duration-300"
                    onLoad={() => setIsImageLoading(false)}
                    onError={() => {
                        setIsImageLoading(false);
                        setImageError(true);
                    }}
                />
            </>
        );
    }
    return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-muted text-muted-foreground">
            <ImageOff className="h-8 w-8 mb-2" />
            <p>មិនមានរូបភាពទេ។</p>
        </div>
    );
  };


  return (
    <div className="w-full overflow-hidden printable-area">
      <CardHeader className="p-0">
        <div className="relative h-64 w-full">
          {renderImageContent()}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <CardTitle className="font-headline text-3xl font-bold text-white">
              {recipe.recipeName}
            </CardTitle>
          </div>
          <div className="absolute top-4 right-4 flex gap-2 no-print">
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
      <CardContent className="p-6">
        <div className="mb-6 grid grid-cols-1 gap-4 text-center sm:grid-cols-2">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">
              {recipe.estimatedCookingTime}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">
              {recipe.nutritionalInformation}
            </span>
          </div>
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
                variant="ghost"
                size="icon"
                onClick={handleReadAloud}
                disabled={isFetchingAudio}
                aria-label="អានការណែនាំឮៗ"
                className="no-print"
              >
                {isFetchingAudio ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5 text-primary" />
                ) : (
                  <Play className="h-5 w-5 text-primary" />
                )}
              </Button>
            </div>
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
