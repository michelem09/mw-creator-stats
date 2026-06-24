export const fmt = (n: number): string => {
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toLocaleString("en-US");
};

export const fmt0 = (n: number): string =>
  Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "0";

export const pct = (num: number, den: number, digits = 1): string => {
  if (!den) return "0%";
  return ((num / den) * 100).toFixed(digits) + "%";
};

export const daysAgo = (n: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

export const today = (): string => new Date().toISOString().slice(0, 10);
