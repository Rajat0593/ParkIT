import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'parkit_search_cache_';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 50; // Maximum number of cached searches

/**
 * Generate cache key from search parameters
 */
function generateCacheKey(params) {
  const key = [
    params.latitude?.toFixed(4),
    params.longitude?.toFixed(4),
    params.radius || 5,
    params.vehicle_type || 'all',
    params.sort_by || 'distance',
  ].join('_');

  return `${CACHE_PREFIX}${key}`;
}

/**
 * Get cached search results
 */
export async function getCachedSearch(params) {
  try {
    const cacheKey = generateCacheKey(params);
    const cached = await AsyncStorage.getItem(cacheKey);

    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache has expired
    if (now - timestamp > CACHE_TTL) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Save search results to cache
 */
export async function setCachedSearch(params, data) {
  try {
    const cacheKey = generateCacheKey(params);
    const cacheData = {
      data,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));

    // Cleanup old cache entries if exceeding MAX_CACHE_SIZE
    await cleanupOldCache();
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

/**
 * Clear cache for specific search
 */
export async function clearCacheForSearch(params) {
  try {
    const cacheKey = generateCacheKey(params);
    await AsyncStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Clear all parking search cache
 */
export async function clearAllSearchCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    const cacheItems = await AsyncStorage.multiGet(cacheKeys);

    let totalSize = 0;
    let expiredCount = 0;
    const now = Date.now();

    cacheItems.forEach(([_, value]) => {
      if (value) {
        const { timestamp } = JSON.parse(value);
        totalSize += value.length;

        if (now - timestamp > CACHE_TTL) {
          expiredCount += 1;
        }
      }
    });

    return {
      totalEntries: cacheKeys.length,
      expiredEntries: expiredCount,
      totalSize: (totalSize / 1024).toFixed(2) + ' KB',
      estimatedTTL: CACHE_TTL / 60000 + ' minutes',
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
}

/**
 * Cleanup expired cache entries
 */
async function cleanupOldCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    if (cacheKeys.length <= MAX_CACHE_SIZE) return;

    // Get all cache entries with timestamps
    const cacheItems = await AsyncStorage.multiGet(cacheKeys);
    const itemsWithTime = cacheItems.map(([key, value]) => ({
      key,
      timestamp: value ? JSON.parse(value).timestamp : 0,
    }));

    // Sort by timestamp and remove oldest
    itemsWithTime.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = itemsWithTime
      .slice(0, Math.max(10, cacheKeys.length - MAX_CACHE_SIZE))
      .map((item) => item.key);

    await AsyncStorage.multiRemove(toRemove);
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}

/**
 * Initialize cache optimization
 * Runs cleanup on app startup
 */
export async function initializeCacheOptimization() {
  try {
    const stats = await getCacheStats();
    console.log('Cache stats:', stats);

    // Remove expired entries
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    const now = Date.now();

    const expiredKeys = [];
    const cacheItems = await AsyncStorage.multiGet(cacheKeys);

    cacheItems.forEach(([key, value]) => {
      if (value) {
        const { timestamp } = JSON.parse(value);
        if (now - timestamp > CACHE_TTL) {
          expiredKeys.push(key);
        }
      }
    });

    if (expiredKeys.length > 0) {
      await AsyncStorage.multiRemove(expiredKeys);
      console.log(`Removed ${expiredKeys.length} expired cache entries`);
    }
  } catch (error) {
    console.error('Error initializing cache optimization:', error);
  }
}

/**
 * Cache middleware for API calls
 * Usage: await cacheMiddleware(params, () => apiCall())
 */
export async function cacheMiddleware(params, apiCall, options = {}) {
  const { useCache = true, forceFresh = false } = options;

  // Check cache if enabled
  if (useCache && !forceFresh) {
    const cached = await getCachedSearch(params);
    if (cached) {
      console.log('Using cached search results');
      return cached;
    }
  }

  // Call API
  try {
    const data = await apiCall();

    // Save to cache
    if (useCache) {
      await setCachedSearch(params, data);
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

export default {
  getCachedSearch,
  setCachedSearch,
  clearCacheForSearch,
  clearAllSearchCache,
  getCacheStats,
  initializeCacheOptimization,
  cacheMiddleware,
  generateCacheKey,
};
