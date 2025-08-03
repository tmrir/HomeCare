import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TechnicianAssignment from "@/components/TechnicianAssignment";
import { formatDistanceToNow } from "date-fns";
import { ar } from 'date-fns/locale/ar';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Wrench, 
  Eye, 
  RefreshCw, 
  UserPlus, 
  Calendar,
  MessageSquare,
  Check,
  X,
  AlertCircle,
  Package,
  Edit
} from "lucide-react";

interface ServiceRequest {
  id: string;
  full_name: string;
  mobile: string;
  service_type: string;
  issue_description: string;
  preferred_time: string;
  location: {
    lat: number;
    lng: number;
    neighborhood?: string;
    address?: string;
  };
  is_different_address: boolean;
  needs_parts: boolean;
  part_type?: string;
  part_other?: string;
  needs_installation: boolean;
  photo_urls: string[];
  status: string;
  assigned_technician?: string;
  technician_name?: string;
  technician_phone?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  tracking_code?: string;
}

interface Technician {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  skills: string[];
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: 'available' | 'busy' | 'offline';
  rating?: number;
  total_reviews?: number;
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
  const [activeTab, setActiveTab] = useState("pending");
  const [isAssigningTech, setIsAssigningTech] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const statusOptions = [
    { value: "pending", label: "بانتظار التأكيد", color: "bg-yellow-500" },
    { value: "confirmed", label: "مؤكد", color: "bg-blue-500" },
    { value: "in_progress", label: "جاري التنفيذ", color: "bg-orange-500" },
    { value: "completed", label: "مكتمل", color: "bg-green-500" },
    { value: "cancelled", label: "تم الإلغاء", color: "bg-red-500" },
  ];

  const serviceTypeLabels: Record<string, string> = {
    plumbing: "سباكة",
    electrical: "كهرباء",
    ac: "تكييف",
    other: "أخرى",
  };

  const serviceTypeIcons: Record<string, string> = {
    plumbing: "🚰",
    electrical: "🔌",
    ac: "❄️",
    other: "🔧",
  };

  const timeLabels = {
    morning: "فترة صباحية (8 ص - 12 ظ)",
    evening: "فترة مسائية (4 م - 8 م)",
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchRequests();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('service_requests_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'service_requests' 
        }, 
        (payload) => {
          console.log('Change received!', payload);
          fetchRequests();
        }
      )
      .subscribe();

    // Fetch technicians
    const fetchTechnicians = async () => {
      try {
        const { data, error } = await supabase
          .from('technicians')
          .select('*');
        
        if (error) throw error;
        setTechnicians(data || []);
      } catch (error) {
        console.error('Error fetching technicians:', error);
      }
    };
    
    fetchTechnicians();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(subscription);
    };
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

  const handleAssignTechnician = async (technicianId: string) => {
    if (!selectedRequest) return;
    
    try {
      setIsAssigningTech(true);
      const technician = technicians.find(t => t.id === technicianId);
      
      const { error } = await supabase
        .from('service_requests')
        .update({ 
          assigned_technician: technicianId,
          technician_name: technician?.full_name,
          technician_phone: technician?.phone,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Update technician status to busy
      await supabase
        .from('technicians')
        .update({ status: 'busy' })
        .eq('id', technicianId);

      toast({
        title: "تم التعيين بنجاح",
        description: `تم تعيين الفني ${technician?.full_name} للطلب بنجاح`,
      });

      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast({
        title: "خطأ في التعيين",
        description: "حدث خطأ أثناء محاولة تعيين الفني",
        variant: "destructive",
      });
    } finally {
      setIsAssigningTech(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (activeTab === 'all') return true;
    return request.status === activeTab;
  });

  const getTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true,
      locale: ar,
    });
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

  // ... (previous imports remain the same) ...

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">لوحة تحكم الإدارة</h1>
              <p className="text-sm text-muted-foreground mt-1">
                آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchRequests} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث
              </Button>
              <span className="text-sm text-muted-foreground">
                {requests.length} طلب
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statusOptions.map((status) => {
            const count = requests.filter(r => r.status === status.value).length;
            const isActive = activeTab === status.value;
            return (
              <motion.div 
                key={status.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(status.value)}
                className="cursor-pointer"
              >
                <Card className={`transition-colors ${isActive ? 'border-primary bg-primary/5' : ''}`}>
                  <CardContent className="p-3 text-center">
                    <div className={`w-10 h-10 rounded-full ${status.color} mx-auto mb-2 flex items-center justify-center`}>
                      <span className="text-white font-bold">{count}</span>
                    </div>
                    <h3 className="font-medium text-sm">{status.label}</h3>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Requests List */}
        <Card>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">
              {activeTab === 'all' ? 'جميع الطلبات' : statusOptions.find(s => s.value === activeTab)?.label}
              <span className="text-sm text-muted-foreground mr-2">
                ({filteredRequests.length})
              </span>
            </h2>
          </div>
          
          <div className="divide-y">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                لا توجد طلبات متاحة
              </div>
            ) : (
              <AnimatePresence>
                {filteredRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl mt-1">
                          {serviceTypeIcons[request.service_type] || '🔧'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{request.full_name}</h3>
                            <span className="text-muted-foreground text-sm">
                              {getTimeAgo(request.created_at)}
                            </span>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.location?.neighborhood || request.location?.address || 'لا يوجد عنوان'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm">
                              {serviceTypeLabels[request.service_type] || 'خدمة أخرى'}
                            </span>
                            {request.tracking_code && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {request.tracking_code}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewRequest(request)}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          عرض
                        </Button>
                        {request.status === 'pending' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setUpdateData({
                                status: 'confirmed',
                                assigned_technician: '',
                                admin_notes: request.admin_notes || ''
                              });
                            }}
                          >
                            <UserPlus className="w-4 h-4 ml-1" />
                            تعيين فني
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
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