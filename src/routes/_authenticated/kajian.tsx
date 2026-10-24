import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  submitKajian,
  getJudulOptions,
  type KajianInput,
  type JadwalItem,
} from "@/lib/kajian.functions";
import { Button } from "@/components/ui/button";
import { ComboboxField } from "@/components/ui/combobox-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { CalendarDays, LogOut, Moon, Send } from "lucide-react";

const ADMIN_WHATSAPP = "6281297929294";

const DAY_OPTIONS = [
  "Ahad",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jum'at",
  "Sabtu",
] as const;

const JUDUL_OPTIONS = [
  "Ad-Daa Wa Ad-Dawaa",
  "Al-Adzkar An-Nawawiyah",
  "Al-Jami'ul Ulum Lil Imam Ahmad",
  "Al-Lu'lu' wal Marjan",
  "Al-Mausu'ah Al-Fiqhiyah Al-Muyassaroh",
  "Al-Qaulul Mufid 'ala Kitabit Tauhid",
  "Aqidah Shohihah",
  "Bahasa Arab",
  "Bahjatun Naazhirin Syarh Riyaadhush Shaalihiin",
  "Fiqih Siroh Nabawi",
  "Kaifa 'aamalahum Rasulullah Muhammad ﷺ",
  "Kalimat Thayyibah",
  "Kifayatul Muta’abbid wa Tuhfatul Mutazahhid",
  "Kitab Adabul Mufrad",
  "Kitab Al-Kabair",
  "Kitab Fiqih Masbuq",
  "Manhajul Anbiyaa' fii Tazkiyatin Nufuus",
  "Mashdar Aqidah Ahlis Sunnah wal Jama'ah",
  "Mausu'ah Nadhrotin Na'im Fi Makarimi Akhlaqir Rasulil Karim",
  "Mukhtashor Fiqih Islam",
  "Pentingnya Berilmu",
  "Risalah Al Imam Muhammad Bin Abdil Wahhab ila Ahli Al-Qashim",
  "Shahih Al Wabilus Shayyib Minal Kalimit Thayyib",
  "Shahih Fiqhus Sunnah",
  "Syarah Shahih Muslim",
  "Syarah Al-Ushul Ats-Tsalatsah",
  "Syarhus Sunnah",
  "Tafsir Juz Amma",
  "Tahsin/Tajwid",
  "Tematik",
  "Yang lain:",
];

const PEMATERI_OPTIONS = [
  "Ahmad Baihaqi",
  "Faiz Abdullah, S.Ag., M.Ag.",
  "Fadhil Ziyanul Hubbi, SM",
  "Fathulloh Burhan",
  "Fityan Amali",
  "Galih Setiadi",
  "Hibban Muttabi Al Haq, SH",
  "Imam Syafi'i",
  "Muhammad Nazaruddin",
  "Muhtadi Abdul Munib",
  "Riza Firmansyah, M.Pd",
  "Ubaidillah Masyhadi",
  "Yang lain:",
];

function addDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d;
}

const HIJRI_MONTHS_ID = [
  "Muharram",
  "Safar",
  "Rabi'ul Awwal",
  "Rabi'ul Akhir",
  "Jumadil Awwal",
  "Jumadil Akhir",
  "Rajab",
  "Sya'ban",
  "Ramadhan",
  "Syawwal",
  "Dzulqa'dah",
  "Dzulhijjah",
];

function gregorianToHijri(gy: number, gm: number, gd: number) {
  const jd =
    Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4) +
    Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4) +
    gd -
    32075;
  const l0 = jd - 1948440 + 10632;
  const n = Math.floor((l0 - 1) / 10631);
  let l = l0 - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

function formatHijri(
  dateStr: string,
  kajianRutin: KajianInput["kajianRutin"] = "Ba'da Maghrib 🌙"
): string {
  if (!dateStr) return "";
  try {
    const daysToAdd = kajianRutin === "Ba'da Maghrib 🌙" ? 1 : 0;
    const d = addDays(dateStr, daysToAdd);
    const { year, month, day } = gregorianToHijri(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate()
    );
    const monthName = HIJRI_MONTHS_ID[month - 1] ?? "";
    if (!monthName) return "";
    return `${day} ${monthName} ${year} H`;
  } catch {
    return "";
  }
}

function formatDay(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return DAY_OPTIONS[d.getDay()];
}

function formatMasehiLong(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export const Route = createFileRoute("/_authenticated/kajian")({
  component: KajianPage,
});

function KajianPage() {
  const navigate = useNavigate();
  const submit = useServerFn(submitKajian);
  const fetchJudul = useServerFn(getJudulOptions);
  const [judulOptions, setJudulOptions] = useState<string[]>(JUDUL_OPTIONS);
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);

  useEffect(() => {
    fetchJudul()
      .then((res) => {
        if (res.data.length) {
          const list = res.data.filter((x) => x !== "Yang lain:");
          setJudulOptions([...list, "Yang lain:"]);
        }
        if (res.jadwal) {
          setJadwalList(res.jadwal);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Gagal memuat daftar judul dari Google Sheet");
      });
  }, []);

  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<KajianInput>({
    hari: formatDay(today) as KajianInput["hari"],
    tanggalMasehi: today,
    tanggalHijri: formatHijri(today, "Ba'da Maghrib 🌙"),
    pemateri: "",
    ketPemateri: "",
    judul: "",
    ketTambahan: "",
    kajianRutin: "Ba'da Maghrib 🌙",
    jenis: "Umum",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const hijriAuto = useMemo(
    () => formatHijri(form.tanggalMasehi, form.kajianRutin),
    [form.tanggalMasehi, form.kajianRutin]
  );
  useEffect(() => {
    setForm((f) => ({ ...f, tanggalHijri: hijriAuto }));
  }, [hijriAuto]);

  const dayAuto = useMemo(
    () => formatDay(form.tanggalMasehi) as KajianInput["hari"],
    [form.tanggalMasehi]
  );
  useEffect(() => {
    setForm((f) => ({ ...f, hari: dayAuto }));
  }, [dayAuto]);

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
      const result = await submit({ data: form });

      if (!result.message || !result.message.trim()) {
        toast.error("Pesan WhatsApp kosong — periksa response Apps Script");
        return;
      }
      const waUrl = `https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP}&text=${encodeURIComponent(
        result.message
      )}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");

      setForm((f) => ({
        ...f,
        pemateri: "",
        ketPemateri: "",
        judul: "",
        ketTambahan: "",
      }));
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
              <h1 className="font-display text-xl leading-tight text-foreground">
                Masjid Imam An-Nawawi
              </h1>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Jadwal Kajian Rutin
              </p>
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
              <span className="text-xs font-semibold uppercase tracking-widest">
                Formulir Baru
              </span>
            </div>
            <CardTitle className="font-display text-2xl">Isi Jadwal Kajian</CardTitle>
            <CardDescription>
              Data akan tersimpan ke Google Sheet & notifikasi WhatsApp dibuka otomatis ke admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="tanggal">Tanggal Masehi</Label>
                  <Input
                    id="tanggal"
                    type="date"
                    required
                    value={form.tanggalMasehi}
                    onChange={(e) => update("tanggalMasehi", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formatMasehiLong(form.tanggalMasehi)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hari">Hari</Label>
                  <Select
                    value={form.hari}
                    onValueChange={(v) => update("hari", v as KajianInput["hari"])}
                  >
                    <SelectTrigger
                      id="hari"
                      className="h-auto min-h-9 w-full px-3 py-2 text-sm font-normal"
                    >
                      <SelectValue placeholder="Pilih hari..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hijri">Tanggal Hijriah</Label>
                  <Input
                    id="hijri"
                    required
                    value={form.tanggalHijri}
                    onChange={(e) => update("tanggalHijri", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Otomatis dari tanggal Masehi, bisa diubah.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label>Kajian Rutin</Label>
                  <RadioGroup
                    value={form.kajianRutin}
                    onValueChange={(v) =>
                      update("kajianRutin", v as KajianInput["kajianRutin"])
                    }
                    className="grid grid-cols-1 gap-3"
                  >
                    {(
                      [
                        "Ba'da Maghrib 🌙",
                        "Ba'da Shubuh 🌄",
                        "Ba'da Ashar",
                      ] as const
                    ).map((j) => (
                      <label
                        key={j}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                          form.kajianRutin === j
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <RadioGroupItem value={j} id={`kr-${j}`} />
                        <span className="font-medium">{j}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Jenis Kajian</Label>
                  <RadioGroup
                    value={form.jenis}
                    onValueChange={(val) =>
                      update("jenis", val as KajianInput["jenis"])
                    }
                    className="grid grid-cols-1 gap-3"
                  >
                    {(
                      ["Umum", "Khusus Ikhwan", "Khusus Muslimah"] as const
                    ).map((j) => (
                      <label
                        key={j}
                        htmlFor={`jenis-${j}`}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                          form.jenis === j
                            ? "border-primary bg-primary/5 text-foreground font-medium"
                            : "border-border hover:border-primary/40 text-muted-foreground"
                        }`}
                      >
                        <RadioGroupItem value={j} id={`jenis-${j}`} />
                        <span className="flex-1 select-none">{j}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ComboboxField
                  id="pemateri"
                  label="Pemateri"
                  options={PEMATERI_OPTIONS}
                  value={form.pemateri}
                  onChange={(v) => update("pemateri", v)}
                  placeholder="Pilih pemateri..."
                  customPlaceholder="Ketik nama pemateri lain..."
                  required
                />
                <div className="space-y-2">
                  <Label htmlFor="ket-pemateri">Ket. Pemateri</Label>
                  <Input
                    id="ket-pemateri"
                    maxLength={300}
                    placeholder="Misal: Badal ustadz fulan"
                    value={form.ketPemateri}
                    onChange={(e) => update("ketPemateri", e.target.value)}
                  />
                </div>
              </div>

              <ComboboxField
                id="judul"
                label="Judul Kajian"
                options={judulOptions}
                value={form.judul}
                onChange={(v) => update("judul", v)}
                placeholder="Pilih judul kajian..."
                customPlaceholder="Ketik judul kajian lain..."
                required
              />

              <div className="space-y-2">
                <Label htmlFor="ket">Keterangan Tambahan</Label>
                <Textarea
                  id="ket"
                  rows={3}
                  maxLength={1000}
                  placeholder="Opsional — kitab rujukan, waktu, dsb."
                  value={form.ketTambahan}
                  onChange={(e) => update("ketTambahan", e.target.value)}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={loading}
              >
                <Send className="h-4 w-4" />
                {loading ? "Menyimpan..." : "Simpan & Kirim WhatsApp"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Login sebagai{" "}
                <span className="font-medium text-foreground">
                  {email ?? "..."}
                </span>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Bagian Bawah: Kalender 1 Bulan & Pantauan Jadwal */}
        <div className="mt-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 1. Kalender Mini 1 Bulan */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-emerald-600" />
                  Kalender{" "}
                  {new Intl.DateTimeFormat("id-ID", {
                    month: "long",
                    year: "numeric",
                  }).format(new Date())}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
                  {["Ah", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"].map((d) => (
                    <div key={d} className="py-1">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {(() => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = now.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const totalDays = new Date(year, month + 1, 0).getDate();
                    const todayDate = now.getDate();

                    const cells = [];
                    for (let i = 0; i < firstDay; i++) {
                      cells.push(<div key={`empty-${i}`} className="p-2" />);
                    }
                    for (let day = 1; day <= totalDays; day++) {
                      const isToday = day === todayDate;
                      cells.push(
                        <div
                          key={day}
                          className={`p-2 rounded-md font-medium transition ${
                            isToday
                              ? "bg-emerald-600 text-white font-bold shadow-sm"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          {day}
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* 2. Pantauan Jadwal 7 Hari Terakhir */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Pantauan Jadwal Terakhir
                </CardTitle>
                <CardDescription className="text-xs">
                  Catatan kajian yang telah masuk ke sistem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {jadwalList.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Belum ada rekaman jadwal.
                    </p>
                  ) : (
                    jadwalList.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                            <span className="font-medium text-foreground">
                              {item.hari}
                            </span>
                            <span>•</span>
                            <span>{item.tanggal}</span>
                          </div>
                          <p className="text-xs font-semibold text-foreground truncate">
                            {item.judul || "Kajian Rutin"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            Ustadz {item.pemateri}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            item.waktu.includes("Maghrib")
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.waktu.includes("Maghrib") ? "Maghrib" : "Shubuh"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
