const { Event, EventTag, EventRegistration, Bookmark } = require("./db/models");
const { connectForScript } = require("./utils/scriptSafety");

async function wipeEvents() {
  try {
    await connectForScript("wipe-events");
    await EventRegistration.destroy({ where: {} });
    await Bookmark.destroy({ where: {} });
    await EventTag.destroy({ where: {} });
    const count = await Event.destroy({ where: {} });
    console.log(`Wipe complete. Deleted ${count} events.`);
    process.exit(0);
  } catch (error) {
    console.error("Error during wipe:", error);
    process.exit(1);
  }
}

wipeEvents();
