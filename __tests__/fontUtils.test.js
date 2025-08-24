const { 
  calculateNewFontSize, 
  shouldApplyToUrl, 
  generateExportFilename 
} = require('../src/utils/fontUtils');

describe('Font Utilities', () => {
  describe('calculateNewFontSize', () => {
    test('should return null if currentSize or increaseMethod is missing', () => {
      expect(calculateNewFontSize(null, { type: 'fixed', value: 16, unit: 'px' })).toBeNull();
      expect(calculateNewFontSize(12, null)).toBeNull();
    });
    
    test('should return fixed size when type is fixed', () => {
      const result = calculateNewFontSize(12, { type: 'fixed', value: 16, unit: 'px' });
      expect(result).toBe('16px');
    });
    
    test('should use the provided unit', () => {
      expect(calculateNewFontSize(12, { type: 'fixed', value: 2, unit: 'em' })).toBe('2em');
      expect(calculateNewFontSize(12, { type: 'fixed', value: 2, unit: 'rem' })).toBe('2rem');
    });
  });
  
  describe('shouldApplyToUrl', () => {
    test('should return true if domains array is empty', () => {
      expect(shouldApplyToUrl('https://example.com', 'example.com', [], 'blacklist')).toBe(true);
      expect(shouldApplyToUrl('https://example.com', 'example.com', [], 'whitelist')).toBe(true);
    });
    
    test('should handle whitelist correctly', () => {
      const domains = [
        { value: 'example.com', isRegex: false },
        { value: 'test.org', isRegex: false }
      ];
      
      expect(shouldApplyToUrl('https://example.com/page', 'example.com', domains, 'whitelist')).toBe(true);
      expect(shouldApplyToUrl('https://other.com/page', 'other.com', domains, 'whitelist')).toBe(false);
    });
    
    test('should handle blacklist correctly', () => {
      const domains = [
        { value: 'example.com', isRegex: false },
        { value: 'test.org', isRegex: false }
      ];
      
      expect(shouldApplyToUrl('https://example.com/page', 'example.com', domains, 'blacklist')).toBe(false);
      expect(shouldApplyToUrl('https://other.com/page', 'other.com', domains, 'blacklist')).toBe(true);
    });
    
    test('should handle regex domains', () => {
      const domains = [
        { value: 'example\\.com', isRegex: true },
        { value: '.*\\.test\\.org', isRegex: true }
      ];
      
      expect(shouldApplyToUrl('https://example.com/page', 'example.com', domains, 'whitelist')).toBe(true);
      expect(shouldApplyToUrl('https://sub.test.org/page', 'sub.test.org', domains, 'whitelist')).toBe(true);
      expect(shouldApplyToUrl('https://other.com/page', 'other.com', domains, 'whitelist')).toBe(false);
    });
    
    test('should handle invalid regex gracefully', () => {
      const domains = [
        { value: '(invalid', isRegex: true }
      ];
      
      // Should not throw and should return false for whitelist
      expect(shouldApplyToUrl('https://example.com', 'example.com', domains, 'whitelist')).toBe(false);
      // Should not throw and should return true for blacklist
      expect(shouldApplyToUrl('https://example.com', 'example.com', domains, 'blacklist')).toBe(true);
    });
  });
  
  describe('generateExportFilename', () => {
    test('should generate filename with current date if no date provided', () => {
      const result = generateExportFilename();
      const today = new Date();
      const expected = `extension-settings-${today.getFullYear().toString().substr(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}.json`;
      expect(result).toBe(expected);
    });
    
    test('should generate filename with provided date', () => {
      const testDate = new Date(2023, 0, 15); // Jan 15, 2023
      const result = generateExportFilename(testDate);
      expect(result).toBe('extension-settings-230115.json');
    });
  });
});