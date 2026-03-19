/**
 * Reverse geocode coordinates to get location details using Nominatim API
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns Object containing address details (address, city, country)
 */
export async function reverseGeocode(latitude: number, longitude: number) {
  try {
    console.log('[v0] Reverse geocoding:', { latitude, longitude });
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SmartBin-App/1.0',
        },
      }
    );

    if (!response.ok) {
      console.warn('[v0] Geocoding API returned status:', response.status);
      return {
        address: '',
        city: '',
        country: 'India',
      };
    }

    const data = await response.json();
    console.log('[v0] Reverse geocode result:', data);

    const address = data.address || {};
    const city = address.city || address.town || address.village || address.county || '';
    const displayName = data.display_name || '';

    return {
      address: displayName,
      city: city,
      country: address.country || 'India',
    };
  } catch (error) {
    console.error('[v0] Reverse geocoding error:', error);
    return {
      address: '',
      city: '',
      country: 'India',
    };
  }
}
