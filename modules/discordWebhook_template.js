import moment from 'moment';
import axios from 'axios';

const webhookURL =
  ""

/**
 * Sends a notification to a Discord webhook.
 * @param {string} userName - The user's name.
 * @param {string} userNote - The user's note.
 * @param {string} timeZone - The user's time zone.
 * @param {string} startDate - The user's start time selection.
 * @param {string} endDate - The user's end time selection.
 * @param {Array} sessionSelectedSlots - The selected slots.
 */

export async function sendDiscordNotification(userName, userNote, timeZone, startDate, endDate, sessionSelectedSlots) {
  console.log('sessionSelectedSlots:', sessionSelectedSlots);
  console.log('Type of sessionSelectedSlots:', typeof sessionSelectedSlots);

  if (!Array.isArray(sessionSelectedSlots)) {
    console.error('sessionSelectedSlots is not an array:', sessionSelectedSlots);
    return;
  }

  const days = {};

  sessionSelectedSlots.forEach(slot => {
    const dateTime = moment.unix(slot.timestamp).tz(timeZone);
    const date = dateTime.format('YYYY-MM-DD');
    const time = dateTime.format('HH:mm');

    if (!days[date]) {
      days[date] = [];
    }
    days[date].push({ timestamp: slot.timestamp, time });
  });

  // Sort dates
  const sortedDates = Object.keys(days).sort((a, b) => new Date(a) - new Date(b));

  // Format the message
  const formattedSlots = sortedDates
    .map((date) => {
      const times = days[date].sort((a, b) => a.timestamp - b.timestamp);
      const timeBlocks = [];
      let startTime = times[0].time;
      let endTime = times[0].time;

      for (let i = 1; i < times.length; i++) {
        const currentTime = times[i].time;
        const previousTime = times[i - 1].time;

        const currentTimeInMinutes = convertTimeToMinutes(currentTime);
        const previousTimeInMinutes = convertTimeToMinutes(previousTime);

        if (currentTimeInMinutes === previousTimeInMinutes + 60) {
          endTime = currentTime;
        } else {
          timeBlocks.push({ start: startTime, end: endTime });
          startTime = currentTime;
          endTime = currentTime;
        }
      }
      timeBlocks.push({ start: startTime, end: endTime });

      return formatTimeBlocks(timeBlocks, date);
    }).join("\n");

  const startTimestamp = moment.unix(sessionSelectedSlots[0].timestamp).unix();
  const endTimestamp = moment.unix(sessionSelectedSlots[sessionSelectedSlots.length - 1].timestamp).unix();
  const startDateTimestamp = moment(startDate).unix();
  const endDateTimestamp = moment(endDate).unix();

  const message = `
**Name:** ${userName}
**Note:** ${userNote}
**Time Zone:** ${timeZone}
**For Timeframe:** <t:${startDateTimestamp}:D> - <t:${endDateTimestamp}:D>
**First Available:** <t:${startTimestamp}:D>
**Last Available:** <t:${endTimestamp}:D>
**Availability:**
${formattedSlots}
`;

  console.log("Generated message:", message); // Debugging line

  try {
    const response = await axios.post(webhookURL, {
      content: message
    });
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

// Helper function to convert time to minutes
function convertTimeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Helper function to format time blocks
function formatTimeBlocks(timeBlocks, date) {
  return timeBlocks.map((block, index) => {
    const startTimestamp = moment(`${date} ${block.start}`, 'YYYY-MM-DD HH:mm').unix();
    const endTimestamp = moment(`${date} ${block.end}`, 'YYYY-MM-DD HH:mm').unix();
    return index === 0
      ? `<t:${startTimestamp}:f> - <t:${endTimestamp}:t>`
      : `<t:${startTimestamp}:t> - <t:${endTimestamp}:t>`;
  }).join(", ");
}