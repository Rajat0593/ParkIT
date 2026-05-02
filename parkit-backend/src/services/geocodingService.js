const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Geocoding Service
 * Converts addresses to coordinates and coordinates to addresses
 * Uses Google Maps Geocoding API
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

/**
 * Geocode an address to get latitude and longitude
 * @param {string} address - The address to geocode
 * @returns {Promise<{latitude: number, longitude: number, formatted_address: string}>}
 */
exports.geocodeAddress = async (address) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      logger.error('Google Maps API key not configured');
      throw new Error('Google Maps API key is required. Set GOOGLE_MAPS_API_KEY environment variable.');
    }

    const response = await axios.get(GOOGLE_GEOCODING_URL, {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY
      },
      timeout: 5000
    });

    if (response.data.status !== 'OK') {
      logger.warn(`Geocoding failed for address: ${address}, Status: ${response.data.status}`);
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }

    const result = response.data.results[0];
    const location = result.geometry.location;

    return {
      latitude: location.lat,
      longitude: location.lng,
      formatted_address: result.formatted_address,
      address_components: result.address_components,
      geometry: result.geometry,
      place_id: result.place_id
    };
  } catch (error) {
    logger.error('Error geocoding address:', error.message);
    throw error;
  }
};

/**
 * Reverse geocode coordinates to get address
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{address: string, address_components: array}>}
 */
exports.reverseGeocodeCoordinates = async (latitude, longitude) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is required');
    }

    const response = await axios.get(GOOGLE_GEOCODING_URL, {
      params: {
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY
      },
      timeout: 5000
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Reverse geocoding failed: ${response.data.status}`);
    }

    const result = response.data.results[0];

    return {
      address: result.formatted_address,
      address_components: result.address_components
    };
  } catch (error) {
    logger.error('Error reverse geocoding coordinates:', error.message);
    throw error;
  }
};

/**
 * Get multiple address suggestions from partial input
 * Uses Google Places Autocomplete API
 * @param {string} input - Partial address input
 * @param {number} latitude - Optional user latitude for location bias
 * @param {number} longitude - Optional user longitude for location bias
 * @returns {Promise<array>}
 */
exports.getAddressAutocompleteSuggestions = async (input, latitude, longitude) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is required');
    }

    const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

    const params = {
      input,
      key: GOOGLE_MAPS_API_KEY,
      language: 'en'
    };

    // Add location bias if coordinates provided
    if (latitude && longitude) {
      params.location = `${latitude},${longitude}`;
      params.radius = 50000; // 50km radius for bias
    }

    const response = await axios.get(AUTOCOMPLETE_URL, {
      params,
      timeout: 5000
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Autocomplete failed: ${response.data.status}`);
    }

    return response.data.predictions.map(prediction => ({
      place_id: prediction.place_id,
      description: prediction.description,
      main_text: prediction.main_text,
      secondary_text: prediction.secondary_text
    }));
  } catch (error) {
    logger.error('Error getting autocomplete suggestions:', error.message);
    throw error;
  }
};

/**
 * Get place details from place_id (from autocomplete)
 * @param {string} placeId - Place ID from autocomplete
 * @returns {Promise<{latitude: number, longitude: number, address: string}>}
 */
exports.getPlaceDetails = async (placeId) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is required');
    }

    const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

    const response = await axios.get(PLACE_DETAILS_URL, {
      params: {
        place_id: placeId,
        fields: 'geometry,formatted_address,address_components',
        key: GOOGLE_MAPS_API_KEY
      },
      timeout: 5000
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Place details request failed: ${response.data.status}`);
    }

    const location = response.data.result.geometry.location;

    return {
      latitude: location.lat,
      longitude: location.lng,
      formatted_address: response.data.result.formatted_address,
      address_components: response.data.result.address_components
    };
  } catch (error) {
    logger.error('Error getting place details:', error.message);
    throw error;
  }
};

/**
 * Get coordinates from address with fallback to mock data for testing
 * Use this in development if Google Maps API key is not available
 * @param {string} address
 * @returns {Promise<{latitude: number, longitude: number, formatted_address: string}>}
 */
exports.geocodeAddressWithFallback = async (address) => {
  try {
    // Try real geocoding first
    return await exports.geocodeAddress(address);
  } catch (error) {
    logger.warn('Real geocoding failed, using mock data for testing');

    // Mock data for common test locations
    const mockLocations = {
      'delhi mall': { latitude: 28.5921, longitude: 77.1385, formatted_address: 'Delhi Mall, Delhi' },
      'connaught place': { latitude: 28.6328, longitude: 77.1897, formatted_address: 'Connaught Place, Delhi' },
      'india gate': { latitude: 28.6129, longitude: 77.1791, formatted_address: 'India Gate, Delhi' },
      'mall of india': { latitude: 28.6692, longitude: 77.1025, formatted_address: 'Mall of India, Delhi' },
      'noida city center': { latitude: 28.5865, longitude: 77.3619, formatted_address: 'Noida City Center, Noida' }
    };

    const normalizedAddress = address.toLowerCase().trim();
    for (const [key, location] of Object.entries(mockLocations)) {
      if (normalizedAddress.includes(key) || key.includes(normalizedAddress)) {
        logger.info(`Using mock location for: ${address}`);
        return { ...location, source: 'mock' };
      }
    }

    // If no mock location found, throw error
    throw new Error(`Could not find location for: ${address}`);
  }
};

/**
 * Extract address components from Google Maps response
 * @param {array} addressComponents - Address components from Google Maps API
 * @returns {object} Structured address object
 */
exports.extractAddressComponents = (addressComponents) => {
  const components = {
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: ''
  };

  addressComponents.forEach(component => {
    const types = component.types;
    if (types.includes('street_number')) {
      components.street += component.long_name + ' ';
    }
    if (types.includes('route')) {
      components.street += component.long_name;
    }
    if (types.includes('locality')) {
      components.city = component.long_name;
    }
    if (types.includes('administrative_area_level_1')) {
      components.state = component.long_name;
    }
    if (types.includes('country')) {
      components.country = component.long_name;
    }
    if (types.includes('postal_code')) {
      components.postal_code = component.long_name;
    }
  });

  return components;
};

module.exports.geocodeService = {
  geocodeAddress: exports.geocodeAddress,
  reverseGeocodeCoordinates: exports.reverseGeocodeCoordinates,
  getAddressAutocompleteSuggestions: exports.getAddressAutocompleteSuggestions,
  getPlaceDetails: exports.getPlaceDetails,
  geocodeAddressWithFallback: exports.geocodeAddressWithFallback,
  extractAddressComponents: exports.extractAddressComponents
};
