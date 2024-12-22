import "moment-timezone";
import moment from "moment";
import {
    reapplySessionSelectedSlots,
    updateSessionSelectedSlots
} from "./modules/table.js";
import { setupForm } from "./modules/form.js";
import { updateAggregatedTable } from "./modules/availability.js";

// ---------- Initialization ----------
const form = document.getElementById('availabilityForm');
const userName = document.getElementById('userName');
const userNote = document.getElementById('note');
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

// ---------- Exported Variables ----------
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
        updateSessionSelectedSlots(tableBody);
    }
});

tableBody.addEventListener('mousemove', (e) => {
    if (isDragging && e.target.classList.contains('time-slot')) {
        const currentSlot = e.target;
        if (currentSlot !== startSlot) {
            currentSlot.classList.toggle('selected', isSelecting);
            currentSlot.classList.add('hover');
            updateSessionSelectedSlots(tableBody);
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

    updateSessionSelectedSlots(tableBody);
});

// Event listener for updating session selected slots on click
tableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('time-slot') && !isDragging) {
        updateSessionSelectedSlots(tableBody);
    }
});

// Event listener for adding hover class on mouseover
tableBody.addEventListener('mouseover', (e) => {
    if (isDragging && e.target.classList.contains('time-slot')) {
        e.target.classList.add('hover');
    }
});

// Event listener for removing hover class on mouseout
tableBody.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('time-slot')) {
        e.target.classList.remove('hover');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const yourScheduleTab = document.getElementById('yourScheduleTab');
    const aggregatedAvailabilityTab = document.getElementById('aggregatedAvailabilityTab');
    const yourScheduleSection = document.getElementById('yourSchedule');
    const aggregatedAvailabilitySection = document.getElementById('aggregatedAvailability');
    const formHeader = document.getElementById('availabilityFormHeader');
    const formDivider = document.getElementById('availabilityFormDivider');

    yourScheduleTab.addEventListener('click', () => {
        yourScheduleTab.classList.add('tab-active');
        aggregatedAvailabilityTab.classList.remove('tab-active');
        yourScheduleSection.classList.remove('hidden');
        aggregatedAvailabilitySection.classList.add('hidden');
        formHeader.classList.remove('hidden');
        formDivider.classList.remove('hidden');
    });

    aggregatedAvailabilityTab.addEventListener('click', async () => {
        yourScheduleTab.classList.remove('tab-active');
        aggregatedAvailabilityTab.classList.add('tab-active');
        yourScheduleSection.classList.add('hidden');
        aggregatedAvailabilitySection.classList.remove('hidden');
        formHeader.classList.add('hidden');
        formDivider.classList.add('hidden');

        // Clear sessionSelectedSlots
        sessionStorage.removeItem('sessionSelectedSlots');

        await updateAggregatedTable();
    });

    // Add event listeners to form elements
    [startDate, endDate, startTimeSelect, endTimeSelect, timeFormatSelect, granularitySelect].forEach(element => {
        if (element && typeof element.addEventListener === 'function') {
            element.addEventListener('change', updateAggregatedTable);
        } else {
            console.error('Element not found or is not a valid HTML element:', element);
        }
    });

    setupForm(
        form,
        userName,
        userNote,
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

    // Reapply session selected slots on page load
    reapplySessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots, moment());
});