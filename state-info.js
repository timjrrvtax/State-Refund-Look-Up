// Get state from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const stateName = urlParams.get('state');

// If no state parameter, redirect to index
if (!stateName) {
    window.location.href = 'index.html';
}

// CSV parser (same as in app.js)
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = {};
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Simple split by comma since our CSV doesn't have quoted fields
        const values = line.split(',').map(v => v.trim());
        
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

// Load state data and display information
async function loadStateInfo() {
    try {
        const response = await fetch('states.csv');
        const csvText = await response.text();
        const stateData = parseCSV(csvText);
        
        const state = stateData[stateName];
        
        if (!state) {
            document.getElementById('info-message').textContent = 'State not found.';
            document.getElementById('info-message').className = 'message error';
            return;
        }
        
        // Update page title and header
        document.getElementById('state-name').textContent = stateName;
        document.title = `${stateName} - Tax Information`;
        
        // Display appropriate message based on tax status
        const messageEl = document.getElementById('info-message');
        if (state.HasIncomeTax === 'false') {
            document.getElementById('tax-status').textContent = 'No State Income Tax';
            messageEl.innerHTML = `
                <strong>${stateName} does not have a state income tax.</strong><br>
                This means there are no state income tax refunds to check. However, you may still need to file or pay other state taxes.
                Below are helpful resources for other tax-related matters in ${stateName}.
            `;
        } else if (state.HasIncomeTax === 'limited') {
            document.getElementById('tax-status').textContent = 'Limited State Income Tax';
            messageEl.innerHTML = `
                <strong>${stateName} has limited state income tax.</strong><br>
                ${stateName} only taxes certain types of income (such as interest and dividends).
                Most residents do not need to file a state income tax return.
                Below are helpful resources for tax-related matters in ${stateName}.
            `;
        }
        
        // Set up resource links
        document.getElementById('main-tax-link').href = state.MainTaxURL;
        document.getElementById('business-link').href = state.BusinessURL;
        document.getElementById('property-link').href = state.PropertyURL;
        
    } catch (error) {
        console.error('Error loading state info:', error);
        document.getElementById('info-message').textContent = 'Error loading state information. Please try again.';
        document.getElementById('info-message').className = 'message error';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadStateInfo);
