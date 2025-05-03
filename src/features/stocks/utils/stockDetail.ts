// src/features/stocks/utils/stockDetail.ts

import {
  StockDetailQuote,
  CompanyProfile,
  HistoricalPrice,
  KeyMetrics,
} from '../models/stockDetail';

/**
 * Transform API response to StockDetailQuote model
 */
export const transformStockDetailQuote = (data: any): StockDetailQuote => {
  if (!data || typeof data !== 'object' || !data.symbol) {
    throw new Error('Invalid stock quote data');
  }

  return {
    symbol: data.symbol,
    name: data.name || '',
    price: parseFloat(data.price) || 0,
    change: parseFloat(data.change) || 0,
    changePercent: parseFloat(data.changesPercentage) || 0,
    dayHigh: parseFloat(data.dayHigh) || 0,
    dayLow: parseFloat(data.dayLow) || 0,
    yearHigh: parseFloat(data.yearHigh) || 0,
    yearLow: parseFloat(data.yearLow) || 0,
    marketCap: parseFloat(data.marketCap) || 0,
    volume: parseInt(data.volume) || 0,
    avgVolume: parseInt(data.avgVolume) || 0,
    pe: data.pe ? parseFloat(data.pe) : null,
    eps: data.eps ? parseFloat(data.eps) : null,
    beta: data.beta ? parseFloat(data.beta) : null,
    dividend: data.lastDiv ? parseFloat(data.lastDiv) : null,
    dividendYield: data.dividendYield ? parseFloat(data.dividendYield) : null,
    nextEarningsDate: data.earningsAnnouncement || null,
    open: parseFloat(data.open) || 0,
    previousClose: parseFloat(data.previousClose) || 0,
    timestamp: data.timestamp || Math.floor(Date.now() / 1000),
    exchange: data.exchange || '',
  };
};

/**
 * Transform API response to CompanyProfile model
 */
export const transformCompanyProfile = (data: any): CompanyProfile => {
  if (!data || typeof data !== 'object' || !data.symbol) {
    throw new Error('Invalid company profile data');
  }

  return {
    symbol: data.symbol,
    name: data.companyName || '',
    description: data.description || '',
    sector: data.sector || '',
    industry: data.industry || '',
    employees: parseInt(data.fullTimeEmployees) || 0,
    ceo: data.ceo || '',
    website: data.website || '',
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    country: data.country || '',
    zip: data.zip || '',
    ipoDate: data.ipoDate || null,
    exchange: data.exchangeShortName || '',
    exchangeSymbol: data.exchange || '',
    currency: data.currency || 'USD',
    logo: data.image || null,
  };
};

/**
 * Transform API response to HistoricalPrice model (for daily data)
 */
export const transformHistoricalPrices = (data: any[]): HistoricalPrice[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(item => ({
      date: item.date || '',
      timestamp: new Date(item.date).getTime() / 1000,
      open: parseFloat(item.open) || 0,
      high: parseFloat(item.high) || 0,
      low: parseFloat(item.low) || 0,
      close: parseFloat(item.close) || 0,
      volume: parseInt(item.volume) || 0,
    }))
    .sort((a, b) => a.timestamp - b.timestamp); // Sort by date ascending
};

/**
 * Transform API response to HistoricalPrice model (for intraday data)
 */
export const transformIntradayPrices = (data: any[]): HistoricalPrice[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(item => ({
      date: item.date || '',
      timestamp: new Date(item.date).getTime() / 1000,
      open: parseFloat(item.open) || 0,
      high: parseFloat(item.high) || 0,
      low: parseFloat(item.low) || 0,
      close: parseFloat(item.close) || 0,
      volume: parseInt(item.volume) || 0,
    }))
    .sort((a, b) => a.timestamp - b.timestamp); // Sort by date ascending
};

/**
 * Transform API response to KeyMetrics model
 */
export const transformKeyMetrics = (data: any): KeyMetrics => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid key metrics data');
  }

  return {
    date: data.date || '',
    marketCap: parseFloat(data.marketCap) || 0,
    peRatio: data.peRatio !== undefined ? parseFloat(data.peRatio) : null,
    pbRatio: data.pbRatio !== undefined ? parseFloat(data.pbRatio) : null,
    dividendYield: data.dividendYield !== undefined ? parseFloat(data.dividendYield) : null,
    roe: data.roe !== undefined ? parseFloat(data.roe) : null,
    roa: data.roa !== undefined ? parseFloat(data.roa) : null,
    debtToEquity: data.debtToEquity !== undefined ? parseFloat(data.debtToEquity) : null,
    currentRatio: data.currentRatio !== undefined ? parseFloat(data.currentRatio) : null,
    quickRatio: data.quickRatio !== undefined ? parseFloat(data.quickRatio) : null,
    enterpriseValue: data.enterpriseValue !== undefined ? parseFloat(data.enterpriseValue) : null,
    evToRevenue: data.evToRevenue !== undefined ? parseFloat(data.evToRevenue) : null,
    evToEbitda: data.evToEbitda !== undefined ? parseFloat(data.evToEbitda) : null,
    earningsYield: data.earningsYield !== undefined ? parseFloat(data.earningsYield) : null,
    freeCashFlowYield:
      data.freeCashFlowYield !== undefined ? parseFloat(data.freeCashFlowYield) : null,
    payoutRatio: data.payoutRatio !== undefined ? parseFloat(data.payoutRatio) : null,
    priceToBookRatio:
      data.priceToBookRatio !== undefined ? parseFloat(data.priceToBookRatio) : null,
    priceToSalesRatio:
      data.priceToSalesRatio !== undefined ? parseFloat(data.priceToSalesRatio) : null,
    grahamNumber: data.grahamNumber !== undefined ? parseFloat(data.grahamNumber) : null,
  };
};

/**
 * Format price with custom precision
 */
export const formatPrice = (price: number, precision: number = 2): string => {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
};

/**
 * Format number to currency
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format number to compact format with proper suffix (K, M, B, T)
 */
export const formatCompactNumber = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return 'N/A';
  }

  if (Math.abs(num) < 1000) {
    return num.toFixed(2);
  }

  const absNum = Math.abs(num);
  const sign = Math.sign(num);
  const signPrefix = sign < 0 ? '-' : '';

  if (absNum >= 1_000_000_000_000) {
    return `${signPrefix}${(absNum / 1_000_000_000_000).toFixed(2)}T`;
  } else if (absNum >= 1_000_000_000) {
    return `${signPrefix}${(absNum / 1_000_000_000).toFixed(2)}B`;
  } else if (absNum >= 1_000_000) {
    return `${signPrefix}${(absNum / 1_000_000).toFixed(2)}M`;
  } else {
    return `${signPrefix}${(absNum / 1_000).toFixed(2)}K`;
  }
};

/**
 * Format change value with +/- sign and percentage
 */
export const formatChange = (change: number, changePercent: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
};

/**
 * Format date from ISO date string to locale formatted date
 */
export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'N/A';

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (err) {
    console.error('Error formatting date:', err);
    return 'N/A';
  }
};
