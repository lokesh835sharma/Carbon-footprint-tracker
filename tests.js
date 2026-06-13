"use strict";
/**
 * @file tests.js
 * @description Automated testing suite for EcoCore Logic.
 * This file verifies the integrity of the carbon footprint calculations.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Basic Custom Test Runner
    const tests = [];
    
    /**
     * Registers a new test case.
     * @param {string} name - The name of the test.
     * @param {Function} fn - The test function to execute.
     */
    function test(name, fn) {
        tests.push({ name, fn });
    }

    /**
     * Asserts that a condition is true.
     * @param {boolean} condition - The condition to check.
     * @param {string} message - The error message if assertion fails.
     * @throws {Error} Throws an error if condition is false.
     */
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || "Assertion failed");
        }
    }

    // --- Mock LocalStorage ---
    let store = {};
    const mockLocalStorage = {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => store[key] = value.toString(),
        removeItem: (key) => delete store[key],
        clear: () => store = {}
    };
    
    const originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, configurable: true, writable: true });

    // --- Write Tests ---

    test("calculateActivityEmission - Transport (Car)", () => {
        const activity = { category: 'transport', type: 'car', value: 10 }; // 10km
        const result = window.EcoCore.calculateActivityEmission(activity);
        assert(result === 2.0, `Expected 2.0, got ${result}`);
    });

    test("calculateActivityEmission - Food (Beef)", () => {
        const activity = { category: 'food', type: 'beef', value: 1 };
        const result = window.EcoCore.calculateActivityEmission(activity);
        assert(result === 15.0, `Expected 15.0, got ${result}`);
    });

    test("calculateActivityEmission - Energy (Electricity)", () => {
        const activity = { category: 'energy', type: 'electricity', value: 100 }; // 100kWh
        const result = window.EcoCore.calculateActivityEmission(activity);
        assert(result === 40.0, `Expected 40.0, got ${result}`);
    });

    test("calculateActivityEmission - Edge Cases (Invalid/Missing Inputs)", () => {
        assert(window.EcoCore.calculateActivityEmission(null) === 0, "Null activity should return 0");
        assert(window.EcoCore.calculateActivityEmission({}) === 0, "Empty activity should return 0");
        assert(window.EcoCore.calculateActivityEmission({ category: 'unknown' }) === 0, "Unknown category should return 0");
        assert(window.EcoCore.calculateActivityEmission({ category: 'transport', type: 'spaceship' }) === 0, "Unknown type should return 0");
        assert(window.EcoCore.calculateActivityEmission({ category: 'transport', type: 'car', value: -10 }) === 0, "Negative values should return 0");
        assert(window.EcoCore.calculateActivityEmission({ category: 'transport', type: 'car', value: 'invalid' }) === 0, "Non-number values should return 0");
    });

    test("aggregateEmissions - Calculates Totals Correctly", () => {
        const activities = [
            { category: 'transport', type: 'car', value: 10 },    // 2.0
            { category: 'food', type: 'chicken', value: 1 },      // 3.5
            { category: 'energy', type: 'electricity', value: 10} // 4.0
        ];
        
        const totals = window.EcoCore.aggregateEmissions(activities);
        assert(totals.transport === 2.0, "Transport total incorrect");
        assert(totals.food === 3.5, "Food total incorrect");
        assert(totals.energy === 4.0, "Energy total incorrect");
        assert(totals.total === 9.5, `Total incorrect, expected 9.5 got ${totals.total}`);
    });

    test("aggregateEmissions - Empty Array", () => {
        const totals = window.EcoCore.aggregateEmissions([]);
        assert(totals.total === 0, "Empty array should have 0 total");
        assert(totals.transport === 0, "Empty array should have 0 transport");
    });

    test("aggregateEmissions - Invalid Array Items", () => {
        const totals = window.EcoCore.aggregateEmissions([null, {}, {category: 'unknown'}]);
        assert(totals.total === 0, "Array with invalid items should have 0 total");
    });

    test("Data Store - saveData and loadData", () => {
        store = {}; // clear mock store
        const testData = { activities: [{ id: "1" }], goal: 100, baselineSet: false, baseline: { transport: 0, energy: 0, diet: 0 } };
        window.EcoCore.saveData(testData);
        const loaded = window.EcoCore.loadData();
        assert(loaded.goal === 100, "Goal not loaded correctly");
        assert(loaded.activities.length === 1, "Activities not loaded correctly");
    });

    test("Data Store - loadData fallback on corrupted data", () => {
        store = { 'ecotrack_data': 'invalid_json{]' };
        const loaded = window.EcoCore.loadData();
        assert(loaded.goal === 500, "Should return default goal on corruption");
        assert(Array.isArray(loaded.activities), "Activities should be an array");
    });

    test("Data Store - clearData", () => {
        store = { 'ecotrack_data': '{"goal": 999}' };
        window.EcoCore.clearData();
        const loaded = window.EcoCore.loadData();
        assert(loaded.goal === 500, "clearData should restore default goal");
    });

    test("Data Store - addActivity", () => {
        window.EcoCore.clearData();
        const activity = { category: 'transport', type: 'bike', value: 5 };
        const data = window.EcoCore.addActivity(activity);
        assert(data.activities.length === 1, "Activity not added");
        assert(data.activities[0].category === 'transport', "Activity category incorrect");
        assert(data.activities[0].id !== undefined, "Activity missing ID");
        assert(data.activities[0].timestamp !== undefined, "Activity missing timestamp");
    });

    // --- Run Tests ---
    console.log("🚀 Starting Automated Test Suite...");
    let passed = 0;
    
    tests.forEach(t => {
        try {
            t.fn();
            console.log(`✅ PASS: ${t.name}`);
            passed++;
        } catch (e) {
            console.error(`❌ FAIL: ${t.name} - ${e.message}`);
        }
    });
    
    console.log(`🏁 Test Run Complete: ${passed}/${tests.length} passed.`);
    
    // Restore original localStorage to avoid side effects
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage, configurable: true, writable: true });
});
