// Fetch country code from ipinfo.io
export async function fetchCountryCode(): Promise<string | null> {
  try {
    const token = import.meta.env.VITE_IPINFO_TOKEN;
    const res = await fetch(`https://ipinfo.io/json?token=${token}`);
    const data = await res.json();
    return data.country || null;
  } catch {
    return null;
  }
}

// Convert country code (e.g., 'US') to flag image URL (using flagcdn.com)
export function countryCodeToFlagImg(countryCode: string, size: number = 24): string {
  if (!countryCode) return '';
  return `https://flagcdn.com/w${size}/${countryCode.toLowerCase()}.png`;
} 