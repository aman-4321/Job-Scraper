import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { parseISO } from "date-fns";
import { getRandomUserAgent } from "../useragents";

const prisma = new PrismaClient();

interface AmazonJob {
  title: string;
  company_name: string;
  normalized_location: string;
  description: string;
  posted_date: string;
  job_path: string;
  url?: string;
}

export async function fetchAmazonJobs() {
  try {
    const lastJob = await prisma.jobs.findFirst({
      where: { company: "Amazon" },
      orderBy: { posted_date: "desc" },
    });

    let allJobs: AmazonJob[] = [];
    let offset = 0;
    const limit = 100;
    const maxFetches = 3;
    let fetchCount = 0;
    let foundNewJobs = true;

    while (foundNewJobs && fetchCount < maxFetches) {
      const url = `https://www.amazon.jobs/en/search.json?radius=24km&facets[]=normalized_country_code&facets[]=normalized_state_name&facets[]=normalized_city_name&facets[]=location&facets[]=business_category&facets[]=category&facets[]=schedule_type_id&facets[]=employee_class&facets[]=normalized_location&facets[]=job_function_id&facets[]=is_manager&facets[]=is_intern&offset=${offset}&result_limit=${limit}&sort=relevant&latitude=&longitude=&loc_group_id=&loc_query=India&base_query=&city=&country=IND&region=&county=&query_options=&=`;

      console.log(`Fetching Amazon jobs with offset ${offset}...`);
      const response = await axios.get(url, {
        headers: {
          "User-Agent": getRandomUserAgent(),
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://www.amazon.jobs/en/",
          Connection: "keep-alive",
        },
      });

      if (
        !response.data ||
        !response.data.jobs ||
        response.data.jobs.length === 0
      ) {
        console.log("No more jobs found in response");
        break;
      }

      const jobsWithUrls = response.data.jobs.map((job: AmazonJob) => ({
        ...job,
        url: `https://amazon.jobs/${job.job_path}`,
      }));

      if (lastJob && fetchCount > 0) {
        const newJobs = jobsWithUrls.filter((job: AmazonJob) => {
          const jobDate = new Date(job.posted_date);
          return jobDate > lastJob.posted_date;
        });

        if (newJobs.length === 0) {
          foundNewJobs = false;
          console.log("No new jobs found in this batch");
        }
      }

      allJobs = [...allJobs, ...jobsWithUrls];
      offset += limit;
      fetchCount++;

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`Fetched a total of ${allJobs.length} Amazon jobs`);
    return allJobs;
  } catch (error) {
    console.error("Error fetching Amazon jobs:", error);
    return [];
  }
}

export async function processAndSaveAmazonJobs(jobs: AmazonJob[]) {
  console.log(`Processing ${jobs.length} Amazon jobs...`);

  let newJobsAdded = 0;
  let existingJobsCount = 0;

  for (const job of jobs) {
    try {
      const fullDescription = `${job.description}`;

      const postedDate = new Date(job.posted_date);

      const existingJob = await prisma.jobs.findUnique({
        where: {
          jobUrl: job.url as string,
        },
      });

      if (existingJob) {
        existingJobsCount++;
      } else {
        await prisma.jobs.create({
          data: {
            title: job.title,
            company: job.company_name,
            location: job.normalized_location,
            description: fullDescription,
            posted_date: postedDate,
            jobUrl: job.url as string,
          },
        });

        newJobsAdded++;
      }
    } catch (error: any) {
      if (error.code === "P2002" && error.meta?.target?.includes("jobUrl")) {
        existingJobsCount++;
      } else {
        console.error(`Error processing job ${job.title}:`, error);
      }
    }
  }

  console.log(
    `Amazon scraping summary: ${newJobsAdded} new jobs added, ${existingJobsCount} already existed`
  );

  return newJobsAdded;
}

async function main() {
  try {
    console.log("Fetching Amazon job listings...");
    const jobs = await fetchAmazonJobs();
    console.log(`Found ${jobs.length} Amazon job listings`);

    if (jobs.length > 0) {
      const newJobsAdded = await processAndSaveAmazonJobs(jobs);
      console.log(
        `Amazon jobs processing completed: ${newJobsAdded} new jobs added`
      );
    } else {
      console.log("No Amazon jobs found to process");
    }
  } catch (error) {
    console.error("Error in Amazon job scraping process:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
