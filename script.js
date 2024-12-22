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
const aggregatedAvailabilityTableBody = document.querySelector('#aggregatedAvailabilityTable tbody');
const tableHeader = document.querySelector('#availabilityTable thead tr');
const timeZoneSelect = document.getElementById('timeZone');
const resetButton = document.getElementById('resetButton');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const startTimeSelect = document.getElementById('startTime');
const endTimeSelect = document.getElementById('endTime');
const timeFormatSelect = document.getElementById('timeFormat');
const granularitySelect = document.getElementById('granularity');
const exportCSVButton = document.getElementById('exportCSVButton');
const yourScheduleTab = document.getElementById('yourScheduleTab');
const aggregatedAvailabilityTab = document.getElementById('aggregatedAvailabilityTab');
const yourScheduleSection = document.getElementById('yourSchedule');
const aggregatedAvailabilitySection = document.getElementById('aggregatedAvailability');
const formHeader = document.getElementById('availabilityFormHeader');
const formDivider = document.getElementById('availabilityFormDivider');

// Default settings
export let sessionSelectedSlots = JSON.parse(sessionStorage.getItem('sessionSelectedSlots')) || [];
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

function handleMouseDown(e, tableBody, updateFunction, slotClass) {
    if (e.target.classList.contains(slotClass) && e.currentTarget === tableBody) {
        const clickedSlot = e.target;
        startSlot = clickedSlot;
        isDragging = true;
        isSelecting = !clickedSlot.classList.contains('selected');

        clickedSlot.classList.toggle('selected', isSelecting);
        updateFunction(tableBody);
    }
}

function handleMouseMove(e, tableBody, updateFunction, slotClass) {
    if (isDragging && e.target.classList.contains(slotClass) && e.currentTarget === tableBody) {
        const currentSlot = e.target;
        if (currentSlot !== startSlot) {
            currentSlot.classList.toggle('selected', isSelecting);
            currentSlot.classList.add('hover');
            updateFunction(tableBody);
        }
    }
}

function handleMouseUp(tableBody, updateFunction) {
    isDragging = false;
    startSlot = null;

    const hoveredSlots = tableBody.querySelectorAll('.time-slot.hover');
    hoveredSlots.forEach(slot => {
        slot.classList.remove('hover');
    });

    updateFunction(tableBody);
}

// Event handlers for "Your Schedule" table
tableBody.addEventListener('mousedown', (e) => handleMouseDown(e, tableBody, updateSessionSelectedSlots, 'time-slot'));
tableBody.addEventListener('mousemove', (e) => handleMouseMove(e, tableBody, updateSessionSelectedSlots, 'time-slot'));
tableBody.addEventListener('mouseup', () => handleMouseUp(tableBody, updateSessionSelectedSlots));

// Event handlers for "Aggregated Availability" table
aggregatedAvailabilityTableBody.addEventListener('mousedown', (e) => handleMouseDown(e, aggregatedAvailabilityTableBody, () => { }, 'aggregated-availability-time-slot'));
aggregatedAvailabilityTableBody.addEventListener('mousemove', (e) => handleMouseMove(e, aggregatedAvailabilityTableBody, () => { }, 'aggregated-availability-time-slot'));
aggregatedAvailabilityTableBody.addEventListener('mouseup', () => handleMouseUp(aggregatedAvailabilityTableBody, () => { }));

document.addEventListener('DOMContentLoaded', () => {
    yourScheduleTab.addEventListener('click', () => {
        yourScheduleTab.classList.add('tab-active');
        aggregatedAvailabilityTab.classList.remove('tab-active');
        yourScheduleSection.classList.remove('hidden');
        aggregatedAvailabilitySection.classList.add('hidden');
        //formHeader.classList.remove('hidden');
        //formDivider.classList.remove('hidden');
        sessionSelectedSlots.length = 0;
        // Retrieve the saved selection from sessionStorage
        const savedSlots = sessionStorage.getItem('sessionSelectedSlots');
        if (savedSlots) {
            sessionSelectedSlots = JSON.parse(savedSlots);
        }

        reapplySessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots, moment(startDate.value));
    });

    aggregatedAvailabilityTab.addEventListener('click', async () => {
        yourScheduleTab.classList.remove('tab-active');
        aggregatedAvailabilityTab.classList.add('tab-active');
        yourScheduleSection.classList.add('hidden');
        aggregatedAvailabilitySection.classList.remove('hidden');
        //formHeader.classList.add('hidden');
        //formDivider.classList.add('hidden');
        sessionSelectedSlots.length = 0;
        // Save the current selection to sessionStorage
        //sessionStorage.setItem('sessionSelectedSlots', JSON.stringify(sessionSelectedSlots));

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
        'availability-schedule-time-slot',
        'start-time',
        'end-time',
        'hover'
    );

    // Reapply session selected slots on page load
    reapplySessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots, moment(startDate.value));
});