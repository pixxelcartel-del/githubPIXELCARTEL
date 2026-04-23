import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DiagramRenderer } from "@/components/diagram-renderer";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { GlassPanel, InkPanel, PaperPanel, Surface } from "@/components/ui/surface";
import { demoPaper } from "@/lib/paper-data";

export default function PaperPage() {
  return (
    <AppShell>
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <div className="space-y-5">
          <InkPanel className="p-5">
            <Badge className="bg-white text-[#081018]">Preloaded demo paper</Badge>
            <h1 className="mt-4 text-3xl font-black text-white">Practice library</h1>
            <p className="mt-3 text-sm leading-6 text-white/68">
              {demoPaper.subject} {demoPaper.code}, {demoPaper.component}, {demoPaper.session}
            </p>
            <div className="mt-5 grid gap-2 text-sm text-white/72">
              <LibraryFact label="Duration" value={`${demoPaper.durationMinutes} minutes`} />
              <LibraryFact label="Stored total" value={`${demoPaper.totalMarks} marks`} />
              <LibraryFact label="Source check" value={`QP ${demoPaper.sourceTotalMarks.questionPaper} / MS cover ${demoPaper.sourceTotalMarks.markSchemeCover}`} />
            </div>
            <p className="mt-5 text-sm leading-6 text-white/68">
              Developer-fed QP/MS sources are extracted into structured questions, mark points, and editable diagram layers before students practise.
            </p>
            <Link href="/exam/demo-attempt" className={buttonClassName({ className: "mt-5 w-full" })}>
              Start guided mock
            </Link>
          </InkPanel>

          <Surface className="p-5">
            <h2 className="text-lg font-black text-ink">Question map</h2>
            <div className="mt-4 space-y-2">
              {demoPaper.questions.map((question) => (
                <a key={question.id} href={`#${question.id}`} className="block rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3 transition hover:bg-[var(--surface-strong)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-ink">Q{question.number}. {question.title}</p>
                    <Badge>{question.totalMarks}m</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">Pages {question.pageStart}-{question.pageEnd}</p>
                </a>
              ))}
            </div>
          </Surface>
        </div>

        <div className="grid gap-5">
          {demoPaper.questions.map((question) => (
            <PaperPanel key={question.id} id={question.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-normal text-[#667085]">Native paper layer</p>
                  <h2 className="mt-2 text-2xl font-black text-[#101318]">Q{question.number}. {question.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#28313c]">{question.prompt}</p>
                </div>
                <Badge>{question.subQuestions.length} parts</Badge>
              </div>
              <div className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1fr]">
                <DiagramRenderer questionId={question.id} />
                <div className="space-y-2">
                  {question.subQuestions.map((part) => (
                    <GlassPanel key={part.id} className="p-3">
                      <p className="font-black text-ink">{part.label} / {part.marks}m</p>
                      <p className="mt-1 text-sm leading-6 text-soft">{part.prompt}</p>
                    </GlassPanel>
                  ))}
                </div>
              </div>
            </PaperPanel>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function LibraryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/8 p-3">
      <span>{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}
