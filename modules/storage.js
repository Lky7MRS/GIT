// modules/storage.js

import { db } from './firebase.js'; // Import only 'db'
import { ref, get, set } from 'firebase/database';
import { convertTo24HourFormat } from './utils.js';

export async function loadDataFromFirebase(
    userId,
    timeZoneSelect,
    timeFormatSelect,
    granularitySelect,
    startTimeSelect,
    endTimeSelect,
    startDateElement,
    endDateElement,
    tableBody,
    tableHeader,
    sessionSelectedSlots,
    reapplySessionSelectedSlots
) {
    try {
        const availabilityRef = ref(db, 'availabilities/' + userId);
        const snapshot = await get(availabilityRef);

        if (snapshot.exists()) {
            const savedData = snapshot.val();
            const data = savedData[Object.keys(savedData)[0]];

            document.getElementById('userName').value = data.name;
            document.getElementById('note').value = data.note;

            // Format dates correctly before setting values
            startDateElement.value = moment(data.startDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
            endDateElement.value = moment(data.endDate, 'YYYY-MM-DD').format('YYYY-MM-DD');

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
            console.log("No data available for the user.");
        }
    } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        alert("An error occurred while loading your availability.");
    }
}

export async function saveDataToFirebase(timeFormat, sessionSelectedSlots) {
    const selectedSlots24h = sessionSelectedSlots.map(slot => ({
        time: timeFormat === '12h' ? convertTo24HourFormat(slot.time) : slot.time,
        day: slot.day
    })).filter(slot => slot.time && slot.day);

    try {
        const dbRef = ref(db, 'selectedSlots');
        await set(dbRef, selectedSlots24h);
        console.log('Data saved to Firebase:', selectedSlots24h);
    } catch (error) {
        console.error('Error saving data to Firebase:', error);
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