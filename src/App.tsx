import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  RotateCcw,
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Search,
  Database,
} from 'lucide-react';
import {
  StoreMasterRecord,
  WeeklySalesRecord,
  JoinedSalesRecord,
  FilterState,
  KpiMetrics,
  RegionSummary,
  StoreSummary,
  CategorySummary,
  ExecutiveInsights,
} from './types/retail';
import {
  DEMO_STORES,
  generateDemoWeeklySales,
  joinSalesAndStores,
  parseWeeklySalesExcel,
  parseStoreMasterExcel,
  downloadSampleExcelFile,
} from './data/demoData';
import { MultiSelectDropdown } from './components/MultiSelectDropdown';
import { RetailCharts } from './components/RetailCharts';

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
}

function formatCurrencyPrecise(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function App() {
  const initialSales = useMemo(() => generateDemoWeeklySales(), []);
  const [salesRecords, setSalesRecords] =
    useState<WeeklySalesRecord[]>(initialSales);
  const [storeRecords, setStoreRecords] =
    useState<StoreMasterRecord[]>(DEMO_STORES);

  const [salesFileName, setSalesFileName] = useState<string>(
    'retail_weekly_sales.xlsx (Demo Pre-loaded)'
  );
  const [storeFileName, setStoreFileName] = useState<string>(
    'store_master.xlsx (Demo Pre-loaded)'
  );
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>({
    type: 'info',
    message:
      'Pre-loaded sample retail dataset active (576 weekly store-category records across 12 stores and 8 weeks). Upload custom Excel files or filter below.',
  });

  const salesFileInputRef = useRef<HTMLInputElement | null>(null);
  const storeFileInputRef = useRef<HTMLInputElement | null>(null);

  // Join sales & store master records
  const joinedData: JoinedSalesRecord[] = useMemo(
    () => joinSalesAndStores(salesRecords, storeRecords),
    [salesRecords, storeRecords]
  );

  // Extract distinct filter option lists
  const availableOptions = useMemo(() => {
    const weeks = Array.from(
      new Set(joinedData.map((r) => r.week_start_date))
    ).sort();
    const regions = Array.from(new Set(joinedData.map((r) => r.region))).sort();
    const stores = Array.from(
      new Set(joinedData.map((r) => r.store_name))
    ).sort();
    const cities = Array.from(new Set(joinedData.map((r) => r.city))).sort();
    const formats = Array.from(
      new Set(joinedData.map((r) => r.store_format))
    ).sort();
    const categories = Array.from(
      new Set(joinedData.map((r) => r.product_category))
    ).sort();

    return {
      weeks,
      regions,
      stores,
      cities,
      formats,
      categories,
    };
  }, [joinedData]);

  // Multi-select filter state initialized to all available options
  const [filters, setFilters] = useState<FilterState>(() => ({
    weekStartDates: availableOptions.weeks,
    regions: availableOptions.regions,
    storeNames: availableOptions.stores,
    cities: availableOptions.cities,
    storeFormats: availableOptions.formats,
    productCategories: availableOptions.categories,
  }));

  // Sync filters when new files are uploaded or demo dataset is reloaded
  const syncFiltersToDataset = (newJoined: JoinedSalesRecord[]) => {
    const weeks = Array.from(
      new Set(newJoined.map((r) => r.week_start_date))
    ).sort();
    const regions = Array.from(new Set(newJoined.map((r) => r.region))).sort();
    const stores = Array.from(
      new Set(newJoined.map((r) => r.store_name))
    ).sort();
    const cities = Array.from(new Set(newJoined.map((r) => r.city))).sort();
    const formats = Array.from(
      new Set(newJoined.map((r) => r.store_format))
    ).sort();
    const categories = Array.from(
      new Set(newJoined.map((r) => r.product_category))
    ).sort();

    setFilters({
      weekStartDates: weeks,
      regions,
      storeNames: stores,
      cities,
      storeFormats: formats,
      productCategories: categories,
    });
  };

  // Load Demo Dataset handler
  const handleLoadDemoDataset = () => {
    const demoSales = generateDemoWeeklySales();
    const demoStores = DEMO_STORES;
    setSalesRecords(demoSales);
    setStoreRecords(demoStores);
    setSalesFileName('retail_weekly_sales.xlsx (Demo Pre-loaded)');
    setStoreFileName('store_master.xlsx (Demo Pre-loaded)');
    const nextJoined = joinSalesAndStores(demoSales, demoStores);
    syncFiltersToDataset(nextJoined);
    if (salesFileInputRef.current) salesFileInputRef.current.value = '';
    if (storeFileInputRef.current) storeFileInputRef.current.value = '';
    setUploadStatus({
      type: 'success',
      message:
        'Demo dataset loaded: 576 weekly transaction records joined with 12 store master records.',
    });
  };

  // Handle 'retail_weekly_sales.xlsx' upload
  const handleSalesFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsedSales = await parseWeeklySalesExcel(file);
      setSalesRecords(parsedSales);
      setSalesFileName(file.name);
      const nextJoined = joinSalesAndStores(parsedSales, storeRecords);
      syncFiltersToDataset(nextJoined);
      setUploadStatus({
        type: 'success',
        message: `Parsed '${file.name}' (${parsedSales.length.toLocaleString()} sales rows) and joined with store metadata.`,
      });
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to parse retail_weekly_sales.xlsx file.',
      });
    }
  };

  // Handle 'store_master.xlsx' upload
  const handleStoreFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsedStores = await parseStoreMasterExcel(file);
      setStoreRecords(parsedStores);
      setStoreFileName(file.name);
      const nextJoined = joinSalesAndStores(salesRecords, parsedStores);
      syncFiltersToDataset(nextJoined);
      setUploadStatus({
        type: 'success',
        message: `Parsed '${file.name}' (${parsedStores.length.toLocaleString()} store master rows) and updated store dimensions.`,
      });
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to parse store_master.xlsx file.',
      });
    }
  };

  // Filtered dataset based on all 6 multi-select filters
  const filteredRecords = useMemo(() => {
    const weekSet = new Set(filters.weekStartDates);
    const regionSet = new Set(filters.regions);
    const storeSet = new Set(filters.storeNames);
    const citySet = new Set(filters.cities);
    const formatSet = new Set(filters.storeFormats);
    const categorySet = new Set(filters.productCategories);

    return joinedData.filter(
      (r) =>
        weekSet.has(r.week_start_date) &&
        regionSet.has(r.region) &&
        storeSet.has(r.store_name) &&
        citySet.has(r.city) &&
        formatSet.has(r.store_format) &&
        categorySet.has(r.product_category)
    );
  }, [joinedData, filters]);

  // 2. TOP KPI SCORECARDS Calculation
  const kpiMetrics: KpiMetrics = useMemo(() => {
    let grossSales = 0;
    let discountAmount = 0;
    let returnsAmount = 0;
    let netSales = 0;
    let salesTarget = 0;
    let totalTransactions = 0;
    let totalStockoutIncidents = 0;

    filteredRecords.forEach((r) => {
      const rowNet = r.gross_sales - r.discount_amount - r.returns_amount;
      grossSales += r.gross_sales;
      discountAmount += r.discount_amount;
      returnsAmount += r.returns_amount;
      netSales += rowNet;
      salesTarget += r.sales_target;
      totalTransactions += r.transactions;
      totalStockoutIncidents += r.stockout_incidents;
    });

    const targetAchievementPct =
      salesTarget > 0 ? (netSales / salesTarget) * 100 : 0;
    const averageTransactionValue =
      totalTransactions > 0 ? netSales / totalTransactions : 0;
    const returnRatePct = netSales > 0 ? (returnsAmount / netSales) * 100 : 0;
    const discountRatePct =
      grossSales > 0 ? (discountAmount / grossSales) * 100 : 0;

    return {
      grossSales,
      discountAmount,
      returnsAmount,
      netSales,
      salesTarget,
      targetAchievementPct,
      totalTransactions,
      averageTransactionValue,
      returnRatePct,
      discountRatePct,
      totalStockoutIncidents,
      recordCount: filteredRecords.length,
    };
  }, [filteredRecords]);

  // Regional Aggregation
  const regionSummaries: RegionSummary[] = useMemo(() => {
    const map = new Map<
      string,
      {
        netSales: number;
        salesTarget: number;
        grossSales: number;
        transactions: number;
        stockouts: number;
      }
    >();

    filteredRecords.forEach((r) => {
      const cur = map.get(r.region) || {
        netSales: 0,
        salesTarget: 0,
        grossSales: 0,
        transactions: 0,
        stockouts: 0,
      };
      cur.netSales += r.net_sales;
      cur.salesTarget += r.sales_target;
      cur.grossSales += r.gross_sales;
      cur.transactions += r.transactions;
      cur.stockouts += r.stockout_incidents;
      map.set(r.region, cur);
    });

    return Array.from(map.entries())
      .map(([region, vals]) => ({
        region,
        ...vals,
        achievementPct:
          vals.salesTarget > 0 ? (vals.netSales / vals.salesTarget) * 100 : 0,
      }))
      .sort((a, b) => b.netSales - a.netSales);
  }, [filteredRecords]);

  // Store Aggregation
  const storeSummaries: StoreSummary[] = useMemo(() => {
    const map = new Map<
      string,
      {
        storeId: string;
        storeName: string;
        region: string;
        city: string;
        storeFormat: string;
        netSales: number;
        salesTarget: number;
        returnsAmount: number;
        stockouts: number;
      }
    >();

    filteredRecords.forEach((r) => {
      const cur = map.get(r.store_name) || {
        storeId: r.store_id,
        storeName: r.store_name,
        region: r.region,
        city: r.city,
        storeFormat: r.store_format,
        netSales: 0,
        salesTarget: 0,
        returnsAmount: 0,
        stockouts: 0,
      };
      cur.netSales += r.net_sales;
      cur.salesTarget += r.sales_target;
      cur.returnsAmount += r.returns_amount;
      cur.stockouts += r.stockout_incidents;
      map.set(r.store_name, cur);
    });

    return Array.from(map.values())
      .map((s) => ({
        storeId: s.storeId,
        storeName: s.storeName,
        region: s.region,
        city: s.city,
        storeFormat: s.storeFormat,
        netSales: s.netSales,
        salesTarget: s.salesTarget,
        achievementPct:
          s.salesTarget > 0 ? (s.netSales / s.salesTarget) * 100 : 0,
        variance: s.netSales - s.salesTarget,
        stockouts: s.stockouts,
        returnRatePct:
          s.netSales > 0 ? (s.returnsAmount / s.netSales) * 100 : 0,
      }))
      .sort((a, b) => b.achievementPct - a.achievementPct);
  }, [filteredRecords]);

  // Category Aggregation
  const categorySummaries: CategorySummary[] = useMemo(() => {
    const map = new Map<
      string,
      {
        grossSales: number;
        netSales: number;
        returnsAmount: number;
        discountAmount: number;
        stockouts: number;
      }
    >();

    let totalStockoutsAll = 0;

    filteredRecords.forEach((r) => {
      const cur = map.get(r.product_category) || {
        grossSales: 0,
        netSales: 0,
        returnsAmount: 0,
        discountAmount: 0,
        stockouts: 0,
      };
      cur.grossSales += r.gross_sales;
      cur.netSales += r.net_sales;
      cur.returnsAmount += r.returns_amount;
      cur.discountAmount += r.discount_amount;
      cur.stockouts += r.stockout_incidents;
      totalStockoutsAll += r.stockout_incidents;
      map.set(r.product_category, cur);
    });

    return Array.from(map.entries())
      .map(([category, vals]) => ({
        category,
        ...vals,
        returnRatePct:
          vals.netSales > 0 ? (vals.returnsAmount / vals.netSales) * 100 : 0,
        discountRatePct:
          vals.grossSales > 0
            ? (vals.discountAmount / vals.grossSales) * 100
            : 0,
        stockoutSharePct:
          totalStockoutsAll > 0
            ? (vals.stockouts / totalStockoutsAll) * 100
            : 0,
      }))
      .sort((a, b) => b.netSales - a.netSales);
  }, [filteredRecords]);

  // 5. EXECUTIVE BUSINESS INSIGHTS SUMMARY Calculation
  const executiveInsights: ExecutiveInsights = useMemo(() => {
    const regionsByAchievement = [...regionSummaries].sort(
      (a, b) => b.achievementPct - a.achievementPct
    );
    const bestRegion = regionsByAchievement[0] || null;
    const worstRegion =
      regionsByAchievement[regionsByAchievement.length - 1] || null;

    // Stores Failing Target Achievement (< 100%)
    const failingStores = [...storeSummaries]
      .filter((s) => s.achievementPct < 100)
      .sort((a, b) => a.achievementPct - b.achievementPct);

    // Categories with High Return Rates (> 8%)
    const highReturnCategories = [...categorySummaries]
      .filter((c) => c.returnRatePct > 8)
      .sort((a, b) => b.returnRatePct - a.returnRatePct);

    // Critical Stockout Alerts
    const criticalStockoutCategories = [...categorySummaries]
      .filter((c) => c.stockouts > 0)
      .sort((a, b) => b.stockouts - a.stockouts)
      .slice(0, 3);

    const criticalStockoutStores = [...storeSummaries]
      .filter((s) => s.stockouts > 0)
      .sort((a, b) => b.stockouts - a.stockouts)
      .slice(0, 3);

    return {
      bestRegion,
      worstRegion,
      failingStores,
      highReturnCategories,
      criticalStockoutCategories,
      criticalStockoutStores,
      generatedAt: new Date().toISOString().split('T')[0],
    };
  }, [regionSummaries, storeSummaries, categorySummaries]);

  // Build plain-text Executive Insights Summary Report
  const executiveReportText = useMemo(() => {
    const lines: string[] = [
      '========================================================================',
      'RETAIL INTEL DASHBOARD — EXECUTIVE INSIGHTS REPORT',
      `Generated Date: ${executiveInsights.generatedAt} | Active Records: ${kpiMetrics.recordCount}`,
      '========================================================================',
      '',
      '1. EXECUTIVE KPI SCORECARD SUMMARY',
      `   - Net Sales:                  ${formatCurrency(kpiMetrics.netSales)} (Gross: ${formatCurrency(kpiMetrics.grossSales)})`,
      `   - Sales Target:               ${formatCurrency(kpiMetrics.salesTarget)}`,
      `   - Target Achievement %:       ${kpiMetrics.targetAchievementPct.toFixed(2)}%`,
      `   - Average Transaction (ATV):  ${formatCurrencyPrecise(kpiMetrics.averageTransactionValue)} (${kpiMetrics.totalTransactions.toLocaleString()} txns)`,
      `   - Return Rate %:              ${kpiMetrics.returnRatePct.toFixed(2)}% (${formatCurrency(kpiMetrics.returnsAmount)} returns)`,
      `   - Discount Rate %:            ${kpiMetrics.discountRatePct.toFixed(2)}% (${formatCurrency(kpiMetrics.discountAmount)} discounts)`,
      `   - Total Stockout Incidents:   ${kpiMetrics.totalStockoutIncidents.toLocaleString()} incidents`,
      '',
      '2. BEST & WORST PERFORMING REGIONS',
    ];

    if (executiveInsights.bestRegion) {
      lines.push(
        `   - Best Region:  ${executiveInsights.bestRegion.region} | Net Sales: ${formatCurrency(executiveInsights.bestRegion.netSales)} | Target Achievement: ${executiveInsights.bestRegion.achievementPct.toFixed(1)}%`
      );
    } else {
      lines.push('   - Best Region:  No regional data in current filter.');
    }

    if (executiveInsights.worstRegion) {
      lines.push(
        `   - Worst Region: ${executiveInsights.worstRegion.region} | Net Sales: ${formatCurrency(executiveInsights.worstRegion.netSales)} | Target Achievement: ${executiveInsights.worstRegion.achievementPct.toFixed(1)}%`
      );
    }

    lines.push('', '3. STORES FAILING TARGET ACHIEVEMENT (< 100%)');
    if (executiveInsights.failingStores.length === 0) {
      lines.push(
        '   - All selected stores achieved >= 100% of their sales target.'
      );
    } else {
      executiveInsights.failingStores.forEach((st, idx) => {
        lines.push(
          `   ${idx + 1}. ${st.storeName} (${st.city}, ${st.region} · ${st.storeFormat}): ${st.achievementPct.toFixed(1)}% achievement | Net: ${formatCurrency(st.netSales)} vs Target: ${formatCurrency(st.salesTarget)} (Shortfall: ${formatCurrency(Math.abs(st.variance))})`
        );
      });
    }

    lines.push('', '4. CATEGORIES WITH HIGH RETURN RATES (> 8.0%)');
    if (executiveInsights.highReturnCategories.length === 0) {
      lines.push(
        '   - No product categories exceed the 8.0% return rate threshold in the current selection.'
      );
    } else {
      executiveInsights.highReturnCategories.forEach((cat, idx) => {
        lines.push(
          `   ${idx + 1}. ${cat.category}: ${cat.returnRatePct.toFixed(2)}% Return Rate | Returns: ${formatCurrency(cat.returnsAmount)} on Net Sales of ${formatCurrency(cat.netSales)}`
        );
      });
    }

    lines.push('', '5. CRITICAL STOCKOUT ALERTS');
    if (executiveInsights.criticalStockoutCategories.length === 0) {
      lines.push('   - Zero stockout incidents recorded in current selection.');
    } else {
      lines.push('   Highest-Risk Product Categories:');
      executiveInsights.criticalStockoutCategories.forEach((cat, idx) => {
        lines.push(
          `   ${idx + 1}. ${cat.category}: ${cat.stockouts.toLocaleString()} stockout incidents (${cat.stockoutSharePct.toFixed(1)}% of total stockouts)`
        );
      });
      lines.push('   Highest-Risk Store Locations:');
      executiveInsights.criticalStockoutStores.forEach((st, idx) => {
        lines.push(
          `   ${idx + 1}. ${st.storeName} (${st.city}): ${st.stockouts.toLocaleString()} stockout incidents | Target Achievement: ${st.achievementPct.toFixed(1)}%`
        );
      });
    }

    lines.push(
      '',
      '========================================================================'
    );
    return lines.join('\n');
  }, [executiveInsights, kpiMetrics]);

  // 6. EXPORT CAPABILITIES
  const handleExportFilteredCsv = () => {
    const headers = [
      'Week Start Date',
      'Store ID',
      'Store Name',
      'Region',
      'City',
      'Store Format',
      'Product Category',
      'Gross Sales',
      'Discount Amount',
      'Returns Amount',
      'Net Sales',
      'Sales Target',
      'Target Achievement %',
      'Transactions',
      'Average Transaction Value',
      'Return Rate %',
      'Discount Rate %',
      'Stockout Incidents',
    ];

    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredRecords.map((r) => {
      const achPct =
        r.sales_target > 0
          ? ((r.net_sales / r.sales_target) * 100).toFixed(2)
          : '0.00';
      const atv =
        r.transactions > 0 ? (r.net_sales / r.transactions).toFixed(2) : '0.00';
      const retRate =
        r.net_sales > 0
          ? ((r.returns_amount / r.net_sales) * 100).toFixed(2)
          : '0.00';
      const discRate =
        r.gross_sales > 0
          ? ((r.discount_amount / r.gross_sales) * 100).toFixed(2)
          : '0.00';

      return [
        r.week_start_date,
        r.store_id,
        r.store_name,
        r.region,
        r.city,
        r.store_format,
        r.product_category,
        r.gross_sales,
        r.discount_amount,
        r.returns_amount,
        r.net_sales,
        r.sales_target,
        achPct,
        r.transactions,
        atv,
        retRate,
        discRate,
        r.stockout_incidents,
      ]
        .map(escapeCsv)
        .join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `retail_sales_filtered_${executiveInsights.generatedAt}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadInsightsReport = () => {
    const blob = new Blob([executiveReportText], {
      type: 'text/plain;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `executive_insights_summary_${executiveInsights.generatedAt}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Ledger table sorting & search state
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [sortField, setSortField] = useState<
    'achievementPct' | 'netSales' | 'returnRatePct' | 'stockouts'
  >('achievementPct');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedStoreLedger = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    const list = storeSummaries.filter(
      (s) =>
        !q ||
        s.storeName.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q) ||
        s.storeFormat.toLowerCase().includes(q)
    );
    return list.sort((a, b) => {
      const diff = a[sortField] - b[sortField];
      return sortAsc ? diff : -diff;
    });
  }, [storeSummaries, ledgerSearch, sortField, sortAsc]);

  const toggleSort = (
    field: 'achievementPct' | 'netSales' | 'returnRatePct' | 'stockouts'
  ) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const isAnyFilterActive =
    filters.weekStartDates.length !== availableOptions.weeks.length ||
    filters.regions.length !== availableOptions.regions.length ||
    filters.storeNames.length !== availableOptions.stores.length ||
    filters.cities.length !== availableOptions.cities.length ||
    filters.storeFormats.length !== availableOptions.formats.length ||
    filters.productCategories.length !== availableOptions.categories.length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-slate-200">
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display"
        >
          Retail Intel Dashboard
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#data-uploader"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Data Uploader
          </a>
          <a
            href="#kpi-scorecards"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            KPI Scorecards
          </a>
          <a
            href="#charts-analytics"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Visual Analytics
          </a>
          <a
            href="#executive-insights"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Executive Insights
          </a>
          <a
            href="#store-ledger"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Store Ledger
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleLoadDemoDataset}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Load Demo Dataset
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main
        id="top"
        className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-8 space-y-8"
      >
        {/* Page Header + Export Controls */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span>Enterprise Retail BI</span>
              <span aria-hidden="true">·</span>
              <span>SheetJS &amp; Chart.js Engine</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">
                {kpiMetrics.recordCount.toLocaleString()} Active Rows
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Retail Sales Intelligence &amp; Store Target Performance
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Upload weekly transaction workbooks and store master metadata to
              evaluate net sales realization, target achievement, return rate
              erosion, and stockout exposure across regions.
            </p>
          </div>

          {/* 6. EXPORT CAPABILITIES */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExportFilteredCsv}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Filtered Dataset (CSV)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadInsightsReport}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Executive Insights Report</span>
            </button>
          </div>
        </section>

        {/* 1. DATA UPLOADER SECTION */}
        <section
          id="data-uploader"
          aria-labelledby="uploader-heading"
          className="bg-white border border-slate-200 rounded-xl p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <h2
                id="uploader-heading"
                className="text-base font-bold text-slate-900"
              >
                Data Ingestion &amp; Workbook Uploader
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload Excel files (<span className="font-mono">retail_weekly_sales.xlsx</span> and <span className="font-mono">store_master.xlsx</span>) parsed client-side via SheetJS, or restore the pre-loaded demo dataset.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  downloadSampleExcelFile('sales', salesRecords, storeRecords)
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                <span>Sample retail_weekly_sales.xlsx</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadSampleExcelFile('stores', salesRecords, storeRecords)
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                <span>Sample store_master.xlsx</span>
              </button>
              <button
                type="button"
                onClick={handleLoadDemoDataset}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Load Demo Dataset</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
            {/* Uploader 1: retail_weekly_sales.xlsx */}
            <div className="flex flex-col justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    1. Weekly Sales Transactions Workbook
                  </span>
                  <span className="text-xs text-slate-500 font-mono block mt-0.5">
                    Expected file: retail_weekly_sales.xlsx
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-600">
                  {salesRecords.length.toLocaleString()} rows
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
                <span
                  className="text-xs text-slate-600 truncate font-mono"
                  title={salesFileName}
                >
                  Active: {salesFileName}
                </span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer whitespace-nowrap shrink-0 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Sales .xlsx</span>
                  <input
                    ref={salesFileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleSalesFileUpload}
                    className="sr-only"
                    aria-label="Upload retail_weekly_sales.xlsx"
                  />
                </label>
              </div>
            </div>

            {/* Uploader 2: store_master.xlsx */}
            <div className="flex flex-col justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    2. Store Master Metadata Workbook
                  </span>
                  <span className="text-xs text-slate-500 font-mono block mt-0.5">
                    Expected file: store_master.xlsx
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-600">
                  {storeRecords.length.toLocaleString()} stores
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
                <span
                  className="text-xs text-slate-600 truncate font-mono"
                  title={storeFileName}
                >
                  Active: {storeFileName}
                </span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer whitespace-nowrap shrink-0 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Store Master .xlsx</span>
                  <input
                    ref={storeFileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleStoreFileUpload}
                    className="sr-only"
                    aria-label="Upload store_master.xlsx"
                  />
                </label>
              </div>
            </div>
          </div>

          {uploadStatus && (
            <div
              className={`mt-4 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-xs border ${
                uploadStatus.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border-rose-200'
                  : uploadStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {uploadStatus.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{uploadStatus.message}</span>
              </div>
              <span className="font-mono text-slate-500 whitespace-nowrap shrink-0">
                Schema Joined on store_id
              </span>
            </div>
          )}
        </section>

        {/* 3. DYNAMIC MULTI-FILTER BAR */}
        <section
          aria-labelledby="filter-bar-heading"
          className="bg-white border border-slate-200 rounded-xl p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2
                id="filter-bar-heading"
                className="text-base font-bold text-slate-900"
              >
                Dynamic Multi-Select Dimension Filters
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Filter across any combination of dimensions. All 6 KPI scorecards, 5 Chart.js visualizations, and executive insights update instantaneously.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-600">
                Showing {filteredRecords.length.toLocaleString()} of{' '}
                {joinedData.length.toLocaleString()} records
              </span>
              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={() => syncFiltersToDataset(joinedData)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MultiSelectDropdown
              label="Week Start Date"
              options={availableOptions.weeks}
              selected={filters.weekStartDates}
              onChange={(weekStartDates) =>
                setFilters((prev) => ({ ...prev, weekStartDates }))
              }
            />
            <MultiSelectDropdown
              label="Region"
              options={availableOptions.regions}
              selected={filters.regions}
              onChange={(regions) =>
                setFilters((prev) => ({ ...prev, regions }))
              }
            />
            <MultiSelectDropdown
              label="Store Name"
              options={availableOptions.stores}
              selected={filters.storeNames}
              onChange={(storeNames) =>
                setFilters((prev) => ({ ...prev, storeNames }))
              }
            />
            <MultiSelectDropdown
              label="City"
              options={availableOptions.cities}
              selected={filters.cities}
              onChange={(cities) =>
                setFilters((prev) => ({ ...prev, cities }))
              }
            />
            <MultiSelectDropdown
              label="Store Format"
              options={availableOptions.formats}
              selected={filters.storeFormats}
              onChange={(storeFormats) =>
                setFilters((prev) => ({ ...prev, storeFormats }))
              }
            />
            <MultiSelectDropdown
              label="Product Category"
              options={availableOptions.categories}
              selected={filters.productCategories}
              onChange={(productCategories) =>
                setFilters((prev) => ({ ...prev, productCategories }))
              }
            />
          </div>
        </section>

        {/* Empty Filter State Guard */}
        {filteredRecords.length === 0 ? (
          <section className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">
              No Retail Transactions Match Current Filter Selection
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              One or more dimension dropdowns have zero matching combinations.
              Reset all filters to restore the full retail intelligence view.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => syncFiltersToDataset(joinedData)}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* 2. TOP KPI SCORECARDS */}
            <section id="kpi-scorecards" aria-labelledby="kpi-heading">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <h2
                    id="kpi-heading"
                    className="text-lg font-bold text-slate-900"
                  >
                    Executive KPI Scorecards
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time aggregated financial and operational metrics
                    computed across active filter dimensions
                  </p>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  Gross Sales: {formatCurrency(kpiMetrics.grossSales)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* KPI 1: Net Sales */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">
                      Net Sales
                    </span>
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
                      {formatCurrency(kpiMetrics.netSales)}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <div className="font-mono text-[11px] text-slate-600">
                      Gross − Discounts − Returns
                    </div>
                    <div className="font-mono text-[11px]">
                      Target: {formatCurrency(kpiMetrics.salesTarget)}
                    </div>
                  </div>
                </div>

                {/* KPI 2: Target Achievement % */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">
                      Target Achievement %
                    </span>
                    <div
                      className={`text-2xl font-bold font-mono tabular-nums mt-2 ${
                        kpiMetrics.targetAchievementPct >= 100
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {kpiMetrics.targetAchievementPct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <div className="font-mono text-[11px] text-slate-600">
                      (Net Sales / Target) × 100
                    </div>
                    <div
                      className={`font-medium text-[11px] ${
                        kpiMetrics.targetAchievementPct >= 100
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {kpiMetrics.targetAchievementPct >= 100
                        ? 'Status: On / Above Target'
                        : 'Status: Below Target (<100%)'}
                    </div>
                  </div>
                </div>

                {/* KPI 3: Average Transaction Value (ATV) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">
                      Avg Transaction Value
                    </span>
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
                      {formatCurrencyPrecise(
                        kpiMetrics.averageTransactionValue
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <div className="font-mono text-[11px] text-slate-600">
                      Net Sales / Transactions
                    </div>
                    <div className="font-mono text-[11px]">
                      {kpiMetrics.totalTransactions.toLocaleString()} total txns
                    </div>
                  </div>
                </div>

                {/* KPI 4: Return Rate % */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">
                      Return Rate %
                    </span>
                    <div
                      className={`text-2xl font-bold font-mono tabular-nums mt-2 ${
                        kpiMetrics.returnRatePct > 8
                          ? 'text-rose-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {kpiMetrics.returnRatePct.toFixed(2)}%
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <div className="font-mono text-[11px] text-slate-600">
                      (Returns / Net Sales) × 100
                    </div>
                    <div className="font-mono text-[11px]">
                      Returns: {formatCurrency(kpiMetrics.returnsAmount)}
                    </div>
                  </div>
                </div>

                {/* KPI 5: Discount Rate % */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">
                      Discount Rate %
                    </span>
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
                      {kpiMetrics.discountRatePct.toFixed(2)}%
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <div className="font-mono text-[11px] text-slate-600">
                      (Discounts / Gross) × 100
                    </div>
                    <div className="font-mono text-[11px]">
                      Discounts: {formatCurrency(kpiMetrics.discountAmount)}
                    </div>
                  </div>
                </div>

                {/* KPI 6: Total Stockout Incidents */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">
                      Total Stockout Incidents
                    </span>
                    <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-2">
                      {kpiMetrics.totalStockoutIncidents.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <div className="font-mono text-[11px] text-slate-600">
                      Sum of Stockout Events
                    </div>
                    <div className="font-mono text-[11px]">
                      Avg{' '}
                      {(
                        kpiMetrics.totalStockoutIncidents /
                        Math.max(1, storeSummaries.length)
                      ).toFixed(1)}{' '}
                      / store
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. CHARTS & ANALYTICS */}
            <section
              id="charts-analytics"
              aria-labelledby="charts-heading"
              className="space-y-4"
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <h2
                    id="charts-heading"
                    className="text-lg font-bold text-slate-900"
                  >
                    Interactive Visual Analytics Suite
                  </h2>
                  <p className="text-xs text-slate-500">
                    Five synchronized Chart.js views tracking weekly trajectory,
                    regional revenue split, category returns, store leaderboard,
                    and stockout exposure
                  </p>
                </div>
              </div>

              <RetailCharts
                records={filteredRecords}
                regionSummaries={regionSummaries}
                categorySummaries={categorySummaries}
                storeSummaries={storeSummaries}
              />
            </section>

            {/* 5. EXECUTIVE BUSINESS INSIGHTS SUMMARY */}
            <section
              id="executive-insights"
              aria-labelledby="insights-heading"
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2
                    id="insights-heading"
                    className="text-lg font-bold text-slate-900"
                  >
                    Automated Executive Business Insights Summary
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rule-based diagnostic synthesis dynamically computed from
                    current filter selection
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadInsightsReport}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Insights Summary (.txt)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Insight Block 1: Best & Worst Performing Regions */}
                <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      01. Best &amp; Worst Performing Regions
                    </h3>
                    <span className="text-xs font-mono text-slate-500">
                      Target Achievement Benchmark
                    </span>
                  </div>

                  {executiveInsights.bestRegion &&
                  executiveInsights.worstRegion ? (
                    <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                      <div className="pb-2.5 border-b border-slate-200/80">
                        <span className="font-semibold text-emerald-800 block">
                          Top Performing Region:{' '}
                          {executiveInsights.bestRegion.region}
                        </span>
                        <span className="font-mono text-slate-900">
                          Net Sales:{' '}
                          {formatCurrency(
                            executiveInsights.bestRegion.netSales
                          )}{' '}
                          · Target Achievement:{' '}
                          {executiveInsights.bestRegion.achievementPct.toFixed(
                            1
                          )}
                          %
                        </span>
                        <p className="text-slate-600 mt-1">
                          Generated{' '}
                          {executiveInsights.bestRegion.transactions.toLocaleString()}{' '}
                          transactions against a quota of{' '}
                          {formatCurrency(
                            executiveInsights.bestRegion.salesTarget
                          )}
                          .
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-rose-800 block">
                          Lowest Performing Region:{' '}
                          {executiveInsights.worstRegion.region}
                        </span>
                        <span className="font-mono text-slate-900">
                          Net Sales:{' '}
                          {formatCurrency(
                            executiveInsights.worstRegion.netSales
                          )}{' '}
                          · Target Achievement:{' '}
                          {executiveInsights.worstRegion.achievementPct.toFixed(
                            1
                          )}
                          %
                        </span>
                        <p className="text-slate-600 mt-1">
                          Trails{' '}
                          {executiveInsights.bestRegion.region} by{' '}
                          {(
                            executiveInsights.bestRegion.achievementPct -
                            executiveInsights.worstRegion.achievementPct
                          ).toFixed(1)}{' '}
                          percentage points with{' '}
                          {executiveInsights.worstRegion.stockouts.toLocaleString()}{' '}
                          recorded stockouts.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Insufficient regional data available.
                    </p>
                  )}
                </div>

                {/* Insight Block 2: Stores Failing Target Achievement (< 100%) */}
                <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      02. Stores Failing Target Achievement (&lt; 100%)
                    </h3>
                    <span className="text-xs font-mono text-rose-700">
                      {executiveInsights.failingStores.length} of{' '}
                      {storeSummaries.length} stores below quota
                    </span>
                  </div>

                  {executiveInsights.failingStores.length === 0 ? (
                    <p className="text-xs text-emerald-800">
                      All active stores in the current filter selection achieved
                      100% or more of their sales targets.
                    </p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <p className="text-slate-600">
                        The following stores fell short of the 100% target
                        achievement threshold and require commercial review:
                      </p>
                      <ul className="divide-y divide-slate-200/80 font-mono">
                        {executiveInsights.failingStores.map((st) => (
                          <li
                            key={st.storeId}
                            className="py-1.5 flex items-center justify-between gap-2"
                          >
                            <span className="text-slate-800 truncate font-sans font-medium">
                              {st.storeName}{' '}
                              <span className="text-slate-500 font-normal">
                                · {st.city}
                              </span>
                            </span>
                            <span className="text-rose-700 whitespace-nowrap shrink-0">
                              {st.achievementPct.toFixed(1)}% (−
                              {formatCurrency(Math.abs(st.variance))})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Insight Block 3: Categories with High Return Rates (> 8%) */}
                <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      03. Categories with High Return Rates (&gt; 8%)
                    </h3>
                    <span className="text-xs font-mono text-rose-700">
                      {executiveInsights.highReturnCategories.length} categories
                      flagged
                    </span>
                  </div>

                  {executiveInsights.highReturnCategories.length === 0 ? (
                    <p className="text-xs text-emerald-800">
                      No product categories exceed the 8.0% return rate
                      threshold in the filtered view.
                    </p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <p className="text-slate-600">
                        Categories exceeding the 8.0% return-to-net-sales
                        tolerance threshold:
                      </p>
                      <ul className="divide-y divide-slate-200/80">
                        {executiveInsights.highReturnCategories.map((cat) => (
                          <li
                            key={cat.category}
                            className="py-2 flex items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {cat.category}
                              </span>
                              <span className="text-slate-500 font-mono text-[11px]">
                                Returns: {formatCurrency(cat.returnsAmount)} ·
                                Net Sales: {formatCurrency(cat.netSales)}
                              </span>
                            </div>
                            <span className="font-mono font-semibold text-rose-700 whitespace-nowrap shrink-0">
                              {cat.returnRatePct.toFixed(2)}% Return Rate
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Insight Block 4: Critical Stockout Alerts */}
                <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      04. Critical Stockout Alerts
                    </h3>
                    <span className="text-xs font-mono text-amber-800">
                      {kpiMetrics.totalStockoutIncidents.toLocaleString()} total
                      incidents
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block mb-1">
                        Highest Stockout Product Categories:
                      </span>
                      <ul className="space-y-1 font-mono text-[11px] text-slate-700">
                        {executiveInsights.criticalStockoutCategories.map(
                          (cat) => (
                            <li
                              key={cat.category}
                              className="flex items-center justify-between"
                            >
                              <span className="font-sans text-xs text-slate-800">
                                {cat.category}
                              </span>
                              <span>
                                {cat.stockouts.toLocaleString()} incidents (
                                {cat.stockoutSharePct.toFixed(1)}% share)
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80">
                      <span className="font-semibold text-slate-800 block mb-1">
                        Most Impacted Store Locations:
                      </span>
                      <ul className="space-y-1 font-mono text-[11px] text-slate-700">
                        {executiveInsights.criticalStockoutStores.map((st) => (
                          <li
                            key={st.storeId}
                            className="flex items-center justify-between"
                          >
                            <span className="font-sans text-xs text-slate-800">
                              {st.storeName} ({st.city})
                            </span>
                            <span className="text-amber-800 font-medium">
                              {st.stockouts.toLocaleString()} stockouts ·{' '}
                              {st.achievementPct.toFixed(1)}% target
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Store Performance Ledger Table */}
            <section
              id="store-ledger"
              aria-labelledby="ledger-heading"
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2
                    id="ledger-heading"
                    className="text-lg font-bold text-slate-900"
                  >
                    Store Performance &amp; Target Realization Ledger
                  </h2>
                  <p className="text-xs text-slate-500">
                    Granular breakdown of store-level Net Sales, Target
                    Achievement %, Return Rate %, and Stockout Incidents
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    placeholder="Search store, city, format..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-2.5 pr-4">Store Name</th>
                      <th className="py-2.5 px-3">Location &amp; Format</th>
                      <th className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSort('netSales')}
                          className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                        >
                          <span>Net Sales</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-2.5 px-3 text-right">Sales Target</th>
                      <th className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSort('achievementPct')}
                          className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                        >
                          <span>Target Ach %</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSort('returnRatePct')}
                          className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                        >
                          <span>Return Rate %</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-2.5 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSort('stockouts')}
                          className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                        >
                          <span>Stockouts</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {sortedStoreLedger.map((store) => (
                      <tr
                        key={store.storeId}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-2.5 pr-4 font-medium text-slate-900 whitespace-nowrap">
                          {store.storeName}{' '}
                          <span className="text-slate-400 font-mono font-normal">
                            · {store.storeId}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {store.city} · {store.region} · {store.storeFormat}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900">
                          {formatCurrency(store.netSales)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                          {formatCurrency(store.salesTarget)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono tabular-nums font-semibold ${
                            store.achievementPct >= 100
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {store.achievementPct.toFixed(1)}%
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono tabular-nums ${
                            store.returnRatePct > 8
                              ? 'text-rose-700 font-semibold'
                              : 'text-slate-700'
                          }`}
                        >
                          {store.returnRatePct.toFixed(2)}%
                        </td>
                        <td className="py-2.5 pl-3 text-right font-mono tabular-nums text-slate-800">
                          {store.stockouts.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-12">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            Retail Intel Dashboard · Client-Side SheetJS &amp; Chart.js Analytics
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleExportFilteredCsv}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Export Filtered CSV
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleDownloadInsightsReport}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Download Insights Report
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
