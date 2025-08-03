import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, MapPin, User, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Technician {
  id: string;
  full_name: string;
  phone: string;
  skills: string[];
  location: {
    lat: number;
    lng: number;
  };
  status: 'available' | 'busy' | 'offline';
}

interface TechnicianAssignmentProps {
  requestId: string;
  serviceType: string;
  location: {
    lat: number;
    lng: number;
  };
  onAssign: (technicianId: string) => void;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export default function TechnicianAssignment({ 
  requestId, 
  serviceType, 
  location,
  onAssign 
}: TechnicianAssignmentProps) {
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const { data, error } = await supabase
          .from('technicians')
          .select('*')
          .eq('status', 'available')
          .contains('skills', [serviceType]);

        if (error) throw error;

        // Add distance to each technician and sort by distance
        const techsWithDistance = data.map(tech => ({
          ...tech,
          distance: calculateDistance(
            location.lat, 
            location.lng, 
            tech.location.lat, 
            tech.location.lng
          )
        })).sort((a, b) => a.distance - b.distance);

        setTechnicians(techsWithDistance);
      } catch (error) {
        console.error('Error fetching technicians:', error);
        toast({
          title: "خطأ في تحميل الفنيين",
          description: "حدث خطأ أثناء تحميل قائمة الفنيين المتاحين",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTechnicians();
  }, [serviceType, location, toast]);

  const handleAssign = async (technicianId: string) => {
    try {
      setSelectedTech(technicianId);
      
      // Update request with assigned technician
      const { error } = await supabase
        .from('service_requests')
        .update({ 
          assigned_technician: technicianId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update technician status to busy
      await supabase
        .from('technicians')
        .update({ status: 'busy' })
        .eq('id', technicianId);

      // Notify parent component
      onAssign(technicianId);

      toast({
        title: "تم تعيين الفني بنجاح",
        description: "تم تعيين الفني للطلب بنجاح",
      });
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast({
        title: "خطأ في تعيين الفني",
        description: "حدث خطأ أثناء تعيين الفني للطلب",
        variant: "destructive",
      });
      setSelectedTech(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="mr-2">جاري تحميل الفنيين المتاحين...</span>
      </div>
    );
  }

  if (technicians.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        لا يوجد فنيون متاحون حاليًا
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium">الفنيون المتاحون:</h4>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {technicians.map((tech) => (
          <div 
            key={tech.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              selectedTech === tech.id ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Avatar>
                <AvatarImage src={`/avatars/${tech.id}.jpg`} alt={tech.full_name} />
                <AvatarFallback>{tech.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="font-medium">{tech.full_name}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 ml-1" />
                  <span>{tech.distance.toFixed(1)} كم</span>
                </div>
              </div>
            </div>
            
            <Button 
              size="sm" 
              onClick={() => handleAssign(tech.id)}
              disabled={selectedTech === tech.id}
            >
              {selectedTech === tech.id ? (
                <>
                  <Check className="ml-1 h-4 w-4" />
                  معين
                </>
              ) : (
                "تعيين"
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
