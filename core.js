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
 * Loads application data from LocalStorage safely
 * @returns {AppData} The stored data or default data if none exists
 */
function loadData() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Ensure default structure exists even if stored data is partial
                return { ...defaultData, ...parsed };
            }
        }
    } catch (e) {
        console.warn("Local storage read failed, using defaults.", e);
    }
    return { ...defaultData, activities: [] }; // Return a fresh copy
}

/**
 * Saves application data to LocalStorage safely
 * @param {AppData} data - The data object to save
 */
function saveData(data) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    } catch (e) {
        console.warn("Local storage write failed.", e);
    }
}

/**
 * Adds a new activity to the data store
 * @param {Object} activity - The activity details (category, type, value)
 * @returns {AppData} The updated data object
 */
function addActivity(activity) {
    if (!activity || !activity.category) return loadData(); // Invalid activity
    
    const data = loadData();
    data.activities.push({
        ...activity,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7), // more unique ID
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
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch (e) {
        console.warn("Failed to clear local storage.", e);
    }
    return { ...defaultData, activities: [] };
}

// Global Calculator Functions
const EMISSION_FACTORS = Object.freeze({
    transport: { car: 0.2, bus: 0.05, train: 0.04, bike: 0, walk: 0 },
    food: { beef: 15.0, chicken: 3.5, vegetarian: 1.5, vegan: 1.0 },
    energy: { electricity: 0.4 }
});

/**
 * Calculates the CO2 emission for a single activity safely
 * @param {Object} activity - The activity object
 * @returns {number} The calculated emission value
 */
function calculateActivityEmission(activity) {
    if (!activity || typeof activity !== 'object') return 0;
    if (!activity.category || !activity.type) return 0;
    
    let emission = 0;
    // Ensure value is a non-negative number
    const value = (typeof activity.value === 'number' && activity.value > 0) ? activity.value : 0;
    
    switch (activity.category) {
        case 'transport':
            emission = value * (EMISSION_FACTORS.transport[activity.type] || 0);
            break;
        case 'food':
            emission = EMISSION_FACTORS.food[activity.type] || 0;
            break;
        case 'energy':
            emission = value * (EMISSION_FACTORS.energy[activity.type] || 0);
            break;
        default:
            return 0; // Unknown category
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
    
    if (!Array.isArray(activities)) return totals;

    activities.forEach(act => {
        if (!act || !act.category) return;
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
if (typeof window !== 'undefined') {
    window.EcoCore = {
        loadData,
        saveData,
        addActivity,
        clearData,
        calculateActivityEmission,
        aggregateEmissions,
        EMISSION_FACTORS
    };
}
