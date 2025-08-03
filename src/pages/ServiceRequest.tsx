import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, User, Phone, Settings, FileText, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import EnhancedLocationDetector from "@/components/EnhancedLocationDetector";
import PartsSelector from "@/components/PartsSelector";
import PhotoUpload from "@/components/PhotoUpload";

interface LocationData {
  lat: number;
  lng: number;
  neighborhood?: string;
}

const ServiceRequest = () => {
  console.log('ServiceRequest component rendering...');
  
  // Add a test effect to check if component mounts
  useEffect(() => {
    console.log('ServiceRequest component mounted');
    return () => {
      console.log('ServiceRequest component unmounted');
    };
  }, []);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    serviceType: "",
    issueDescription: "",
    preferredTime: "",
    location: null as LocationData | null,
    isDifferentAddress: false,
    needsParts: false,
    selectedPart: "",
    customPart: "",
    needsInstallation: false,
    photos: [] as string[],
    manualAddress: "",
  });

  const serviceTypes = [
    { value: "plumbing", label: "سباكة" },
    { value: "electrical", label: "كهرباء" },
    { value: "ac", label: "تكييف" },
    { value: "other", label: "أخرى" },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = (location: any) => {
    setFormData(prev => ({
      ...prev,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.address || 'عنوان غير محدد',
        neighborhood: location.neighborhood || 'منطقة غير محددة'
      },
      manualAddress: location.address || ''
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return "اسم المستخدم مطلوب";
    if (!formData.mobile.trim()) return "رقم الجوال مطلوب";
    if (!/^(\+966|0)?5\d{8}$/.test(formData.mobile.replace(/\s/g, ""))) {
      return "رقم الجوال غير صحيح";
    }
    if (!formData.location) return "يجب تحديد الموقع";
    if (!formData.serviceType) return "نوع الخدمة مطلوب";
    if (!formData.issueDescription.trim()) return "وصف المشكلة مطلوب";
    if (!formData.preferredTime) return "الوقت المفضل مطلوب";
    if (formData.needsParts && !formData.selectedPart) return "يجب اختيار نوع القطعة";
    if (formData.selectedPart === "other" && !formData.customPart.trim()) {
      return "يجب كتابة نوع القطعة المطلوبة";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted'); // Debug log
    
    const error = validateForm();
    if (error) {
      console.log('Validation error:', error); // Debug log
      toast({
        title: "خطأ في البيانات",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data for database
      const requestData = {
        full_name: formData.fullName,
        mobile: formData.mobile,
        service_type: formData.serviceType,
        issue_description: formData.issueDescription,
        preferred_time: formData.preferredTime,
        location: formData.location as any, // Cast to JSON type for Supabase
        is_different_address: formData.isDifferentAddress,
        needs_parts: formData.needsParts,
        part_type: formData.selectedPart || null,
        part_other: formData.customPart || null,
        needs_installation: formData.needsInstallation,
        photo_urls: formData.photos,
      };

      const { data, error: dbError } = await supabase
        .from('service_requests')
        .insert([requestData])
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "تم إرسال الطلب بنجاح",
        description: `رقم الطلب: #${data.id.slice(-8).toUpperCase()}`,
      });
      
      // Navigate to confirmation page with the request ID
      navigate(`/confirmation?order=${data.id}`);
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "خطأ في إرسال الطلب",
        description: "حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a test function to check navigation
  const testNavigation = () => {
    console.log('Navigation test - navigating to /confirmation');
    navigate('/confirmation?order=TEST123');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Test Button - Temporary */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={testNavigation}
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        >
          Test Navigation
        </Button>
      </div>
      
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              العودة
            </Button>
            <h1 className="text-xl font-semibold text-primary">طلب خدمة جديد</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-medium border-0 bg-gradient-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold mb-2">
                احجز خدمتك الآن
              </CardTitle>
              <p className="text-muted-foreground">
                املأ البيانات التالية وسنتواصل معك في أقرب وقت
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">المعلومات الشخصية</h3>
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="fullName">الاسم الكامل *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                        className="text-right"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="mobile">رقم الجوال *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="mobile"
                          value={formData.mobile}
                          onChange={(e) => handleInputChange("mobile", e.target.value)}
                          placeholder="05xxxxxxxx"
                          className="text-right pl-10"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">تفاصيل الموقع</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <EnhancedLocationDetector
                      onLocationSelect={handleLocationSelect}
                      initialLocation={formData.location}
                    />
                    
                    {formData.location && (
                      <div className="p-4 bg-muted/20 rounded-md">
                        <p className="font-medium">الموقع المحدد:</p>
                        <p className="text-sm text-muted-foreground">
                          {formData.location.address || 'لا يوجد عنوان'}
                        </p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          الإحداثيات: {formData.location.lat?.toFixed(6)}, {formData.location.lng?.toFixed(6)}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <input
                        type="checkbox"
                        id="isDifferentAddress"
                        checked={formData.isDifferentAddress}
                        onChange={(e) => handleInputChange("isDifferentAddress", e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="isDifferentAddress" className="text-sm font-medium">
                        عنوان مختلف عن الموقع الحالي
                      </Label>
                    </div>
                    
                    {formData.isDifferentAddress && (
                      <div>
                        <Label htmlFor="alternateAddress">العنوان البديل</Label>
                        <Textarea
                          id="alternateAddress"
                          value={formData.manualAddress}
                          onChange={(e) => {
                            handleInputChange("manualAddress", e.target.value);
                            // Update location address if manual address is changed
                            if (formData.location) {
                              handleInputChange("location", {
                                ...formData.location,
                                address: e.target.value
                              });
                            }
                          }}
                          placeholder="أدخل العنوان البديل بالتفصيل"
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">تفاصيل الخدمة</h3>
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="serviceType">نوع الخدمة *</Label>
                      <Select value={formData.serviceType} onValueChange={(value) => handleInputChange("serviceType", value)}>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر نوع الخدمة" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypes.map((service) => (
                            <SelectItem key={service.value} value={service.value}>
                              {service.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="issueDescription">وصف المشكلة *</Label>
                      <Textarea
                        id="issueDescription"
                        value={formData.issueDescription}
                        onChange={(e) => handleInputChange("issueDescription", e.target.value)}
                        placeholder="اكتب وصفاً مفصلاً للمشكلة التي تواجهها..."
                        className="text-right min-h-24"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>الوقت المفضل للزيارة *</Label>
                      <RadioGroup
                        value={formData.preferredTime}
                        onValueChange={(value) => handleInputChange("preferredTime", value)}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem value="morning" id="morning" />
                          <Label htmlFor="morning">فترة صباحية (8 ص - 12 ظ)</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem value="evening" id="evening" />
                          <Label htmlFor="evening">فترة مسائية (4 م - 8 م)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                {/* Parts Selector */}
                <PartsSelector
                  serviceType={formData.serviceType}
                  needsParts={formData.needsParts}
                  onNeedsPartsChange={(value) => handleInputChange("needsParts", value)}
                  selectedPart={formData.selectedPart}
                  onPartChange={(part) => handleInputChange("selectedPart", part)}
                  customPart={formData.customPart}
                  onCustomPartChange={(value) => handleInputChange("customPart", value)}
                  needsInstallation={formData.needsInstallation}
                  onInstallationChange={(value) => handleInputChange("needsInstallation", value)}
                />

                {/* Photo Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">صور المشكلة</h3>
                  </div>
                  
                  <PhotoUpload
                    photos={formData.photos}
                    onPhotosChange={(photos) => handleInputChange("photos", photos)}
                  />
                </div>

                <Button
                  type="submit"
                  variant="cta"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full text-lg py-6 h-auto"
                >
                  {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequest;