export const formatNumber = (num, decimals = 1) => {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatPercent = (num, decimals = 1) => {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return `${Number(num).toFixed(decimals)}%`;
};

export const formatCurrency = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '$0.00';
  return `$${Number(num).toFixed(2)}`;
};

export const formatKWh = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '- kWh';
  return `${Number(num).toFixed(decimals)} kWh`;
};
