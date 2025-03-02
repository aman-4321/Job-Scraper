import express from "express";
import { GetJobById, GetJobs } from "../controllers/job.controller";

export const jobRouter = express.Router();

jobRouter.get("/", GetJobs);
jobRouter.get("/:id", GetJobById);
