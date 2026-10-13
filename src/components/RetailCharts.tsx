import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import {
  JoinedSalesRecord,
  RegionSummary,
  CategorySummary,
  StoreSummary,
} from '../types/retail';

interface RetailChartsProps {
  records: JoinedSalesRecord[];
  regionSummaries: RegionSummary[];
  categorySummaries: CategorySummary[];
  storeSummaries: StoreSummary[];
}

function formatCompactCurrency(val: number): string {
  if (Math.abs(val) >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(val) >= 1_000) {
    return `$${(val / 1_000).toFixed(0)}K`;
  }
  return `$${val.toFixed(0)}`;
}

export const RetailCharts: React.FC<RetailChartsProps> = ({
  records,
  regionSummaries,
  categorySummaries,
  storeSummaries,
}) => {
  const weeklyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const regionalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const categoryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leaderboardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stockoutCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const chartInstances = useRef<{
    weekly?: Chart;
    regional?: Chart;
    category?: Chart;
    leaderboard?: Chart;
    stockout?: Chart;
  }>({});

  // 1. Weekly Sales Trend: Continuous line chart showing Net Sales vs Sales Target over time
  useEffect(() => {
    if (!weeklyCanvasRef.current) return;
    if (chartInstances.current.weekly) {
      chartInstances.current.weekly.destroy();
    }

    const weekMap = new Map<
      string,
      { netSales: number; salesTarget: number; grossSales: number }
    >();

    records.forEach((r) => {
      const existing = weekMap.get(r.week_start_date) || {
        netSales: 0,
        salesTarget: 0,
        grossSales: 0,
      };
      existing.netSales += r.net_sales;
      existing.salesTarget += r.sales_target;
      existing.grossSales += r.gross_sales;
      weekMap.set(r.week_start_date, existing);
    });

    const sortedWeeks = Array.from(weekMap.keys()).sort();
    const netSalesSeries = sortedWeeks.map(
      (w) => weekMap.get(w)?.netSales || 0
    );
    const targetSeries = sortedWeeks.map(
      (w) => weekMap.get(w)?.salesTarget || 0
    );

    chartInstances.current.weekly = new Chart(weeklyCanvasRef.current, {
      type: 'line',
      data: {
        labels: sortedWeeks,
        datasets: [
          {
            label: 'Net Sales ($)',
            data: netSalesSeries,
            borderColor: '#0f172a',
            backgroundColor: 'rgba(15, 23, 42, 0.08)',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#0f172a',
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Sales Target ($)',
            data: targetSeries,
            borderColor: '#0284c7',
            backgroundColor: 'transparent',
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 3.5,
            pointHoverRadius: 5,
            pointBackgroundColor: '#0284c7',
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              font: { family: "'Public Sans', sans-serif", size: 12 },
              color: '#334155',
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: "'JetBrains Mono', monospace", size: 12 },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
            padding: 10,
            callbacks: {
              label: (ctx) => {
                const val = Number(ctx.raw) || 0;
                return `${ctx.dataset.label}: $${val.toLocaleString()}`;
              },
              afterBody: (items) => {
                if (items.length >= 2) {
                  const net = Number(items[0].raw) || 0;
                  const target = Number(items[1].raw) || 0;
                  const pct = target > 0 ? ((net / target) * 100).toFixed(1) : '0.0';
                  return `Target Achievement: ${pct}%`;
                }
                return '';
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 11 },
              color: '#475569',
            },
          },
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(148, 163, 184, 0.18)' },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 11 },
              color: '#475569',
              callback: (value) => formatCompactCurrency(Number(value)),
            },
          },
        },
      },
    });

    return () => {
      chartInstances.current.weekly?.destroy();
    };
  }, [records]);

  // 2. Regional Revenue Splitting: Bar chart displaying Net Sales and Target Achievement % across regions
  useEffect(() => {
    if (!regionalCanvasRef.current) return;
    if (chartInstances.current.regional) {
      chartInstances.current.regional.destroy();
    }

    const labels = regionSummaries.map((r) => r.region);
    const netSalesData = regionSummaries.map((r) => r.netSales);
    const targetData = regionSummaries.map((r) => r.salesTarget);
    const achievementData = regionSummaries.map((r) =>
      Number(r.achievementPct.toFixed(1))
    );

    chartInstances.current.regional = new Chart(regionalCanvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Net Sales ($)',
            data: netSalesData,
            backgroundColor: '#0f172a',
            borderRadius: 4,
            yAxisID: 'y',
            order: 2,
          },
          {
            label: 'Sales Target ($)',
            data: targetData,
            backgroundColor: '#cbd5e1',
            borderRadius: 4,
            yAxisID: 'y',
            order: 3,
          },
          {
            label: 'Target Achievement (%)',
            data: achievementData,
            type: 'line',
            borderColor: '#0284c7',
            backgroundColor: '#0284c7',
            borderWidth: 2.5,
            pointRadius: 5,
            pointBackgroundColor: achievementData.map((pct) =>
              pct >= 100 ? '#16a34a' : '#dc2626'
            ),
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            yAxisID: 'y1',
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              font: { family: "'Public Sans', sans-serif", size: 12 },
              color: '#334155',
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
            padding: 10,
            callbacks: {
              label: (ctx) => {
                const val = Number(ctx.raw) || 0;
                if (ctx.dataset.yAxisID === 'y1') {
                  return `${ctx.dataset.label}: ${val.toFixed(1)}%`;
                }
                return `${ctx.dataset.label}: $${val.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: "'Public Sans', sans-serif", size: 12 },
              color: '#334155',
            },
          },
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(148, 163, 184, 0.18)' },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 11 },
              color: '#475569',
              callback: (v) => formatCompactCurrency(Number(v)),
            },
          },
          y1: {
            type: 'linear',
            position: 'right',
            min: 60,
            max: 130,
            grid: { drawOnChartArea: false },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 11 },
              color: '#0284c7',
              callback: (v) => `${v}%`,
            },
          },
        },
      },
    });

    return () => {
      chartInstances.current.regional?.destroy();
    };
  }, [regionSummaries]);

  // 3. Category Performance: Grouped bar chart comparing Gross Sales, Net Sales, and Return Rate by Category
  useEffect(() => {
    if (!categoryCanvasRef.current) return;
    if (chartInstances.current.category) {
      chartInstances.current.category.destroy();
    }

    const labels = categorySummaries.map((c) => c.category);
    const grossSeries = categorySummaries.map((c) => c.grossSales);
    const netSeries = categorySummaries.map((c) => c.netSales);
    const returnRateSeries = categorySummaries.map((c) =>
      Number(c.returnRatePct.toFixed(2))
    );

    chartInstances.current.category = new Chart(categoryCanvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Gross Sales ($)',
            data: grossSeries,
            backgroundColor: '#94a3b8',
            borderRadius: 4,
            yAxisID: 'y',
          },
          {
            label: 'Net Sales ($)',
            data: netSeries,
            backgroundColor: '#0f172a',
            borderRadius: 4,
            yAxisID: 'y',
          },
          {
            label: 'Return Rate (%)',
            data: returnRateSeries,
            backgroundColor: returnRateSeries.map((r) =>
              r > 8 ? '#dc2626' : '#d97706'
            ),
            borderRadius: 4,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              font: { family: "'Public Sans', sans-serif", size: 12 },
              color: '#334155',
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
            padding: 10,
            callbacks: {
              label: (ctx) => {
                const val = Number(ctx.raw) || 0;
                if (ctx.dataset.yAxisID === 'y1') {
                  const flag = val > 8 ? ' (HIGH > 8%)' : '';
                  return `${ctx.dataset.label}: ${val.toFixed(2)}%${flag}`;
                }
                return `${ctx.dataset.label}: $${val.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: "'Public Sans', sans-serif", size: 11 },
              color: '#334155',
            },
          },
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(148, 163, 184, 0.18)' },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 11 },
              color: '#475569',
              callback: (v) => formatCompactCurrency(Number(v)),
            },
          },
          y1: {
            type: 'linear',
            position: 'right',
            min: 0,
            suggestedMax: 16,
            grid: { drawOnChartArea: false },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 11 },
              color: '#dc2626',
              callback: (v) => `${v}%`,
            },
          },
        },
      },
    });

    return () => {
      chartInstances.current.category?.destroy();
    };
  }, [categorySummaries]);

  // 4. Store Leaderboard: Horizontal bar chart comparing Top 5 Performing Stores vs Bottom 5 Stores against Sales Targets
  useEffect(() => {
    if (!leaderboardCanvasRef.current) return;
    if (chartInstances.current.leaderboard) {
      chartInstances.current.leaderboard.destroy();
    }

    const sortedByAch = [...storeSummaries].sort(
      (a, b) => b.achievementPct - a.achievementPct
    );

    let leaderboardStores: StoreSummary[] = [];
    if (sortedByAch.length <= 10) {
      leaderboardStores = sortedByAch;
    } else {
      const top5 = sortedByAch.slice(0, 5);
      const bottom5 = sortedByAch.slice(-5);
      leaderboardStores = [...top5, ...bottom5];
    }

    const labels = leaderboardStores.map(
      (s, idx) =>
        `${idx < 5 ? 'TOP' : 'BTM'} · ${s.storeName} (${s.achievementPct.toFixed(1)}%)`
    );
    const netSalesVals = leaderboardStores.map((s) => s.netSales);
    const targetVals = leaderboardStores.map((s) => s.salesTarget);

    chartInstances.current.leaderboard = new Chart(
      leaderboardCanvasRef.current,
      {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Net Sales ($)',
              data: netSalesVals,
              backgroundColor: leaderboardStores.map((s) =>
                s.achievementPct >= 100 ? '#16a34a' : '#dc2626'
              ),
              borderRadius: 4,
              barPercentage: 0.75,
            },
            {
              label: 'Sales Target ($)',
              data: targetVals,
              backgroundColor: '#cbd5e1',
              borderRadius: 4,
              barPercentage: 0.75,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                boxWidth: 12,
                font: { family: "'Public Sans', sans-serif", size: 12 },
                color: '#334155',
              },
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleFont: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 12,
              },
              bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
              padding: 10,
              callbacks: {
                label: (ctx) => {
                  const val = Number(ctx.raw) || 0;
                  return `${ctx.dataset.label}: $${val.toLocaleString()}`;
                },
                afterBody: (items) => {
                  const idx = items[0]?.dataIndex;
                  if (idx !== undefined && leaderboardStores[idx]) {
                    const st = leaderboardStores[idx];
                    const sign = st.variance >= 0 ? '+' : '-';
                    return [
                      `Target Achievement: ${st.achievementPct.toFixed(1)}%`,
                      `Variance vs Target: ${sign}$${Math.abs(st.variance).toLocaleString()}`,
                    ];
                  }
                  return [];
                },
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(148, 163, 184, 0.18)' },
              ticks: {
                font: { family: "'JetBrains Mono', monospace", size: 11 },
                color: '#475569',
                callback: (v) => formatCompactCurrency(Number(v)),
              },
            },
            y: {
              grid: { display: false },
              ticks: {
                font: { family: "'JetBrains Mono', monospace", size: 11 },
                color: '#1e293b',
              },
            },
          },
        },
      }
    );

    return () => {
      chartInstances.current.leaderboard?.destroy();
    };
  }, [storeSummaries]);

  // 5. Stockout Risk: Doughnut chart showing stockout incidents across product categories
  useEffect(() => {
    if (!stockoutCanvasRef.current) return;
    if (chartInstances.current.stockout) {
      chartInstances.current.stockout.destroy();
    }

    const sortedCats = [...categorySummaries].sort(
      (a, b) => b.stockouts - a.stockouts
    );
    const labels = sortedCats.map((c) => c.category);
    const data = sortedCats.map((c) => c.stockouts);

    const palette = [
      '#0f172a',
      '#0284c7',
      '#d97706',
      '#dc2626',
      '#475569',
      '#94a3b8',
    ];

    chartInstances.current.stockout = new Chart(stockoutCanvasRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            label: 'Stockout Incidents',
            data,
            backgroundColor: palette.slice(0, labels.length),
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '64%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 14,
              font: { family: "'Public Sans', sans-serif", size: 12 },
              color: '#334155',
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
            padding: 10,
            callbacks: {
              label: (ctx) => {
                const idx = ctx.dataIndex;
                const cat = sortedCats[idx];
                const val = Number(ctx.raw) || 0;
                const share = cat ? cat.stockoutSharePct.toFixed(1) : '0.0';
                return ` ${val.toLocaleString()} incidents (${share}% share)`;
              },
            },
          },
        },
      },
    });

    return () => {
      chartInstances.current.stockout?.destroy();
    };
  }, [categorySummaries]);

  return (
    <div className="space-y-6">
      {/* Row 1: Weekly Sales Trend & Regional Revenue Splitting */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                01. Weekly Sales Trend
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Continuous trajectory of Net Sales ($) vs. Sales Target ($) across weekly periods
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Line · Chronological
            </span>
          </div>
          <div className="relative h-72 w-full">
            <canvas ref={weeklyCanvasRef} />
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                02. Regional Revenue Splitting
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Net Sales ($) and Target Achievement (%) across operating territories
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Dual-Axis Bar
            </span>
          </div>
          <div className="relative h-72 w-full">
            <canvas ref={regionalCanvasRef} />
          </div>
        </div>
      </div>

      {/* Row 2: Category Performance */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              03. Category Performance & Return Rate Exposure
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Grouped comparison of Gross Sales ($), Net Sales ($), and Return Rate (%) by Product Category (Crimson indicates Return Rate &gt; 8.0%)
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Grouped Bar · Dual Scale
          </span>
        </div>
        <div className="relative h-80 w-full">
          <canvas ref={categoryCanvasRef} />
        </div>
      </div>

      {/* Row 3: Store Leaderboard & Stockout Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                04. Store Leaderboard (Top 5 vs. Bottom 5)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Horizontal benchmark comparing Top 5 and Bottom 5 stores by Target Achievement %
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Green ≥ 100% · Crimson &lt; 100%
            </span>
          </div>
          <div className="relative h-80 w-full">
            <canvas ref={leaderboardCanvasRef} />
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                05. Stockout Risk by Category
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proportional distribution of stockout incidents across merchandise lines
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Doughnut · Share %
            </span>
          </div>
          <div className="relative h-80 w-full">
            <canvas ref={stockoutCanvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
