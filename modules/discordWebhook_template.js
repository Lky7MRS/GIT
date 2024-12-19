import axios from "axios";

const webhookURL =
  "";

/**
 * Sends a message to the Discord webhook.
 * @param {string} userName - The user's name.
 * @param {string} userNote - The user's note.
 * @param {string} timeZone - The user's time zone.
 * @param {string} startDate - The start date.
 * @param {string} endDate - The end date.
 * @param {Array} selectedSlots - The selected slots.
 */
export async function sendDiscordNotification(
  userName,
  userNote,
  timeZone,
  startDate,
  endDate,
  selectedSlots
) {
  const days = {};

  // Group slots by day and date
  selectedSlots.forEach((slot) => {
    const [day, date] = slot.day.split("\n");
    const key = `${day} (${date})`;
    if (!days[key]) {
      days[key] = [];
    }
    days[key].push(slot.time);
  });

  // Log the grouped days and times
  console.log("Grouped days and times:", days);

  // Sort times for each day
  Object.keys(days).forEach((day) => {
    days[day].sort();
  });

  // Sort the days by date
  const sortedDays = Object.keys(days).sort((a, b) => {
    // Extract date in DD/MM format
    const dateA = a.match(/\((\d{2}\/\d{2})\)/)[1]; 
    const dateB = b.match(/\((\d{2}\/\d{2})\)/)[1];
    // Create Date objects with the extracted date and current year
    const dateAObj = new Date(`${dateA}/${new Date().getFullYear()}`); 
    const dateBObj = new Date(`${dateB}/${new Date().getFullYear()}`);
    return dateAObj - dateBObj;
  });

  // Format the message
  const formattedSlots = sortedDays
    .map((day) => {
      const times = days[day];
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
        .map((block) => {
          const startTimestamp = Math.floor(
            new Date(`${startDate.split("T")[0]}T${block.start}:00`).getTime() / 1000
          );
          const endTimestamp = Math.floor(
            new Date(`${startDate.split("T")[0]}T${block.end}:00`).getTime() / 1000 + 59 * 60
          );
          return `<t:${startTimestamp}:t> - <t:${endTimestamp}:t>`;
        })
        .join(", ");

      // Remove double parentheses from the date
      const formattedDay = day.replace(/\(\(/g, "(").replace(/\)\)/g, ")");

      return `**${formattedDay}**: ${formattedTimeBlocks}`;
    })
    .join("\n");

  // Log the formatted slots
  console.log("Formatted slots:", formattedSlots);

  const message = `
**Name:** ${userName}
**Note:** ${userNote}
**Time Zone:** ${timeZone}
**Start Date:** <t:${Math.floor(new Date(startDate).getTime() / 1000)}:d>
**End Date:** <t:${Math.floor(new Date(endDate).getTime() / 1000)}:d>
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