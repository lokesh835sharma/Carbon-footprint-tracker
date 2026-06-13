"use strict";
/**
 * dashboard.js
 * Logic specifically for index.html (Dashboard)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Ensure EcoCore is loaded
    if (!window.EcoCore) {
        console.error("EcoCore not loaded. Dashboard initialization failed.");
        return;
    }

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

    /**
     * Initializes the dashboard view and event listeners
     */
    function init() {
        if (!activityForm || !categorySelect || !typeSelect) return; // Exit if not on dashboard page
        
        updateTypeDropdown();
        updateDashboard();

        categorySelect.addEventListener('change', updateTypeDropdown);
        activityForm.addEventListener('submit', handleFormSubmit);
        if (resetBtn) resetBtn.addEventListener('click', handleReset);
    }

    /**
     * Updates the specific action dropdown based on selected category
     */
    function updateTypeDropdown() {
        const cat = categorySelect.value;
        if (!typeOptions[cat]) return;
        
        // Securely clear and populate dropdown
        while(typeSelect.firstChild) typeSelect.removeChild(typeSelect.firstChild);
        
        const fragment = document.createDocumentFragment();
        typeOptions[cat].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.val;
            option.textContent = opt.label;
            fragment.appendChild(option);
        });
        typeSelect.appendChild(fragment);

        if (valueGroup && valInput) {
            if (cat === 'food') {
                valueGroup.style.display = 'none';
                valInput.removeAttribute('required');
                valInput.value = '1';
            } else {
                valueGroup.style.display = 'block';
                valInput.setAttribute('required', 'true');
                valInput.value = '';
                valInput.placeholder = cat === 'transport' ? 'Distance in km' : 'Energy in kWh';
            }
        }

        updateSimulatorUI(cat);
        updateInsightsUI(cat);
    }

    /**
     * Rebuilds the What-If simulator UI dynamically and securely
     * @param {string} category - The selected emission category
     */
    function updateSimulatorUI(category) {
        if (!simContainer || !simulatorOptions[category]) return;
        
        // Securely clear contents
        while(simContainer.firstChild) simContainer.removeChild(simContainer.firstChild);
        if (simSavingsEl) simSavingsEl.textContent = "0.0";
        
        const fragment = document.createDocumentFragment();
        
        simulatorOptions[category].forEach(opt => {
            const div = document.createElement('div');
            div.className = 'toggle-item';
            div.setAttribute('data-savings', opt.savings.toString());
            div.setAttribute('tabindex', '0');
            div.setAttribute('role', 'button');
            div.setAttribute('aria-pressed', 'false');
            
            const titleSpan = document.createElement('span');
            titleSpan.style.fontWeight = "600";
            titleSpan.textContent = opt.title;
            
            const savingsSpan = document.createElement('span');
            savingsSpan.className = 'subtitle';
            savingsSpan.textContent = `-${opt.savings.toFixed(1)} kg`;
            
            div.appendChild(titleSpan);
            div.appendChild(savingsSpan);
            
            div.addEventListener('click', () => {
                div.classList.toggle('active');
                let isPressed = div.getAttribute('aria-pressed') === 'true';
                div.setAttribute('aria-pressed', String(!isPressed));
                calculateSimulatorSavings();
            });
            div.addEventListener('keydown', (e) => {
                if(e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    div.click();
                }
            });

            fragment.appendChild(div);
        });
        
        simContainer.appendChild(fragment);
    }

    /**
     * Calculates the total savings selected in the simulator
     */
    function calculateSimulatorSavings() {
        if (!simContainer || !simSavingsEl) return;
        
        let savings = 0;
        const toggles = simContainer.querySelectorAll('.toggle-item.active');
        toggles.forEach(toggle => {
            savings += parseFloat(toggle.getAttribute('data-savings') || "0");
        });
        simSavingsEl.textContent = savings.toFixed(1);
    }

    /**
     * Rebuilds the Smart Insights list dynamically and securely
     * @param {string} category - The selected emission category
     */
    function updateInsightsUI(category) {
        if (!insightList || !recommendations[category]) return;
        
        // Securely clear contents
        while(insightList.firstChild) insightList.removeChild(insightList.firstChild);
        if (insightMessage) {
            insightMessage.textContent = `Here are targeted actions to reduce your ${category.toUpperCase()} footprint:`;
        }
        
        const fragment = document.createDocumentFragment();
        recommendations[category].forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            fragment.appendChild(li);
        });
        insightList.appendChild(fragment);
    }

    /**
     * Handles the form submission to log an activity
     * @param {Event} e - Form submit event
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        if (!categorySelect || !typeSelect || !valInput) return;
        
        const activity = {
            category: categorySelect.value,
            type: typeSelect.value,
            value: parseFloat(valInput.value) || 1
        };

        addActivity(activity);
        
        const btn = e.target.querySelector('button[type="submit"]');
        if (btn) {
            const ogText = btn.textContent;
            btn.textContent = "Logged!";
            btn.style.backgroundColor = "var(--color-primary)";
            btn.style.color = "var(--text-main)";
            
            setTimeout(() => {
                btn.textContent = ogText;
                btn.style.backgroundColor = "var(--text-main)";
                btn.style.color = "white";
                if (activity.category !== 'food') {
                    valInput.value = '';
                }
                updateDashboard();
            }, 1000);
        } else {
            updateDashboard();
        }
    }

    /**
     * Updates the main dashboard UI, charts, and totals
     */
    function updateDashboard() {
        const data = loadData();
        const totals = aggregateEmissions(data.activities);
        
        if (totalEmissionsEl) {
            totalEmissionsEl.textContent = totals.total.toString();
        }

        const maxBarValue = Math.max(totals.transport, totals.food, totals.energy, 10);
        
        if (barTransport) barTransport.style.height = `${(totals.transport / maxBarValue) * 100}%`;
        if (barFood) barFood.style.height = `${(totals.food / maxBarValue) * 100}%`;
        if (barEnergy) barEnergy.style.height = `${(totals.energy / maxBarValue) * 100}%`;
    }

    /**
     * Resets the application data
     */
    function handleReset() {
        if(confirm("Are you sure you want to clear all your tracked footprint data?")) {
            clearData();
            updateDashboard();
        }
    }

    init();
});
