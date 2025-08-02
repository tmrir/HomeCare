import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Package, Wrench } from "lucide-react";

interface Part {
  id: string;
  name: string;
  description?: string;
}

interface PartsSelectorProps {
  serviceType: string;
  needsParts: boolean;
  onNeedsPartsChange: (value: boolean) => void;
  selectedPart: string;
  onPartChange: (part: string) => void;
  customPart: string;
  onCustomPartChange: (value: string) => void;
  needsInstallation: boolean;
  onInstallationChange: (value: boolean) => void;
}

const PartsSelector = ({
  serviceType,
  needsParts,
  onNeedsPartsChange,
  selectedPart,
  onPartChange,
  customPart,
  onCustomPartChange,
  needsInstallation,
  onInstallationChange,
}: PartsSelectorProps) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (needsParts && serviceType) {
      fetchParts();
    }
  }, [needsParts, serviceType]);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parts_catalog')
        .select('id, name, description')
        .eq('category', serviceType)
        .eq('is_active', true);

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!serviceType) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 space-x-reverse">
        <Switch
          id="needs-parts"
          checked={needsParts}
          onCheckedChange={onNeedsPartsChange}
        />
        <Label htmlFor="needs-parts" className="text-base font-medium">
          هل ترغب بطلب قطعة جديدة؟
        </Label>
      </div>

      {needsParts && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5" />
              اختيار القطعة المطلوبة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">جاري تحميل القطع المتاحة...</p>
              </div>
            ) : (
              <RadioGroup value={selectedPart} onValueChange={onPartChange}>
                <div className="space-y-3">
                  {parts.map((part) => (
                    <div key={part.id} className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value={part.id} id={part.id} />
                      <Label htmlFor={part.id} className="cursor-pointer">
                        <div>
                          <p className="font-medium">{part.name}</p>
                          {part.description && (
                            <p className="text-sm text-muted-foreground">{part.description}</p>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="other" id="other-part" />
                    <Label htmlFor="other-part" className="cursor-pointer font-medium">
                      أخرى
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            )}

            {selectedPart === "other" && (
              <div className="mt-4">
                <Label htmlFor="custom-part">اكتب نوع القطعة المطلوبة</Label>
                <Input
                  id="custom-part"
                  value={customPart}
                  onChange={(e) => onCustomPartChange(e.target.value)}
                  placeholder="مثال: صنبور مطبخ من النوع..."
                  className="text-right mt-2"
                />
              </div>
            )}

            {selectedPart && (
              <div className="border-t pt-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="needs-installation"
                    checked={needsInstallation}
                    onCheckedChange={onInstallationChange}
                  />
                  <Label htmlFor="needs-installation" className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    هل ترغب بتركيب القطعة؟
                  </Label>
                </div>
                
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <div className={`p-3 rounded-lg border ${needsInstallation ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}>
                    <p className="text-sm font-medium">
                      {needsInstallation ? '✅ نعم، أريد مع التركيب' : '❌ لا، فقط توصيل القطعة'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {needsInstallation 
                        ? 'سيقوم الفني بتوصيل وتركيب القطعة'
                        : 'سيتم توصيل القطعة فقط بدون تركيب'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PartsSelector;