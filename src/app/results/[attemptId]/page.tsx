import { ResultsAudit } from "@/components/results-audit";

export default async function ResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;

  return <ResultsAudit attemptId={attemptId} />;
}
