import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const kajianSchema = z.object({
  tanggalMasehi: z.string().min(1),
  tanggalHijri: z.string().min(1),
  pemateri: z.string().trim().min(1).max(200),
  ketPemateri: z.string().trim().max(300).default(""),
  judul: z.string().trim().min(1).max(300),
  ketTambahan: z.string().trim().max(1000).default(""),
  jenis: z.enum(["Umum", "Khusus"]),
});

export type KajianInput = z.infer<typeof kajianSchema>;

export const submitKajian = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => kajianSchema.parse(input))
  .handler(async ({ data, context }) => {
    const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (!url) throw new Error("GOOGLE_SHEET_WEBHOOK_URL belum diset");

    const payload = {
      tanggalMasehi: data.tanggalMasehi,
      tanggalHijri: data.tanggalHijri,
      pemateri: data.pemateri,
      ketPemateri: data.ketPemateri,
      judul: data.judul,
      ketTambahan: data.ketTambahan,
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

    return { ok: true as const, payload };
  });
