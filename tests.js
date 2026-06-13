"use strict";
/**
 * tests.js
 * Automated testing suite for EcoCore Logic.
 * This file verifies the integrity of the carbon footprint calculations.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Basic Custom Test Runner
    const tests = [];
    
    function test(name, fn) {
        tests.push({ name, fn });
    }

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || "Assertion failed");
        }
    }

    // --- Write Tests ---

    test("calculateActivityEmission - Transport (Car)", () => {
        const activity = { category: 'transport', type: 'car', value: 10 }; // 10km
        const result = window.EcoCore.calculateActivityEmission(activity);
        // car factor is 0.2. 10 * 0.2 = 2.0
        assert(result === 2.0, `Expected 2.0, got ${result}`);
    });

    test("calculateActivityEmission - Food (Beef)", () => {
        const activity = { category: 'food', type: 'beef', value: 1 };
        const result = window.EcoCore.calculateActivityEmission(activity);
        // beef factor is 15.0
        assert(result === 15.0, `Expected 15.0, got ${result}`);
    });

    test("calculateActivityEmission - Energy (Electricity)", () => {
        const activity = { category: 'energy', type: 'electricity', value: 100 }; // 100kWh
        const result = window.EcoCore.calculateActivityEmission(activity);
        // electricity factor is 0.4. 100 * 0.4 = 40.0
        assert(result === 40.0, `Expected 40.0, got ${result}`);
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
});
