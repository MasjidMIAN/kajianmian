import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Moon } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/kajian" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Selamat datang kembali");
    navigate({ to: "/kajian" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/kajian` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Akun dibuat. Silakan cek email untuk verifikasi bila diminta.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Moon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-foreground">Masjid Imam An-Nawawi</h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Panel Panitia & DKM</p>
          </div>
        </Link>

        <Card className="border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="font-display">Masuk Panitia</CardTitle>
            <CardDescription>Hanya panitia terdaftar yang dapat mengisi jadwal kajian.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Masuk</TabsTrigger>
                <TabsTrigger value="signup">Daftar</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-4 pt-4">
                  <Field id="email-in" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field id="pw-in" label="Kata Sandi" type="password" value={password} onChange={setPassword} />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Memproses..." : "Masuk"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-4 pt-4">
                  <Field id="email-up" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field id="pw-up" label="Kata Sandi" type="password" value={password} onChange={setPassword} placeholder="min. 6 karakter" />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Memproses..." : "Daftar"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ id, label, type, value, onChange, placeholder }: {
  id: string; label: string; type: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} required value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} minLength={type === "password" ? 6 : undefined} />
    </div>
  );
}
