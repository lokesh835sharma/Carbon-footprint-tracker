"use strict";
/**
 * community.js
 * Logic for community.html — Personal Eco Impact & Badges
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!window.EcoCore) {
        console.error("EcoCore not loaded. Community initialization failed.");
        return;
    }

    const { loadData, calculateActivityEmission, aggregateEmissions } = window.EcoCore;
    const data = loadData();
    const totals = aggregateEmissions(data.activities);

    // --- Stat Cards ---
    const totalCO2El = document.getElementById('statTotalCO2');
    const totalLogsEl = document.getElementById('statTotalLogs');
    const avgPerLogEl = document.getElementById('statAvgPerLog');
    const bestCategoryEl = document.getElementById('statBestCategory');

    if (totalCO2El) totalCO2El.textContent = totals.total.toFixed(1);
    if (totalLogsEl) totalLogsEl.textContent = data.activities.length;

    if (data.activities.length > 0) {
        const avg = (totals.total / data.activities.length).toFixed(1);
        if (avgPerLogEl) avgPerLogEl.textContent = avg;

        // Find best (lowest) category — only among categories that have been used
        const usedCategories = new Set(data.activities.map(a => a.category));
        const cats = [
            { name: 'Transport', val: totals.transport },
            { name: 'Food', val: totals.food },
            { name: 'Energy', val: totals.energy }
        ].filter(c => usedCategories.has(c.name.toLowerCase()));

        if (cats.length > 0) {
            const best = cats.reduce((a, b) => a.val <= b.val ? a : b);
            if (bestCategoryEl) bestCategoryEl.textContent = best.name;
        }
    } else {
        if (avgPerLogEl) avgPerLogEl.textContent = '—';
        if (bestCategoryEl) bestCategoryEl.textContent = '—';
    }

    // --- Eco Equivalents ---
    const treesEl = document.getElementById('eqTrees');
    const drivingEl = document.getElementById('eqDriving');
    const phonesEl = document.getElementById('eqPhones');

    // 1 tree absorbs ~22 kg CO2 per year → trees needed to offset
    const treesNeeded = (totals.total / 22).toFixed(1);
    // 1 km of driving ≈ 0.2 kg CO2
    const drivingKm = (totals.total / 0.2).toFixed(0);
    // Charging a phone ≈ 0.005 kg CO2
    const phoneCharges = Math.round(totals.total / 0.005);

    if (treesEl) treesEl.textContent = treesNeeded;
    if (drivingEl) drivingEl.textContent = Number(drivingKm).toLocaleString();
    if (phonesEl) phonesEl.textContent = phoneCharges.toLocaleString();

    // --- Weekly Breakdown ---
    const weeklyContainer = document.getElementById('weeklyBreakdown');
    if (weeklyContainer) {
        const now = new Date();
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Get start of current week (Sunday)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        // Bucket emissions by day of week
        const dailyTotals = [0, 0, 0, 0, 0, 0, 0];
        data.activities.forEach(act => {
            const d = new Date(act.timestamp);
            if (d >= startOfWeek) {
                dailyTotals[d.getDay()] += calculateActivityEmission(act);
            }
        });

        const maxDaily = Math.max(...dailyTotals, 1);

        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 7; i++) {
            const col = document.createElement('div');
            col.className = 'week-bar-col';

            const bar = document.createElement('div');
            bar.className = 'week-bar';
            const pct = (dailyTotals[i] / maxDaily) * 100;
            bar.style.height = Math.max(pct, 4) + '%';

            // Highlight today
            if (i === now.getDay()) {
                bar.classList.add('today');
            }

            const label = document.createElement('span');
            label.className = 'week-label';
            label.textContent = dayLabels[i];

            const valLabel = document.createElement('span');
            valLabel.className = 'week-val';
            valLabel.textContent = dailyTotals[i] > 0 ? dailyTotals[i].toFixed(1) : '';

            col.appendChild(valLabel);
            col.appendChild(bar);
            col.appendChild(label);
            fragment.appendChild(col);
        }
        weeklyContainer.appendChild(fragment);
    }

    // --- Badges ---
    if (data.activities.length > 0) {
        const badge = document.getElementById('badgeStarted');
        if (badge) {
            badge.classList.add('earned');
            badge.style.backgroundColor = 'var(--color-primary)';
        }
    }

    const hasTransit = data.activities.some(a => a.type === 'bus' || a.type === 'train');
    if (hasTransit) {
        const badge = document.getElementById('badgeTransit');
        if (badge) {
            badge.classList.add('earned');
            badge.style.backgroundColor = 'var(--color-secondary)';
        }
    }

    const hasVegan = data.activities.some(a => a.type === 'vegan');
    if (hasVegan) {
        const badge = document.getElementById('badgeVegan');
        if (badge) badge.classList.add('earned');
    }

    const hasBike = data.activities.some(a => a.type === 'bike');
    if (hasBike) {
        const badge = document.getElementById('badgeCyclist');
        if (badge) {
            badge.classList.add('earned');
            badge.style.backgroundColor = 'var(--color-primary)';
        }
    }

    if (data.activities.length >= 10) {
        const badge = document.getElementById('badgeDedicated');
        if (badge) {
            badge.classList.add('earned');
            badge.style.backgroundColor = 'var(--color-accent)';
        }
    }

    // Check for 7-day streak
    if (data.activities.length >= 7) {
        // Get unique dates as timestamps, sorted newest first
        const uniqueDates = [...new Set(data.activities.map(a => {
            const d = new Date(a.timestamp);
            return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        }))].sort((a, b) => b - a);

        let streak = 1;
        const oneDay = 1000 * 60 * 60 * 24;
        for (let i = 1; i < uniqueDates.length; i++) {
            if (uniqueDates[i - 1] - uniqueDates[i] === oneDay) {
                streak++;
            } else {
                break;
            }
        }
        if (streak >= 7) {
            const badge = document.getElementById('badgeStreak');
            if (badge) {
                badge.classList.add('earned');
                badge.style.backgroundColor = '#fbbf24';
            }
        }
    }
});
