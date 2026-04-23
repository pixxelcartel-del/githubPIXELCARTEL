import { NextResponse } from "next/server";
import { dashboardStats } from "@/lib/dashboard-data";

export async function GET() {
  return NextResponse.json({
    summary: "Your guided mock sequence is improving. The next opportunity is tighter written explanation and cleaner diagram construction.",
    stats: dashboardStats,
  });
}
