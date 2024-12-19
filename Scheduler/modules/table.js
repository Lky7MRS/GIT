import moment from 'moment';
import {
    convertTo12HourFormat,
    convertTo24HourFormat,
    convertToUserTimeZone,
    roundToNearestGranularity
} from './utils.js';

export function generateTimeSlots(tableBody, tableHeader, startDate, endDate, startTimeSelect, endTimeSelect, timeFormat, granularity, sessionSelectedSlots, reapplySessionSelectedSlots) {
    const startTimeMoment = moment(startTimeSelect.value, timeFormat === '12h' ? 'h:mm A' : 'HH:mm');
    const endTimeMoment = moment(endTimeSelect.value, timeFormat === '12h' ? 'h:mm A' : 'HH:mm');
    let startHour = startTimeMoment.hour();
    let endHour = endTimeMoment.hour();
    let startMinute = startTimeMoment.minutes();
    let endMinute = endTimeMoment.minutes();

    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
        endHour += 24;
    }

    const times = [];
    for (let hour = startHour; hour <= endHour; hour++) {
        let startMinuteForHour = hour === startHour ? startMinute : 0;
        let endMinuteForHour = hour === endHour ? endMinute : 59;

        for (let minute = startMinuteForHour; minute <= endMinuteForHour; minute += granularity) {
            const time = moment({ hour, minute });

            if (time.hour() < startHour) {
                time.add(24, 'hours');
            }

            if (time.isSameOrAfter(startTimeMoment) && time.isBefore(endTimeMoment)) {
                times.push(time.format(timeFormat === '12h' ? 'h:mm A' : 'HH:mm'));
            }
        }
    }

    if (startTimeMoment.isSame(endTimeMoment)) {
        times.length = 0;
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += granularity) {
                const time = moment({ hour, minute });
                times.push(time.format(timeFormat === '12h' ? 'h:mm A' : 'HH:mm'));
            }
        }
    } else if (!times.includes(endTimeMoment.format(timeFormat === '12h' ? 'h:mm A' : 'HH:mm'))) {
        times.push(endTimeMoment.format(timeFormat === '12h' ? 'h:mm A' : 'HH:mm'));
    }

    const start = moment(startDate, 'YYYY-MM-DD');
    const end = moment(endDate, 'YYYY-MM-DD');
    let currentDay = start.clone();
    const dayHeaders = [];
    while (currentDay.isSameOrBefore(end, 'day')) {
        const dayName = currentDay.format('dddd');
        const date = currentDay.format('DD/MM');
        dayHeaders.push(`<th>${dayName}<br>(${date})</th>`);
        currentDay.add(1, 'day');
    }

    tableHeader.innerHTML = `<th>Time</th>${dayHeaders.join('')}`;

    tableBody.innerHTML = times.map(time => {
        return `<tr>
            <td>${time}</td>
            ${dayHeaders.map(() => `<td class='time-slot'></td>`).join('')} 
        </tr>`;
    }).join('');

    reapplySessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots);
}

export function reapplySessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots) {
    sessionSelectedSlots = JSON.parse(sessionStorage.getItem('sessionSelectedSlots')) || [];

    Array.from(tableBody.rows).forEach(row => {
        const time = row.cells[0].innerText;

        Array.from(row.cells).slice(1).forEach(cell => {
            const dayIndex = cell.cellIndex;

            if (tableHeader.cells[dayIndex]) {
                const day = tableHeader.cells[dayIndex].innerText;

                const isSelected = sessionSelectedSlots.some(slot => {
                    return slot.time === time && slot.day === day;
                });

                cell.classList.toggle('selected', isSelected);
            }
        });
    });
}

export function updateSessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots) {
    const selectedSlots = Array.from(document.querySelectorAll('.time-slot.selected')).map(slot => {
        const time = slot.parentElement.cells[0].innerText;
        const day = tableHeader.cells[slot.cellIndex].innerText;
        return { time, day };
    });
    sessionSelectedSlots.length = 0; // Clear the existing array
    sessionSelectedSlots.push(...selectedSlots); // Push new items
    sessionStorage.setItem('sessionSelectedSlots', JSON.stringify(sessionSelectedSlots));
}