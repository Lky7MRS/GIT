import moment from 'moment';

export function populateTimeDropdowns(
    startTimeSelect,
    endTimeSelect,
    timeFormat,
    granularity,
    selectedStartTime,
    selectedEndTime,
    startDateElement,
    endDateElement,
    selectedStartDate,
    selectedEndDate
) {
    const times = generateTimes(timeFormat, granularity);

    const updateDropdown = (dropdown, selectedTime) => {
        if (!dropdown) {
            console.error('Dropdown element is not defined:', dropdown);
            return;
        }
        dropdown.innerHTML = times
            .map(time => `<option value="${time}" ${time === selectedTime ? 'selected' : ''}>${time}</option>`)
            .join('');
    };

    updateDropdown(startTimeSelect, selectedStartTime);
    updateDropdown(endTimeSelect, selectedEndTime);
    startDateElement.value = selectedStartDate;
    endDateElement.value = selectedEndDate;
}

function generateTimes(timeFormat, granularity) {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += granularity) {
            const time = moment({ hour, minute });
            times.push(timeFormat === '12h' ? time.format('h:mm A') : time.format('HH:mm'));
        }
    }
    return times;
}

export function convertTo12HourFormat(time24h) {
    return moment(time24h, 'HH:mm').format('h:mm A');
}

export function convertTo24HourFormat(time12h) {
    return moment(time12h, 'h:mm A').format('HH:mm');
}

export function convertToUserTimeZone(time, userTimeZone, timeFormat, granularity) {
    const timeFormatToUse = timeFormat === '12h' ? 'h:mm A' : 'HH:mm';
    const timeInUtc = moment.utc(time, timeFormatToUse);
    const timeInUserTimeZone = timeInUtc.tz(userTimeZone);

    return roundToNearestGranularity(timeInUserTimeZone, granularity).format(timeFormatToUse);
}

export function roundToNearestGranularity(momentObj, granularityMinutes) {
    const roundedMinutes = Math.round(momentObj.minutes() / granularityMinutes) * granularityMinutes;
    return momentObj.clone().minutes(roundedMinutes).seconds(0);
}

export function convertTimesSessionStorage(newTimeFormat) {
    let sessionSelectedSlots = JSON.parse(sessionStorage.getItem('sessionSelectedSlots')) || [];
    sessionSelectedSlots = sessionSelectedSlots.map(slot => {
        const timestamp = slot.timestamp;
        const time = moment.unix(timestamp).format(newTimeFormat === '12h' ? 'h:mm A' : 'HH:mm');
        const date = moment.unix(timestamp).format('DD/MM/YYYY');
        const newTimestamp = moment(`${date} ${time}`, `DD/MM/YYYY ${newTimeFormat === '12h' ? 'h:mm A' : 'HH:mm'}`).unix();
        return { timestamp: newTimestamp };
    });
    sessionStorage.setItem('sessionSelectedSlots', JSON.stringify(sessionSelectedSlots));
    return sessionSelectedSlots;
}