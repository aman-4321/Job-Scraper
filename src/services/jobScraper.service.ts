import { fetchAmazonJobs, processAndSaveAmazonJobs } from "./amazon.service";
import {
  fetchMicrosoftJobs,
  processAndSaveMicrosoftJobs,
} from "./microsoft.service";

function getTimeStamp() {
  const now = new Date();
  return `[${now.toLocaleDateString()} ${now.toLocaleTimeString()}]`;
}

export async function runJobScraper() {
  console.log(`${getTimeStamp()} 🚀 STARTING JOB SCRAPERS RUN`);

  try {
    console.log(`${getTimeStamp()} Starting Microsoft job scraper...`);
    const microsoftStartTime = new Date();
    const microsoftJobs = await fetchMicrosoftJobs();
    console.log(
      `${getTimeStamp()} Microsoft fetch completed in ${
        (new Date().getTime() - microsoftStartTime.getTime()) / 1000
      } seconds. Found ${microsoftJobs.length} jobs.`
    );

    const msNewJobs = await processAndSaveMicrosoftJobs(microsoftJobs);

    console.log(`${getTimeStamp()} Starting Amazon job scraper...`);
    const amazonStartTime = new Date();
    const amazonJobs = await fetchAmazonJobs();
    console.log(
      `${getTimeStamp()} Amazon fetch completed in ${
        (new Date().getTime() - amazonStartTime.getTime()) / 1000
      } seconds. Found ${amazonJobs.length} jobs.`
    );

    const amzNewJobs = await processAndSaveAmazonJobs(amazonJobs);

    console.log(`${getTimeStamp()} ✅ JOB SCRAPING COMPLETED SUCCESSFULLY`);
    console.log(`${getTimeStamp()} Summary:`);
    console.log(`${getTimeStamp()} - Microsoft: ${msNewJobs} new jobs added`);
    console.log(`${getTimeStamp()} - Amazon: ${amzNewJobs} new jobs added`);

    const totalRunTime =
      (new Date().getTime() - microsoftStartTime.getTime()) / 1000;
    console.log(
      `${getTimeStamp()} Total execution time: ${totalRunTime.toFixed(
        2
      )} seconds`
    );

    const endTime = new Date();
    console.log(
      `${getTimeStamp()} Last scraped: ${endTime.toLocaleTimeString()} on ${endTime.toLocaleDateString()}`
    );
  } catch (error) {
    console.error(
      `${getTimeStamp()} ❌ ERROR during scheduled job scraping:`,
      error
    );
  }
}
