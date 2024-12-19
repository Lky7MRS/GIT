import moment from 'moment';

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
        const year = currentDay.year();
        dayHeaders.push(`<th>${dayName}<br>(${date})</th>`);
        currentDay.add(1, 'day');
    }

    tableHeader.innerHTML = `<th>Time</th>${dayHeaders.join('')}`;

    tableBody.innerHTML = times.map(time => {
        return `<tr>
            <td>${time}</td>
            ${dayHeaders.map((header, index) => {
            const day = header.match(/\(([^)]+)\)/)[1];
            const year = start.clone().add(index, 'days').year();
            const fullDate = `${day}/${year}`;
            return `<td class='time-slot' data-time='${time}' data-date='${fullDate}'></td>`;
        }).join('')}
        </tr>`;
    }).join('');

    reapplySessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots, start);
}

export function reapplySessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots, start) {
    sessionSelectedSlots = JSON.parse(sessionStorage.getItem('sessionSelectedSlots')) || [];

    console.log("Reapplying session selected slots:", sessionSelectedSlots); // Debugging line

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
                console.log(`Checking cell for time: ${time}, date: ${fullDate}`); // Debugging line

                const isSelected = sessionSelectedSlots.some(slot => {
                    return slot.time === time && slot.date === fullDate;
                });

                console.log(`Slot selected: ${isSelected}`); // Debugging line
                cell.classList.toggle('selected', isSelected);
            }
        });
    });
    updateStartEndClasses(tableBody);
}

export function updateSessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots) {
    const selectedSlots = Array.from(document.querySelectorAll('.time-slot.selected')).map(slot => {
        const time = slot.dataset.time;
        const date = slot.dataset.date;
        return { time, date };
    });

    sessionStorage.setItem('sessionSelectedSlots', JSON.stringify(selectedSlots));
    updateStartEndClasses(tableBody);
}

export function updateStartEndClasses(tableBody) {
    // Remove existing start-time and end-time classes
    Array.from(tableBody.querySelectorAll('.time-slot')).forEach(cell => {
        cell.classList.remove('start-time', 'end-time');
    });

    // Get the number of columns
    const numColumns = tableBody.rows[0].cells.length;

    // Iterate over each column
    for (let colIndex = 1; colIndex < numColumns; colIndex++) {
        const selectedCells = [];

        // Collect selected cells in the current column
        Array.from(tableBody.rows).forEach(row => {
            const cell = row.cells[colIndex];
            if (cell.classList.contains('selected')) {
                selectedCells.push(cell);
            }
        });

        // Add start-time and end-time classes to the first and last selected cells in the column
        if (selectedCells.length > 0) {
            selectedCells[0].classList.add('start-time');
            selectedCells[selectedCells.length - 1].classList.add('end-time');
        }
    }
}