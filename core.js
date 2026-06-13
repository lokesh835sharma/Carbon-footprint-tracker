"use strict";
/**
 * core.js
 * EcoTrack Core Logic - Data Store and Calculations
 * Shared across all pages.
 */

const STORAGE_KEY = 'ecotrack_data';

/**
 * @typedef {Object} Baseline
 * @property {number} transport
 * @property {number} energy
 * @property {number} diet
 */

/**
 * @typedef {Object} AppData
 * @property {Array<Object>} activities
 * @property {number} goal
 * @property {boolean} baselineSet
 * @property {Baseline} baseline
 */

const defaultData = {
    activities: [],
    goal: 500,
    baselineSet: false,
    baseline: { transport: 0, energy: 0, diet: 0 }
};

// Global Data Store Functions

/**
 * Loads application data from LocalStorage
 * @returns {AppData} The stored data or default data if none exists
 */
function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error("Error reading from local storage", e);
    }
    return defaultData;
}

/**
 * Saves application data to LocalStorage
 * @param {AppData} data - The data object to save
 */
function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Error saving to local storage", e);
    }
}

/**
 * Adds a new activity to the data store
 * @param {Object} activity - The activity details (category, type, value)
 * @returns {AppData} The updated data object
 */
function addActivity(activity) {
    const data = loadData();
    data.activities.push({
        ...activity,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
    });
    saveData(data);
    return data;
}

/**
 * Clears all data from LocalStorage and returns to defaults
 * @returns {AppData} The default data object
 */
function clearData() {
    localStorage.removeItem(STORAGE_KEY);
    return defaultData;
}

// Global Calculator Functions
const EMISSION_FACTORS = {
    transport: { car: 0.2, bus: 0.05, train: 0.04, bike: 0, walk: 0 },
    food: { beef: 15.0, chicken: 3.5, vegetarian: 1.5, vegan: 1.0 },
    energy: { electricity: 0.4 }
};

/**
 * Calculates the CO2 emission for a single activity
 * @param {Object} activity - The activity object
 * @returns {number} The calculated emission value
 */
function calculateActivityEmission(activity) {
    if (!activity || !activity.category) return 0;
    let emission = 0;
    switch (activity.category) {
        case 'transport':
            emission = (activity.value || 0) * (EMISSION_FACTORS.transport[activity.type] || 0);
            break;
        case 'food':
            emission = EMISSION_FACTORS.food[activity.type] || 0;
            break;
        case 'energy':
            emission = (activity.value || 0) * EMISSION_FACTORS.energy.electricity;
            break;
    }
    return Number(emission.toFixed(2));
}

/**
 * Aggregates emissions across all logged activities
 * @param {Array<Object>} activities - List of activity objects
 * @returns {Object} Total emissions mapped by category and the grand total
 */
function aggregateEmissions(activities) {
    const totals = { transport: 0, food: 0, energy: 0, total: 0 };
    activities.forEach(act => {
        const val = calculateActivityEmission(act);
        if (totals[act.category] !== undefined) {
            totals[act.category] += val;
        }
        totals.total += val;
    });
    return {
        transport: Number(totals.transport.toFixed(2)),
        food: Number(totals.food.toFixed(2)),
        energy: Number(totals.energy.toFixed(2)),
        total: Number(totals.total.toFixed(2))
    };
}

// Attach to window so other scripts can use them easily
window.EcoCore = {
    loadData,
    saveData,
    addActivity,
    clearData,
    calculateActivityEmission,
    aggregateEmissions,
    EMISSION_FACTORS
};
