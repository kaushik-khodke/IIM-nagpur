import districtsData from "./districts.json";

export interface GeolocationResult {
  state: string;
  district: string;
}

/**
 * Requests the browser's current GPS position and uses OpenStreetMap Nominatim
 * reverse geocoding to retrieve the state and district names.
 */
export async function detectUserLocation(): Promise<GeolocationResult | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Nominatim reverse geocoding. accept-language=en ensures English responses.
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`
          );
          if (!res.ok) {
            resolve(null);
            return;
          }
          const data = await res.json();
          if (data && data.address) {
            const address = data.address;
            const detectedState = address.state || "";
            // Check various address fields where the district/county/city might be stored in India
            const detectedDistrict =
              address.state_district ||
              address.county ||
              address.district ||
              address.city ||
              address.suburb ||
              "";

            resolve({ state: detectedState, district: detectedDistrict });
            return;
          }
        } catch (err) {
          console.error("Error in Nominatim reverse geocoding:", err);
        }
        resolve(null);
      },
      (error) => {
        console.warn("Geolocation permission denied or error:", error);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/**
 * Fuzzy matches a raw state and district string against our districts.json list.
 * Returns the exact state and district name from our dataset.
 */
export function matchLocationWithDistricts(
  stateName: string,
  districtName: string
): GeolocationResult | null {
  if (!stateName || !districtName) return null;

  // 1. Find matching state
  const stateMatch = districtsData.states.find(
    (s) =>
      s.state.toLowerCase() === stateName.toLowerCase() ||
      stateName.toLowerCase().includes(s.state.toLowerCase()) ||
      s.state.toLowerCase().includes(stateName.toLowerCase())
  );

  if (!stateMatch) return null;

  // 2. Find matching district within that state
  const cleanDetectedDistrict = districtName
    .toLowerCase()
    .replace("district", "")
    .replace("dist", "")
    .trim();

  // Try direct string inclusion/match
  let districtMatch = stateMatch.districts.find((d) => {
    const cleanD = d.toLowerCase().replace(/[\(\)]/g, "");
    return cleanD.includes(cleanDetectedDistrict) || cleanDetectedDistrict.includes(cleanD);
  });

  // If no match found, try a looser match or fallback to the first district in that state
  if (!districtMatch) {
    districtMatch = stateMatch.districts[0];
  }

  return {
    state: stateMatch.state,
    district: districtMatch,
  };
}
