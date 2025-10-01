import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Download, ArrowRight, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Reservation {
  id: string;
  name: string;
  status: string;
  receipt_url: string | null;
  created_at: string;
}

const Admin = () => {
  const [menuText, setMenuText] = useState<string>("");
  const [isUpdatingMenu, setIsUpdatingMenu] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMenu();
    loadReservations();
  }, []);

  const loadMenu = async () => {
    try {
      const { data, error } = await supabase
        .from("menu")
        .select("menu_text")
        .eq("id", 1)
        .single();

      if (error) throw error;
      setMenuText(data?.menu_text || "");
    } catch (error) {
      console.error("خطا در بارگذاری منو:", error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری منو",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const loadReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("خطا در بارگذاری رزروها:", error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری لیست رزروها",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReservations(false);
    }
  };

  const handleUpdateMenu = async () => {
    if (!menuText.trim()) {
      toast({
        title: "خطا",
        description: "متن منو نمی‌تواند خالی باشد",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingMenu(true);
    try {
      const { error } = await supabase
        .from("menu")
        .update({ menu_text: menuText.trim() })
        .eq("id", 1);

      if (error) throw error;

      toast({
        title: "موفقیت‌آمیز",
        description: "منو با موفقیت به‌روزرسانی شد",
      });
    } catch (error: any) {
      console.error("خطا در به‌روزرسانی منو:", error);
      toast({
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی منو",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingMenu(false);
    }
  };

  const handleExportCSV = () => {
    const finalReservations = reservations.filter((r) => r.status === "final");
    
    if (finalReservations.length === 0) {
      toast({
        title: "هشدار",
        description: "هیچ رزرو نهایی برای خروجی وجود ندارد",
        variant: "destructive",
      });
      return;
    }

    let csv = "نام,وضعیت,لینک فیش,تاریخ ثبت\n";
    finalReservations.forEach((row) => {
      const receiptUrl = row.receipt_url 
        ? `${supabase.storage.from("receipts").getPublicUrl(row.receipt_url).data.publicUrl}`
        : "ندارد";
      const date = new Date(row.created_at).toLocaleDateString("fa-IR");
      csv += `${row.name},${row.status === "final" ? "نهایی" : "موقت"},${receiptUrl},${date}\n`;
    });

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reservations_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "موفقیت‌آمیز",
      description: `${finalReservations.length} رزرو نهایی به فایل CSV صادر شد`,
    });
  };

  const getReceiptUrl = (receiptPath: string | null) => {
    if (!receiptPath) return null;
    return supabase.storage.from("receipts").getPublicUrl(receiptPath).data.publicUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* هدر */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
              پنل مدیریت
            </h1>
            <p className="text-muted-foreground">مدیریت منو و رزروها</p>
          </div>
          <Link to="/">
            <Button variant="outline">
              <ArrowRight className="ml-2 h-4 w-4" />
              بازگشت به صفحه اصلی
            </Button>
          </Link>
        </div>

        {/* به‌روزرسانی منو */}
        <Card className="mb-8 shadow-md">
          <CardHeader>
            <CardTitle>مدیریت منوی هفته</CardTitle>
            <CardDescription>منوی هفته را وارد یا ویرایش کنید</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingMenu ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <Textarea
                  placeholder="منوی هفته را اینجا وارد کنید..."
                  value={menuText}
                  onChange={(e) => setMenuText(e.target.value)}
                  rows={8}
                  className="text-right resize-none"
                />
                <Button
                  onClick={handleUpdateMenu}
                  disabled={isUpdatingMenu || !menuText.trim()}
                  className="w-full sm:w-auto"
                >
                  {isUpdatingMenu ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال به‌روزرسانی...
                    </>
                  ) : (
                    <>
                      <Save className="ml-2 h-4 w-4" />
                      به‌روزرسانی منو
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* لیست رزروها */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>لیست رزروها</CardTitle>
                <CardDescription>
                  مشاهده و مدیریت رزروهای ثبت شده
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={loadReservations}
                  variant="outline"
                  size="sm"
                  disabled={isLoadingReservations}
                >
                  <RefreshCcw className={`ml-2 h-4 w-4 ${isLoadingReservations ? "animate-spin" : ""}`} />
                  بارگذاری مجدد
                </Button>
                <Button onClick={handleExportCSV} size="sm">
                  <Download className="ml-2 h-4 w-4" />
                  خروجی CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingReservations ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                هیچ رزروی ثبت نشده است
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نام</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">فیش واریزی</TableHead>
                      <TableHead className="text-right">تاریخ ثبت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-medium">
                          {reservation.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              reservation.status === "final"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {reservation.status === "final" ? "نهایی" : "موقت"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {reservation.receipt_url ? (
                            <a
                              href={getReceiptUrl(reservation.receipt_url) || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              مشاهده فیش
                            </a>
                          ) : (
                            <span className="text-muted-foreground">ندارد</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(reservation.created_at).toLocaleDateString(
                            "fa-IR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
