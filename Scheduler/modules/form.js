// modules/form.js
import { generateTimeSlots, reapplySessionSelectedSlots, updateSessionSelectedSlots } from './table.js';
import { populateTimeDropdowns, convertTo12HourFormat, convertTo24HourFormat, convertToUserTimeZone } from './utils.js';
import { timeFormat, granularity, updateTimeFormat, updateGranularity, sessionSelectedSlots } from '../script.js';

export function setupForm(form, timeZoneSelect, timeFormatSelect, granularitySelect, startTimeSelect, endTimeSelect, startDateElement, endDateElement, tableBody, tableHeader, resetButton) {

    // Event listener for time format change
    timeFormatSelect.addEventListener('change', (e) => {
        const newTimeFormat = e.target.value;
        console.log(`Selected time format: ${newTimeFormat}`);
        updateTimeFormat(newTimeFormat);

        // Convert times in session storage
        let sessionSelectedSlots = JSON.parse(sessionStorage.getItem('sessionSelectedSlots')) || [];
        sessionSelectedSlots = sessionSelectedSlots.map(slot => {
            const { time, day } = slot;
            const convertedTime = newTimeFormat === '12h'
                ? convertTo12HourFormat(time)
                : convertTo24HourFormat(time);
            return { time: convertedTime, day };
        });

        // Update session storage with converted times
        sessionStorage.setItem('sessionSelectedSlots', JSON.stringify(sessionSelectedSlots));

        // Update dropdowns, regenerate table, and reapply selections
        populateTimeDropdowns(startTimeSelect, endTimeSelect, newTimeFormat, granularity);
        generateTimeSlots(
            tableBody,
            tableHeader,
            startDateElement.value,
            endDateElement.value,
            startTimeSelect,
            endTimeSelect,
            newTimeFormat,
            granularity,
            sessionSelectedSlots,
            reapplySessionSelectedSlots
        );
    });

    // Event listener for time zone change
    timeZoneSelect.addEventListener('change', () => {
        const selectedTimeZone = timeZoneSelect.value;

        // Update session storage with converted times (rounded to nearest granularity)
        let sessionSelectedSlots = JSON.parse(sessionStorage.getItem('sessionSelectedSlots')) || [];
        sessionSelectedSlots = sessionSelectedSlots.map(slot => ({
            time: convertToUserTimeZone(slot.time, selectedTimeZone, timeFormat, granularity),
            day: slot.day
        }));
        sessionStorage.setItem('sessionSelectedSlots', JSON.stringify(sessionSelectedSlots));

        // Regenerate the table
        generateTimeSlots(
            tableBody,
            tableHeader,
            startDateElement.value,
            endDateElement.value,
            startTimeSelect,
            endTimeSelect,
            timeFormat,
            granularity,
            sessionSelectedSlots,
            reapplySessionSelectedSlots
        );
    });

    // Event listener for granularity change
    granularitySelect.addEventListener('change', () => {
        const newGranularity = parseInt(granularitySelect.value);
        updateGranularity(newGranularity);

        // Regenerate the table with the new granularity
        generateTimeSlots(
            tableBody,
            tableHeader,
            startDateElement.value,
            endDateElement.value,
            startTimeSelect,
            endTimeSelect,
            timeFormat,
            newGranularity,
            sessionSelectedSlots,
            reapplySessionSelectedSlots
        );
    });

    // Event listener for end date change
    endDateElement.addEventListener('change', (e) => {
        generateTimeSlots(
            tableBody,
            tableHeader,
            startDateElement.value,
            endDateElement.value,
            startTimeSelect,
            endTimeSelect,
            timeFormat,
            granularity,
            sessionSelectedSlots,
            reapplySessionSelectedSlots
        );
    });

    // Event listener for start time change
    startTimeSelect.addEventListener('change', () => {
        generateTimeSlots(
            tableBody,
            tableHeader,
            startDateElement.value,
            endDateElement.value,
            startTimeSelect,
            endTimeSelect,
            timeFormat,
            granularity,
            sessionSelectedSlots,
            reapplySessionSelectedSlots
        );
    });

    // Event listener for end time change
    endTimeSelect.addEventListener('change', () => {
        generateTimeSlots(
            tableBody,
            tableHeader,
            startDateElement.value,
            endDateElement.value,
            startTimeSelect,
            endTimeSelect,
            timeFormat,
            granularity,
            sessionSelectedSlots,
            reapplySessionSelectedSlots
        );
    });

    // Reset button handler
    resetButton.addEventListener('click', () => {
        // Reset form and table
        form.reset();
        tableBody.innerHTML = '';

        // Reset to default settings
        updateTimeFormat('24h');
        timeFormatSelect.value = '24h';
        updateGranularity(60);
        granularitySelect.value = 60;

        // Get today and a week from today in 'YYYY-MM-DD' format
        const today = moment().format('YYYY-MM-DD');
        const weeksFromToday = moment().add(1, 'week').format('YYYY-MM-DD');

        // Set the start and end dates
        document.getElementById('startDate').value = today;
        document.getElementById('endDate').value = weeksFromToday;

        // Populate time dropdowns and generate time slots
        populateTimeDropdowns(startTimeSelect, endTimeSelect, timeFormat, granularity);
        generateTimeSlots(
            tableBody,
            tableHeader,
            today,
            weeksFromToday,
            startTimeSelect,
            endTimeSelect,
            timeFormat,
            granularity,
            [],
            reapplySessionSelectedSlots
        );
        timeZoneSelect.value = moment.tz.guess();

        // Clear session storage
        sessionStorage.removeItem('sessionSelectedSlots');
    });

    // Save Data to Firebase
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        let sessionSelectedSlots = JSON.parse(sessionStorage.getItem('sessionSelectedSlots')) || [];
        const selectedSlots24h = sessionSelectedSlots.map(slot => ({
            time: timeFormat === '12h' ? convertTo24HourFormat(slot.time) : slot.time,
            day: slot.day
        }));

        const formData = {
            name: document.getElementById('userName').value,
            timeZone: timeZoneSelect.value,
            note: document.getElementById('note').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            timeFormat: timeFormat,
            selectedSlots: selectedSlots24h,
            startTime: startTimeSelect.value,
            endTime: endTimeSelect.value,
            granularity: granularity
        };

        try {
            const userId = localStorage.getItem('userId').toString();
            //const userId = auth.currentUser.uid;
            const availabilitiesRef = ref(db, 'availabilities/' + userId);
            const newAvailabilityRef = push(availabilitiesRef);
            await set(newAvailabilityRef, formData);

            localStorage.setItem('userAvailability', JSON.stringify(formData));
            alert(`Thank you, ${formData.name}! Your availability from ${formData.startDate} to ${formData.endDate} has been recorded.`);
        } catch (error) {
            console.error("Error saving data to Firebase:", error);
            alert("An error occurred while saving your availability.");
        }
    });
}