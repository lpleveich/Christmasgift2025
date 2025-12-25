// Global variables
let currentAge = 11;
let currentName = "Grayson";
let currentTheme = "purple"; // Default to Grayson's purple theme
let chartDataPoints = []; // Store chart data points for hover detection
let chartConfig = {}; // Store chart configuration for hover detection

// Theme colors
const themeColors = {
    blue: '#4285F4',    // Landon
    purple: '#bb86fc'  // Grayson
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set up splash page buttons
    const cardButtons = document.querySelectorAll('.profile-button');
    cardButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const profile = this.dataset.profile;
            const color = this.dataset.color;
            openCard(profile, color);
        });
    });

    // Only set up calculator if card is already opened (for direct access)
    if (!document.getElementById('christmas-card') || document.getElementById('christmas-card').classList.contains('hidden')) {
        initializeCalculator();
    }
});

function openCard(profile, color) {
    const card = document.getElementById('christmas-card');
    const calculator = document.getElementById('calculator-container');
    
    // Set profile
    if (profile === 'Grayson') {
        currentAge = 11;
        currentName = 'Grayson';
    } else {
        currentAge = 13;
        currentName = 'Landon';
    }
    
    // Set theme
    currentTheme = color;
    document.body.className = `theme-${color}`;
    document.documentElement.style.setProperty('--primary-color', themeColors[color]);
    
    // Update profile greeting immediately
    updateProfileGreeting();
    
    // Animate splash page closing
    card.classList.add('closing');
    
    // Show calculator after animation
    setTimeout(() => {
        card.classList.add('hidden');
        calculator.classList.remove('hidden');
        initializeCalculator();
    }, 500);
}

function initializeCalculator() {
    // Update profile greeting
    updateProfileGreeting();
    
    // Update theme based on current profile
    if (currentName === 'Landon') {
        currentTheme = 'blue';
        document.body.className = 'theme-blue';
    } else {
        currentTheme = 'purple';
        document.body.className = 'theme-purple';
    }
    document.documentElement.style.setProperty('--primary-color', themeColors[currentTheme]);

    // Set up current balance input with comma formatting
    const currentBalanceInput = document.getElementById('current-balance');
    if (currentBalanceInput) {
        currentBalanceInput.addEventListener('input', function(e) {
            const cursorPosition = e.target.selectionStart;
            const oldValue = e.target.value;
            const newValue = formatNumberWithCommas(e.target.value);
            
            // Only update if the value changed (to avoid cursor jumping)
            if (oldValue !== newValue) {
                e.target.value = newValue;
                // Restore cursor position (adjust for added/removed commas)
                const diff = newValue.length - oldValue.length;
                e.target.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
            }
            
            calculateResults();
        });
        
        // Format on blur to ensure proper formatting
        currentBalanceInput.addEventListener('blur', function(e) {
            e.target.value = formatNumberWithCommas(e.target.value);
        });
    }

    // Calculate on Christmas gift toggle change
    const christmasGiftToggle = document.getElementById('christmas-gift-toggle');
    if (christmasGiftToggle) {
        christmasGiftToggle.addEventListener('change', calculateResults);
    }

    // Calculate on monthly contribution input change
    const monthlyContributionInput = document.getElementById('monthly-contribution');
    if (monthlyContributionInput) {
        monthlyContributionInput.addEventListener('input', calculateResults);
    }

    // Format initial current balance value
    if (currentBalanceInput) {
        currentBalanceInput.value = formatNumberWithCommas(currentBalanceInput.value);
    }

    // Initial calculation (with small delay to ensure canvas is ready)
    setTimeout(() => {
        calculateResults();
    }, 100);

    // Set up chart hover functionality
    setupChartHover();
}

// Compound interest formula: A = P(1 + r/n)^(nt) + PMT * [((1 + r/n)^(nt) - 1) / (r/n)]
// Where:
// A = the future value
// P = principal (initial amount)
// r = annual interest rate (as decimal) - ASSUMED 7% YEAR OVER YEAR
// n = number of times interest compounds per year (12 for monthly compounding)
// t = time in years
// PMT = monthly payment
//
// This uses monthly compounding, which is standard for 529 accounts.
// The 7% annual rate compounds monthly, so monthly rate = 7% / 12 = 0.5833...% per month

function calculateCompoundInterest(principal, monthlyPayment, annualRate, years) {
    // Convert annual rate (7%) to monthly rate
    // annualRate is in percentage (7), so divide by 100 to get decimal (0.07), then divide by 12 for monthly
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    
    // Future value of principal with monthly compounding
    // Formula: P * (1 + monthlyRate)^months
    const futureValuePrincipal = principal * Math.pow(1 + monthlyRate, months);
    
    // Future value of monthly payments (annuity formula)
    // Formula: PMT * [((1 + monthlyRate)^months - 1) / monthlyRate]
    let futureValuePayments = 0;
    if (monthlyPayment > 0 && monthlyRate > 0) {
        futureValuePayments = monthlyPayment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    } else if (monthlyPayment > 0) {
        // Edge case: if rate is 0, just sum the payments
        futureValuePayments = monthlyPayment * months;
    }
    
    return futureValuePrincipal + futureValuePayments;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatNumberWithCommas(value) {
    // Remove all non-digit characters
    const numericValue = value.replace(/\D/g, '');
    // Add commas for thousands
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function parseNumberFromFormatted(value) {
    // Remove commas and parse as float
    return parseFloat(value.replace(/,/g, '')) || 0;
}

function updateProfileGreeting() {
    const greetingElement = document.getElementById('profile-greeting');
    if (greetingElement) {
        greetingElement.textContent = `Merry Christmas ${currentName}!`;
    }
}

function calculateResults() {
    const principal = parseNumberFromFormatted(document.getElementById('current-balance').value) || 1523;
    const christmasGiftToggle = document.getElementById('christmas-gift-toggle');
    const christmasGift = christmasGiftToggle && christmasGiftToggle.checked ? 200 : 0;
    const monthlyPayment = parseFloat(document.getElementById('monthly-contribution').value) || 0;
    const annualRate = 7; // Fixed at 7% annual interest rate
    
    // Add Christmas gift to principal (one-time addition)
    const totalPrincipal = principal + christmasGift;
    
    // Calculate for different ages
    const ages = [18, 22, 65];
    const results = {};
    
    ages.forEach(targetAge => {
        const years = targetAge - currentAge;
        if (years > 0) {
            const futureValue = calculateCompoundInterest(totalPrincipal, monthlyPayment, annualRate, years);
            const growth = futureValue - totalPrincipal - (monthlyPayment * 12 * years);
            results[targetAge] = {
                total: futureValue,
                growth: growth
            };
        } else {
            results[targetAge] = {
                total: totalPrincipal,
                growth: 0
            };
        }
    });
    
    // Update result displays
    updateResultDisplay('result-18', results[18]);
    updateResultDisplay('result-22', results[22]);
    updateResultDisplay('result-65', results[65]);
    
    // Update gift comparison if gift is enabled
    if (christmasGift > 0) {
        updateGiftComparison(principal, totalPrincipal, monthlyPayment, annualRate);
    } else {
        // Hide gift difference displays when gift is off
        ['18', '22', '65'].forEach(age => {
            const giftDiff = document.getElementById(`gift-diff-${age}`);
            if (giftDiff) {
                giftDiff.style.display = 'none';
            }
        });
    }
    
    // Update comparison section
    updateComparison(results, totalPrincipal);
    
    // Update chart
    updateChart(totalPrincipal, monthlyPayment, annualRate);
}

function updateResultDisplay(elementId, result) {
    const element = document.getElementById(elementId);
    if (element && result) {
        element.querySelector('.amount').textContent = formatCurrency(result.total);
        element.querySelector('.growth').textContent = `Growth: ${formatCurrency(result.growth)}`;
    }
}

function updateGiftComparison(principalWithoutGift, principalWithGift, monthlyPayment, annualRate) {
    const ages = [18, 22, 65];
    const annualRateValue = 7; // Fixed at 7%
    
    ages.forEach(targetAge => {
        const years = targetAge - currentAge;
        const giftDiffElement = document.getElementById(`gift-diff-${targetAge}`);
        
        if (!giftDiffElement) return;
        
        if (years > 0) {
            // Calculate with gift
            const futureValueWithGift = calculateCompoundInterest(principalWithGift, monthlyPayment, annualRateValue, years);
            // Calculate without gift
            const futureValueWithoutGift = calculateCompoundInterest(principalWithoutGift, monthlyPayment, annualRateValue, years);
            // Difference
            const difference = futureValueWithGift - futureValueWithoutGift;
            
            giftDiffElement.textContent = formatCurrency(difference) + ' more';
            giftDiffElement.style.display = 'block';
        } else {
            giftDiffElement.textContent = formatCurrency(200) + ' more';
            giftDiffElement.style.display = 'block';
        }
    });
}

function updateComparison(results, totalPrincipal) {
    const spendingAmount = 50; // What they would spend now ($50)
    const investingAmount = 1723; // What they would invest ($1,723)
    
    // Calculate results for investing $2,023
    const annualRate = 7;
    const ages = [18, 22, 65];
    const investingResults = {};
    
    ages.forEach(targetAge => {
        const years = targetAge - currentAge;
        if (years > 0) {
            const futureValue = calculateCompoundInterest(investingAmount, 0, annualRate, years);
            investingResults[targetAge] = futureValue;
        } else {
            investingResults[targetAge] = investingAmount;
        }
    });
    
    if (investingResults[18]) {
        document.getElementById('compare-18').textContent = formatCurrency(investingResults[18]);
    }
    if (investingResults[22]) {
        document.getElementById('compare-22').textContent = formatCurrency(investingResults[22]);
    }
    if (investingResults[65]) {
        document.getElementById('compare-65').textContent = formatCurrency(investingResults[65]);
        const difference = investingResults[65] - spendingAmount;
        document.getElementById('difference-amount').textContent = formatCurrency(difference);
    }
}

function updateChart(principal, monthlyPayment, annualRate) {
    const canvas = document.getElementById('growth-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Get container dimensions for responsive sizing
    const container = canvas.parentElement;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight || 400;
    
    // Set canvas size based on container and device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width = containerWidth * dpr;
    const height = canvas.height = containerHeight * dpr;
    
    // Scale context to match device pixel ratio
    ctx.scale(dpr, dpr);
    
    // Use original container dimensions for drawing
    const drawWidth = containerWidth;
    const drawHeight = containerHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, drawWidth, drawHeight);
    
    // Calculate data points
    const maxAge = 65;
    const years = maxAge - currentAge;
    const dataPoints = [];
    const step = Math.max(1, Math.floor(years / 20)); // 20 data points max
    
    for (let y = 0; y <= years; y += step) {
        const value = calculateCompoundInterest(principal, monthlyPayment, annualRate, y);
        dataPoints.push({ year: y, value: value });
    }
    
    // Add final point only if it's not already included
    if (years > 0 && dataPoints[dataPoints.length - 1].year !== years) {
        const finalValue = calculateCompoundInterest(principal, monthlyPayment, annualRate, years);
        dataPoints.push({ year: years, value: finalValue });
    }
    
    if (dataPoints.length === 0) return;
    
    // Find max value for scaling
    const maxValue = Math.max(...dataPoints.map(p => p.value));
    const minValue = Math.min(principal, ...dataPoints.map(p => p.value));
    const valueRange = maxValue - minValue || 1;
    
    // Chart dimensions - responsive padding
    const padding = Math.max(40, Math.min(60, drawWidth * 0.05));
    const chartWidth = drawWidth - 2 * padding;
    const chartHeight = drawHeight - 2 * padding;

    // Store chart data for hover detection
    chartConfig = {
        padding,
        chartWidth,
        chartHeight,
        drawWidth,
        drawHeight,
        minValue,
        valueRange
    };
    
    // Calculate and store point positions
    chartDataPoints = dataPoints.map((point, i) => {
        const x = padding + (chartWidth / (dataPoints.length - 1)) * i;
        const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
        return {
            ...point,
            x,
            y,
            age: currentAge + point.year
        };
    });
    
    // Responsive font sizes
    const fontSize = Math.max(10, Math.min(12, drawWidth * 0.03));
    const labelFontSize = Math.max(10, Math.min(14, drawWidth * 0.035));
    
    // Draw grid lines
    ctx.strokeStyle = '#303030';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(drawWidth - padding, y);
        ctx.stroke();
        
        // Y-axis labels
        const value = maxValue - (valueRange / 5) * i;
        ctx.fillStyle = '#AAAAAA';
        ctx.font = `${fontSize}px Montserrat, sans-serif`;
        ctx.textAlign = 'right';
        // Position Y-axis values with enough space to avoid overlap with label
        ctx.fillText(formatCurrency(value), padding - 12, y + 4);
    }
    
    // Draw X-axis labels - show fewer labels on small screens
    const labelInterval = drawWidth < 480 ? Math.ceil(dataPoints.length / 4) : 1;
    ctx.fillStyle = '#AAAAAA';
    ctx.font = `${fontSize}px Montserrat, sans-serif`;
    ctx.textAlign = 'center';
    for (let i = 0; i < dataPoints.length; i += labelInterval) {
        const x = padding + (chartWidth / (dataPoints.length - 1)) * i;
        const age = currentAge + dataPoints[i].year;
        ctx.fillText(age, x, drawHeight - padding + 18);
    }
    
    // Draw line - responsive line width (draw before storing points for hover)
    const lineWidth = Math.max(2, Math.min(3, drawWidth * 0.006));
    ctx.strokeStyle = themeColors[currentTheme] || themeColors.purple;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    for (let i = 0; i < dataPoints.length; i++) {
        const x = padding + (chartWidth / (dataPoints.length - 1)) * i;
        const y = padding + chartHeight - ((dataPoints[i].value - minValue) / valueRange) * chartHeight;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    // Draw points - responsive point size
    const pointSize = Math.max(3, Math.min(5, drawWidth * 0.012));
    ctx.fillStyle = themeColors[currentTheme] || themeColors.purple;
    chartDataPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Draw axis labels
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `500 ${labelFontSize}px Montserrat, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Age', drawWidth / 2, drawHeight - 8);
    
    // Y-axis label hidden per user request
    // ctx.save();
    // ctx.translate(Math.max(8, drawWidth * 0.01), drawHeight / 2);
    // ctx.rotate(-Math.PI / 2);
    // ctx.fillText('Account Value', 0, 0);
    // ctx.restore();
    
    // Mark key ages
    const keyAges = [18, 22, 65];
    keyAges.forEach(age => {
        if (age > currentAge && age <= maxAge) {
            const yearsToAge = age - currentAge;
            const x = padding + (chartWidth / years) * yearsToAge;
            
            ctx.strokeStyle = '#34a853';
            ctx.lineWidth = Math.max(1, lineWidth * 0.67);
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, drawHeight - padding);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Label - only show on larger screens or reduce frequency
            if (drawWidth >= 480 || age === 18 || age === 65) {
                ctx.fillStyle = '#34a853';
                ctx.font = `500 ${fontSize}px Montserrat, sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(`Age ${age}`, x, padding - 8);
            }
        }
    });
}

// Handle window resize
window.addEventListener('resize', function() {
    const principal = parseNumberFromFormatted(document.getElementById('current-balance').value) || 1523;
    const christmasGiftToggle = document.getElementById('christmas-gift-toggle');
    const christmasGift = christmasGiftToggle && christmasGiftToggle.checked ? 200 : 0;
    const monthlyPayment = parseFloat(document.getElementById('monthly-contribution').value) || 0;
    const annualRate = 7; // Fixed at 7% annual interest rate
    const totalPrincipal = principal + christmasGift;
    updateChart(totalPrincipal, monthlyPayment, annualRate);
});

// Set up chart hover functionality
function setupChartHover() {
    const canvas = document.getElementById('growth-chart');
    const tooltip = document.getElementById('chart-tooltip');
    if (!canvas || !tooltip) return;

    const container = canvas.parentElement;
    let hoveredPoint = null;

    canvas.addEventListener('mousemove', function(e) {
        const containerRect = container.getBoundingClientRect();
        const x = e.clientX - containerRect.left;
        const y = e.clientY - containerRect.top;

        // Find the closest point
        let closestPoint = null;
        let minDistance = Infinity;
        const hoverRadius = 20; // Pixels

        chartDataPoints.forEach(point => {
            const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
            if (distance < minDistance && distance < hoverRadius) {
                minDistance = distance;
                closestPoint = point;
            }
        });

        if (closestPoint) {
            hoveredPoint = closestPoint;
            tooltip.innerHTML = `
                <div class="tooltip-age">Age ${closestPoint.age}</div>
                <div class="tooltip-amount">${formatCurrency(closestPoint.value)}</div>
            `;
            tooltip.classList.add('show');

            // Force a reflow to get accurate tooltip dimensions
            tooltip.offsetHeight;
            
            // Get tooltip dimensions
            const tooltipWidth = tooltip.offsetWidth;
            const tooltipHeight = tooltip.offsetHeight;
            
            // Center tooltip horizontally on the dot (using transform: translateX(-50%) in CSS)
            let tooltipX = closestPoint.x;
            
            // Position tooltip above the dot
            let tooltipY = closestPoint.y - tooltipHeight - 10;
            
            // Check horizontal bounds - adjust if tooltip goes off screen
            // Since we're using transform: translateX(-50%), we need to check if centered position would go off screen
            const halfWidth = tooltipWidth / 2;
            if (tooltipX - halfWidth < 0) {
                tooltip.style.transform = 'translateX(0)';
                tooltipX = halfWidth;
            } else if (tooltipX + halfWidth > containerRect.width) {
                tooltip.style.transform = 'translateX(-100%)';
                tooltipX = containerRect.width - halfWidth;
            } else {
                tooltip.style.transform = 'translateX(-50%)';
            }
            
            // Check vertical bounds - if tooltip would go above container, show below dot instead
            if (tooltipY < 0) {
                tooltipY = closestPoint.y + 15;
            }
            // If tooltip would go below container, adjust upward
            if (tooltipY + tooltipHeight > containerRect.height) {
                tooltipY = containerRect.height - tooltipHeight - 10;
            }

            tooltip.style.left = tooltipX + 'px';
            tooltip.style.top = tooltipY + 'px';
        } else {
            hoveredPoint = null;
            tooltip.classList.remove('show');
        }
    });

    canvas.addEventListener('mouseleave', function() {
        hoveredPoint = null;
        tooltip.classList.remove('show');
    });
}

