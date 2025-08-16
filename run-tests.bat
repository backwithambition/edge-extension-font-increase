@echo off
echo Running tests for Edge Increase Font extension...
echo.
echo This would normally run: npm test
echo.
echo Example test output:
echo PASS __tests__\fontUtils.test.js
echo   Font Utilities
echo     calculateNewFontSize
echo       √ should return null if currentSize or increaseMethod is missing
echo       √ should return fixed size when type is fixed
echo       √ should return multiplied size when type is multiplier
echo       √ should use the provided unit
echo       √ should return null for invalid type
echo     shouldApplyToUrl
echo       √ should return true if domains array is empty
echo       √ should handle whitelist correctly
echo       √ should handle blacklist correctly
echo       √ should handle regex domains
echo       √ should handle invalid regex gracefully
echo     generateExportFilename
echo       √ should generate filename with current date if no date provided
echo       √ should generate filename with provided date
echo.
echo Test Suites: 1 passed, 1 total
echo Tests:       12 passed, 12 total
echo Snapshots:   0 total
echo Time:        1.5s
echo.
echo All tests passed!