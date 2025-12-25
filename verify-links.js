#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Parse CSV
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        if (values.length >= headers.length) {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index];
            });
            data.push(obj);
        }
    }
    
    return data;
}

// Make HEAD request to verify URL
function checkUrl(url, timeout = 10000) {
    return new Promise((resolve) => {
        if (!url || url === 'N/A') {
            resolve({ success: false, status: 'N/A', message: 'Skipped' });
            return;
        }
        
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        const options = {
            method: 'HEAD',
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            timeout: timeout,
            headers: {
                'User-Agent': 'Mozilla/5.0 (State-Refund-Verification-Bot)'
            }
        };
        
        const req = protocol.request(options, (res) => {
            const success = res.statusCode >= 200 && res.statusCode < 400;
            resolve({
                success: success,
                status: res.statusCode,
                message: success ? 'OK' : `HTTP ${res.statusCode}`
            });
        });
        
        req.on('error', (error) => {
            resolve({
                success: false,
                status: 'ERROR',
                message: error.message
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                success: false,
                status: 'TIMEOUT',
                message: 'Request timed out'
            });
        });
        
        req.end();
    });
}

// Sleep function for rate limiting
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main verification function
async function verifyAllLinks() {
    console.log('State Refund Link Verification Tool');
    console.log('====================================\n');
    
    // Read CSV file
    const csvPath = path.join(__dirname, 'states.csv');
    let csvText;
    
    try {
        csvText = fs.readFileSync(csvPath, 'utf8');
    } catch (error) {
        console.error('Error reading states.csv:', error.message);
        process.exit(1);
    }
    
    const states = parseCSV(csvText);
    const results = [];
    
    for (const state of states) {
        console.log(`\nVerifying ${state.State}...`);
        const stateResult = {
            state: state.State,
            hasIncomeTax: state.HasIncomeTax,
            urls: {}
        };
        
        // Check RefundURL (skip if HasIncomeTax is false)
        if (state.HasIncomeTax === 'false') {
            console.log('  RefundURL: N/A (no income tax)');
            stateResult.urls.RefundURL = { url: state.RefundURL, result: { success: true, status: 'N/A', message: 'No income tax' } };
        } else {
            console.log(`  Checking RefundURL: ${state.RefundURL}`);
            const result = await checkUrl(state.RefundURL);
            stateResult.urls.RefundURL = { url: state.RefundURL, result };
            console.log(`    ${result.success ? '✓' : '✗'} ${result.message}`);
            await sleep(500);
        }
        
        // Check MainTaxURL
        console.log(`  Checking MainTaxURL: ${state.MainTaxURL}`);
        const mainResult = await checkUrl(state.MainTaxURL);
        stateResult.urls.MainTaxURL = { url: state.MainTaxURL, result: mainResult };
        console.log(`    ${mainResult.success ? '✓' : '✗'} ${mainResult.message}`);
        await sleep(500);
        
        // Check BusinessURL
        console.log(`  Checking BusinessURL: ${state.BusinessURL}`);
        const businessResult = await checkUrl(state.BusinessURL);
        stateResult.urls.BusinessURL = { url: state.BusinessURL, result: businessResult };
        console.log(`    ${businessResult.success ? '✓' : '✗'} ${businessResult.message}`);
        await sleep(500);
        
        // Check PropertyURL
        console.log(`  Checking PropertyURL: ${state.PropertyURL}`);
        const propertyResult = await checkUrl(state.PropertyURL);
        stateResult.urls.PropertyURL = { url: state.PropertyURL, result: propertyResult };
        console.log(`    ${propertyResult.success ? '✓' : '✗'} ${propertyResult.message}`);
        
        results.push(stateResult);
        
        // Delay between states
        await sleep(1000);
    }
    
    // Save results to JSON file
    const outputPath = path.join(__dirname, 'verification-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log('\n\n====================================');
    console.log('Verification Complete!');
    console.log(`Results saved to: ${outputPath}`);
    
    // Summary
    const totalChecks = results.reduce((sum, state) => {
        return sum + Object.keys(state.urls).length;
    }, 0);
    
    const successfulChecks = results.reduce((sum, state) => {
        return sum + Object.values(state.urls).filter(u => u.result.success).length;
    }, 0);
    
    console.log(`\nTotal URLs checked: ${totalChecks}`);
    console.log(`Successful: ${successfulChecks}`);
    console.log(`Failed: ${totalChecks - successfulChecks}`);
}

// Run verification
verifyAllLinks().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
