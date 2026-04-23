import Image from "next/image";
import { demoPaper } from "@/lib/paper-data";

export function PaperPreview({ page = 1 }: { page?: number }) {
  const src = demoPaper.assets.pageImages[page - 1] ?? demoPaper.assets.pageImages[0];
  return (
    <div className="relative aspect-[0.707/1] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <Image src={src} alt={`Question paper page ${page}`} fill sizes="(max-width: 768px) 100vw, 420px" className="object-cover object-top" priority={page === 1} />
    </div>
  );
}
