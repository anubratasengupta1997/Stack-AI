import * as XLSX from 'xlsx';
import {
  StoreMasterRecord,
  WeeklySalesRecord,
  JoinedSalesRecord,
} from '../types/retail';

export const DEMO_STORES: StoreMasterRecord[] = [
  {
    store_id: 'STR-101',
    store_name: 'Manhattan SoHo Flagship',
    region: 'Northeast',
    city: 'New York',
    store_format: 'Flagship Urban',
  },
  {
    store_id: 'STR-102',
    store_name: 'Boston Back Bay Gallery',
    region: 'Northeast',
    city: 'Boston',
    store_format: 'Lifestyle Center',
  },
  {
    store_id: 'STR-103',
    store_name: 'King of Prussia Plaza',
    region: 'Northeast',
    city: 'Philadelphia',
    store_format: 'Suburban Mall',
  },
  {
    store_id: 'STR-201',
    store_name: 'Chicago Magnificent Mile',
    region: 'Midwest',
    city: 'Chicago',
    store_format: 'Flagship Urban',
  },
  {
    store_id: 'STR-202',
    store_name: 'Minneapolis Galleria',
    region: 'Midwest',
    city: 'Minneapolis',
    store_format: 'Suburban Mall',
  },
  {
    store_id: 'STR-203',
    store_name: 'Columbus Easton Commons',
    region: 'Midwest',
    city: 'Columbus',
    store_format: 'Express Outlet',
  },
  {
    store_id: 'STR-301',
    store_name: 'Miami Brickell Citi Centre',
    region: 'South',
    city: 'Miami',
    store_format: 'Flagship Urban',
  },
  {
    store_id: 'STR-302',
    store_name: 'Atlanta Buckhead Village',
    region: 'South',
    city: 'Atlanta',
    store_format: 'Lifestyle Center',
  },
  {
    store_id: 'STR-303',
    store_name: 'Dallas NorthPark Center',
    region: 'South',
    city: 'Dallas',
    store_format: 'Suburban Mall',
  },
  {
    store_id: 'STR-401',
    store_name: 'San Francisco Union Square',
    region: 'West',
    city: 'San Francisco',
    store_format: 'Flagship Urban',
  },
  {
    store_id: 'STR-402',
    store_name: 'Seattle Bellevue Square',
    region: 'West',
    city: 'Seattle',
    store_format: 'Suburban Mall',
  },
  {
    store_id: 'STR-403',
    store_name: 'Denver Cherry Creek Outlet',
    region: 'West',
    city: 'Denver',
    store_format: 'Express Outlet',
  },
];

const WEEKS = [
  '2026-08-03',
  '2026-08-10',
  '2026-08-17',
  '2026-08-24',
  '2026-08-31',
  '2026-09-07',
  '2026-09-14',
  '2026-09-21',
];

const CATEGORIES = [
  'Consumer Electronics',
  'Apparel & Footwear',
  'Home & Living',
  'Beauty & Personal Care',
  'Active & Outdoor',
  'Gourmet & Pantry',
];

function seededNoise(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function generateDemoWeeklySales(): WeeklySalesRecord[] {
  const records: WeeklySalesRecord[] = [];

  const storeMultipliers: Record<
    string,
    { salesScale: number; targetRatio: number; stockoutBias: number }
  > = {
    'STR-101': { salesScale: 1.45, targetRatio: 0.89, stockoutBias: 0.8 },
    'STR-102': { salesScale: 1.12, targetRatio: 0.94, stockoutBias: 0.9 },
    'STR-103': { salesScale: 0.92, targetRatio: 1.07, stockoutBias: 1.3 },
    'STR-201': { salesScale: 1.25, targetRatio: 0.96, stockoutBias: 1.0 },
    'STR-202': { salesScale: 0.84, targetRatio: 1.12, stockoutBias: 1.5 },
    'STR-203': { salesScale: 0.72, targetRatio: 1.16, stockoutBias: 1.8 },
    'STR-301': { salesScale: 1.38, targetRatio: 0.88, stockoutBias: 0.7 },
    'STR-302': { salesScale: 1.15, targetRatio: 0.93, stockoutBias: 0.9 },
    'STR-303': { salesScale: 1.06, targetRatio: 0.97, stockoutBias: 1.1 },
    'STR-401': { salesScale: 1.18, targetRatio: 1.09, stockoutBias: 1.4 },
    'STR-402': { salesScale: 1.28, targetRatio: 0.91, stockoutBias: 0.8 },
    'STR-403': { salesScale: 0.68, targetRatio: 1.18, stockoutBias: 1.9 },
  };

  const categoryProfiles: Record<
    string,
    {
      baseGross: number;
      discountRate: number;
      returnRateOfGross: number;
      avgTicket: number;
      baseStockouts: number;
    }
  > = {
    'Consumer Electronics': {
      baseGross: 46000,
      discountRate: 0.065,
      returnRateOfGross: 0.082,
      avgTicket: 185,
      baseStockouts: 5.2,
    },
    'Apparel & Footwear': {
      baseGross: 38000,
      discountRate: 0.115,
      returnRateOfGross: 0.095,
      avgTicket: 92,
      baseStockouts: 3.8,
    },
    'Home & Living': {
      baseGross: 31000,
      discountRate: 0.085,
      returnRateOfGross: 0.052,
      avgTicket: 134,
      baseStockouts: 2.4,
    },
    'Beauty & Personal Care': {
      baseGross: 27500,
      discountRate: 0.055,
      returnRateOfGross: 0.031,
      avgTicket: 58,
      baseStockouts: 4.1,
    },
    'Active & Outdoor': {
      baseGross: 29000,
      discountRate: 0.075,
      returnRateOfGross: 0.068,
      avgTicket: 118,
      baseStockouts: 2.9,
    },
    'Gourmet & Pantry': {
      baseGross: 21500,
      discountRate: 0.042,
      returnRateOfGross: 0.015,
      avgTicket: 44,
      baseStockouts: 1.6,
    },
  };

  let seedCounter = 1;

  WEEKS.forEach((week, weekIdx) => {
    const seasonalWave =
      1 +
      weekIdx * 0.022 +
      (week === '2026-08-31' || week === '2026-09-07' ? 0.09 : 0);

    DEMO_STORES.forEach((store) => {
      const storeMult = storeMultipliers[store.store_id] || {
        salesScale: 1,
        targetRatio: 1,
        stockoutBias: 1,
      };

      CATEGORIES.forEach((category) => {
        const profile = categoryProfiles[category];
        const n1 = seededNoise(seedCounter++);
        const n2 = seededNoise(seedCounter++);
        const n3 = seededNoise(seedCounter++);

        const jitter = 0.88 + n1 * 0.24;
        const grossSales = Math.round(
          profile.baseGross * storeMult.salesScale * seasonalWave * jitter
        );

        const discountRate =
          profile.discountRate * (0.85 + n2 * 0.3) *
          (week === '2026-08-31' ? 1.22 : 1);
        const discountAmount = Math.round(grossSales * discountRate);

        const returnRate = profile.returnRateOfGross * (0.88 + n3 * 0.25);
        const returnsAmount = Math.round(grossSales * returnRate);

        const netSales = grossSales - discountAmount - returnsAmount;
        const salesTarget = Math.round(
          netSales * storeMult.targetRatio * (0.95 + n2 * 0.1)
        );

        const transactions = Math.max(
          25,
          Math.round(netSales / (profile.avgTicket * (0.92 + n1 * 0.16)))
        );

        const stockoutIncidents = Math.max(
          0,
          Math.round(
            profile.baseStockouts *
              storeMult.stockoutBias *
              (0.4 + n3 * 1.25)
          )
        );

        records.push({
          week_start_date: week,
          store_id: store.store_id,
          product_category: category,
          gross_sales: grossSales,
          discount_amount: discountAmount,
          returns_amount: returnsAmount,
          sales_target: salesTarget,
          transactions,
          stockout_incidents: stockoutIncidents,
        });
      });
    });
  });

  return records;
}

export function joinSalesAndStores(
  sales: WeeklySalesRecord[],
  stores: StoreMasterRecord[]
): JoinedSalesRecord[] {
  const storeMap = new Map<string, StoreMasterRecord>();
  stores.forEach((s) => {
    storeMap.set(String(s.store_id).trim().toUpperCase(), s);
  });

  return sales.map((row) => {
    const normalizedId = String(row.store_id).trim().toUpperCase();
    const matchedStore = storeMap.get(normalizedId);

    const gross = Number(row.gross_sales) || 0;
    const discount = Number(row.discount_amount) || 0;
    const returns = Number(row.returns_amount) || 0;
    const netSales = gross - discount - returns;

    return {
      ...row,
      gross_sales: gross,
      discount_amount: discount,
      returns_amount: returns,
      sales_target: Number(row.sales_target) || 0,
      transactions: Number(row.transactions) || 0,
      stockout_incidents: Number(row.stockout_incidents) || 0,
      net_sales: netSales,
      store_name: matchedStore?.store_name || `Store ${row.store_id}`,
      region: matchedStore?.region || 'Unassigned Region',
      city: matchedStore?.city || 'Unassigned City',
      store_format: matchedStore?.store_format || 'Standard Format',
    };
  });
}

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function formatExcelDate(val: unknown): string {
  if (val === null || val === undefined) return '2026-08-03';
  if (typeof val === 'number') {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      const y = String(parsed.y).padStart(4, '0');
      const m = String(parsed.m).padStart(2, '0');
      const d = String(parsed.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split('T')[0];
  }
  return str || '2026-08-03';
}

function parseNumeric(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[$,%\s,]/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export async function parseWeeklySalesExcel(
  file: File
): Promise<WeeklySalesRecord[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
  });

  if (!rawRows.length) {
    throw new Error('The uploaded sales Excel file contains no rows.');
  }

  return rawRows.map((raw, idx) => {
    const norm: Record<string, unknown> = {};
    Object.keys(raw).forEach((k) => {
      norm[normalizeKey(k)] = raw[k];
    });

    const weekStart = formatExcelDate(
      norm.week_start_date ??
        norm.week_start ??
        norm.week ??
        norm.date ??
        norm.period ??
        '2026-08-03'
    );

    const storeId = String(
      norm.store_id ??
        norm.store_code ??
        norm.store ??
        norm.location_id ??
        `STR-${101 + (idx % 12)}`
    ).trim();

    const category = String(
      norm.product_category ??
        norm.category ??
        norm.department ??
        norm.product_line ??
        'General Merchandise'
    ).trim();

    const grossSales = parseNumeric(
      norm.gross_sales ??
        norm.gross_revenue ??
        norm.total_gross_sales ??
        norm.gross ??
        0
    );

    const discountAmount = parseNumeric(
      norm.discount_amount ??
        norm.discounts ??
        norm.discount ??
        norm.total_discount ??
        0
    );

    const returnsAmount = parseNumeric(
      norm.returns_amount ??
        norm.return_amount ??
        norm.returns ??
        norm.total_returns ??
        0
    );

    const salesTarget = parseNumeric(
      norm.sales_target ??
        norm.target_sales ??
        norm.target ??
        norm.quota ??
        grossSales * 0.85
    );

    const transactions = Math.max(
      1,
      Math.round(
        parseNumeric(
          norm.transactions ??
            norm.total_transactions ??
            norm.transaction_count ??
            norm.orders ??
            Math.max(10, grossSales / 110)
        )
      )
    );

    const stockoutIncidents = Math.max(
      0,
      Math.round(
        parseNumeric(
          norm.stockout_incidents ??
            norm.stockouts ??
            norm.stockout_count ??
            norm.out_of_stock_incidents ??
            0
        )
      )
    );

    return {
      week_start_date: weekStart,
      store_id: storeId,
      product_category: category,
      gross_sales: grossSales,
      discount_amount: discountAmount,
      returns_amount: returnsAmount,
      sales_target: salesTarget,
      transactions,
      stockout_incidents: stockoutIncidents,
    };
  });
}

export async function parseStoreMasterExcel(
  file: File
): Promise<StoreMasterRecord[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
  });

  if (!rawRows.length) {
    throw new Error('The uploaded store master Excel file contains no rows.');
  }

  return rawRows.map((raw, idx) => {
    const norm: Record<string, unknown> = {};
    Object.keys(raw).forEach((k) => {
      norm[normalizeKey(k)] = raw[k];
    });

    return {
      store_id: String(
        norm.store_id ?? norm.store_code ?? norm.id ?? `STR-${101 + idx}`
      ).trim(),
      store_name: String(
        norm.store_name ?? norm.name ?? norm.store ?? `Retail Store ${idx + 1}`
      ).trim(),
      region: String(
        norm.region ?? norm.territory ?? norm.zone ?? 'Northeast'
      ).trim(),
      city: String(
        norm.city ?? norm.market ?? norm.metro ?? 'New York'
      ).trim(),
      store_format: String(
        norm.store_format ??
          norm.format ??
          norm.store_type ??
          'Flagship Urban'
      ).trim(),
    };
  });
}

export function downloadSampleExcelFile(
  type: 'sales' | 'stores',
  salesData: WeeklySalesRecord[],
  storeData: StoreMasterRecord[]
) {
  const wb = XLSX.utils.book_new();
  if (type === 'sales') {
    const ws = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly_Sales');
    XLSX.writeFile(wb, 'retail_weekly_sales.xlsx');
  } else {
    const ws = XLSX.utils.json_to_sheet(storeData);
    XLSX.utils.book_append_sheet(wb, ws, 'Store_Master');
    XLSX.writeFile(wb, 'store_master.xlsx');
  }
}
