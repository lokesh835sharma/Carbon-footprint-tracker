/**
 * dashboard.js
 * Logic specifically for index.html (Dashboard)
 */

document.addEventListener('DOMContentLoaded', () => {
    const { loadData, addActivity, clearData, aggregateEmissions } = window.EcoCore;

    // DOM Elements
    const totalEmissionsEl = document.getElementById('totalEmissions');
    const barTransport = document.getElementById('barTransport');
    const barFood = document.getElementById('barFood');
    const barEnergy = document.getElementById('barEnergy');

    const activityForm = document.getElementById('activityForm');
    const categorySelect = document.getElementById('category');
    const typeSelect = document.getElementById('type');
    const valueGroup = document.getElementById('valueGroup');
    const valInput = document.getElementById('valInput');

    const simContainer = document.getElementById('simContainer');
    const simSavingsEl = document.getElementById('simSavings');

    const insightMessage = document.getElementById('insightMessage');
    const insightList = document.getElementById('insightList');
    const resetBtn = document.getElementById('resetBtn');

    // Options mapping
    const typeOptions = {
        transport: [
            { val: 'car', label: 'Car (Drive)' },
            { val: 'bus', label: 'Bus' },
            { val: 'train', label: 'Train' },
            { val: 'bike', label: 'Bicycle' },
            { val: 'walk', label: 'Walking' }
        ],
        food: [
            { val: 'beef', label: 'Beef / Red Meat Meal' },
            { val: 'chicken', label: 'Poultry / Pork Meal' },
            { val: 'vegetarian', label: 'Vegetarian Meal' },
            { val: 'vegan', label: 'Vegan Meal' }
        ],
        energy: [
            { val: 'electricity', label: 'Electricity Usage' }
        ]
    };

    // Dynamic Simulator Options
    const simulatorOptions = {
        transport: [
            { title: "Bike instead of drive (20km)", savings: 4.0 },
            { title: "Carpool to work", savings: 2.5 },
            { title: "Take the train instead of driving", savings: 3.2 }
        ],
        food: [
            { title: "Swap beef meal for vegetarian", savings: 13.5 },
            { title: "Go fully vegan for the day", savings: 14.0 },
            { title: "Eat local produce only", savings: 1.2 }
        ],
        energy: [
            { title: "Turn off AC for 5 hours", savings: 2.5 },
            { title: "Switch to LED bulbs (entire house)", savings: 1.5 },
            { title: "Line dry clothes instead of dryer", savings: 2.0 }
        ]
    };

    // Dynamic Insight Recommendations
    const recommendations = {
        transport: ["Try carpooling to work", "Substitute one driving trip with cycling", "Check tire pressure to improve fuel efficiency"],
        food: ["Implement 'Meatless Mondays'", "Buy locally sourced produce", "Reduce food waste by meal planning"],
        energy: ["Switch to LED bulbs", "Unplug vampire appliances", "Adjust thermostat by 2 degrees"]
    };

    function init() {
        if(!activityForm) return; // Quick check if we are on dashboard
        updateTypeDropdown(); // Initializes dropdown, simulator, and insights
        updateDashboard();

        categorySelect.addEventListener('change', updateTypeDropdown);
        activityForm.addEventListener('submit', handleFormSubmit);
        if(resetBtn) resetBtn.addEventListener('click', handleReset);
    }

    function updateTypeDropdown() {
        const cat = categorySelect.value;
        typeSelect.innerHTML = '';
        
        typeOptions[cat].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.val;
            option.textContent = opt.label;
            typeSelect.appendChild(option);
        });

        if (cat === 'food') {
            valueGroup.style.display = 'none';
            valInput.removeAttribute('required');
            valInput.value = 1;
        } else {
            valueGroup.style.display = 'block';
            valInput.setAttribute('required', 'true');
            valInput.value = '';
            valInput.placeholder = cat === 'transport' ? 'Distance in km' : 'Energy in kWh';
        }

        // Dynamically update the 2 sections below!
        updateSimulatorUI(cat);
        updateInsightsUI(cat);
    }

    function updateSimulatorUI(category) {
        simContainer.innerHTML = '';
        simSavingsEl.textContent = "0.0";
        simulatorOptions[category].forEach(opt => {
            const div = document.createElement('div');
            div.className = 'toggle-item';
            div.setAttribute('data-savings', opt.savings);
            div.setAttribute('tabindex', '0');
            div.setAttribute('role', 'button');
            div.setAttribute('aria-pressed', 'false');
            div.innerHTML = `
                <span style="font-weight: 600;">${opt.title}</span>
                <span class="subtitle">-${opt.savings.toFixed(1)} kg</span>
            `;
            
            div.addEventListener('click', () => {
                div.classList.toggle('active');
                let isPressed = div.getAttribute('aria-pressed') === 'true';
                div.setAttribute('aria-pressed', !isPressed);
                calculateSimulatorSavings();
            });
            div.addEventListener('keydown', (e) => {
                if(e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    div.click();
                }
            });

            simContainer.appendChild(div);
        });
    }

    function calculateSimulatorSavings() {
        let savings = 0;
        const toggles = simContainer.querySelectorAll('.toggle-item');
        toggles.forEach(toggle => {
            if (toggle.classList.contains('active')) {
                savings += parseFloat(toggle.dataset.savings);
            }
        });
        simSavingsEl.textContent = savings.toFixed(1);
    }

    function updateInsightsUI(category) {
        insightList.innerHTML = '';
        insightMessage.textContent = `Here are targeted actions to reduce your ${category.toUpperCase()} footprint:`;
        
        recommendations[category].forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            insightList.appendChild(li);
        });
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const activity = {
            category: categorySelect.value,
            type: typeSelect.value,
            value: parseFloat(valInput.value) || 1
        };

        addActivity(activity);
        
        const btn = e.target.querySelector('button');
        const ogText = btn.textContent;
        btn.textContent = "Logged!";
        btn.style.backgroundColor = "var(--color-primary)";
        btn.style.color = "var(--text-main)";
        
        setTimeout(() => {
            btn.textContent = ogText;
            btn.style.backgroundColor = "var(--text-main)";
            btn.style.color = "white";
            valInput.value = '';
            updateDashboard();
        }, 1000);
    }

    function updateDashboard() {
        const data = loadData();
        const totals = aggregateEmissions(data.activities);
        
        totalEmissionsEl.textContent = totals.total;

        const maxBarValue = Math.max(totals.transport, totals.food, totals.energy, 10);
        
        barTransport.style.height = `${(totals.transport / maxBarValue) * 100}%`;
        barFood.style.height = `${(totals.food / maxBarValue) * 100}%`;
        barEnergy.style.height = `${(totals.energy / maxBarValue) * 100}%`;
    }

    function handleReset() {
        if(confirm("Are you sure you want to clear all your tracked footprint data?")) {
            clearData();
            updateDashboard();
        }
    }

    init();
});
