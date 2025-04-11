// Store device data
const deviceData = {
    ac: { power: 0, voltage: 220, current: 0 },
    fridge: { power: 0, voltage: 220, current: 0 },
    lighting: { power: 0, voltage: 220, current: 0 },
    other: { power: 0, voltage: 220, current: 0 }
};

// Initialize chart data
const chartData = {
    labels: [],
    datasets: [{
        label: 'Total Power (W)',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.1)'
    }]
};

// Update device data
function updateDeviceData(deviceId, data) {
    if (deviceData[deviceId]) {
        deviceData[deviceId] = {
            ...deviceData[deviceId],
            ...data
        };
    }
}

// Update dashboard with latest data
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

        // Update chart
        if (window.energyChart) {
            const now = new Date().toLocaleTimeString();
            chartData.labels.push(now);
            chartData.datasets[0].data.push(totalPower);
            
            // Keep only last 20 data points
            if (chartData.labels.length > 20) {
                chartData.labels.shift();
                chartData.datasets[0].data.shift();
            }
            
            window.energyChart.update();
        }
    } catch (error) {
        console.error('Error updating dashboard:', error);
        showAlert('Error updating dashboard', 'error');
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.querySelector('.alert-container');
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.innerHTML = `
        <span class="alert-icon">${type === 'error' ? '⚠️' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
        <div class="alert-content">
            <div class="alert-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="alert-message">${message}</div>
        </div>
        <button class="alert-close">&times;</button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.classList.add('hide');
        setTimeout(() => alert.remove(), 300);
    }, 5000);
    
    // Close button
    alert.querySelector('.alert-close').addEventListener('click', () => {
        alert.classList.add('hide');
        setTimeout(() => alert.remove(), 300);
    });
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
    const ctx = document.getElementById('energyChart');
    if (ctx) {
        window.energyChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });
    }

    // Handle form submission
    const energyForm = document.getElementById('energyInputForm');
    if (energyForm) {
        energyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const device = document.getElementById('device').value;
            const usage = parseFloat(document.getElementById('usage').value);
            const timestamp = document.getElementById('timestamp').value;
            
            if (device && usage && timestamp) {
                // Update device data
                deviceData[device] = {
                    power: usage,
                    voltage: 220,
                    current: usage / 220
                };

                // Update UI
                updateDashboard();
                
                // Show success message
                showAlert('Data added successfully', 'success');
                
                // Reset form
                energyForm.reset();
            }
        });
    }

    // Handle file import
    const importBtn = document.getElementById('importBtn');
    const dataFile = document.getElementById('dataFile');
    
    if (importBtn && dataFile) {
        importBtn.addEventListener('click', () => {
            const file = dataFile.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        // Update device data with imported data
                        Object.assign(deviceData, data);
                        updateDashboard();
                        showAlert('Data imported successfully', 'success');
                    } catch (error) {
                        showAlert('Invalid file format', 'error');
                    }
                };
                reader.readAsText(file);
            } else {
                showAlert('Please select a file', 'warning');
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