// modules/availability.js

import moment from 'moment';
import { generateTimeSlots, reapplySessionSelectedSlots } from './table';
import { fetchDataFromFirebase } from './storage';

const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const startTimeSelect = document.getElementById('startTime');
const endTimeSelect = document.getElementById('endTime');
const timeFormatSelect = document.getElementById('timeFormat');
const granularitySelect = document.getElementById('granularity');
const aggTableBody = document.querySelector('#aggregatedAvailabilityTable tbody');
const aggTableHeader = document.querySelector('#aggregatedAvailabilityTable thead tr');

export function findOverlappingTimes(availabilities) {
    const timeSlots = {};

    Object.values(availabilities).forEach(user => {
        user.selectedSlots.forEach(slot => {
            const time = moment.unix(slot.timestamp).format('YYYY-MM-DD HH:mm');
            if (!timeSlots[time]) {
                timeSlots[time] = [];
            }
            timeSlots[time].push(user.name);
        });
    });

    return timeSlots;
}

export function suggestMeetingTimes(data) {
    const suggestedTimes = Object.entries(data)
        .filter(([time, users]) => users.length > 1) // Filter times with more than one user
        .sort((a, b) => b[1].length - a[1].length); // Sort by number of users

    return suggestedTimes;
}

export async function applyFetchedDataToTable(data, tableBody, tableHeader) {
    const databaseSlots = [];

    Object.values(data).forEach(user => {
        user.selectedSlots.forEach(slot => {
            databaseSlots.push(slot);
        });
    });
    reapplySessionSelectedSlots(tableBody, tableHeader, databaseSlots, moment(startDate.value), 'aggregated-availability-time-slot');
}

export const updateAggregatedTable = async () => {
    const data = await fetchDataFromFirebase();
    if (data) {
        if (startDate && endDate && startTimeSelect && endTimeSelect && timeFormatSelect && granularitySelect) {
            generateTimeSlots(
                aggTableBody,
                aggTableHeader,
                startDate.value,
                endDate.value,
                startTimeSelect,
                endTimeSelect,
                timeFormatSelect.value,
                granularitySelect.value,
                [],
                reapplySessionSelectedSlots,
                'aggregated-availability-time-slot',
                'start-time',
                'end-time',
                'hover'
            );
            applyFetchedDataToTable(data, aggTableBody, aggTableHeader);
        } else {
            console.error('One or more elements are not found');
        }
    } else {
        console.error('No data found');
    }
};
