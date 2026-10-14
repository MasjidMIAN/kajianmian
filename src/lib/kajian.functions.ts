import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const kajianSchema = z.object({
  hari: z.enum(["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"]),
  tanggalMasehi: z.string().min(1),
  tanggalHijri: z.string().min(1),
  pemateri: z.string().trim().min(1).max(200),
  ketPemateri: z.string().trim().max(300).default(""),
  judul: z.string().trim().min(1).max(300),
  ketTambahan: z.string().trim().max(1000).default(""),
  kajianRutin: z.enum(["Ba'da Maghrib 🌙", "Ba'da Shubuh 🌄", "Ba'da Ashar"]),
  jenis: z.enum(["Umum", "Khusus Muslimah"]),
});

export type KajianInput = z.infer<typeof kajianSchema>;

export const submitKajian = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => kajianSchema.parse(input))
  .handler(async ({ data, context }) => {
    const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (!url) throw new Error("GOOGLE_SHEET_WEBHOOK_URL belum diset");

    const payload = {
      hari: data.hari,
      tanggalMasehi: data.tanggalMasehi,
      tanggalHijri: data.tanggalHijri,
      pemateri: data.pemateri,
      ketPemateri: data.ketPemateri,
      judul: data.judul,
      ketTambahan: data.ketTambahan,
      kajianRutin: data.kajianRutin,
      jenis: data.jenis,
      submittedBy: context.claims?.email ?? context.userId,
      submittedAt: new Date().toISOString(),
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Apps Script error", res.status, body);
      throw new Error(`Gagal simpan ke Google Sheet (${res.status})`);
    }

    // Ambil properti "message" dari response JSON Apps Script
    let message = "";
    try {
      const json = (await res.json()) as { message?: unknown };
      if (typeof json?.message === "string") message = json.message;
    } catch {
      console.error("Response Apps Script bukan JSON valid");
    }
    if (!message) {
      throw new Error("Apps Script tidak mengembalikan properti 'message'");
    }

    return { ok: true as const, message, payload };
  });
