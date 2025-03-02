import { Request, Response } from "express";
import { prisma } from "../db";

export const GetJobs = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "10", company, location, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filtering conditions
    const where: any = {};

    if (company) {
      where.company = {
        contains: company as string,
        mode: "insensitive",
      };
    }

    if (location) {
      where.location = {
        contains: location as string,
        mode: "insensitive",
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { company: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.jobs.count({ where });
    const totalPages = Math.ceil(total / limitNum);

    // Check if the requested page is valid
    if (pageNum > totalPages && total > 0) {
      res.status(400).json({
        error: `Invalid page number. The last available page is ${totalPages}.`,
        total,
        totalPages,
      });
    }

    // Get jobs with pagination
    const jobs = await prisma.jobs.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        posted_date: "desc",
      },
    });

    res.json({
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      jobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};

export const GetJobById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.jobs.findUnique({
      where: { id },
    });

    if (!job) {
      res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: "Failed to fetch job" });
  }
};
