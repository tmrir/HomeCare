import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, Star, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Confirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const orderNumber = searchParams.get('order');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!orderNumber) {
      navigate('/');
    }
  }, [orderNumber, navigate]);

  const handleRatingSubmit = () => {
    if (rating === 0) {
      toast({
        title: "يرجى اختيار التقييم",
        description: "اختر عدد النجوم لتقييم الخدمة",
        variant: "destructive",
      });
      return;
    }

    // Here you would save the rating to your database
    toast({
      title: "شكراً لك على التقييم",
      description: "تم حفظ تقييمك بنجاح",
    });
    
    // Reset form
    setRating(0);
    setComment("");
  };

  if (!orderNumber) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
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
              العودة للرئيسية
            </Button>
            <h1 className="text-xl font-semibold text-primary">تأكيد الطلب</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Success Message */}
          <Card className="shadow-medium border-0 bg-gradient-card text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-success">
                تم إرسال طلبك بنجاح!
              </h2>
              <p className="text-lg mb-6 text-muted-foreground">
                سيتم التواصل معك قريباً لتأكيد موعد الزيارة
              </p>
              <div className="bg-muted/50 rounded-lg p-4 inline-block">
                <p className="text-sm text-muted-foreground mb-1">رقم الطلب</p>
                <p className="text-xl font-bold text-primary">{orderNumber}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card className="shadow-medium border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle className="text-center">حالة الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-semibold text-primary">تم استلام الطلب</p>
                    <p className="text-sm text-muted-foreground">
                      طلبك قيد المراجعة وسيتم التواصل معك خلال 15 دقيقة
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg opacity-50">
                  <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                  <div>
                    <p className="font-semibold text-muted-foreground">تحديد الفني</p>
                    <p className="text-sm text-muted-foreground">
                      سيتم تحديد أقرب فني متاح لك
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg opacity-50">
                  <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                  <div>
                    <p className="font-semibold text-muted-foreground">في الطريق</p>
                    <p className="text-sm text-muted-foreground">
                      الفني في طريقه إليك
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg opacity-50">
                  <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                  <div>
                    <p className="font-semibold text-muted-foreground">اكتمال الخدمة</p>
                    <p className="text-sm text-muted-foreground">
                      تم إنجاز العمل بنجاح
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Section */}
          <Card className="shadow-medium border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle className="text-center">قيّم خدمتنا</CardTitle>
              <p className="text-center text-muted-foreground">
                ساعدنا في تحسين خدماتنا من خلال تقييمك
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Star Rating */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">اختر التقييم</p>
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-all duration-200 hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? "text-accent fill-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  أضف تعليق (اختياري)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="شاركنا رأيك في الخدمة..."
                  className="w-full p-3 border rounded-lg text-right min-h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleRatingSubmit}
                variant="cta"
                className="w-full"
                disabled={rating === 0}
              >
                إرسال التقييم
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/request')}
              className="flex-1"
            >
              طلب خدمة جديدة
            </Button>
            <Button
              variant="default"
              onClick={() => navigate('/')}
              className="flex-1 flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;