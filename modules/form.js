import { generateTimeSlots, reapplySessionSelectedSlots } from './table.js';
import { populateTimeDropdowns, convertTo12HourFormat, convertTo24HourFormat, convertToUserTimeZone, convertTimesSessionStorage } from './utils.js';
import { timeFormat, granularity, updateTimeFormat, updateGranularity, sessionSelectedSlots } from '../script.js';
import { sendDiscordNotification } from './discordWebhook.js';
import { saveDataToFirebase } from './storage.js';
import moment from 'moment';

export function setupForm(form, userName, userNote, timeZoneSelect, timeFormatSelect, granularitySelect, startTimeSelect, endTimeSelect, startDateElement, endDateElement, tableBody, tableHeader, resetButton) {

    // Populate time zones
    moment.tz.names().forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.text = zone;
        timeZoneSelect.appendChild(option);
    });

    function saveFormData() {
        const formData = {
            userName: userName.value,
            userNote: userNote.value,
            timeZone: timeZoneSelect.value,
            timeFormat: timeFormatSelect.value,
            granularity: granularitySelect.value,
            startTime: startTimeSelect.value,
            endTime: endTimeSelect.value,
            startDate: startDateElement.value,
            endDate: endDateElement.value,
            sessionSelectedSlots: sessionStorage.getItem('sessionSelectedSlots')
        };
        localStorage.setItem('formData', JSON.stringify(formData));
    }

    // Function to load form data from localStorage
    function loadFormData() {
        const formData = JSON.parse(localStorage.getItem('formData'));
        if (formData) {
            userName.value = formData.userName;
            userNote.value = formData.userNote;
            timeZoneSelect.value = formData.timeZone;
            timeFormatSelect.value = formData.timeFormat;
            granularitySelect.value = formData.granularity;

            populateTimeDropdowns(startTimeSelect, endTimeSelect, formData.timeFormat, formData.granularity, formData.startTime, formData.endTime, startDateElement, endDateElement, formData.startDate, formData.endDate);

            timeZoneSelect.value = moment.tz.guess() || formData.timeZone;
            if (formData.sessionSelectedSlots) {
                sessionStorage.setItem('sessionSelectedSlots', formData.sessionSelectedSlots);
            }

            generateTimeSlots(
                tableBody,
                tableHeader,
                formData.startDate,
                formData.endDate,
                startTimeSelect,
                endTimeSelect,
                formData.timeFormat,
                formData.granularity,
                sessionSelectedSlots,
                reapplySessionSelectedSlots
            );
        } else {
            // Initialize for new users
            const startDate = moment().format('YYYY-MM-DD');
            const endDate = moment().add(1, 'week').format('YYYY-MM-DD');
            // Populate time dropdowns before setting their values
            populateTimeDropdowns(startTimeSelect, endTimeSelect, '24h', 60, '08:00', '18:00', startDateElement, endDateElement, startDate, endDate);

            generateTimeSlots(
                tableBody,
                tableHeader,
                startDate,
                endDate,
                startTimeSelect,
                endTimeSelect,
                '24h',
                60,
                sessionSelectedSlots,
                reapplySessionSelectedSlots
            );

            timeZoneSelect.value = moment.tz.guess();
            saveFormData();
        }
    }

    loadFormData();

    // Event listener for form changes to save data to localStorage
    form.addEventListener('change', saveFormData);

    // Event listener for time format change
    timeFormatSelect.addEventListener('change', (e) => {
        const newTimeFormat = e.target.value;
        updateTimeFormat(newTimeFormat);

        // Convert start and end times
        const convertTime = (time, format) => {
            return format === '12h' ? convertTo12HourFormat(time) : convertTo24HourFormat(time);
        };

        const previousStartTime = startTimeSelect.value;
        const previousEndTime = endTimeSelect.value;

        const convertedStartTime = convertTime(previousStartTime, newTimeFormat);
        const convertedEndTime = convertTime(previousEndTime, newTimeFormat);

        // Convert times in session storage
        let sessionSelectedSlots = convertTimesSessionStorage(newTimeFormat);

        // Update with converted times
        populateTimeDropdowns(startTimeSelect, endTimeSelect, newTimeFormat, granularity, convertedStartTime, convertedEndTime, startDateElement, endDateElement, startDateElement.value, endDateElement.value);
        generateAndReapplyTimeSlots();
    });

    // Event listener for time zone change
    timeZoneSelect.addEventListener('change', () => {
        const selectedTimeZone = timeZoneSelect.value;

        // Update session storage with converted times (rounded to nearest granularity)
        let sessionSelectedSlots = JSON.parse(sessionStorage.getItem('sessionSelectedSlots')) || [];
        sessionSelectedSlots = sessionSelectedSlots.map(slot => {
            const timestamp = moment.unix(slot.timestamp).tz(selectedTimeZone).unix();
            return { timestamp };
        });

        // Update session storage with converted times
        sessionStorage.setItem('sessionSelectedSlots', JSON.stringify(sessionSelectedSlots));

        // Update dropdowns, regenerate table, and reapply selections
        populateTimeDropdowns(startTimeSelect, endTimeSelect, timeFormat, granularity, startTimeSelect.value, endTimeSelect.value, startDateElement, endDateElement, startDateElement.value, endDateElement.value);
        generateAndReapplyTimeSlots();
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

    // Function to generate and reapply time slots
    const generateAndReapplyTimeSlots = () => {
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
        reapplySessionSelectedSlots(tableBody, tableHeader, sessionSelectedSlots, moment(startDateElement.value, 'YYYY-MM-DD'));
    };

    // Event listener for date change
    startDateElement.addEventListener('change', generateAndReapplyTimeSlots);
    endDateElement.addEventListener('change', generateAndReapplyTimeSlots);

    // Event listener for start time change
    startTimeSelect.addEventListener('change', generateAndReapplyTimeSlots);

    // Event listener for end time change
    endTimeSelect.addEventListener('change', generateAndReapplyTimeSlots);

    // Reset button handler
    resetButton.addEventListener('click', () => {
        // Reset form and table
        form.reset();
        tableBody.innerHTML = '';

        // Clear session storage
        sessionStorage.removeItem('sessionSelectedSlots');
        // Clear local storage
        localStorage.removeItem('formData');
        loadFormData();
    });

    // Save Data to Firebase and send Discord notification
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        saveFormData();
        const formData = JSON.parse(localStorage.getItem('formData'));

        let sessionSelectedSlots = JSON.parse(sessionStorage.getItem('sessionSelectedSlots')) || [];
        await saveDataToFirebase(formData);

        // Send Discord notification
        if (formData) {
            await sendDiscordNotification(
                formData.userName,
                formData.userNote,
                formData.timeZone,
                formData.startDate,
                formData.endDate,
                JSON.parse(formData.sessionSelectedSlots),
            );
        }
    });

    // Export Data to CSV
    exportCSVButton.addEventListener('click', () => {
        const formData = JSON.parse(localStorage.getItem('formData'));
        if (!formData) return alert('No data to export.');

        const csvContent = [
            ['Name', 'Time Zone', 'Start Date', 'End Date', 'Note', 'Selected Slots'],
            [
                formData.userName,
                formData.timeZone,
                formData.startDate,
                formData.endDate,
                `"${formData.userNote}"`,
                JSON.parse(formData.sessionSelectedSlots).map(slot => `${slot.day} ${slot.time}`).join('; '),
            ],
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'availability.csv';
        link.click();
    });
}