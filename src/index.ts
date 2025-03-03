import express, { Request, Response } from "express";
import cors from "cors";
import { CronJob } from "cron";
import { runJobScraper } from "./services/jobScraper.service";
import { prisma } from "./db";
import { jobRouter } from "./routes/job.routes";

const app = express();
const PORT = process.env.PORT || 8080;

function getTimeStamp() {
  const now = new Date();
  return `[${now.toLocaleDateString()} ${now.toLocaleTimeString()}]`;
}

app.use(cors());
app.use(express.json());
app.use("/api/v1/jobs", jobRouter);
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`${getTimeStamp()} API server running on port ${PORT}`);

  console.log(`${getTimeStamp()} Starting job scraper scheduler...`);

  console.log(`${getTimeStamp()} 🔄 Executing initial job scraper run...`);
  runJobScraper().catch((err) =>
    console.error(`${getTimeStamp()} Initial job scraper run failed:`, err)
  );

  const scheduledJob = new CronJob("0 0 * * * *", async () => {
    console.log(
      `${getTimeStamp()} ⏰ CRON TRIGGER: Starting scheduled job scraping`
    );
    try {
      await runJobScraper();
      console.log(`${getTimeStamp()} ✅ CRON JOB COMPLETED SUCCESSFULLY`);
    } catch (error) {
      console.error(`${getTimeStamp()} ❌ CRON JOB FAILED:`, error);
    }
  });

  scheduledJob.start();
  console.log(`${getTimeStamp()} Scheduler started}`);

  setInterval(() => {
    console.log(
      `${getTimeStamp()} ❤️ Scheduler heartbeat check. Next scheduled run: ${scheduledJob
        .nextDate()
        .toLocaleString()}`
    );

    const used = process.memoryUsage();
    console.log(
      `${getTimeStamp()} 📊 Memory usage: RSS ${Math.round(
        used.rss / 1024 / 1024
      )}MB | Heap ${Math.round(used.heapUsed / 1024 / 1024)}/${Math.round(
        used.heapTotal / 1024 / 1024
      )}MB`
    );
  }, 3600000);

  process.on("SIGINT", () => {
    console.log(`${getTimeStamp()} Stopping scheduler...`);
    scheduledJob.stop();
    prisma.$disconnect().then(() => {
      console.log(`${getTimeStamp()} Database connection closed. Exiting.`);
      process.exit(0);
    });
  });
});
