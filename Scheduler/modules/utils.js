import moment from 'moment';

export function populateTimeDropdowns(startTimeSelect, endTimeSelect, timeFormat, granularity) {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += granularity) {
            const time = moment({ hour, minute });
            times.push(timeFormat === '12h' ? time.format('h:mm A') : time.format('HH:mm'));
        }
    }

    const updateDropdown = (dropdown) => {
        dropdown.innerHTML = times
            .map(time => `<option value="${time}">${time}</option>`)
            .join('');
    };

    updateDropdown(startTimeSelect);
    updateDropdown(endTimeSelect);
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

    // Round to the nearest specified granularity
    const roundedTime = roundToNearestGranularity(timeInUserTimeZone, granularity);
    return roundedTime.format(timeFormatToUse);
}

export function roundToNearestGranularity(momentObj, granularityMinutes) {
    const minutes = momentObj.minutes();
    const roundedMinutes = Math.round(minutes / granularityMinutes) * granularityMinutes;
    return momentObj.clone().minutes(roundedMinutes).seconds(0);
}