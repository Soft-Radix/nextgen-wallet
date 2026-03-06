import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type ChartDataPoint = { label: string; value: number };

export type DashboardStats = {
  totalRegisteredUsers: number;
  registeredUsersChangePercent: number | null;
  totalTransactionAmount: number;
  transactionAmountChangePercent: number | null;
  activeUserCount: number;
  activeUserPercent: number | null;
  chartMonthly: ChartDataPoint[];
  chartYearly: ChartDataPoint[];
};

export async function GET() {
  try {
    const supabase = await createClient();

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const isoThirty = thirtyDaysAgo.toISOString();

    // 1) Total registered users (user_details count)
    const { count: totalUsers, error: totalUsersError } = await supabase
      .from("user_details")
      .select("*", { count: "exact", head: true });

    if (totalUsersError) {
      console.error("dashboard-stats total users error:", totalUsersError);
      return NextResponse.json(
        { error: totalUsersError.message },
        { status: 500 }
      );
    }

    // 2) Users registered in the past 30 days (for % increase)
    const { count: newUsersLast30Days, error: newUsersError } = await supabase
      .from("user_details")
      .select("*", { count: "exact", head: true })
      .gte("created_at", isoThirty);

    if (newUsersError) {
      console.error("dashboard-stats new users error:", newUsersError);
    }

    const previousPeriodCount = Math.max(0, (totalUsers ?? 0) - (newUsersLast30Days ?? 0));
    const registeredUsersChangePercent =
      previousPeriodCount > 0 && newUsersLast30Days != null
        ? Number((((newUsersLast30Days ?? 0) / previousPeriodCount) * 100).toFixed(1))
        : (totalUsers ?? 0) > 0
          ? 100
          : null;

    // 3) Active users (status = 'active') and % of total
    const { count: activeCount, error: activeError } = await supabase
      .from("user_details")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    if (activeError) {
      console.error("dashboard-stats active users error:", activeError);
    }

    const total = totalUsers ?? 0;
    const active = activeCount ?? 0;
    const activeUserPercent = total > 0 ? Number(((active / total) * 100).toFixed(1)) : null;

    // 4) Total transaction amount and % change vs last month (transactions table)
    let totalTransactionAmount = 0;
    let transactionAmountChangePercent: number | null = null;

    try {
      const { data: allTxRows, error: txError } = await supabase
        .from("transactions")
        .select("amount, created_at");

      if (!txError && allTxRows && Array.isArray(allTxRows)) {
        const numericAmount = (v: unknown): number => {
          if (typeof v === "number" && !Number.isNaN(v)) return v;
          if (typeof v === "string") return Number.parseFloat(v) || 0;
          return 0;
        };

        let thisMonthSum = 0;
        let lastMonthSum = 0;

        for (const row of allTxRows) {
          const amt = numericAmount(row?.amount ?? 0);
          const createdAt = row?.created_at ? new Date(row.created_at as string) : null;
          totalTransactionAmount += amt;
          if (createdAt) {
            if (createdAt >= startOfThisMonth) thisMonthSum += amt;
            else if (createdAt >= startOfLastMonth && createdAt <= endOfLastMonth) lastMonthSum += amt;
          }
        }

        transactionAmountChangePercent =
          lastMonthSum > 0
            ? Number((((thisMonthSum - lastMonthSum) / lastMonthSum) * 100).toFixed(1))
            : thisMonthSum > 0
              ? 100
              : null;
      }
    } catch (_) {
      // transactions table may not exist or have different schema
    }

    // 5) Chart data: monthly (last 12 months) and yearly (last 6 years) from transactions
    const chartMonthly: ChartDataPoint[] = [];
    const chartYearly: ChartDataPoint[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    try {
      const { data: allTxRows, error: txChartError } = await supabase
        .from("transactions")
        .select("amount, created_at");

      if (!txChartError && allTxRows && Array.isArray(allTxRows)) {
        const numericAmount = (v: unknown): number => {
          if (typeof v === "number" && !Number.isNaN(v)) return v;
          if (typeof v === "string") return Number.parseFloat(v) || 0;
          return 0;
        };

        const now = new Date();
        // Last 12 months (current month first, then backwards)
        const monthlySums: Record<string, number> = {};
        for (let i = 0; i < 12; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthlySums[key] = 0;
        }
        const yearlySums: Record<number, number> = {};
        for (let y = now.getFullYear() - 5; y <= now.getFullYear(); y++) {
          yearlySums[y] = 0;
        }

        for (const row of allTxRows) {
          const amt = numericAmount(row?.amount ?? 0);
          const createdAt = row?.created_at ? new Date(row.created_at as string) : null;
          if (!createdAt) continue;
          const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
          if (monthKey in monthlySums) monthlySums[monthKey] += amt;
          const year = createdAt.getFullYear();
          if (year in yearlySums) yearlySums[year] += amt;
        }

        // Build monthly array: oldest to newest (last 12 months)
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          chartMonthly.push({
            label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
            value: monthlySums[key] ?? 0,
          });
        }

        // Build yearly array: oldest to newest
        for (let y = now.getFullYear() - 5; y <= now.getFullYear(); y++) {
          chartYearly.push({ label: String(y), value: yearlySums[y] ?? 0 });
        }
      }
    } catch (_) {
      // fallback empty chart
    }

    const body: DashboardStats = {
      totalRegisteredUsers: total,
      registeredUsersChangePercent,
      totalTransactionAmount,
      transactionAmountChangePercent,
      activeUserCount: active,
      activeUserPercent,
      chartMonthly,
      chartYearly,
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error("dashboard-stats error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
