import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Wrench, Zap, Snowflake, Shield, Clock, Star } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: Wrench,
      title: "سباكة",
      description: "إصلاح وصيانة أنظمة المياه والصرف",
    },
    {
      icon: Zap,
      title: "كهرباء",
      description: "تركيب وإصلاح الأنظمة الكهربائية",
    },
    {
      icon: Snowflake,
      title: "تكييف",
      description: "صيانة وإصلاح أجهزة التكييف",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "فنيون معتمدون",
      description: "جميع الفنيين معتمدين وذوي خبرة عالية",
    },
    {
      icon: Clock,
      title: "خدمة سريعة",
      description: "نصل إليك في أسرع وقت ممكن",
    },
    {
      icon: Star,
      title: "جودة مضمونة",
      description: "ضمان على جميع أعمال الصيانة",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-primary">فني بيتك</h1>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/request')}
              className="hidden md:flex"
            >
              اطلب خدمة
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        ></div>
        <div className="relative container mx-auto px-4 text-center text-white">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            فنيون محترفون
            <br />
            <span className="text-accent">لخدمة منزلك</span>
          </h2>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90">
            احجز فني موثوق للسباكة والكهرباء والتكييف بضغطة زر واحدة
          </p>
          <Button 
            variant="hero" 
            size="lg" 
            onClick={() => navigate('/request')}
            className="text-xl px-12 py-6 h-auto"
          >
            اطلب فني الآن
          </Button>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">خدماتنا</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              نقدم خدمات منزلية شاملة بأعلى جودة وأسرع وقت
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="text-center hover:shadow-medium transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-0">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-semibold mb-4">{service.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">لماذا نحن؟</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              نضمن لك أفضل تجربة خدمة منزلية
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors duration-300">
                  <feature.icon className="w-10 h-10 text-accent" />
                </div>
                <h4 className="text-xl font-semibold mb-4">{feature.title}</h4>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            جاهز لحجز خدمتك؟
          </h3>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            احجز الآن واحصل على خدمة سريعة ومضمونة من فنيين محترفين
          </p>
          <Button 
            variant="cta" 
            size="lg" 
            onClick={() => navigate('/request')}
            className="text-xl px-12 py-6 h-auto"
          >
            احجز خدمتك الآن
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Wrench className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold">فني بيتك</h3>
            </div>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              منصة موثوقة لحجز خدمات الصيانة المنزلية مع أفضل الفنيين المعتمدين
            </p>
            <p className="text-white/60">
              جميع الحقوق محفوظة © 2024 فني بيتك
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;