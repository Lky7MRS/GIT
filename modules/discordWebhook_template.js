import axios from "axios";
import moment from "moment";
import { convertTo24HourFormat } from "./utils.js";

const webhookURL =
  ""

 /**
 * Sends a message to the Discord webhook.
 * @param {string} userName - The user's name.
 * @param {string} userNote - The user's note.
 * @param {string} timeZone - The user's time zone.
 * @param {string} startDate - The start date.
 * @param {string} endDate - The end date.
 * @param {Array} selectedSlots - The selected slots.
 * @param {string} timeFormat - The time format ('12h' or '24h').
 */
export async function sendDiscordNotification(
  userName,
  userNote,
  timeZone,
  startDate,
  endDate,
  selectedSlots,
  timeFormat
) {
  const days = {};

  // Group slots by date
  selectedSlots.forEach(slot => {
    const date = moment(slot.date, 'DD/MM/YYYY').format('YYYY-MM-DD');
    if (!days[date]) {
      days[date] = [];
    }
    days[date].push(slot.time);
  });

  // Sort dates
  const sortedDates = Object.keys(days).sort((a, b) => new Date(a) - new Date(b));

  // Format the message
  const formattedSlots = sortedDates
    .map((date) => {
      const times = days[date];
      const timeBlocks = [];
      let startTime = times[0];
      let endTime = times[0];

      for (let i = 1; i < times.length; i++) {
        const currentTime = times[i];
        const previousTime = times[i - 1];

        // Check if the current time is consecutive to the previous time
        const currentTimeInMinutes =
          parseInt(currentTime.split(":")[0]) * 60 +
          parseInt(currentTime.split(":")[1]);
        const previousTimeInMinutes =
          parseInt(previousTime.split(":")[0]) * 60 +
          parseInt(previousTime.split(":")[1]);

        if (currentTimeInMinutes === previousTimeInMinutes + 60) {
          endTime = currentTime;
        } else {
          timeBlocks.push({ start: startTime, end: endTime });
          startTime = currentTime;
          endTime = currentTime;
        }
      }
      timeBlocks.push({ start: startTime, end: endTime });

      const formattedTimeBlocks = timeBlocks
        .map((block, index) => {
          const start = timeFormat === "12h" ? convertTo24HourFormat(block.start) : block.start;
          const end = timeFormat === "12h" ? convertTo24HourFormat(block.end) : block.end;
          const startTimestamp = Math.floor(
            new Date(`${date}T${start}:00`).getTime() / 1000
          );
          const endTimestamp = Math.floor(
            new Date(`${date}T${end}:00`).getTime() / 1000 + 59 * 60
          );
          if (index === 0) {
            return `<t:${startTimestamp}:f> - <t:${endTimestamp}:t>`;
          } else {
            return `<t:${startTimestamp}:t> - <t:${endTimestamp}:t>`;
          }
        })
        .join(", ");

      return formattedTimeBlocks;
    })
    .join("\n");

  const message = `
    **Name:** ${userName}
    **Note:** ${userNote}
    **Time Zone:** ${timeZone}
    **Start Date:** <t:${Math.floor(new Date(startDate).getTime() / 1000)}:D>
    **End Date:** <t:${Math.floor(new Date(endDate).getTime() / 1000)}:D>
    **Availability:**
    ${formattedSlots}
    `;

  console.log("Generated message:", message); // Debugging line

  try {
    const response = await axios.post(webhookURL, {
      content: message,
    });
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}