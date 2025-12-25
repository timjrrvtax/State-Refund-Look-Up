// State data will be loaded from CSV
let stateData = {};

// CSV parser that handles commas within URLs
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = {};
    
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
            const state = values[0];
            data[state] = {
                RefundURL: values[1],
                MainTaxURL: values[2],
                HasIncomeTax: values[3],
                BusinessURL: values[4],
                PropertyURL: values[5]
            };
        }
    }
    
    return data;
}

// Load CSV file and populate dropdown
async function loadStates() {
    try {
        const response = await fetch('states.csv');
        const csvText = await response.text();
        
        stateData = parseCSV(csvText);
        
        // Populate dropdown
        const select = document.getElementById('state-select');
        Object.keys(stateData).sort().forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading states:', error);
        document.getElementById('message').textContent = 'Error loading state data. Please refresh the page.';
        document.getElementById('message').className = 'message error';
    }
}

// Handle state selection
document.getElementById('state-select').addEventListener('change', function() {
    const checkButton = document.getElementById('check-button');
    const message = document.getElementById('message');
    
    if (this.value) {
        checkButton.disabled = false;
        message.textContent = '';
    } else {
        checkButton.disabled = true;
        message.textContent = '';
    }
});

// Handle button click
document.getElementById('check-button').addEventListener('click', function() {
    const selectedState = document.getElementById('state-select').value;
    const message = document.getElementById('message');
    
    if (selectedState && stateData[selectedState]) {
        const data = stateData[selectedState];
        
        // Check if state has no income tax or limited income tax
        if (data.HasIncomeTax === 'false' || data.HasIncomeTax === 'limited') {
            // Redirect to state info page
            window.location.href = `state-info.html?state=${encodeURIComponent(selectedState)}`;
            return;
        }
        
        const refundUrl = data.RefundURL;
        const mainTaxUrl = data.MainTaxURL;
        
        message.textContent = `Opening ${selectedState} refund status page...`;
        message.className = 'message success';
        
        // Open the state's refund page in a new tab
        const newWindow = window.open(refundUrl, '_blank');
        
        // Show fallback message after 2 seconds
        setTimeout(() => {
            message.innerHTML = `If the page didn't open, you can access the refund page directly or visit the <a href="${mainTaxUrl}" target="_blank" class="fallback-link">main ${selectedState} tax website</a>.`;
            message.className = 'message info';
        }, 2000);
        
    } else {
        message.textContent = 'Please select a valid state.';
        message.className = 'message error';
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadStates);

// Admin function to verify all links (exposed to window for console access)
window.verifyAllLinks = async function() {
    console.log('Starting link verification...');
    const results = [];
    
    for (const [state, data] of Object.entries(stateData)) {
        console.log(`\nVerifying ${state}...`);
        const stateResults = {
            state: state,
            RefundURL: { url: data.RefundURL, status: 'N/A' },
            MainTaxURL: { url: data.MainTaxURL, status: 'pending' },
            BusinessURL: { url: data.BusinessURL, status: 'pending' },
            PropertyURL: { url: data.PropertyURL, status: 'pending' }
        };
        
        // Skip refund URL verification for states without income tax
        if (data.HasIncomeTax !== 'false' && data.RefundURL !== 'N/A') {
            stateResults.RefundURL.status = 'pending';
        }
        
        // Note: Due to CORS limitations in browsers, actual verification
        // may not work for all URLs. This is a best-effort approach.
        // For comprehensive verification, use the Node.js verify-links.js script.
        
        for (const [key, info] of Object.entries(stateResults)) {
            if (key === 'state') continue;
            if (info.status === 'N/A') {
                console.log(`  ${key}: ${info.url} - Skipped (N/A)`);
                continue;
            }
            
            try {
                // Attempt to verify using fetch with no-cors mode
                // This won't give us status codes, but can detect some failures
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                await fetch(info.url, { 
                    mode: 'no-cors',
                    signal: controller.signal 
                });
                
                clearTimeout(timeoutId);
                info.status = 'likely accessible';
                console.log(`  ${key}: ${info.url} - ✓ Likely accessible`);
            } catch (error) {
                info.status = 'failed';
                info.error = error.message;
                console.log(`  ${key}: ${info.url} - ✗ Failed (${error.message})`);
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        results.push(stateResults);
    }
    
    console.log('\n=== Verification Complete ===');
    console.log('Note: Browser CORS limitations mean this verification is best-effort.');
    console.log('For comprehensive verification, run: node verify-links.js');
    
    return results;
};
