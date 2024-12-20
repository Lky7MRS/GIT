// modules/storage.js

import { db } from './firebase.js';
import { getDatabase, ref, get, update } from 'firebase/database';

export async function saveDataToFirebase(formData) {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = generateUniqueId();
        localStorage.setItem('userId', userId);
    }

    const formattedData = {
        [userId]: {
            name: formData.userName,
            note: formData.userNote,
            timeZone: formData.timeZone,
            timeFormat: formData.timeFormat,
            granularity: formData.granularity,
            startDate: formData.startDate,
            endDate: formData.endDate,
            selectedSlots: JSON.parse(formData.sessionSelectedSlots) || []
        }
    };
    try {
        const dbRef = ref(db, 'availabilities');
        await update(dbRef, formattedData);
    } catch (error) {
        console.error('Error saving data to Firebase:', error);
    }
}

export async function fetchDataFromFirebase() {
    try {
        const db = getDatabase();
        const dbRef = ref(db, 'availabilities');
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            return data;
        } else {
            console.log('No data available');
            return null;
        }
    } catch (error) {
        console.error('Error fetching data from Firebase:', error);
        return null;
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
