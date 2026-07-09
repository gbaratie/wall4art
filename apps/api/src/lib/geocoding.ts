const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'Wall4Art/0.1 (https://wall4art.local; geocoding@wall4art.local)';

let lastRequestAt = 0;

async function nominatimFetch(path: string, params: Record<string, string>) {
  const now = Date.now();
  const waitMs = Math.max(0, 1000 - (now - lastRequestAt));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastRequestAt = Date.now();

  const url = new URL(path, NOMINATIM_BASE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding service unavailable (${response.status})`);
  }

  return response.json();
}

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    postcode?: string;
  };
};

export type GeocodedAddress = {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  postalCode: string;
  label: string;
};

function extractCity(address: NominatimResult['address']) {
  return (
    address?.city ??
    address?.town ??
    address?.village ??
    address?.municipality ??
    ''
  );
}

function extractStreet(address: NominatimResult['address']) {
  if (!address) return '';
  const parts = [address.house_number, address.road].filter(Boolean);
  return parts.join(' ').trim();
}

function toGeocodedAddress(result: NominatimResult): GeocodedAddress {
  const street = extractStreet(result.address);
  const city = extractCity(result.address);

  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    address: street || result.display_name.split(',')[0]?.trim() || result.display_name,
    city,
    postalCode: result.address?.postcode ?? '',
    label: result.display_name,
  };
}

export async function geocodeAddress(input: {
  address: string;
  city: string;
  postalCode: string;
}): Promise<GeocodedAddress> {
  const query = [input.address, input.postalCode, input.city, 'France']
    .filter(Boolean)
    .join(', ');

  const results = (await nominatimFetch('/search', {
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '1',
    countrycodes: 'fr',
  })) as NominatimResult[];

  if (results.length) {
    const geocoded = toGeocodedAddress(results[0]);
    return {
      ...geocoded,
      address: input.address.trim() || geocoded.address,
      city: input.city.trim() || geocoded.city,
      postalCode: input.postalCode.trim() || geocoded.postalCode,
    };
  }

  const fallbackQuery = [input.postalCode, input.city, 'France'].filter(Boolean).join(', ');
  const fallbackResults = (await nominatimFetch('/search', {
    q: fallbackQuery,
    format: 'json',
    addressdetails: '1',
    limit: '1',
    countrycodes: 'fr',
  })) as NominatimResult[];

  if (!fallbackResults.length) {
    throw new Error('Adresse introuvable. Vérifiez l’adresse, la ville et le code postal.');
  }

  const fallback = toGeocodedAddress(fallbackResults[0]);
  return {
    latitude: fallback.latitude,
    longitude: fallback.longitude,
    address: input.address.trim(),
    city: input.city.trim() || fallback.city,
    postalCode: input.postalCode.trim() || fallback.postalCode,
    label: `${input.address}, ${input.postalCode} ${input.city}`,
  };
}

export async function geocodeCity(city: string): Promise<{ latitude: number; longitude: number }> {
  const results = (await nominatimFetch('/search', {
    q: `${city}, France`,
    format: 'json',
    limit: '1',
    countrycodes: 'fr',
  })) as NominatimResult[];

  if (!results.length) {
    throw new Error('Ville introuvable. Vérifiez le nom de la ville.');
  }

  return {
    latitude: Number(results[0].lat),
    longitude: Number(results[0].lon),
  };
}

export async function searchAddresses(
  query: string,
  limit = 5,
): Promise<GeocodedAddress[]> {
  const results = (await nominatimFetch('/search', {
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: String(limit),
    countrycodes: 'fr',
  })) as NominatimResult[];

  return results.map(toGeocodedAddress).filter((item) => item.city);
}
