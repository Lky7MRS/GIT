import "moment-timezone";
import {
    reapplySessionSelectedSlots,
    updateSessionSelectedSlots
} from "./modules/table.js";
import { setupForm } from "./modules/form.js";
import { populateTimeDropdowns } from "./modules/utils.js";

// ---------- Initialization ----------
const form = document.getElementById('availabilityForm');
const tableBody = document.querySelector('#availabilityTable tbody');
const tableHeader = document.querySelector('#availabilityTable thead tr');
const timeZoneSelect = document.getElementById('timeZone');
const resetButton = document.getElementById('resetButton');
const startTimeSelect = document.getElementById('startTime');
const endTimeSelect = document.getElementById('endTime');
const timeFormatSelect = document.getElementById('timeFormat');
const granularitySelect = document.getElementById('granularity');
const exportCSVButton = document.getElementById('exportCSVButton');

// Default settings
export let sessionSelectedSlots = [];
export let timeFormat = '24h';
export let granularity = 60;

// Update timeFormat
export function updateTimeFormat(newTimeFormat) {
    timeFormat = newTimeFormat;
}

export function updateGranularity(newGranularity) {
    granularity = newGranularity;
}

// ---------- Event Listeners ----------

// Handle mouse interactions for slot selection
let isDragging = false;
let startSlot = null;
let isSelecting = true;

tableBody.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('time-slot')) {
        const clickedSlot = e.target;
        startSlot = clickedSlot;
        isDragging = true;
        isSelecting = !clickedSlot.classList.contains('selected');

        clickedSlot.classList.toggle('selected', isSelecting);
        updateSessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots); // Pass sessionSelectedSlots
    }
});

tableBody.addEventListener('mousemove', (e) => {
    if (isDragging && e.target.classList.contains('time-slot')) {
        const currentSlot = e.target;
        if (currentSlot !== startSlot) {
            currentSlot.classList.toggle('selected', isSelecting);
            currentSlot.classList.add('hover');
            updateSessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots); // Pass sessionSelectedSlots
        }
    }
});

tableBody.addEventListener('mouseup', () => {
    isDragging = false;
    startSlot = null;

    const hoveredSlots = document.querySelectorAll('.time-slot.hover');
    hoveredSlots.forEach(slot => {
        slot.classList.remove('hover');
    });
});

tableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('time-slot') && !isDragging) {
        updateSessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots);
    }
});

tableBody.addEventListener('mouseover', (e) => {
    if (isDragging && e.target.classList.contains('time-slot')) {
        const hoveredSlot = e.target;
        hoveredSlot.classList.add('hover');
    }
});

tableBody.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('time-slot')) {
        e.target.classList.remove('hover');
    }
});

// Export Data
exportCSVButton.addEventListener('click', () => {
    const savedData = JSON.parse(localStorage.getItem('userAvailability'));
    if (!savedData) return alert('No data to export.');

    const csvContent = [
        ['Name', 'Time Zone', 'Start Date', 'End Date', 'Note', 'Selected Slots'],
        [
            savedData.name,
            savedData.timeZone,
            savedData.startDate,
            savedData.endDate,
            `"${savedData.note}"`,
            savedData.selectedSlots.map(slot => `${slot.day} ${slot.time}`).join('; '),
        ],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'availability.csv';
    link.click();
});

// ---------- Initialization Call ----------
// Call setupForm to initialize form-related functionalities
setupForm(
    form,
    timeZoneSelect,
    timeFormatSelect,
    granularitySelect,
    startTimeSelect,
    endTimeSelect,
    document.getElementById('startDate'),
    document.getElementById('endDate'),
    tableBody,
    tableHeader,
    resetButton,
    reapplySessionSelectedSlots,
    updateSessionSelectedSlots,
);