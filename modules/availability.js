import moment from 'moment';
import { generateTimeSlots } from './table';
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
        .filter(([time, users]) => users.length > 1)
        .sort((a, b) => b[1].length - a[1].length);

    return suggestedTimes;
}

export async function applyFetchedDataToTable(data, tableBody, tableHeader) {
    const databaseSlots = [];

    Object.values(data).forEach(user => {
        user.selectedSlots.forEach(slot => {
            databaseSlots.push({ ...slot, userName: user.name });
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

function reapplySessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots, start, slotClass = 'time-slot') {
    sessionSelectedSlots = sessionSelectedSlots || JSON.parse(sessionStorage.getItem('sessionSelectedSlots'));

    Array.from(tableBody.rows).forEach(row => {
        const time = row.cells[0].innerText;

        Array.from(row.cells).slice(1).forEach(cell => {
            const dayIndex = cell.cellIndex;

            if (tableHeader.cells[dayIndex]) {
                const dayHeader = tableHeader.cells[dayIndex].innerText;
                const dayMatch = dayHeader.match(/\(([^)]+)\)/);
                const day = dayMatch ? dayMatch[1] : null;
                const year = start.clone().add(dayIndex - 1, 'days').year();
                const fullDate = `${day}/${year}`;
                const cellTimestamp = moment(`${fullDate} ${time}`, 'DD/MM/YYYY h:mm A').unix();
                const matchingSlots = sessionSelectedSlots.filter(slot => slot.timestamp === cellTimestamp);
                const isSelected = matchingSlots.length > 0;

                if (isSelected) {
                    const userCount = matchingSlots.length;
                    const opacity = Math.min(0.1 + userCount * 0.1, 1); // Adjust opacity based on user count
                    cell.classList.add('selected');
                    cell.dataset.users = matchingSlots.map(slot => slot.userName).join(', ');
                    cell.textContent = matchingSlots.map(slot => slot.userName).join(', ');
                    cell.style.backgroundColor = `rgba(13, 71, 161, ${opacity})`; // Dynamic background color
                } else {
                    cell.classList.remove('selected');
                    delete cell.dataset.users;
                    cell.textContent = '';
                    cell.style.backgroundColor = ''; // Reset background color
                }
            }
        });
    });
    updateSessionSelectedSlots(tableBody, slotClass);
}

function updateSessionSelectedSlots(tableBody, slotClass = 'time-slot') {
    const selectedSlots = Array.from(document.querySelectorAll(`.${slotClass}.selected`)).map(slot => {
        const time = slot.dataset.time;
        const date = slot.dataset.date;
        const timestamp = moment(`${date} ${time}`, 'DD/MM/YYYY h:mm A').unix();
        return { timestamp };
    });

    updateStartEndClasses(tableBody, slotClass);
}

function updateStartEndClasses(tableBody, slotClass = 'time-slot', startTimeClass = 'start-time', endTimeClass = 'end-time') {
    // Remove existing start-time and end-time classes
    Array.from(tableBody.querySelectorAll(`.${slotClass}`)).forEach(cell => {
        cell.classList.remove(startTimeClass, endTimeClass);
    });

    // Get the number of columns
    const numColumns = tableBody.rows[0].cells.length;

    // Iterate over each column
    for (let colIndex = 1; colIndex < numColumns; colIndex++) {
        let selectedCells = [];

        // Collect selected cells in the current column
        Array.from(tableBody.rows).forEach(row => {
            const cell = row.cells[colIndex];
            if (cell.classList.contains('selected')) {
                selectedCells.push(cell);
            } else if (selectedCells.length > 0) {
                // Handle the end of a contiguous block
                markContiguousBlock(selectedCells, startTimeClass, endTimeClass);
                selectedCells = [];
            }
        });

        // Handle the last contiguous block if it exists
        if (selectedCells.length > 0) {
            markContiguousBlock(selectedCells, startTimeClass, endTimeClass);
        }
    }
}

// Helper function to mark the start and end of a contiguous block
function markContiguousBlock(cells, startTimeClass, endTimeClass) {
    cells[0].classList.add(startTimeClass);
    cells[cells.length - 1].classList.add(endTimeClass);
}