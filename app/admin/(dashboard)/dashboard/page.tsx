"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../AdminPageHeader";

type ChartDataPoint = { label: string; value: number };

type DashboardStats = {
  totalRegisteredUsers: number;
  registeredUsersChangePercent: number | null;
  totalTransactionAmount: number;
  transactionAmountChangePercent: number | null;
  activeUserCount: number;
  activeUserPercent: number | null;
  chartMonthly: ChartDataPoint[];
  chartYearly: ChartDataPoint[];
};

function formatCount(n: number): string {
  return n.toLocaleString();
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const registeredUsersIcon = (
  <svg width="49" height="49" viewBox="0 0 49 49" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24.5" cy="24.5" r="24.5" fill="white" />
    <path fillRule="evenodd" clipRule="evenodd" d="M13.8955 20.1206C13.8955 16.188 16.9924 13 20.8126 13C24.6329 13 27.7298 16.188 27.7298 20.1206C27.7298 24.0532 24.6329 27.2412 20.8126 27.2412C16.9924 27.2412 13.8955 24.0532 13.8955 20.1206Z" fill="#7C3AED" />
    <path d="M28.2948 24.1764C28.2249 24.3128 28.2545 24.4829 28.3749 24.5747C29.2689 25.2559 30.3752 25.6587 31.5728 25.6587C34.544 25.6587 36.9528 23.1792 36.9528 20.1205C36.9528 17.0618 34.544 14.5823 31.5728 14.5823C30.3752 14.5823 29.2689 14.9851 28.3749 15.6664C28.2545 15.7582 28.2249 15.9282 28.2948 16.0646C28.9156 17.2757 29.267 18.6559 29.267 20.1205C29.267 21.5851 28.9156 22.9653 28.2948 24.1764Z" fill="#7C3AED" />
    <path fillRule="evenodd" clipRule="evenodd" d="M13.344 29.93C15.2383 29.0836 17.7238 28.8235 20.8127 28.8235C23.9043 28.8235 26.3915 29.0841 28.2865 29.9324C30.3507 30.8563 31.6053 32.4301 32.2629 34.6522C32.5711 35.6937 31.8112 36.7352 30.7639 36.7352H10.8644C9.81587 36.7352 9.05431 35.6922 9.36346 34.6488C10.0219 32.4263 11.2784 30.853 13.344 29.93Z" fill="#7C3AED" />
    <path d="M28.9878 27.2988C28.3514 27.3394 28.314 28.2195 28.8988 28.4813C30.5011 29.1985 31.7076 30.2544 32.5729 31.6021C33.2829 32.708 34.3854 33.5706 35.6731 33.5706H38.4101C39.4972 33.5706 40.2904 32.4587 39.9079 31.3724C39.886 31.3099 39.8631 31.2478 39.8394 31.1863C39.3131 29.8182 38.4109 28.811 37.0751 28.1691C35.821 27.5663 34.2509 27.3176 32.4013 27.2424L32.3709 27.2412H32.3406C31.2511 27.2412 30.1131 27.2268 28.9878 27.2988Z" fill="#7C3AED" />
  </svg>
);

const transactionVolumeIcon = (
  <svg width="49" height="49" viewBox="0 0 49 49" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24.5" cy="24.5" r="24.5" fill="white" />
    <path d="M38.7344 27.1562L31.4687 34.4219C30.625 35.3008 29.3594 35.9219 28.0234 35.9219H22.5625C21.8711 35.9219 21.25 36.1914 20.793 36.6484L18.9766 38.3594H10.7031L18.6602 30.2969L18.6484 30.2852C19.4922 29.4414 20.6758 28.9141 21.9766 28.9023H29.8281C30.6602 28.9023 31.3281 29.5703 31.3281 30.4023C31.3281 31.2344 30.6602 31.9023 29.8281 31.9023H23.5C23.2305 31.8789 23.0078 32.1016 23.0078 32.3945C23.0078 32.6875 23.2305 32.8984 23.5117 32.8984H29.8047C30.4727 32.9219 31.1055 32.6406 31.5742 32.1719C32.043 31.7031 32.3008 31.0586 32.3008 30.4023C32.3242 30.0977 32.2422 29.7695 32.1367 29.4883L36.6016 25.0234C37.1992 24.4258 38.1367 24.4258 38.7227 25C39.332 25.5977 39.3203 26.5703 38.7344 27.1562ZM18.0859 19.6094C18.0859 15.25 21.5781 11.7109 25.9375 11.7109C30.2969 11.7109 33.8125 15.2266 33.8125 19.5859C33.8125 23.9453 30.2852 27.4609 25.9492 27.4609C21.6133 27.4609 18.0859 23.9453 18.0859 19.6094ZM26.9805 21.4258C26.9805 21.9648 26.5352 22.3633 25.6328 22.3633C24.7891 22.3633 24.0039 22.0703 23.5 21.8242L23.1016 23.418C23.5586 23.6758 24.5078 23.9219 25.4453 23.9219V25.1172H26.5352V23.8867C28.1289 23.5352 28.8789 22.5859 28.8789 21.3555C28.8789 20.125 28.1875 19.3633 26.6992 18.8242C25.6211 18.3789 25.1172 18.168 25.1172 17.6172C25.1172 17.2188 25.5508 16.8203 26.3477 16.8203C27.1445 16.8203 27.7305 17.0664 28.0937 17.2188L28.5391 15.6602C28.0586 15.4023 27.4023 15.2148 26.5 15.2148V13.9961H25.4102V15.2969C23.957 15.5898 23.1602 16.5273 23.1602 17.7344C23.1602 19.0352 24.0625 19.7617 25.5039 20.2656C26.5469 20.6641 26.9805 20.8867 26.9805 21.4258Z" fill="#2563EB" />
  </svg>
);

const activeWalletIcon = (
  <svg width="49" height="49" viewBox="0 0 49 49" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24.5" cy="24.5" r="24.5" fill="white" />
    <g clipPath="url(#clip0_125_1626)">
      <path d="M25.875 24.5625H38.5625C38.8044 24.5625 39 24.3669 39 24.125C39 16.8765 33.1235 11 25.875 11C25.6331 11 25.4375 11.1956 25.4375 11.4375V24.125C25.4375 24.3669 25.6331 24.5625 25.875 24.5625Z" fill="#16A34A" />
      <path d="M38.5625 25.4375H26.75C26.7307 25.4375 26.7141 25.4458 26.6953 25.448C26.6586 25.4528 26.6218 25.4563 26.5868 25.4699C26.5527 25.4834 26.5242 25.5066 26.4954 25.5281C26.4796 25.5399 26.4608 25.546 26.4464 25.5596C26.4455 25.5604 26.4451 25.5622 26.4442 25.5631C26.4066 25.5998 26.3777 25.644 26.3554 25.6921C26.3536 25.6961 26.3493 25.6991 26.3475 25.7031C26.3405 25.7197 26.3409 25.7398 26.3361 25.7577C26.3261 25.7945 26.3138 25.8317 26.3134 25.8697L26.3125 25.875C26.3125 25.8982 26.3221 25.9188 26.3261 25.9415C26.3313 25.9739 26.3331 26.0062 26.3453 26.0373C26.3606 26.0758 26.3856 26.1073 26.4105 26.1393C26.4197 26.1515 26.4241 26.1668 26.4354 26.1782L26.4398 26.1826C26.4398 26.1826 26.4407 26.1839 26.4416 26.1843L35.1557 35.1557C37.5313 32.7805 39 29.4993 39 25.875C39 25.6331 38.8044 25.4375 38.5625 25.4375Z" fill="#16A34A" />
      <path d="M24.8316 26.0023C24.5677 25.7385 24.5625 25.2647 24.5625 25.2647V13.1875C24.5625 12.9456 24.3669 12.75 24.125 12.75C16.8765 12.75 11 18.6265 11 25.875C11 33.1235 16.8765 39 24.125 39C27.7493 39 31.0305 37.5313 33.4057 35.1557C33.4057 35.1557 25.2607 26.4311 24.8316 26.0023Z" fill="#16A34A" />
    </g>
    <defs>
      <clipPath id="clip0_125_1626">
        <rect width="28" height="28" fill="white" transform="translate(11 11)" />
      </clipPath>
    </defs>
  </svg>
);

const fastNowIcon = (
  <svg width="49" height="49" viewBox="0 0 49 49" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24.5" cy="24.5" r="24.5" fill="white" />
    <path d="M30.6443 17.125C30.6443 20.5077 27.902 23.25 24.5193 23.25C21.1365 23.25 18.3943 20.5077 18.3943 17.125C18.3943 13.7422 21.1365 11 24.5193 11C27.902 11 30.6443 13.7422 30.6443 17.125Z" fill="#D97706" />
    <path opacity="0.4" d="M37.6443 17.125C37.6443 19.5412 35.6855 21.5 33.2693 21.5C30.8531 21.5 28.8943 19.5412 28.8943 17.125C28.8943 14.7088 30.8531 12.75 33.2693 12.75C35.6855 12.75 37.6443 14.7088 37.6443 17.125Z" fill="#D97706" />
    <path opacity="0.4" d="M11.3945 17.125C11.3945 19.5412 13.3533 21.5 15.7695 21.5C18.1858 21.5 20.1445 19.5412 20.1445 17.125C20.1445 14.7088 18.1858 12.75 15.7695 12.75C13.3533 12.75 11.3945 14.7088 11.3945 17.125Z" fill="#D97706" />
    <path d="M35.0195 32.875C35.0195 36.2577 30.3185 39 24.5195 39C18.7205 39 14.0195 36.2577 14.0195 32.875C14.0195 29.4922 18.7205 26.75 24.5195 26.75C30.3185 26.75 35.0195 29.4922 35.0195 32.875Z" fill="#D97706" />
    <path opacity="0.4" d="M42.0193 32.875C42.0193 35.2912 38.8852 37.25 35.0193 37.25C31.1534 37.25 28.0193 35.2912 28.0193 32.875C28.0193 30.4588 31.1534 28.5 35.0193 28.5C38.8852 28.5 42.0193 30.4588 42.0193 32.875Z" fill="#D97706" />
    <path opacity="0.4" d="M7.01929 32.875C7.01929 35.2912 10.1533 37.25 14.0193 37.25C17.8853 37.25 21.0193 35.2912 21.0193 32.875C21.0193 30.4588 17.8853 28.5 14.0193 28.5C10.1533 28.5 7.01929 30.4588 7.01929 32.875Z" fill="#D97706" />
  </svg>
);

function formatChartAmount(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

/** Round max up to a "nice" axis cap (1, 2, 5, 10, 20, 50, 100k, …) for clean Y-axis labels */
function niceAxisMax(max: number): number {
  if (max <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / exp;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * exp;
}

/** Exactly 4–5 distinct Y-axis tick values from 0 to niceMax, no duplicate labels */
function getYAxisTicks(niceMax: number): number[] {
  const seen = new Set<number>();
  const ticks: number[] = [];
  for (let i = 0; i <= 4; i++) {
    const v = i === 4 ? niceMax : Math.round((i / 4) * niceMax);
    if (!seen.has(v)) {
      seen.add(v);
      ticks.push(v);
    }
  }
  if (ticks[ticks.length - 1] !== niceMax) ticks.push(niceMax);
  return ticks.sort((a, b) => a - b);
}

type RecentTransactionRow = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  sender_name: string | null;
};

const fallbackRecentTransactions: RecentTransactionRow[] = [
  { id: "TXN-2024-001882", sender_name: "Sarah Johansen", amount: 2450, status: "Completed", created_at: "2026-02-10T14:22:11Z" },
  { id: "TXN-2024-001881", sender_name: "Michael Chen", amount: 1200, status: "Pending", created_at: "2026-02-10T13:45:00Z" },
  { id: "TXN-2024-001880", sender_name: "Emma Wilson", amount: 3780.5, status: "Completed", created_at: "2026-02-10T12:18:33Z" },
  { id: "TXN-2024-001879", sender_name: "James Brown", amount: 890, status: "Failed", created_at: "2026-02-10T11:02:44Z" },
  { id: "TXN-2024-001878", sender_name: "Olivia Davis", amount: 5120, status: "Completed", created_at: "2026-02-10T10:55:22Z" },
];

const transactionHeaders = ["TRANSACTION ID", "USER", "AMOUNT",  "STATUS", "TIMESTAMP"]

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "completed"
      ? "bg-[#DCFCE7] text-[#008236]"
      : status === "Pending"
        ? "bg-[#FEF9C2] text-[#A65F00]"
        : "bg-[#FFE2E2] text-[#C10007]";
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles}`}>
      {status}
    </span>
  );
}

export default function AdminDashboardPage() {
  const [chartMode, setChartMode] = useState<"yearly" | "monthly">("yearly");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [recentTx, setRecentTx] = useState<RecentTransactionRow[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const [statsRes, recentRes] = await Promise.all([
          fetch("/api/admin/dashboard-stats"),
          fetch("/api/admin/recent-transactions"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (!cancelled) setStats(statsData);
        }

        if (recentRes.ok) {
          const recentData = await recentRes.json();
          if (!cancelled) {
            const mapped: RecentTransactionRow[] = (recentData as any[]).map((row) => ({
              id: String(row.id),
              amount: typeof row.amount === "number" ? row.amount : Number(row.amount ?? 0),
              status: String(row.status ?? ""),
              created_at: String(row.created_at ?? ""),
              sender_name: row.sender_name ?? null,
            }));
            setRecentTx(mapped);
          }
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const overviewCards = stats
    ? [
        {
          title: "Registered Users",
          value: formatCount(stats.totalRegisteredUsers),
          sub:
            stats.registeredUsersChangePercent != null
              ? `+${stats.registeredUsersChangePercent}% vs last 30 days`
              : "vs last 30 days",
          bg: "bg-[#F3E8FF]",
          icon: registeredUsersIcon,
        },
        {
          title: "Transaction Volume",
          value: formatCurrency(stats.totalTransactionAmount),
          sub:
            stats.transactionAmountChangePercent != null
              ? `${stats.transactionAmountChangePercent >= 0 ? "+" : ""}${stats.transactionAmountChangePercent}% this month`
              : "this month",
          bg: "bg-[#E0F2FE]",
          icon: transactionVolumeIcon,
        },
        {
          title: "Active Users",
          value: formatCount(stats.activeUserCount),
          sub:
            stats.activeUserPercent != null
              ? `${stats.activeUserPercent}% of total registered`
              : "of total registered",
          bg: "bg-[#DCFCEA]",
          icon: activeWalletIcon,
        },
        // {
        //   title: "FastNow Transaction",
        //   value: "6,241",
        //   sub: "28% of total transactions",
        //   bg: "bg-[#FEF3C7]",
        //   icon: fastNowIcon,
        // },
      ]
    : [
        { title: "Registered Users", value: "—", sub: "Loading…", bg: "bg-[#F3E8FF]", icon: registeredUsersIcon },
        { title: "Transaction Volume", value: "—", sub: "Loading…", bg: "bg-[#E0F2FE]", icon: transactionVolumeIcon },
        { title: "Active Users", value: "—", sub: "Loading…", bg: "bg-[#DCFCEA]", icon: activeWalletIcon },
        // { title: "FastNow Transaction", value: "6,241", sub: "28% of total transactions", bg: "bg-[#FEF3C7]", icon: fastNowIcon },
      ];

  const chartData: ChartDataPoint[] =
    chartMode === "yearly"
      ? (stats?.chartYearly ?? [])
      : (stats?.chartMonthly ?? []);
  const dataMax = Math.max(1, ...chartData.map((d) => d.value));
  const chartMax = niceAxisMax(dataMax);
  const yAxisTicks = getYAxisTicks(chartMax);
  const maxBarIndex = chartData.length
    ? chartData.reduce((i, d, idx) => (d.value > chartData[i].value ? idx : i), 0)
    : -1;

  return (
    <div className="px-4 py-4 pb-12 sm:px-8 sm:py-8">
      <AdminPageHeader title="Dashboard" />

      {/* Overview */}
      <section className="mb-10 max-w-[1040px]">
        <h2 className="text-lg font-bold text-[#030200] mb-1">Overview</h2>
        <p className="text-sm text-[#6F7B8F] mb-6">
          Real-time platform metrics, transaction insights, and operational controls.
        </p>
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          {overviewCards.map((card) => (
            <div
              key={card.title}
              className={`${card.bg} w-full rounded-xl border border-[#e4e4e7] shadow-sm overflow-hidden`}
            >
              <div className={`px-4 py-2 flex items-center justify-between`}>
                <span className="text-black text-[13px] font-medium">{card.title}</span>
                {card.icon}
              </div>
              <div className="p-4">
                <p className="text-xl font-bold text-[#030200]">{card.value}</p>
                <p className="text-xs text-[#6F7B8F] mt-1">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Transaction Volume Chart */}
      <section className="mb-10">
        <div className="bg-white rounded-xl border border-[#e4e4e7] shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#030200]">Transaction Volume Over Time</h2>
              <p className="text-sm text-[#6F7B8F]">
                {chartMode === "yearly" ? "Yearly" : "Monthly"} transaction volume in USD
              </p>
            </div>
            <div className="flex rounded-lg border border-[#e4e4e7] overflow-hidden">
              <button
                onClick={() => setChartMode("yearly")}
                className={`cursor-pointer px-4 py-2 w-full text-sm font-medium ${chartMode === "yearly"
                  ? "bg-[#169D25] text-white"
                  : "bg-white text-[#6F7B8F]"
                  }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setChartMode("monthly")}
                className={`cursor-pointer px-4 py-2 text-sm font-medium ${chartMode === "monthly"
                  ? "bg-[#169D25] text-white"
                  : "bg-white text-[#6F7B8F]"
                  }`}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="flex gap-4 overflow-visible">
            <div className="flex flex-col justify-between text-xs text-[#6F7B8F] h-[200px] py-0.5 shrink-0 w-12">
              {[...yAxisTicks].reverse().map((yVal, idx) => (
                <span key={`y-${idx}-${yVal}`}>{formatChartAmount(yVal)}</span>
              ))}
            </div>
            <div className="flex-1 min-w-0 relative overflow-visible">
              <div className="absolute inset-0 pointer-events-none" style={{ height: "200px" }}>
                {yAxisTicks.map((yVal, idx) => (
                  <div
                    key={`grid-${idx}-${yVal}`}
                    className="absolute left-0 right-0 border-t border-dashed border-[#e4e4e7]"
                    style={{ bottom: `${(yVal / chartMax) * 100}%` }}
                  />
                ))}
              </div>
              <div className="flex items-end justify-around gap-2 sm:gap-4 h-[200px] relative">
                {chartData.map((d, i) => {
                  const isHighlight = i === maxBarIndex && d.value > 0;
                  const barHeightPx = chartMax > 0 ? (d.value / chartMax) * 200 : 0;
                  return (
                    <div
                      key={`${d.label}-${i}`}
                      className="flex flex-col items-center justify-end flex-1 min-w-0 max-w-[48px] relative cursor-pointer h-full min-h-[200px]"
                      onMouseEnter={() => setHoverIndex(i)}
                      onMouseLeave={() => setHoverIndex(null)}
                    >
                      <div className="absolute inset-0" aria-hidden />
                      <div
                        className="w-[40px] mx-auto min-h-[4px] transition-colors absolute bottom-0 left-1/2 -translate-x-1/2"
                        style={{
                          height: `${barHeightPx}px`,
                          background: isHighlight
                            ? "linear-gradient(180deg, #00DE1C, #169D25)"
                            : "#E9FBE8",
                            borderTopRightRadius: "8px",
                            borderTopLeftRadius: "8px"
                        }}
                      />
                      {(hoverIndex === i || (hoverIndex === null && isHighlight && d.value > 0)) && (
                        <div
                          style={{ bottom: `${barHeightPx + 12}px` }}
                          className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
                        >
                          <div className="bg-[#030200] text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                            {formatChartAmount(d.value)}
                          </div>
                        <div
                          className="w-3 h-3 mt-[-12px] border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent bg-black border-b-[#030200]"
                          aria-hidden
                        />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1 mt-2">
                {chartData.map((d, i) => (
                  <div key={`${d.label}-${i}`} className="flex-1 text-center min-w-0 overflow-hidden">
                    <span className="text-xs text-[#6F7B8F] truncate block" title={d.label}>
                      {chartMode === "yearly" ? d.label : d.label.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fraud Reduction & Settlement */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10"> */}
        {/* Fraud Reduction card */}
        {/* <div className="bg-white rounded-xl border border-[#E2F1E2] shadow-[0_23px_50px_rgba(25,33,61,0.03)] overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 14C0 6.26801 6.26801 0 14 0H34C41.732 0 48 6.26801 48 14V34C48 41.732 41.732 48 34 48H14C6.26801 48 0 41.732 0 34V14Z" fill="#16A34A" />
                <g clipPath="url(#clip0_125_1704)">
                  <path d="M32.9038 14.207L24.2956 12.013C24.2005 11.9957 24.103 11.9957 24.0079 12.013C23.9284 12.001 23.8476 12.001 23.7681 12.013L15.112 14.207C14.5631 14.344 14.0804 14.6706 13.7491 15.1292C13.4178 15.5877 13.2593 16.1486 13.3016 16.7127L13.8052 23.3187C14.0068 25.9392 14.9225 28.4544 16.4527 30.5912C17.983 32.728 20.0693 34.4049 22.4853 35.4397L23.5403 35.8952C23.6733 35.9506 23.8159 35.9792 23.9599 35.9792C24.104 35.9792 24.2466 35.9506 24.3796 35.8952L25.4346 35.4397C27.8506 34.4049 29.9369 32.728 31.4671 30.5912C32.9974 28.4544 33.913 25.9392 34.1147 23.3187L34.6182 16.7127C34.6655 16.1614 34.5206 15.6106 34.2081 15.1539C33.8956 14.6972 33.4348 14.3627 32.9038 14.207ZM28.4558 21.2566L23.6602 26.0522C23.5488 26.1646 23.4162 26.2538 23.2701 26.3146C23.124 26.3755 22.9673 26.4068 22.809 26.4068C22.6507 26.4068 22.494 26.3755 22.3479 26.3146C22.2018 26.2538 22.0692 26.1646 21.9578 26.0522L19.5599 23.6544C19.3342 23.4286 19.2074 23.1224 19.2074 22.8032C19.2074 22.4839 19.3342 22.1777 19.5599 21.9519C19.7857 21.7262 20.0919 21.5993 20.4112 21.5993C20.7304 21.5993 21.0366 21.7262 21.2624 21.9519L22.809 23.5105L26.7534 19.5541C26.9791 19.3284 27.2853 19.2015 27.6046 19.2015C27.9239 19.2015 28.2301 19.3284 28.4558 19.5541C28.6816 19.7799 28.8084 20.0861 28.8084 20.4053C28.8084 20.7246 28.6816 21.0308 28.4558 21.2566Z" fill="white" />
                </g>
                <defs>
                  <clipPath id="clip0_125_1704">
                    <rect width="24" height="24" fill="white" transform="translate(12 12)" />
                  </clipPath>
                </defs>
              </svg>
              <div>
                <p className="text-sm font-semibold text-[#030200]">Fraud Reduction</p>
                <p className="text-xs text-[#6F7B8F]">Real-time monitoring</p>
              </div>
            </div>
            <div className="flex gap-1 px-2.5 py-1 rounded-full text-xs bg-[#F0FDF4] text-[#008236] border border-[#B9F8CF] ml-auto shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_125_1714)">
                  <path d="M12.7172 5.83345C12.9836 7.14087 12.7937 8.50011 12.1793 9.6845C11.5648 10.8689 10.5629 11.8068 9.34057 12.3419C8.11826 12.877 6.74947 12.9768 5.46244 12.6248C4.17542 12.2728 3.04796 11.4903 2.2681 10.4076C1.48823 9.32496 1.10309 8.00767 1.17691 6.67542C1.25072 5.34318 1.77903 4.0765 2.67373 3.08663C3.56843 2.09676 4.77544 1.44353 6.09347 1.23588C7.41151 1.02823 8.76089 1.2787 9.9166 1.94553" stroke="#008236" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M5.25 6.41659L7 8.16659L12.8333 2.33325" stroke="#008236" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round" />
                </g>
                <defs>
                  <clipPath id="clip0_125_1714">
                    <rect width="14" height="14" fill="white" />
                  </clipPath>
                </defs>
              </svg>

              <span>Active</span>
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="bg-[#F0FDF4] rounded-xl px-4 py-4 mb-4">
              <div className="flex mb-1 flex-row items-center gap-2 w-[450px] h-5 flex-none self-stretch">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.3333 14.1666L11.25 7.08325L7.08329 11.2499L1.66663 5.83325" stroke="#00A63E" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M13.3334 14.1667H18.3334V9.16675" stroke="#00A63E" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <p className="text-xs text-[#364153] mb-1">  Fraud Reduction</p>
              </div>
              <p className="text-2xl font-bold text-[#16A34A] mb-1">18.4%</p>
              <p className="text-xs text-[#6F7B8F]">Compared to last quarter</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-2">
              <div className="p-5 bg-[#F0F7F080]">
                <p className="text-[#6F7B8F] text-xs mb-1">Detection Rate</p>
                <p className="text-[#030200] font-semibold">99.7%</p>
              </div>
              <div className="p-5 bg-[#F0F7F080]">
                <p className="text-[#6F7B8F] text-xs mb-1">Blocked Today</p>
                <p className="text-[#030200] font-semibold">247</p>
              </div>
            </div>
            <p className="text-xs text-[#6F7B8F]">
              System monitoring all transactions with minimal false positives.
            </p>
          </div>
        </div> */}

        {/* Settlement Status card */}
        {/* <div className="bg-white rounded-xl border border-[#E2F1E2] shadow-[0_23px_50px_rgba(25,33,61,0.03)] overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 14C0 6.26801 6.26801 0 14 0H34C41.732 0 48 6.26801 48 14V34C48 41.732 41.732 48 34 48H14C6.26801 48 0 41.732 0 34V14Z" fill="#2B7FFF" />
                  <path d="M24 22H31L20 34L23 25H17L25 14L24 22Z" fill="white" />
                </svg>

              </div>
              <div>
                <p className="text-sm font-semibold text-[#030200]">Settlement Status</p>
                <p className="text-xs text-[#6F7B8F]">Instant processing</p>
              </div>
            </div> */}
            {/* <div className="flex gap-1 px-2.5 py-1 rounded-full text-xs bg-[#ECFEFF] text-[#059669] border border-[#BAF6D4] ml-auto shrink-0"> */}
            {/* <svg width="58" height="26" viewBox="0 0 58 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="path-1-inside-1_125_1755" fill="white">
                <path d="M0 10C0 4.47715 4.47715 0 10 0H47.4531C52.976 0 57.4531 4.47715 57.4531 10V16C57.4531 21.5228 52.976 26 47.4531 26H10C4.47715 26 0 21.5228 0 16V10Z" />
              </mask>
              <path d="M0 10C0 4.47715 4.47715 0 10 0H47.4531C52.976 0 57.4531 4.47715 57.4531 10V16C57.4531 21.5228 52.976 26 47.4531 26H10C4.47715 26 0 21.5228 0 16V10Z" fill="#F0FDF4" />
              <path d="M10 0V1H47.4531V0V-1H10V0ZM57.4531 10H56.4531V16H57.4531H58.4531V10H57.4531ZM47.4531 26V25H10V26V27H47.4531V26ZM0 16H1V10H0H-1V16H0ZM10 26V25C5.02944 25 1 20.9706 1 16H0H-1C-1 22.0751 3.92487 27 10 27V26ZM57.4531 16H56.4531C56.4531 20.9706 52.4237 25 47.4531 25V26V27C53.5283 27 58.4531 22.0751 58.4531 16H57.4531ZM47.4531 0V1C52.4237 1 56.4531 5.02944 56.4531 10H57.4531H58.4531C58.4531 3.92487 53.5283 -1 47.4531 -1V0ZM10 0V-1C3.92487 -1 -1 3.92487 -1 10H0H1C1 5.02944 5.02944 1 10 1V0Z" fill="#B9F8CF" mask="url(#path-1-inside-1_125_1755)" />
              <g opacity="0.818228">
                <path d="M11 13C11 11.3431 12.3431 10 14 10C15.6569 10 17 11.3431 17 13C17 14.6569 15.6569 16 14 16C12.3431 16 11 14.6569 11 13Z" fill="#16A34A" />
              </g>
              <path d="M23.9588 17V8.27273H25.2756V15.8665H29.2301V17H23.9588ZM30.63 17V10.4545H31.9041V17H30.63ZM31.2734 9.4446C31.0518 9.4446 30.8615 9.37074 30.7024 9.22301C30.5462 9.07244 30.468 8.89347 30.468 8.68608C30.468 8.47585 30.5462 8.29687 30.7024 8.14915C30.8615 7.99858 31.0518 7.9233 31.2734 7.9233C31.495 7.9233 31.6839 7.99858 31.8402 8.14915C31.9993 8.29687 32.0788 8.47585 32.0788 8.68608C32.0788 8.89347 31.9993 9.07244 31.8402 9.22301C31.6839 9.37074 31.495 9.4446 31.2734 9.4446ZM39.2177 10.4545L36.8441 17H35.4805L33.1026 10.4545H34.4705L36.1282 15.4915H36.1964L37.8498 10.4545H39.2177ZM43.0135 17.1321C42.3686 17.1321 41.8132 16.9943 41.3473 16.7188C40.8842 16.4403 40.5263 16.0497 40.2734 15.5469C40.0234 15.0412 39.8984 14.4489 39.8984 13.7699C39.8984 13.0994 40.0234 12.5085 40.2734 11.9972C40.5263 11.4858 40.8786 11.0866 41.3303 10.7997C41.7848 10.5128 42.3161 10.3693 42.924 10.3693C43.2933 10.3693 43.6513 10.4304 43.9979 10.5526C44.3445 10.6747 44.6555 10.8665 44.9311 11.1278C45.2067 11.3892 45.424 11.7287 45.5831 12.1463C45.7422 12.5611 45.8217 13.0653 45.8217 13.6591V14.1108H40.6186V13.1562H44.5732C44.5732 12.821 44.505 12.5241 44.3686 12.2656C44.2322 12.0043 44.0405 11.7983 43.7933 11.6477C43.549 11.4972 43.2621 11.4219 42.9325 11.4219C42.5746 11.4219 42.2621 11.5099 41.995 11.6861C41.7308 11.8594 41.5263 12.0866 41.3814 12.3679C41.2393 12.6463 41.1683 12.9489 41.1683 13.2756V14.0213C41.1683 14.4588 41.245 14.831 41.3984 15.1378C41.5547 15.4446 41.772 15.679 42.0504 15.8409C42.3288 16 42.6541 16.0795 43.0263 16.0795C43.2678 16.0795 43.4879 16.0455 43.6868 15.9773C43.8857 15.9062 44.0575 15.8011 44.2024 15.6619C44.3473 15.5227 44.4581 15.3509 44.5348 15.1463L45.7408 15.3636C45.6442 15.7187 45.4709 16.0298 45.2209 16.2969C44.9737 16.5611 44.6626 16.767 44.2876 16.9148C43.9155 17.0597 43.4908 17.1321 43.0135 17.1321Z" fill="#008236" />
            </svg> */}

            {/* </div> */}
          {/* </div>
          <div className="px-5 pb-5">
            <div className="bg-[#EEF4FF] rounded-xl px-4 py-4 mb-4">
              <div className="flex gap-2 mb-1">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clip-path="url(#clip0_125_1761)">
                    <path d="M10.0001 18.3334C14.6025 18.3334 18.3334 14.6025 18.3334 10.0001C18.3334 5.39771 14.6025 1.66675 10.0001 1.66675C5.39771 1.66675 1.66675 5.39771 1.66675 10.0001C1.66675 14.6025 5.39771 18.3334 10.0001 18.3334Z" stroke="#155DFC" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M10 5V10L13.3333 11.6667" stroke="#155DFC" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                  <defs>
                    <clipPath id="clip0_125_1761">
                      <rect width="20" height="20" fill="white" />
                    </clipPath>
                  </defs>
                </svg>

                <p className="text-xs text-[#6F7B8F] mb-1">Avg. Settlement Time</p>
              </div>
              <p className="text-2xl font-bold text-[#2563EB] mb-1">2.3s</p>
              <p className="text-xs text-[#6F7B8F]">Across all payment rails</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-2">
              <div className="p-5 bg-[#F0F7F080]">
                <p className="text-[#6F7B8F] text-xs mb-1">Success Rate</p>
                <p className="text-[#030200] font-semibold">99.9%</p>
              </div>
              <div className="p-5 bg-[#F0F7F080]">
                <p className="text-[#6F7B8F] text-xs mb-1">Today</p>
                <p className="text-[#030200] font-semibold">34.8k</p>
              </div>
            </div>
            <p className="text-xs text-[#6F7B8F]">
              All settlement rails operational with real-time processing capabilities.
            </p>
          </div>
        </div>
      </div> */}

      {/* Recent Transactions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#030200]">Recent Transactions</h2>
          <button
            type="button"
            className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1 text-sm text-[#030200] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                onClick={() => router.push("/admin/transactions")}
          >
            <span>View All</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="bg-[#F6FBF5] rounded-xl border border-[#E2F1E2] shadow-[0_23px_50px_rgba(25,33,61,0.03)] overflow-hidden">
          
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F0F7F080]">
                <tr className="border-b border-[#E2F1E2]">

                  {
                    transactionHeaders ? transactionHeaders.map((heading, i) => (

                      <th className="py-3 px-6 text-left text-[11px] text-[#030200] font-normal">
                          {heading}
                      </th>

                    )) : null
                  }
                
                </tr>
              </thead>
              <tbody>
                {(recentTx ?? fallbackRecentTransactions).map((row) => (
                  <tr key={row.id} className="border-b border-[#e4e4e7] last:border-0">
                    <td className="py-3 px-4 text-[#030200]">{row.id}</td>
                    <td className="py-3 px-4 text-[#030200]">
                      {row.sender_name ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#030200]">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-3 px-4 text-[#6F7B8F]">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
