import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { parseISO } from "date-fns";
import { getRandomUserAgent } from "../useragents";

const prisma = new PrismaClient();

interface MicrosoftJob {
  jobId: string;
  title: string;
  location: string;
  description: string;
  posted_date: Date;
  url: string;
}

export async function fetchMicrosoftJobs(
  initialPage: number = 1,
  pageSize: number = 20,
  orderBy: string = "Relevance"
): Promise<MicrosoftJob[]> {
  try {
    const lastJob = await prisma.jobs.findFirst({
      where: { company: "Microsoft" },
      orderBy: { posted_date: "desc" },
    });

    let allJobs: MicrosoftJob[] = [];
    let page = initialPage;
    let newJobsFound = true;
    const maxPages = 3;

    while (newJobsFound && page <= maxPages) {
      console.log(`Fetching Microsoft jobs page ${page}...`);
      const url = `https://gcsservices.careers.microsoft.com/search/api/v1/search`;

      const response = await axios.get(url, {
        params: {
          l: "en_us",
          pg: page,
          pgSz: pageSize,
          o: orderBy,
          flt: true,
        },
        headers: {
          Accept: "application/json",
          "User-Agent": getRandomUserAgent(),
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://careers.microsoft.com/",
          Connection: "keep-alive",
        },
      });

      if (!response.data?.operationResult?.result?.jobs) {
        console.log("No jobs data found in the response structure");
        break;
      }

      const pageJobs: MicrosoftJob[] =
        response.data.operationResult.result.jobs.map((job: any) => ({
          jobId: job.jobId || "N/A",
          title: job.title || "N/A",
          location:
            job.properties?.primaryLocation ||
            job.properties?.locations?.[0] ||
            "N/A",
          description: job.properties?.description || "N/A",
          posted_date: job.postingDate ? parseISO(job.postingDate) : new Date(),
          url: `https://careers.microsoft.com/us/en/job/${job.jobId}`,
        }));

      if (pageJobs.length === 0) break;

      if (lastJob && page > 1) {
        const allNewJobs = pageJobs.filter(
          (job) => job.posted_date > lastJob.posted_date
        );
        if (allNewJobs.length === 0) {
          newJobsFound = false;
          console.log("No new jobs found on this page, stopping fetch");
        }
      }

      allJobs = [...allJobs, ...pageJobs];
      page++;

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return allJobs;
  } catch (error) {
    console.error("Error fetching Microsoft jobs:", error);
    return [];
  }
}

export async function processAndSaveMicrosoftJobs(jobs: MicrosoftJob[]) {
  console.log(
    `Processing ${jobs.length} Microsoft jobs for database insertion...`
  );

  for (const job of jobs) {
    try {
      const existingJob = await prisma.jobs.findUnique({
        where: {
          jobUrl: job.url,
        },
      });

      if (existingJob) {
        console.log(`Job already exists: ${job.title} at Microsoft`);
      } else {
        await prisma.jobs.create({
          data: {
            title: job.title,
            company: "Microsoft",
            location: job.location,
            description: job.description,
            posted_date: job.posted_date,
            jobUrl: job.url,
          },
        });

        console.log(`Added new job: ${job.title} at Microsoft`);
      }
    } catch (error) {
      console.error(`Error processing job ${job.title}:`, error);
    }
  }
}

export async function main() {
  try {
    console.log("Fetching Microsoft job listings...");
    const jobs = await fetchMicrosoftJobs();
    console.log(`Found ${jobs.length} job listings:`);

    if (jobs.length > 0) {
      console.log("----------------------------------------");
      jobs.forEach((job, index) => {
        console.log(`Job #${index + 1}:`);
        console.log(`Title: ${job.title}`);
        console.log(`Location: ${job.location}`);
        console.log(`Job ID: ${job.jobId}`);
        console.log(`Posted Date: ${job.posted_date}`);
        console.log(`URL: ${job.url}`);
        console.log("----------------------------------------");
      });

      await processAndSaveMicrosoftJobs(jobs);
      console.log("Microsoft jobs processing completed successfully");
    }
  } catch (error) {
    console.error("Error in Microsoft job scraping process:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
