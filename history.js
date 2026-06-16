"use strict";
/**
 * history.js
 * Logic specifically for history.html (Activity History)
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!window.EcoCore) {
        console.error("EcoCore not loaded. History initialization failed.");
        return;
    }

    const { loadData, calculateActivityEmission } = window.EcoCore;
    const data = loadData();
    const tbody = document.getElementById('historyTableBody');
    const emptyMessage = document.getElementById('emptyMessage');

    if (data.activities.length === 0) {
        emptyMessage.style.display = 'block';
        return;
    }

    // Sort by newest first
    const sortedActivities = data.activities.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    sortedActivities.forEach(act => {
        const date = new Date(act.timestamp).toLocaleDateString();
        const emission = calculateActivityEmission(act);

        const tr = document.createElement('tr');

        const tdDate = document.createElement('td');
        tdDate.textContent = date;

        const tdCategory = document.createElement('td');
        const span = document.createElement('span');
        span.className = 'tag ' + act.category;
        span.textContent = act.category.toUpperCase();
        tdCategory.appendChild(span);

        const tdAction = document.createElement('td');
        tdAction.style.textTransform = 'capitalize';
        tdAction.textContent = act.type;

        const tdValue = document.createElement('td');
        tdValue.textContent = act.category === 'food' ? act.value + ' Meal' : act.value;

        const tdEmission = document.createElement('td');
        tdEmission.style.fontWeight = '700';
        tdEmission.textContent = '+' + emission + ' kg';

        tr.appendChild(tdDate);
        tr.appendChild(tdCategory);
        tr.appendChild(tdAction);
        tr.appendChild(tdValue);
        tr.appendChild(tdEmission);

        tbody.appendChild(tr);
    });
});
