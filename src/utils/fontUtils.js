/**
 * Utility functions for font size calculations and domain matching
 */

/**
 * Calculate the new font size based on the current size and increase method
 * @param {number} currentSize - Current font size in pixels
 * @param {Object} increaseMethod - Method configuration object
 * @param {string} increaseMethod.type - 'fixed' only
 * @param {number} increaseMethod.value - The exact size to apply
 * @param {string} increaseMethod.unit - 'px', 'em', or 'rem'
 * @returns {string} - New font size with unit
 */
function calculateNewFontSize(currentSize, increaseMethod) {
  if (!currentSize || !increaseMethod) {
    return null;
  }
  
  if (!increaseMethod.unit || typeof increaseMethod.value !== 'number') {
    return null;
  }
  
  const newSize = increaseMethod.value;
  return `${newSize}${increaseMethod.unit}`;
}

/**
 * Check if a URL should have font size changes applied based on domain lists
 * @param {string} url - The URL to check
 * @param {string} hostname - The hostname part of the URL
 * @param {Array} domains - Array of domain objects with value and isRegex properties
 * @param {string} listType - 'whitelist' or 'blacklist'
 * @returns {boolean} - Whether changes should be applied
 */
function shouldApplyToUrl(url, hostname, domains, listType) {
  // If no domains defined, apply everywhere
  if (!domains || domains.length === 0) {
    return true;
  }
  
  const matchesDomain = domains.some(domain => {
    if (!domain || !domain.value) {
      return false;
    }
    
    if (domain.isRegex) {
      try {
        const regex = new RegExp(domain.value);
        return regex.test(url);
      } catch (e) {
        console.error('Invalid regex:', domain.value, e);
        return false;
      }
    } else {
      // Non-regex matches URL start
      return hostname.startsWith(domain.value) || hostname === domain.value;
    }
  });
  
  // Apply based on list type
  return listType === 'whitelist' ? matchesDomain : !matchesDomain;
}

/**
 * Generate a filename for settings export
 * @param {Date} date - Date object to use for the filename
 * @returns {string} - Formatted filename
 */
function generateExportFilename(date = new Date()) {
  return `extension-settings-${date.getFullYear().toString().substr(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}.json`;
}

module.exports = {
  calculateNewFontSize,
  shouldApplyToUrl,
  generateExportFilename
};