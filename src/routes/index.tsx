import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Moon, CalendarDays, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
          <Moon className="h-8 w-8" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Masjid Imam An-Nawawi</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Formulir Jadwal <span className="italic text-primary">Kajian Rutin</span>
        </h1>
        <p className="mt-4 text-muted-foreground">
          Panel resmi bagi panitia dan DKM untuk mendaftarkan jadwal kajian.
          Data tersimpan ke Google Sheet dan notifikasi WhatsApp otomatis terkirim ke admin.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/kajian">Masuk Panel Panitia</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link to="/auth">Daftar / Login</Link>
          </Button>
        </div>

        <div className="mt-14 grid gap-4 text-left sm:grid-cols-3">
          <Feature icon={<CalendarDays className="h-5 w-5" />} title="Tanggal ganda"
            desc="Masehi & Hijriah otomatis." />
          <Feature icon={<MessageCircle className="h-5 w-5" />} title="Notif WhatsApp"
            desc="Pesan ke admin siap kirim." />
          <Feature icon={<Moon className="h-5 w-5" />} title="Umum / Khusus"
            desc="Kategori jelas per kajian." />
        </div>
      </div>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
        {icon}
      </div>
      <h3 className="font-display text-base text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
