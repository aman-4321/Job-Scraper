import { fetchAmazonJobs, processAndSaveAmazonJobs } from "./amazon.service";
import { prisma } from "../db";
import {
  fetchMicrosoftJobs,
  processAndSaveMicrosoftJobs,
} from "./microsoft.service";

export async function runJobScraper() {
  console.log(`Running job scrapers at ${new Date().toISOString()}`);

  try {
    const existingMicrosoftJobsCount = await prisma.jobs.count({
      where: { company: "Microsoft" },
    });

    const existingAmazonJobsCount = await prisma.jobs.count({
      where: { company: "Amazon" },
    });

    console.log("Running Microsoft job scraper...");
    const microsoftJobs = await fetchMicrosoftJobs();
    await processAndSaveMicrosoftJobs(microsoftJobs);

    console.log("Running Amazon job scraper...");
    const amazonJobs = await fetchAmazonJobs();
    await processAndSaveAmazonJobs(amazonJobs);

    const newMicrosoftJobsCount = await prisma.jobs.count({
      where: { company: "Microsoft" },
    });

    const newAmazonJobsCount = await prisma.jobs.count({
      where: { company: "Amazon" },
    });

    console.log(
      `Microsoft scraping completed. Found ${
        microsoftJobs.length
      } jobs, added ${
        newMicrosoftJobsCount - existingMicrosoftJobsCount
      } new jobs to database.`
    );

    console.log(
      `Amazon scraping completed. Found ${amazonJobs.length} jobs, added ${
        newAmazonJobsCount - existingAmazonJobsCount
      } new jobs to database.`
    );

    console.log("All job scraping completed successfully");
    const endTime = new Date();
    console.log(
      `Last scraped: ${endTime.toLocaleTimeString()} on ${endTime.toLocaleDateString()}`
    );
  } catch (error) {
    console.error("Error during scheduled job scraping:", error);
  }
}
