# State-Refund-Look-Up

This project provides a lightweight, static web tool for checking state income tax refund status via a state dropdown powered by a CSV of official refund links.

## Features

- **Smart State Handling**: Automatically detects and handles states without income tax or with limited income tax
- **Resource Links**: Provides access to main tax websites, business tax resources, and property tax resources
- **Fallback Mechanism**: Shows alternative links if the primary refund page doesn't open
- **Link Verification**: Includes Node.js script for automated link verification

## Usage

1. Open `index.html` in a web browser
2. Select your state from the dropdown menu
3. Click "Check Refund Status" to:
   - Open the official state refund page (for states with income tax)
   - View helpful tax resources (for states without/limited income tax)

## States Without Income Tax

The following states do not have state income tax and will be redirected to an information page with alternative resources:
- Alaska
- Florida
- Nevada
- South Dakota
- Tennessee (repealed in 2021)
- Texas
- Washington
- Wyoming

**Note**: New Hampshire only taxes interest and dividends, so most residents don't need to file.

## Files

- `index.html` - Main web page with state selector
- `state-info.html` - Information page for states without/limited income tax
- `states.csv` - CSV file containing state data (refund URLs, tax status, resource links)
- `app.js` - JavaScript to load CSV and handle user interactions
- `state-info.js` - JavaScript for the state information page
- `styles.css` - Styling for the web interface
- `verify-links.js` - Node.js script for link verification

## Link Verification

### Browser-based Verification (Admin)
Open the browser console and run:
```javascript
verifyAllLinks()
```
Note: Browser CORS limitations mean this is best-effort verification.

### Comprehensive Verification (Node.js)
Run the Node.js verification script to check all URLs:
```bash
node verify-links.js
```

This will:
- Check all state URLs via HEAD requests
- Implement proper timeout and rate limiting
- Generate `verification-results.json` with detailed results
- Skip refund URL checks for states without income tax

## CSV Structure

The `states.csv` file contains the following columns:
- **State** - State name
- **RefundURL** - Where's My Refund page URL (or N/A if no income tax)
- **MainTaxURL** - Main state tax department website
- **HasIncomeTax** - Values: "true", "false", or "limited"
- **BusinessURL** - Business tax resources page
- **PropertyURL** - Property tax resources page