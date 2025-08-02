import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Package, 
  Wrench,
  Eye,
  Edit,
  MessageSquare,
  Calendar,
  RefreshCw
} from "lucide-react";

interface ServiceRequest {
  id: string;
  full_name: string;
  mobile: string;
  service_type: string;
  issue_description: string;
  preferred_time: string;
  location: any;
  is_different_address: boolean;
  needs_parts: boolean;
  part_type?: string;
  part_other?: string;
  needs_installation: boolean;
  photo_urls: string[];
  status: string;
  assigned_technician?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [updateData, setUpdateData] = useState({
    status: "",
    assigned_technician: "",
    admin_notes: "",
  });

  const statusOptions = [
    { value: "pending", label: "بانتظار التأكيد", color: "bg-yellow-500" },
    { value: "confirmed", label: "مؤكد", color: "bg-blue-500" },
    { value: "in_progress", label: "جاري التنفيذ", color: "bg-orange-500" },
    { value: "completed", label: "مكتمل", color: "bg-green-500" },
    { value: "cancelled", label: "تم الإلغاء", color: "bg-red-500" },
  ];

  const serviceTypeLabels = {
    plumbing: "سباكة",
    electrical: "كهرباء",
    ac: "تكييف",
    other: "أخرى",
  };

  const timeLabels = {
    morning: "فترة صباحية (8 ص - 12 ظ)",
    evening: "فترة مسائية (4 م - 8 م)",
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "خطأ في تحميل الطلبات",
        description: "حدث خطأ أثناء تحميل الطلبات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      await fetchRequests();
      setSelectedRequest(null);
      
      toast({
        title: "تم تحديث الطلب",
        description: "تم تحديث بيانات الطلب بنجاح",
      });

      // Here you would send WhatsApp/Email notification
      // simulateNotification(updateData.status);
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث الطلب",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return (
      <Badge 
        variant="secondary" 
        className={`${statusConfig?.color} text-white`}
      >
        {statusConfig?.label}
      </Badge>
    );
  };

  const handleViewRequest = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setUpdateData({
      status: request.status,
      assigned_technician: request.assigned_technician || "",
      admin_notes: request.admin_notes || "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">لوحة تحكم الإدارة</h1>
            <Button onClick={fetchRequests} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {statusOptions.map((status) => {
            const count = requests.filter(r => r.status === status.value).length;
            return (
              <Card key={status.value}>
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 rounded-full ${status.color} mx-auto mb-2 flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">{count}</span>
                  </div>
                  <h3 className="font-semibold text-sm">{status.label}</h3>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              جميع الطلبات ({requests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">لا توجد طلبات حالياً</p>
                </div>
              ) : (
                requests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                            معلومات العميل
                          </h4>
                          <div className="space-y-1">
                            <p className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4" />
                              {request.full_name}
                            </p>
                            <p className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4" />
                              {request.mobile}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                            تفاصيل الخدمة
                          </h4>
                          <div className="space-y-1">
                            <p className="text-sm">
                              {serviceTypeLabels[request.service_type as keyof typeof serviceTypeLabels]}
                            </p>
                            <p className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4" />
                              {timeLabels[request.preferred_time as keyof typeof timeLabels]}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                            الحالة والموقع
                          </h4>
                          <div className="space-y-2">
                            {getStatusBadge(request.status)}
                            <p className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4" />
                              {request.location?.neighborhood || "غير محدد"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewRequest(request)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                عرض
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>تفاصيل الطلب #{request.id.slice(-8).toUpperCase()}</DialogTitle>
                              </DialogHeader>
                              
                              {selectedRequest && (
                                <div className="space-y-6">
                                  {/* Customer Info */}
                                  <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      معلومات العميل
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">الاسم:</span> {selectedRequest.full_name}
                                      </div>
                                      <div>
                                        <span className="font-medium">الجوال:</span> {selectedRequest.mobile}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Service Details */}
                                  <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                      <Settings className="w-4 h-4" />
                                      تفاصيل الخدمة
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="font-medium">نوع الخدمة:</span> {serviceTypeLabels[selectedRequest.service_type as keyof typeof serviceTypeLabels]}
                                      </div>
                                      <div>
                                        <span className="font-medium">وصف المشكلة:</span>
                                        <p className="mt-1 p-2 bg-muted rounded">{selectedRequest.issue_description}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium">الوقت المفضل:</span> {timeLabels[selectedRequest.preferred_time as keyof typeof timeLabels]}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Parts Info */}
                                  {selectedRequest.needs_parts && (
                                    <div>
                                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        القطع المطلوبة
                                      </h3>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <span className="font-medium">نوع القطعة:</span> {selectedRequest.part_other || selectedRequest.part_type}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Wrench className="w-4 h-4" />
                                          <span>{selectedRequest.needs_installation ? "مع التركيب" : "بدون تركيب"}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Photos */}
                                  {selectedRequest.photo_urls.length > 0 && (
                                    <div>
                                      <h3 className="font-semibold mb-3">الصور المرفقة</h3>
                                      <div className="grid grid-cols-2 gap-2">
                                        {selectedRequest.photo_urls.map((photo, index) => (
                                          <img
                                            key={index}
                                            src={photo}
                                            alt={`صورة ${index + 1}`}
                                            className="w-full h-32 object-cover rounded"
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Update Form */}
                                  <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                      <Edit className="w-4 h-4" />
                                      تحديث الطلب
                                    </h3>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="status">الحالة</Label>
                                        <Select 
                                          value={updateData.status} 
                                          onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value }))}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {statusOptions.map((status) => (
                                              <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <Label htmlFor="technician">الفني المخصص</Label>
                                        <Input
                                          id="technician"
                                          value={updateData.assigned_technician}
                                          onChange={(e) => setUpdateData(prev => ({ ...prev, assigned_technician: e.target.value }))}
                                          placeholder="اسم الفني"
                                          className="text-right"
                                        />
                                      </div>

                                      <div>
                                        <Label htmlFor="admin-notes">ملاحظات الإدارة</Label>
                                        <Textarea
                                          id="admin-notes"
                                          value={updateData.admin_notes}
                                          onChange={(e) => setUpdateData(prev => ({ ...prev, admin_notes: e.target.value }))}
                                          placeholder="ملاحظات داخلية..."
                                          className="text-right"
                                          rows={3}
                                        />
                                      </div>

                                      <Button 
                                        onClick={() => updateRequest(selectedRequest.id)}
                                        className="w-full"
                                      >
                                        تحديث الطلب
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <p className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;