const { User, Event, sequelize } = require("./db/models");
const { replaceEventTags } = require("./utils/dbCollections");
const { connectForScript } = require("./utils/scriptSafety");

const extraEvents = [
  { title: "Clean Energy Seminar", type: "seminar", department: "Engineering", tags: ["Energy", "Sustainability"] },
  { title: "Algorithms Bootcamp", type: "training", department: "Computer Science", tags: ["Programming", "Algorithms"] },
  { title: "Digital Literature Lecture", type: "lecture", department: "Arts & Humanities", tags: ["Literature", "Digital Media"] },
  { title: "Startup Pitch Competition", type: "conference", department: "Business & Management", tags: ["Startups", "Entrepreneurship"] },
];

async function run() {
  await connectForScript("seed-more");
  const creator = await User.findOne({ where: { role: "admin" } });
  if (!creator) throw new Error("No admin user found. Run the base seed first.");

  for (let index = 0; index < extraEvents.length; index += 1) {
    const template = extraEvents[index];
    const date = new Date();
    date.setDate(date.getDate() + index + 10);
    const event = await Event.create({
      title: template.title,
      description: `${template.title} description.`,
      type: template.type,
      department: template.department,
      faculty: template.department,
      date,
      time: "02:00 PM - 04:00 PM",
      venue: `${template.department} Hall`,
      speaker: "Guest Speaker",
      capacity: 120,
      status: "approved",
      createdById: creator.id,
      color: "#3b82f6",
    });
    await replaceEventTags(event.id, { tags: template.tags, subjectTags: [template.department] }, null, { tags: [], subjectTags: [] });
  }
}

run()
  .then(() => sequelize.close())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
