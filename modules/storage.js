// modules/storage.js
import moment from 'moment';
import { convertToUserTimeZone } from './utils.js';
import { generateTimeSlots, reapplySessionSelectedSlots, updateSessionSelectedSlots } from './table.js';
import { populateTimeDropdowns } from './utils.js';
import { timeFormat, granularity } from '../script.js';
import { db } from './firebase.js'; // Import only 'db'
import { ref, get } from 'firebase/database';

export async function loadDataFromLocalStorage(
    timeZoneSelect,
    timeFormatSelect,
    granularitySelect,
    startTimeSelect,
    endTimeSelect,
    tableBody,
    tableHeader
) {
    // Populate time zones
    moment.tz.names().forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.text = zone;
        timeZoneSelect.appendChild(option);
    });

    try {
        // Use a unique identifier for anonymous users
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = generateUniqueId();
            localStorage.setItem('userId', userId);
        }

        const availabilityRef = ref(db, 'availabilities/' + userId);
        const snapshot = await get(availabilityRef);

        let sessionSelectedSlots = [];

        if (snapshot.exists()) {
            const savedData = snapshot.val();
            const data = savedData[Object.keys(savedData)[0]];

            document.getElementById('userName').value = data.name;
            document.getElementById('note').value = data.note;

            // Format dates correctly before setting values
            document.getElementById('startDate').value = moment(data.startDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
            document.getElementById('endDate').value = moment(data.endDate, 'YYYY-MM-DD').format('YYYY-MM-DD');

            // Set time format and populate dropdowns
            timeFormatSelect.value = data.timeFormat;

            // Set granularity
            granularitySelect.value = data.granularity;

            populateTimeDropdowns(startTimeSelect, endTimeSelect, data.timeFormat, data.granularity);

            // Set start and end times
            startTimeSelect.value = data.startTime;
            endTimeSelect.value = data.endTime;

            // Convert and load selected slots
            if (data.selectedSlots) {
                data.selectedSlots.forEach(slot => {
                    sessionSelectedSlots.push({
                        time: convertToUserTimeZone(slot.time, data.timeZone, data.timeFormat, data.granularity),
                        day: slot.day
                    });
                });
            }

            // Set time zone
            timeZoneSelect.value = data.timeZone || moment.tz.guess() || "Europe/Berlin";

            // Generate time slots and reapply selections
            generateTimeSlots(
                tableBody,
                tableHeader,
                data.startDate,
                data.endDate,
                startTimeSelect,
                endTimeSelect,
                data.timeFormat,
                data.granularity,
                sessionSelectedSlots,
                reapplySessionSelectedSlots
            );

            // Update session storage with the current state
            updateSessionSelectedSlots(tableBody, tableHeader);

        } else {
            const today = moment().format('YYYY-MM-DD');
            const weeksFromToday = moment().add(1, 'week').format('YYYY-MM-DD');

            // Initialize for new users
            populateTimeDropdowns(startTimeSelect, endTimeSelect, '24h', 60);
            generateTimeSlots(
                tableBody,
                tableHeader,
                today,
                weeksFromToday,
                startTimeSelect,
                endTimeSelect,
                '24h',
                60,
                sessionSelectedSlots,
                reapplySessionSelectedSlots
            );
            timeZoneSelect.value = moment.tz.guess() || "Europe/Berlin";
        }
    } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        alert("An error occurred while loading your availability.");
    }
}

// Helper function to generate a unique ID
function generateUniqueId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}