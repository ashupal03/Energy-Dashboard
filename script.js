// Static device data
const deviceData = {
    ac: { power: 45.50, voltage: 220, current: 0.21 },
    fridge: { power: 35.25, voltage: 220, current: 0.16 },
    lighting: { power: 25.75, voltage: 220, current: 0.12 },
    other: { power: 53.50, voltage: 220, current: 0.24 }
};

// Initialize chart data
const chartData = {
    labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
    datasets: [{
        label: 'Total Power (W)',
        data: [120, 80, 90, 110, 130, 150, 160, 140],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.1)'
    }]
};

// Update dashboard with static data
function updateDashboard() {
    try {
        // Update current usage
        const totalPower = Object.values(deviceData).reduce((sum, device) => sum + device.power, 0);
        const currentUsage = document.querySelector('.current-usage');
        if (currentUsage) {
            currentUsage.textContent = `${totalPower.toFixed(1)} W`;
            currentUsage.className = `current-usage ${totalPower > 200 ? 'above-average' : 'below-average'}`;
        }

        // Update application usage
        const appItems = document.querySelectorAll('.app-item');
        appItems.forEach(item => {
            const deviceName = item.querySelector('.app-name').textContent.toLowerCase();
            const deviceId = deviceName.includes('air') ? 'ac' : 
                           deviceName.includes('refrigerator') ? 'fridge' : 
                           deviceName.includes('lighting') ? 'lighting' : 'other';
            
            const power = deviceData[deviceId].power;
            item.querySelector('.app-power').textContent = `${power.toFixed(2)} W`;
            item.querySelector('.power-level').style.width = `${(power / totalPower * 100).toFixed(1)}%`;
        });

    } catch (error) {
        handleError(error, 'dataUpdate');
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    
    // Format message if it contains newlines
    const formattedMessage = message.split('\n').map(line => 
        `<div class="alert-line">${line.trim()}</div>`
    ).join('');
    
    alertDiv.innerHTML = `
        <div class="alert-content">
            <div class="alert-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="alert-message">${formattedMessage}</div>
        </div>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.classList.add('fade-out');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

function handleError(error, context) {
    console.error(`Error in ${context}:`, error);
    
    let userMessage = 'An error occurred. Please try again.';
    let recoveryAction = null;
    
    if (error instanceof TypeError) {
        userMessage = 'A configuration error occurred. Please check your settings.';
        recoveryAction = () => {
            if (context === 'chartInitialization') {
                setTimeout(initializeChart, 2000);
            }
        };
    } else if (error instanceof RangeError) {
        userMessage = 'Invalid data range detected. Please check your inputs.';
        recoveryAction = () => {
            if (context === 'formSubmission') {
                document.getElementById('energyForm').reset();
            }
        };
    } else if (error.message) {
        userMessage = error.message;
    }
    
    showAlert(userMessage, 'error');
    
    if (recoveryAction) {
        recoveryAction();
    }
}

// Initialize chart
function initializeChart() {
    try {
        const ctx = document.getElementById('energyChart');
        if (!ctx) {
            throw new Error('Chart canvas element not found');
        }
        
        window.energyChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} W`;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Power (W)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });
    } catch (error) {
        handleError(error, 'chartInitialization');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        themeIcon.textContent = isDark ? '🌙' : '☀️';
    });

    // Initialize chart
    initializeChart();

    // Handle form submission
    const energyForm = document.getElementById('energyForm');
    if (energyForm) {
        energyForm.addEventListener('submit', function(e) {
            try {
                e.preventDefault();
                
                const device = document.getElementById('device').value;
                const power = parseFloat(document.getElementById('power').value);
                const voltage = parseFloat(document.getElementById('voltage').value);
                const current = parseFloat(document.getElementById('current').value);
                
                // Validate inputs
                const errors = validateFormInputs(device, power, voltage, current);
                if (errors.length > 0) {
                    errors.forEach(error => showAlert(error, 'error'));
                    return;
                }
                
                // Update device data
                deviceData[device] = {
                    power: power,
                    voltage: voltage,
                    current: current
                };
                
                // Update dashboard
                updateDashboard();
                
                // Show success message with details
                showAlert(`Device "${device}" updated successfully:
                    Power: ${power}W
                    Voltage: ${voltage}V
                    Current: ${current}A`, 'success');
                
                // Reset form
                this.reset();
                
            } catch (error) {
                handleError(error, 'formSubmission');
            }
        });
    }

    // Initialize tabs
    const tabLinks = document.querySelectorAll('.nav-link');
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            // Update active tab
            tabLinks.forEach(l => l.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');
            
            // Show target content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(targetId).classList.add('active');
            
            // Update URL without scrolling
            history.pushState(null, '', `#${targetId}`);
        });
    });

    // Handle initial tab based on URL hash
    const initialTab = window.location.hash.substring(1) || 'home';
    const initialTabLink = document.querySelector(`.nav-link[href="#${initialTab}"]`);
    if (initialTabLink) {
        initialTabLink.click();
    }

    // Initial dashboard update
    updateDashboard();
});

function validateFormInputs(device, power, voltage, current) {
    const errors = [];
    
    if (!device) {
        errors.push('Please select a device');
    }
    
    if (isNaN(power) || power < 0) {
        errors.push('Power must be a positive number');
    } else if (power > 10000) {
        errors.push('Power value seems too high. Please check your input');
    }
    
    if (isNaN(voltage) || voltage < 0) {
        errors.push('Voltage must be a positive number');
    } else if (voltage > 500) {
        errors.push('Voltage value seems too high. Please check your input');
    }
    
    if (isNaN(current) || current < 0) {
        errors.push('Current must be a positive number');
    } else if (current > 50) {
        errors.push('Current value seems too high. Please check your input');
    }
    
    // Validate power calculation
    if (!isNaN(power) && !isNaN(voltage) && !isNaN(current)) {
        const calculatedPower = voltage * current;
        const powerDiff = Math.abs(power - calculatedPower);
        if (powerDiff > 10) { // Allow 10W difference
            errors.push(`Power value (${power}W) doesn't match calculated power (${calculatedPower.toFixed(2)}W)`);
        }
    }
    
    return errors;
} 