import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Clock, CheckCircle2, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const [menuText, setMenuText] = useState<string>("در حال بارگذاری...");
  const [name, setName] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const { toast } = useToast();

  // بارگذاری منوی هفته
  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const { data, error } = await supabase
        .from("menu")
        .select("menu_text")
        .eq("id", 1)
        .single();

      if (error) throw error;
      setMenuText(data?.menu_text || "منو هنوز تنظیم نشده است.");
    } catch (error) {
      console.error("خطا در بارگذاری منو:", error);
      setMenuText("خطا در بارگذاری منو");
    }
  };

  // رزرو موقت
  const handleTemporaryReservation = async () => {
    if (!name.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً نام خود را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsReserving(true);
    try {
      const { error } = await supabase
        .from("reservations")
        .insert({ name: name.trim(), status: "temporary" });

      if (error) throw error;

      toast({
        title: "موفقیت‌آمیز",
        description: "رزرو موقت شما ثبت شد. برای ثبت نهایی، فیش واریزی را آپلود کنید.",
      });
    } catch (error: any) {
      console.error("خطا در رزرو موقت:", error);
      toast({
        title: "خطا",
        description: error.message || "خطا در ثبت رزرو موقت",
        variant: "destructive",
      });
    } finally {
      setIsReserving(false);
    }
  };

  // ثبت نهایی با آپلود فیش
  const handleFinalRegistration = async () => {
    if (!name.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً نام خود را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    if (!receiptFile) {
      toast({
        title: "خطا",
        description: "لطفاً فیش واریزی را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // آپلود فیش
      const fileName = `${name.trim()}_${Date.now()}.${receiptFile.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      // ثبت رزرو نهایی
      const { error: insertError } = await supabase
        .from("reservations")
        .insert({
          name: name.trim(),
          status: "final",
          receipt_url: uploadData.path,
        });

      if (insertError) throw insertError;

      toast({
        title: "ثبت نهایی موفق",
        description: "رزرو شما با موفقیت ثبت شد!",
      });

      // پاک کردن فرم
      setName("");
      setReceiptFile(null);
      const fileInput = document.getElementById("receipt") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      console.error("خطا در ثبت نهایی:", error);
      toast({
        title: "خطا",
        description: error.message || "خطا در ثبت نهایی",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* هدر */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            سرویس تغذیه روشنگران
          </h1>
          <p className="text-muted-foreground">ثبت‌نام ناهار مدرسه</p>
        </div>

        {/* منوی هفته */}
        <Card className="mb-8 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              منوی هفته
            </CardTitle>
            <CardDescription>غذای این هفته را مشاهده کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap">
              {menuText}
            </div>
          </CardContent>
        </Card>

        {/* فرم رزرو */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>ثبت رزرو</CardTitle>
            <CardDescription>
              ابتدا رزرو موقت کنید، سپس با آپلود فیش واریزی ثبت نهایی انجام دهید
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* نام */}
            <div className="space-y-2">
              <Label htmlFor="name">نام شما</Label>
              <Input
                id="name"
                type="text"
                placeholder="نام و نام خانوادگی خود را وارد کنید"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-right"
              />
            </div>

            {/* آپلود فیش */}
            <div className="space-y-2">
              <Label htmlFor="receipt">فیش واریزی (اختیاری برای رزرو موقت)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="text-right"
                />
                {receiptFile && (
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                فرمت‌های مجاز: JPG, PNG
              </p>
            </div>

            {/* دکمه‌ها */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleTemporaryReservation}
                disabled={isReserving || isUploading || !name.trim()}
                className="flex-1"
                variant="outline"
              >
                {isReserving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  <>
                    <Clock className="ml-2 h-4 w-4" />
                    رزرو موقت
                  </>
                )}
              </Button>

              <Button
                onClick={handleFinalRegistration}
                disabled={isUploading || isReserving || !name.trim() || !receiptFile}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال آپلود...
                  </>
                ) : (
                  <>
                    <Upload className="ml-2 h-4 w-4" />
                    ثبت نهایی
                  </>
                )}
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
