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

// Convert country code (e.g., 'US') to flag emoji
export function countryCodeToFlagEmoji(countryCode: string): string {
  if (!countryCode) return '';
  return countryCode
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
} 