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

    const simToggles = document.querySelectorAll('.toggle-item');
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

    function init() {
        if(!activityForm) return; // Quick check if we are on dashboard
        updateTypeDropdown();
        updateDashboard();

        categorySelect.addEventListener('change', updateTypeDropdown);
        activityForm.addEventListener('submit', handleFormSubmit);
        if(resetBtn) resetBtn.addEventListener('click', handleReset);

        simToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
                let isPressed = toggle.getAttribute('aria-pressed') === 'true';
                toggle.setAttribute('aria-pressed', !isPressed);
                updateSimulator();
            });
            toggle.addEventListener('keydown', (e) => {
                if(e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle.click();
                }
            });
        });
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

        generateInsights(totals);
    }

    function updateSimulator() {
        let savings = 0;
        simToggles.forEach(toggle => {
            if (toggle.classList.contains('active')) {
                savings += parseFloat(toggle.dataset.savings);
            }
        });
        simSavingsEl.textContent = savings.toFixed(1);
    }

    function generateInsights(totals) {
        insightList.innerHTML = '';
        if (totals.total === 0) {
            insightMessage.textContent = "Start logging activities to get personalized recommendations.";
            return;
        }

        const maxCat = Object.keys(totals).reduce((a, b) => b !== 'total' && totals[a] > totals[b] ? a : b, 'transport');
        insightMessage.textContent = `Your highest emission category is currently ${maxCat.toUpperCase()}. Here are targeted actions to reduce it:`;

        const recommendations = {
            transport: ["Try carpooling to work", "Substitute one driving trip with cycling", "Check tire pressure to improve fuel efficiency"],
            food: ["Implement 'Meatless Mondays'", "Buy locally sourced produce", "Reduce food waste by meal planning"],
            energy: ["Switch to LED bulbs", "Unplug vampire appliances", "Adjust thermostat by 2 degrees"]
        };

        recommendations[maxCat].forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            insightList.appendChild(li);
        });
    }

    function handleReset() {
        if(confirm("Are you sure you want to clear all your tracked footprint data?")) {
            clearData();
            updateDashboard();
        }
    }

    init();
});
