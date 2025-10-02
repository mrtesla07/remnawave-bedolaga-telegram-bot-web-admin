export function countryCodeToFlag(countryCode: string): string {
  if (!countryCode) return "??";
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function countryCodeToFlagUrl(countryCode: string, format: "svg" | "png" = "svg", size: number = 32): string {
  const code = (countryCode || "").toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) return "";
  if (format === "svg") {
    return `https://flagcdn.com/${code}.svg`;
  }
  const height = Math.max(16, Math.min(64, Math.round(size)));
  return `https://flagcdn.com/h${height}/${code}.png`;
}


