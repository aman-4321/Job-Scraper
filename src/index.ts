import express, { Request, Response } from "express";
import cors from "cors";
import { CronJob } from "cron";
import { runJobScraper } from "./services/jobScraper.service";
import { prisma } from "./db";
import { jobRouter } from "./routes/job.routes";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use("/api/v1/jobs", jobRouter);
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
  });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);

  console.log("Starting job scraper scheduler...");

  const scheduledJob = new CronJob("0 0 * * * *", runJobScraper);
  scheduledJob.start();

  process.on("SIGINT", () => {
    console.log("Stopping scheduler...");
    scheduledJob.stop();
    prisma.$disconnect().then(() => {
      process.exit(0);
    });
  });
});
