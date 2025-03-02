# Job Scraping and API Service

This service scrapes job listings from Microsoft and Amazon careers websites and provides REST APIs to interact with the collected data. It stores job listings in a PostgreSQL database and refreshes data every 30 minutes via cron jobs.

## Features

- **Automated Job Scraping**: Collects job listings from Microsoft and Amazon careers websites
- **RESTful API**: Provides endpoints to retrieve and filter job listings
- **Scheduled Updates**: Uses cron jobs to refresh job data every 30 minutes
- **Pagination**: API endpoints support pagination for better performance
- **Filtering**: Supports filtering jobs by company, location, and keyword search

## System Requirements

- Node.js (v14+)
- PostgreSQL database
- npm or yarn package manager

## Environment Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure your environment variables in `.env` file:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
   PORT=8080
   ```

## Database Setup

This project uses Prisma ORM to manage database operations. The database schema includes a `jobs` table with the following structure:

- `id`: Unique identifier (UUID)
- `title`: Job title
- `company`: Company name (Microsoft or Amazon)
- `location`: Job location
- `description`: Job description
- `posted_date`: Date job was posted
- `jobUrl`: URL to the job listing (used as unique constraint)
- `createdAt`: Record creation timestamp
- `updatedAt`: Record update timestamp

To set up the database:

1. Run Prisma migrations:
   ```
   npx prisma migrate dev
   ```

## Starting the Service

Run the application:

```
npm start
```

The server will start on the configured port (default: 8080), and job scraping will begin according to the schedule.

## API Endpoints

### GET /api/v1/jobs

Retrieves a paginated list of jobs with optional filtering.

**Query Parameters:**

| Parameter | Type   | Default | Description                                      |
| --------- | ------ | ------- | ------------------------------------------------ |
| page      | number | 1       | Page number for pagination                       |
| limit     | number | 10      | Number of results per page                       |
| company   | string | null    | Filter by company name (case insensitive)        |
| location  | string | null    | Filter by location (case insensitive)            |
| search    | string | null    | Search in title, company, and description fields |

**Example Request:**

```
GET /api/v1/jobs?page=1&limit=5&company=Microsoft&location=India
```

**Example Response:**

```json
{
  "total": 45,
  "page": 1,
  "limit": 5,
  "totalPages": 9,
  "jobs": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Software Engineer",
      "company": "Microsoft",
      "location": "Bengaluru, India",
      "description": "Job description here...",
      "posted_date": "2023-05-15T00:00:00.000Z",
      "jobUrl": "https://careers.microsoft.com/us/en/job/1234567",
      "createdAt": "2023-05-16T12:30:45.123Z",
      "updatedAt": "2023-05-16T12:30:45.123Z"
    }
    // More jobs...
  ]
}
```

### GET /api/v1/jobs/:id

Retrieves detailed information about a specific job by its ID.

**Example Request:**

```
GET /api/v1/jobs/123e4567-e89b-12d3-a456-426614174000
```

**Example Response:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Software Engineer",
  "company": "Microsoft",
  "location": "Bengaluru, India",
  "description": "Detailed job description...",
  "posted_date": "2023-05-15T00:00:00.000Z",
  "jobUrl": "https://careers.microsoft.com/us/en/job/1234567",
  "createdAt": "2023-05-16T12:30:45.123Z",
  "updatedAt": "2023-05-16T12:30:45.123Z"
}
```

## Error Responses

The API returns appropriate HTTP status codes and error messages:

- `400`: Bad Request - Invalid input parameters
- `404`: Not Found - Job or resource not found
- `500`: Internal Server Error - Server-side issues

**Example Error Response:**

```json
{
  "error": "Invalid page number. The last available page is 9.",
  "total": 45,
  "totalPages": 9
}
```

## Job Scrapers

### Microsoft Jobs Scraper

- Fetches jobs from Microsoft's careers API
- Uses pagination to retrieve multiple pages of results
- Filters for new jobs based on posting dates
- Default configuration fetches up to 3 pages of results

### Amazon Jobs Scraper

- Fetches jobs from Amazon's careers JSON API
- Filters for jobs in India by default
- Retrieves up to 300 jobs in batches of 100
- Stops when no new jobs are found or limits are reached

## Scheduling

The application uses the `cron` package to schedule job scraping every 30 minutes. The cron expression used is `0 */30 * * * *`.

## Development and Extension

To add more job sources:

1. Create a new scraper file (e.g., `google.ts`)
2. Implement `fetchGoogleJobs` and `processAndSaveGoogleJobs` functions
3. Import and integrate these functions in `index.ts`

## Troubleshooting

**Database Connection Issues:**

- Verify DATABASE_URL is correctly configured
- Check PostgreSQL server is running
- Ensure network connectivity to the database

**Scraping Problems:**

- Check console logs for specific errors
- Verify that target sites haven't changed their API structure
- Adjust request headers if being blocked
