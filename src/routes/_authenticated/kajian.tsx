import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { submitKajian, type KajianInput } from "@/lib/kajian.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { CalendarDays, LogOut, Moon, Send } from "lucide-react";

const ADMIN_WHATSAPP = "6281297929294";

function formatHijri(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T12:00:00");
    return new Intl.DateTimeFormat("en-TN-u-ca-islamic-umalqura", {
      day: "numeric", month: "long", year: "numeric",
    }).format(d).replace(" AH", " H");
  } catch {
    return "";
  }
}

function formatMasehiLong(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
}

export const Route = createFileRoute("/_authenticated/kajian")({
  component: KajianPage,
});

function KajianPage() {
  const navigate = useNavigate();
  const submit = useServerFn(submitKajian);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<KajianInput>({
    tanggalMasehi: today,
    tanggalHijri: formatHijri(today),
    pemateri: "",
    ketPemateri: "",
    judul: "",
    ketTambahan: "",
    jenis: "Umum",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const hijriAuto = useMemo(() => formatHijri(form.tanggalMasehi), [form.tanggalMasehi]);
  useEffect(() => { setForm((f) => ({ ...f, tanggalHijri: hijriAuto })); }, [hijriAuto]);

  function update<K extends keyof KajianInput>(k: K, v: KajianInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pemateri.trim() || !form.judul.trim()) {
      toast.error("Pemateri dan judul wajib diisi");
      return;
    }
    setLoading(true);
    try {
      await submit({ data: form });
      toast.success("Jadwal tersimpan ke Google Sheet");

      // Kirim notifikasi WhatsApp ke admin via wa.me
      const msg = [
        "*Jadwal Kajian Baru — Masjid Imam An-Nawawi*",
        "",
        `📅 Masehi: ${formatMasehiLong(form.tanggalMasehi)}`,
        `🌙 Hijriah: ${form.tanggalHijri}`,
        `🎙 Pemateri: ${form.pemateri}`,
        form.ketPemateri ? `   (${form.ketPemateri})` : "",
        `📖 Judul: ${form.judul}`,
        form.ketTambahan ? `📝 Catatan: ${form.ketTambahan}` : "",
        `👥 Jenis: ${form.jenis}`,
        "",
        `Diinput oleh: ${email ?? "panitia"}`,
      ].filter(Boolean).join("\n");
      const waUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");

      // Reset (kecuali tanggal)
      setForm((f) => ({ ...f, pemateri: "", ketPemateri: "", judul: "", ketTambahan: "", jenis: "Umum" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl leading-tight text-foreground">Masjid Imam An-Nawawi</h1>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Jadwal Kajian Rutin</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" /> Keluar
          </Button>
        </header>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="border-b border-border/60 bg-gradient-to-br from-secondary/50 to-transparent">
            <div className="flex items-center gap-2 text-accent">
              <CalendarDays className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">Formulir Baru</span>
            </div>
            <CardTitle className="font-display text-2xl">Isi Jadwal Kajian</CardTitle>
            <CardDescription>
              Data akan tersimpan ke Google Sheet & notifikasi WhatsApp dibuka otomatis ke admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tanggal">Tanggal Masehi</Label>
                  <Input id="tanggal" type="date" required value={form.tanggalMasehi}
                    onChange={(e) => update("tanggalMasehi", e.target.value)} />
                  <p className="text-xs text-muted-foreground">{formatMasehiLong(form.tanggalMasehi)}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hijri">Tanggal Hijriah</Label>
                  <Input id="hijri" required value={form.tanggalHijri}
                    onChange={(e) => update("tanggalHijri", e.target.value)} />
                  <p className="text-xs text-muted-foreground">Otomatis dari tanggal Masehi, bisa diubah.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pemateri">Pemateri</Label>
                  <Input id="pemateri" required maxLength={200} placeholder="Ust. ..."
                    value={form.pemateri} onChange={(e) => update("pemateri", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ket-pemateri">Ket. Pemateri</Label>
                  <Input id="ket-pemateri" maxLength={300} placeholder="Asal / afiliasi (opsional)"
                    value={form.ketPemateri} onChange={(e) => update("ketPemateri", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="judul">Judul Kajian</Label>
                <Input id="judul" required maxLength={300} placeholder="Contoh: Adab Menuntut Ilmu"
                  value={form.judul} onChange={(e) => update("judul", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ket">Keterangan Tambahan</Label>
                <Textarea id="ket" rows={3} maxLength={1000} placeholder="Opsional — kitab rujukan, waktu, dsb."
                  value={form.ketTambahan} onChange={(e) => update("ketTambahan", e.target.value)} />
              </div>

              <div className="space-y-3">
                <Label>Jenis Kajian</Label>
                <RadioGroup value={form.jenis} onValueChange={(v) => update("jenis", v as "Umum" | "Khusus")}
                  className="grid grid-cols-2 gap-3">
                  {(["Umum", "Khusus"] as const).map((j) => (
                    <label key={j}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                        form.jenis === j ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}>
                      <RadioGroupItem value={j} id={`j-${j}`} />
                      <span className="font-medium">{j}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                <Send className="h-4 w-4" />
                {loading ? "Menyimpan..." : "Simpan & Kirim WhatsApp"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Login sebagai <span className="font-medium text-foreground">{email ?? "..."}</span>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
