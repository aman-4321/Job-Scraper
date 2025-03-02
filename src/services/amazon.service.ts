import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { parseISO } from "date-fns";

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
      const response = await axios.get(url);

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
  console.log(`Processing ${jobs.length} jobs for database insertion...`);

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
        console.log(`Job already exists: ${job.title} at ${job.company_name}`);
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

        console.log(`Added new job: ${job.title} at ${job.company_name}`);
      }
    } catch (error) {
      console.error(`Error processing job ${job.title}:`, error);
    }
  }
}

async function main() {
  try {
    console.log("Fetching Amazon job listings...");
    const jobs = await fetchAmazonJobs();
    console.log(`Found ${jobs.length} job listings`);

    if (jobs.length > 0) {
      console.log("----------------------------------------");
      jobs.forEach((job, index) => {
        console.log(`Job #${index + 1}:`);
        console.log(`Title: ${job.title}`);
        console.log(`Location: ${job.normalized_location}`);
        console.log(`Posted Date: ${job.posted_date}`);
        console.log(`URL: ${job.url}`);
        console.log("----------------------------------------");
      });

      await processAndSaveAmazonJobs(jobs);
      console.log("Job scraping completed successfully");
    }
  } catch (error) {
    console.error("Error in job scraping process:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
