import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

const PhotoUpload = ({ photos, onPhotosChange }: PhotoUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 5) {
      toast({
        title: "حد أقصى للصور",
        description: "يمكنك رفع 5 صور كحد أقصى",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const newPhotos: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "حجم الملف كبير",
            description: `الملف ${file.name} يجب أن يكون أقل من 5 ميجابايت`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "نوع ملف غير مدعوم",
            description: `الملف ${file.name} يجب أن يكون صورة`,
            variant: "destructive",
          });
          continue;
        }

        // Convert to base64 for demo (in real app, upload to Supabase Storage)
        const base64 = await fileToBase64(file);
        newPhotos.push(base64);
      }

      onPhotosChange([...photos, ...newPhotos]);
      
      if (newPhotos.length > 0) {
        toast({
          title: "تم رفع الصور",
          description: `تم رفع ${newPhotos.length} صورة بنجاح`,
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في رفع الصور",
        description: "حدث خطأ أثناء رفع الصور. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">صور المشكلة (اختياري)</h4>
        <span className="text-xs text-muted-foreground">{photos.length}/5</span>
      </div>

      {/* Upload Button */}
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={uploading || photos.length >= 5}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="photo-upload"
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading || photos.length >= 5}
          className="w-full flex items-center gap-2"
        >
          {uploading ? (
            <>
              <Upload className="w-4 h-4 animate-spin" />
              جاري رفع الصور...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              {photos.length === 0 ? 'إضافة صور' : `إضافة المزيد (${5 - photos.length} متبقية)`}
            </>
          )}
        </Button>
      </div>

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <img
                    src={photo}
                    alt={`صورة ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 w-6 h-6 p-0 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        رفع الصور يساعد الفني على فهم المشكلة بشكل أفضل. حجم الصورة الواحدة يجب أن يكون أقل من 5 ميجابايت.
      </p>
    </div>
  );
};

export default PhotoUpload;