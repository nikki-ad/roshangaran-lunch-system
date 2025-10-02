import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    setTimeout(() => {
      if (
        username === "nikki.adhami.99@gmail.com" &&
        password === "1234"
      ) {
        sessionStorage.setItem("adminAuth", "true");
        toast({
          title: "ورود موفق",
          description: "به پنل مدیریت خوش آمدید",
        });
        navigate("/admin");
      } else {
        toast({
          title: "خطا",
          description: "نام کاربری یا رمز عبور اشتباه است",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">ورود مدیر</CardTitle>
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <CardDescription>
              برای دسترسی به پنل مدیریت وارد شوید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" data-testid="label-username">نام کاربری</Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="نام کاربری خود را وارد کنید"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="text-right"
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" data-testid="label-password">رمز عبور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="رمز عبور خود را وارد کنید"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-right"
                  data-testid="input-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  "در حال ورود..."
                ) : (
                  <>
                    <LogIn className="ml-2 h-4 w-4" />
                    ورود
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
