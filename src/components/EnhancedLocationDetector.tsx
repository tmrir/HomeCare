import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, MapPinned, Navigation } from 'lucide-react';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface EnhancedLocationDetectorProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location | null;
  disabled?: boolean;
}

const LocationMarker = ({
  position,
  onPositionChange,
}: {
  position: Location | null;
  onPositionChange: (location: Location) => void;
}) => {
  const map = useMapEvents({
    click(e) {
      onPositionChange({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
    locationfound(e) {
      onPositionChange({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
      map.flyTo(e.latlng, 15);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>الموقع المحدد</Popup>
    </Marker>
  );
};

const EnhancedLocationDetector = ({
  onLocationSelect,
  initialLocation = null,
  disabled = false,
}: EnhancedLocationDetectorProps) => {
  const { toast } = useToast();
  const [useManualSelection, setUseManualSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(initialLocation);
  const [mapCenter, setMapCenter] = useState<[number, number]>([24.7136, 46.6753]); // Default to Riyadh
  const mapRef = useRef<L.Map>(null);

  // Initialize with initialLocation if provided
  useEffect(() => {
    if (initialLocation) {
      setCurrentLocation(initialLocation);
      setMapCenter([initialLocation.lat, initialLocation.lng]);
    }
  }, [initialLocation]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'خطأ',
        description: 'المتصفح لا يدعم تحديد الموقع',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        
        try {
          const address = await reverseGeocode(latitude, longitude);
          const locationWithAddress = { ...location, address };
          setCurrentLocation(locationWithAddress);
          setMapCenter([latitude, longitude]);
          onLocationSelect(locationWithAddress);
          
          if (mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 15);
          }
        } catch (error) {
          console.error('Error getting address:', error);
          setCurrentLocation(location);
          onLocationSelect(location);
        }
        
        setIsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast({
          title: 'خطأ',
          description: 'تعذر الحصول على الموقع الحالي. يرجى التأكد من منح الإذن.',
          variant: 'destructive',
        });
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMapClick = (location: Location) => {
    setCurrentLocation(location);
    onLocationSelect(location);
  };

  const handleManualAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const address = formData.get('address') as string;
    
    if (!address.trim()) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال عنوان',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { lat, lng } = await geocodeAddress(address);
      const location = { lat, lng, address };
      setCurrentLocation(location);
      setMapCenter([lat, lng]);
      onLocationSelect(location);
      
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 15);
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر العثور على العنوان. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated geocoding functions - replace with actual API calls
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // In a real app, you would call a geocoding API like Google Maps or OpenStreetMap
    return `الموقع الحالي (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number }> => {
    // In a real app, you would call a geocoding API
    // This is a mock implementation that returns Riyadh coordinates
    return { lat: 24.7136, lng: 46.6753 };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Switch
            id="location-mode"
            checked={useManualSelection}
            onCheckedChange={setUseManualSelection}
            disabled={disabled}
          />
          <Label htmlFor="location-mode" className="cursor-pointer">
            {useManualSelection ? 'تحديد الموقع يدوياً' : 'تحديد الموقع تلقائياً'}
          </Label>
        </div>
        
        {!useManualSelection && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isLoading || disabled}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري التحديد...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 ml-2" />
                تحديد موقعي
              </>
            )}
          </Button>
        )}
      </div>

      {useManualSelection ? (
        <div className="space-y-4">
          <form onSubmit={handleManualAddressSubmit} className="flex gap-2">
            <Input
              name="address"
              placeholder="أدخل العنوان يدوياً"
              className="flex-1"
              disabled={isLoading || disabled}
              defaultValue={currentLocation?.address}
            />
            <Button type="submit" disabled={isLoading || disabled}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <MapPinned className="h-4 w-4 ml-2" />
              )}
              بحث
            </Button>
          </form>

          <div className="h-64 rounded-md overflow-hidden border">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker
                position={currentLocation}
                onPositionChange={handleMapClick}
              />
            </MapContainer>
          </div>
          
          {currentLocation && (
            <div className="text-sm text-muted-foreground flex items-center">
              <MapPin className="h-4 w-4 ml-1 text-primary" />
              <span>
                الإحداثيات: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-64 rounded-md overflow-hidden border bg-muted/20 flex items-center justify-center">
          {currentLocation ? (
            <div className="h-full w-full">
              <MapContainer
                center={[currentLocation.lat, currentLocation.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[currentLocation.lat, currentLocation.lng]}>
                  <Popup>موقعك الحالي</Popup>
                </Marker>
              </MapContainer>
            </div>
          ) : (
            <div className="text-center p-4">
              <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                اضغط على "تحديد موقعي" للعثور على موقعك الحالي
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedLocationDetector;
