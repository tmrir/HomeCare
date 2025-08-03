import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Wrench, Clock, Check, X, MapPin, User, Phone } from 'lucide-react';

interface ServiceRequest {
  id: string;
  full_name: string;
  mobile: string;
  service_type: string;
  issue_description: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
}

const TechnicianDashboard = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .in('status', ['pending', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء جلب الطلبات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: string, status: string) => {
    try {
      setUpdating(prev => ({ ...prev, [id]: true }));
      
      const { error } = await supabase
        .from('service_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      await fetchRequests();
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الطلب بنجاح',
      });
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث حالة الطلب',
        variant: 'destructive',
      });
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  useEffect(() => {
    fetchRequests();

    // الاشتراك في التحديثات الفورية
    const subscription = supabase
      .channel('service_requests')
      .on('postgres_changes', 
        { 
          event: '*',
          schema: 'public',
          table: 'service_requests'
        }, 
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'pending' | 'success' }> = {
      pending: { text: 'قيد الانتظار', variant: 'pending' },
      accepted: { text: 'تم القبول', variant: 'secondary' },
      in_progress: { text: 'قيد التنفيذ', variant: 'default' },
      completed: { text: 'مكتمل', variant: 'success' },
      cancelled: { text: 'ملغي', variant: 'destructive' },
    };
    
    const statusInfo = statusMap[status] || { text: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  const getServiceTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      plumbing: <Wrench className="w-5 h-5 text-blue-500" />,
      electrical: <Wrench className="w-5 h-5 text-yellow-500" />,
      ac: <Wrench className="w-5 h-5 text-green-500" />,
      other: <Wrench className="w-5 h-5 text-gray-500" />,
    };
    return icons[type] || icons.other;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">لوحة تحكم الفني</h1>
        <Button 
          variant="outline" 
          onClick={() => {
            supabase.auth.signOut();
            navigate('/login');
          }}
        >
          تسجيل الخروج
        </Button>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">لا توجد طلبات متاحة حالياً</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {getServiceTypeIcon(request.service_type)}
                    <CardTitle className="text-lg">
                      طلب خدمة #{request.id.slice(-6).toUpperCase()}
                    </CardTitle>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{request.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <a href={`tel:${request.mobile}`} className="hover:underline">
                          {request.mobile}
                        </a>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">
                          {request.location?.address || 'لا يوجد عنوان محدد'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleString('ar-SA')}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium mb-1">وصف المشكلة:</h4>
                    <p className="text-sm text-gray-700">{request.issue_description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {request.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updateRequestStatus(request.id, 'accepted')}
                        disabled={updating[request.id]}
                        className="gap-1"
                      >
                        <Check className="w-4 h-4" />
                        قبول الطلب
                      </Button>
                    )}
                    
                    {request.status === 'accepted' && (
                      <Button
                        size="sm"
                        onClick={() => updateRequestStatus(request.id, 'in_progress')}
                        disabled={updating[request.id]}
                        className="gap-1"
                      >
                        <Clock className="w-4 h-4" />
                        بدء العمل
                      </Button>
                    )}

                    {request.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequestStatus(request.id, 'completed')}
                        disabled={updating[request.id]}
                        className="gap-1"
                      >
                        <Check className="w-4 h-4" />
                        إكمال الطلب
                      </Button>
                    )}

                    {['pending', 'accepted'].includes(request.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequestStatus(request.id, 'cancelled')}
                        disabled={updating[request.id]}
                        className="gap-1"
                      >
                        <X className="w-4 h-4" />
                        رفض الطلب
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TechnicianDashboard;
