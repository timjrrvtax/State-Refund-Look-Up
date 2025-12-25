// State data will be loaded from CSV
let stateData = {};

// Load CSV file and populate dropdown
async function loadStates() {
    try {
        const response = await fetch('states.csv');
        const csvText = await response.text();
        
        // Parse CSV
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        
        // Skip header row and process data
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim()) {
                const values = line.split(',');
                const state = values[0].trim();
                const url = values[1].trim();
                stateData[state] = url;
            }
        }
        
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
        const url = stateData[selectedState];
        message.textContent = `Opening ${selectedState} refund status page...`;
        message.className = 'message success';
        
        // Open the state's refund page in a new tab
        window.open(url, '_blank');
    } else {
        message.textContent = 'Please select a valid state.';
        message.className = 'message error';
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadStates);
