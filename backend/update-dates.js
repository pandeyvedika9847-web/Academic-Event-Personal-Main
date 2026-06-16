const { Event } = require("./db/models");
const { connectForScript } = require("./utils/scriptSafety");

async function updateDates() {
  try {
    await connectForScript("update-dates");
    const events = await Event.findAll({ order: [["id", "ASC"]] });
    const today = new Date();

    for (let index = 0; index < events.length; index += 1) {
      const event = events[index];
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + index + 1);
      await event.update({ date: nextDate });
    }

    console.log(`Updated ${events.length} event dates.`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

updateDates();
