// modules/storage.js

import { db } from './firebase.js'; // Import only 'db'
import { ref, get, set } from 'firebase/database';

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
                        timestamp: slot.timestamp
                    });
                });
            }

            // Set time zone
            timeZoneSelect.value = data.timeZone || moment.tz.guess() || "Europe/Berlin";

            // Generate time slots and reapply selections
            generateAndReapplyTimeSlots(data);

        } else {
            console.log("No data available for the user.");
        }
    } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        //alert("An error occurred while loading your availability.");
    }
}

// Generate time slots and reapply selections
function generateAndReapplyTimeSlots(data) {
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
}

async function fetchDataFromFirebase() {
    try {
        const snapshot = await get(ref(db, 'selectedSlots'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            generateAndReapplyTimeSlots(data);
        } else {
            console.log("No data available for the user.");
        }
    } catch (error) {
        console.error("Error fetching data from Firebase:", error);
    }
}

export async function saveDataToFirebase(timeFormat, sessionSelectedSlots) {
    const selectedSlots = sessionSelectedSlots.map(slot => ({
        timestamp: slot.timestamp
    }));

    try {
        const dbRef = ref(db, 'selectedSlots');
        await set(dbRef, selectedSlots);
        console.log('Data saved to Firebase:', selectedSlots);
    } catch (error) {
        console.error('Error saving data to Firebase:', error);
    }
}

// Helper function to generate a unique ID
function generateUniqueId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}