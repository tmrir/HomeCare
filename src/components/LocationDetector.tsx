import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationData {
  lat: number;
  lng: number;
  neighborhood?: string;
}

interface LocationDetectorProps {
  onLocationChange: (location: LocationData, isDifferentAddress: boolean) => void;
  location: LocationData | null;
  isDifferentAddress: boolean;
  onDifferentAddressChange: (value: boolean) => void;
}

const LocationDetector = ({ 
  onLocationChange, 
  location, 
  isDifferentAddress, 
  onDifferentAddressChange 
}: LocationDetectorProps) => {
  const { toast } = useToast();
  const [isDetecting, setIsDetecting] = useState(false);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "تحديد الموقع غير مدعوم",
        description: "متصفحك لا يدعم خدمة تحديد الموقع",
        variant: "destructive",
      });
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get neighborhood (simulated for demo)
          const neighborhood = await getNeighborhoodName(latitude, longitude);
          
          const locationData = {
            lat: latitude,
            lng: longitude,
            neighborhood
          };
          
          onLocationChange(locationData, isDifferentAddress);
          
          toast({
            title: "تم تحديد الموقع بنجاح",
            description: `الحي: ${neighborhood}`,
          });
        } catch (error) {
          toast({
            title: "خطأ في تحديد الحي",
            description: "تم تحديد الموقع ولكن لم نتمكن من تحديد اسم الحي",
          });
          
          onLocationChange({ lat: latitude, lng: longitude }, isDifferentAddress);
        }
        
        setIsDetecting(false);
      },
      (error) => {
        setIsDetecting(false);
        toast({
          title: "خطأ في تحديد الموقع",
          description: "لم نتمكن من الحصول على موقعك. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Simulated reverse geocoding function (in real app, use Google Maps or OpenStreetMap API)
  const getNeighborhoodName = async (lat: number, lng: number): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock neighborhood names based on coordinates (for demo)
    const neighborhoods = [
      "النزهة", "الملز", "العليا", "الروابي", "المعذر", 
      "الياسمين", "النرجس", "الورود", "الفلاح", "السويدي"
    ];
    
    return neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Home className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">معلومات الموقع</h3>
      </div>

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isDetecting}
          className="w-full flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          {isDetecting ? "جاري تحديد الموقع..." : "تحديد الموقع الحالي"}
        </Button>

        {location && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <p className="text-success font-medium text-center">
              ✓ تم تحديد الموقع بنجاح
              {location.neighborhood && ` - الحي: ${location.neighborhood}`}
            </p>
          </div>
        )}

        <div className="flex items-center space-x-2 space-x-reverse">
          <Switch
            id="different-address"
            checked={isDifferentAddress}
            onCheckedChange={onDifferentAddressChange}
          />
          <Label htmlFor="different-address" className="text-sm">
            هل ترغب بطلب الخدمة لمنزل آخر؟
          </Label>
        </div>

        {isDifferentAddress && (
          <div className="bg-muted/50 border border-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground text-center">
              يمكنك سحب النقطة على الخريطة لتحديد العنوان المطلوب
            </p>
            {/* Map component would go here */}
            <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center mt-2">
              <p className="text-muted-foreground">خريطة تفاعلية - قريباً</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationDetector;