import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Meh, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ServiceRatingProps {
  requestId: string;
  technicianId: string;
  technicianName: string;
  serviceType: string;
  serviceDate: string;
  onRatingComplete?: () => void;
}

const satisfactionLevels = [
  {
    value: "very_satisfied",
    label: "راضٍ جدًا",
    icon: <ThumbsUp className="h-5 w-5 text-green-500" />
  },
  {
    value: "satisfied",
    label: "راضٍ",
    icon: <Smile className="h-5 w-5 text-green-400" />
  },
  {
    value: "neutral",
    label: "محايد",
    icon: <Meh className="h-5 w-5 text-yellow-500" />
  },
  {
    value: "dissatisfied",
    label: "غير راضٍ",
    icon: <ThumbsDown className="h-5 w-5 text-red-500" />
  }
];

export default function ServiceRating({
  requestId,
  technicianId,
  technicianName,
  serviceType,
  serviceDate,
  onRatingComplete
}: ServiceRatingProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [satisfaction, setSatisfaction] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "خطأ في التقييم",
        description: "الرجاء اختيار تقييم من 1 إلى 5 نجوم",
        variant: "destructive",
      });
      return;
    }

    if (!satisfaction) {
      toast({
        title: "خطأ في التقييم",
        description: "الرجاء تحديد مدى رضاك عن الخدمة",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('reviews').insert([
        {
          request_id: requestId,
          technician_id: technicianId,
          rating,
          comment: comment.trim() || null,
          satisfaction_level: satisfaction
        }
      ]);

      if (error) throw error;

      toast({
        title: "شكرًا لك!",
        description: "تم تسجيل تقييمك بنجاح",
      });

      onRatingComplete?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من حفظ تقييمك. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">كيف كانت تجربتك مع الخدمة؟</h2>
        <p className="text-gray-600">
          ساعدنا في تحسين خدماتنا من خلال تقييم تجربتك مع {technicianName}
        </p>
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">تفاصيل الخدمة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <User className="ml-2 h-4 w-4 text-gray-500" />
            <span>الفني: {technicianName}</span>
          </div>
          <div className="flex items-center">
            <Wrench className="ml-2 h-4 w-4 text-gray-500" />
            <span>نوع الخدمة: {serviceType}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="ml-2 h-4 w-4 text-gray-500" />
            <span>تاريخ الخدمة: {new Date(serviceDate).toLocaleDateString('ar-SA')}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex items-center justify-center mb-2">
            {[...Array(5)].map((_, index) => {
              const ratingValue = index + 1;
              return (
                <button
                  key={ratingValue}
                  type="button"
                  className={`text-3xl mx-1 focus:outline-none ${
                    ratingValue <= (hover || rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  onClick={() => setRating(ratingValue)}
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(0)}
                >
                  <Star className="w-10 h-10 fill-current" />
                </button>
              );
            })}
          </div>
          <p className="text-center text-sm text-gray-500 mt-1">
            {rating === 0
              ? "اضغط لتقييم الخدمة"
              : `لقد قمت بتقييم الخدمة بـ ${rating} نجوم`}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comment" className="flex items-center text-gray-700">
            <MessageSquare className="ml-1 h-4 w-4" />
            اكتب رأيك في الخدمة (اختياري)
          </Label>
          <Textarea
            id="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="ما الذي أعجبك أو لم يعجبك في الخدمة؟"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">ما مدى رضاك عن الخدمة؟</p>
          <RadioGroup 
            value={satisfaction} 
            onValueChange={setSatisfaction}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {satisfactionLevels.map((level) => (
              <div key={level.value} className="flex items-center space-x-2 rtl:space-x-reverse">
                <RadioGroupItem value={level.value} id={level.value} />
                <Label 
                  htmlFor={level.value} 
                  className={`flex items-center cursor-pointer px-3 py-2 rounded-md border ${
                    satisfaction === level.value ? 'border-primary bg-primary/5' : 'border-gray-200'
                  }`}
                >
                  {level.icon}
                  <span className="mr-2">{level.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "جاري الإرسال..." : "إرسال التقييم"}
          </Button>
        </div>
      </form>
    </div>
  );
}
