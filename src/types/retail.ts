export interface StoreMasterRecord {
  store_id: string;
  store_name: string;
  region: string;
  city: string;
  store_format: string;
}

export interface WeeklySalesRecord {
  transaction_id?: string;
  week_start_date: string;
  store_id: string;
  product_category: string;
  gross_sales: number;
  discount_amount: number;
  returns_amount: number;
  sales_target: number;
  transactions: number;
  stockout_incidents: number;
}

export interface JoinedSalesRecord extends WeeklySalesRecord {
  store_name: string;
  region: string;
  city: string;
  store_format: string;
  net_sales: number;
}

export interface FilterState {
  weekStartDates: string[];
  regions: string[];
  storeNames: string[];
  cities: string[];
  storeFormats: string[];
  productCategories: string[];
}

export interface KpiMetrics {
  grossSales: number;
  discountAmount: number;
  returnsAmount: number;
  netSales: number;
  salesTarget: number;
  targetAchievementPct: number;
  totalTransactions: number;
  averageTransactionValue: number;
  returnRatePct: number;
  discountRatePct: number;
  totalStockoutIncidents: number;
  recordCount: number;
}

export interface RegionSummary {
  region: string;
  netSales: number;
  salesTarget: number;
  achievementPct: number;
  grossSales: number;
  transactions: number;
  stockouts: number;
}

export interface StoreSummary {
  storeId: string;
  storeName: string;
  region: string;
  city: string;
  storeFormat: string;
  netSales: number;
  salesTarget: number;
  achievementPct: number;
  variance: number;
  stockouts: number;
  returnRatePct: number;
}

export interface CategorySummary {
  category: string;
  grossSales: number;
  netSales: number;
  returnsAmount: number;
  discountAmount: number;
  returnRatePct: number;
  discountRatePct: number;
  stockouts: number;
  stockoutSharePct: number;
}

export interface ExecutiveInsights {
  bestRegion: RegionSummary | null;
  worstRegion: RegionSummary | null;
  failingStores: StoreSummary[];
  highReturnCategories: CategorySummary[];
  criticalStockoutCategories: CategorySummary[];
  criticalStockoutStores: StoreSummary[];
  generatedAt: string;
}
