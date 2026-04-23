import { ExamWorkspace } from "@/components/exam-workspace";

export default async function ExamPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <ExamWorkspace attemptId={attemptId} />;
}
