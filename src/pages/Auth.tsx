import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

const LANGUAGES = ["English", "Hindi", "Hinglish", "Telugu", "Marathi", "Punjabi", "Tamil", "Bengali"];

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Name too short").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  class: z.string().trim().min(1, "Required").max(40),
  preferred_language: z.string().min(1),
});
const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});

const AuthPage = () => {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [su, setSu] = useState({ full_name: "", email: "", password: "", class: "", preferred_language: "Hinglish" });
  const [si, setSi] = useState({ email: "", password: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) nav("/", { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) nav("/", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(su);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.full_name,
          class: parsed.data.class,
          preferred_language: parsed.data.preferred_language,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome to Nexus! 🎉");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse(si);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) return toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <header className="container max-w-4xl flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-hero flex items-center justify-center shadow-elegant">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">Nexus</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md p-6 shadow-card">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Meet Nexus</h1>
            <p className="text-sm text-muted-foreground mt-1">Your AI study buddy — in your language.</p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={si.email} onChange={(e) => setSi({ ...si, email: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input type="password" value={si.password} onChange={(e) => setSi({ ...si, password: e.target.value })} required />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input value={su.full_name} onChange={(e) => setSu({ ...su, full_name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={su.email} onChange={(e) => setSu({ ...su, email: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input type="password" value={su.password} onChange={(e) => setSu({ ...su, password: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Class</Label>
                    <Input placeholder="e.g. 10, BSc-1" value={su.class} onChange={(e) => setSu({ ...su, class: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Language</Label>
                    <Select value={su.preferred_language} onValueChange={(v) => setSu({ ...su, preferred_language: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default AuthPage;
