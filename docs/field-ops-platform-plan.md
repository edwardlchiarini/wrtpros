# Field Operations Platform Plan

## Vision
Build a web application that lets your team:

1. Upload or email scanned receipts.
2. OCR and extract line-item detail from each receipt.
3. Assign each line item to different jobs (not just one receipt-to-one-job).
4. Track employees and schedule workers to specific jobs.
5. Store and organize job photos as proof of work and job history.

---

## Recommended MVP (Phase 1)

### 1) Receipt intake + OCR
- **Input channels:**
  - Web upload (drag/drop PDF, JPG, PNG, HEIC).
  - Forwarded email inbox (e.g., `receipts@yourdomain.com`).
- **OCR pipeline:**
  - Normalize image (deskew, contrast, denoise).
  - OCR extraction.
  - Parse vendor name, date, tax, total, and each line item.
- **Human-in-the-loop review screen:**
  - Confidence indicators per field/line.
  - Quick edit for quantity, description, and amount.

### 2) Split receipt items across multiple jobs
- Build a **line-item allocation grid**:
  - One receipt can be split across many jobs.
  - One line item can be split by percentage or exact dollar amount.
- Validation rules:
  - Allocations must sum to line-item amount.
  - Tax/fees can be distributed automatically by policy.
- Audit trail:
  - Track who changed allocations and when.

### 3) Employee and crew scheduling
- Employee directory with role/skill tags.
- Job calendar with drag-and-drop assignment.
- Views:
  - Daily dispatch board.
  - Employee workload view.
  - Job timeline view.
- Optional alerts:
  - SMS/email shift reminders.

### 4) Job photos
- Upload photos from phone/desktop to a job.
- Auto-organize by:
  - Job
  - Date/time
  - Category (`before`, `during`, `after`, `damage`, `receipt`)
- Metadata:
  - Uploader
  - Timestamp
  - Notes/captions

### 5) Reporting
- Job-level cost summaries.
- Labor hours by employee/job.
- Receipt spend by vendor/category.
- Downloadable CSV export.

---

## Suggested Tech Stack

### Frontend
- React + TypeScript
- Component library: Tailwind + shadcn/ui (or MUI)
- Data grid for allocations/schedules (AG Grid or TanStack Table)

### Backend
- Node.js (NestJS or Express + TypeScript)
- PostgreSQL for relational data
- Redis for queues/caching

### OCR + file handling
- Object storage: S3-compatible bucket
- OCR options:
  - AWS Textract (good for receipts/invoices)
  - Google Vision / Document AI
  - Azure Form Recognizer
- Queue workers for OCR processing (BullMQ / SQS workers)

### Authentication/permissions
- Role-based access control:
  - Admin
  - Office Manager
  - Field Supervisor
  - Technician

### Hosting
- Web/API on Render, Fly.io, or AWS ECS.
- Managed Postgres + managed object storage.

---

## Data Model (Core Entities)

- `jobs`
  - `id`, `job_number`, `client_name`, `site_address`, `status`, `start_date`, `end_date`
- `employees`
  - `id`, `name`, `phone`, `email`, `role`, `active`
- `schedules`
  - `id`, `job_id`, `employee_id`, `start_at`, `end_at`, `notes`
- `receipts`
  - `id`, `vendor`, `receipt_date`, `subtotal`, `tax`, `total`, `source_file_url`, `ocr_status`
- `receipt_items`
  - `id`, `receipt_id`, `description`, `qty`, `unit_price`, `line_total`, `confidence_score`
- `receipt_item_allocations`
  - `id`, `receipt_item_id`, `job_id`, `amount_allocated`, `percent_allocated`
- `job_photos`
  - `id`, `job_id`, `uploaded_by_employee_id`, `photo_url`, `category`, `taken_at`, `notes`
- `audit_logs`
  - `id`, `actor_id`, `entity`, `entity_id`, `action`, `before_json`, `after_json`, `created_at`

---

## API Endpoints (MVP)

### Receipts
- `POST /api/receipts/upload`
- `GET /api/receipts/:id`
- `POST /api/receipts/:id/reprocess-ocr`
- `PATCH /api/receipt-items/:id`

### Allocations
- `POST /api/receipt-items/:id/allocations`
- `PATCH /api/allocations/:id`
- `DELETE /api/allocations/:id`

### Jobs and scheduling
- `GET /api/jobs`
- `POST /api/jobs`
- `POST /api/schedules`
- `PATCH /api/schedules/:id`

### Photos
- `POST /api/jobs/:id/photos`
- `GET /api/jobs/:id/photos`

### Employees
- `GET /api/employees`
- `POST /api/employees`
- `PATCH /api/employees/:id`

---

## Workflow Example (Receipt Split)

1. User uploads Home Depot receipt.
2. OCR extracts 8 line items.
3. Reviewer confirms parsed values.
4. Line 1 and 2 assigned to Job A.
5. Line 3 split 50/50 between Job A and Job B.
6. Remaining lines assigned to Job C.
7. System validates totals and saves allocations.
8. Job cost reports update immediately.

---

## 90-Day Delivery Roadmap

### Weeks 1–2: Foundation
- Finalize requirements and user roles.
- Set up repository structure and CI/CD.
- Create database schema and auth.

### Weeks 3–5: Receipts + OCR
- Upload flow + storage.
- OCR worker integration.
- Receipt/line review UI.

### Weeks 6–7: Allocation engine
- Split-by-amount and split-by-percent UX.
- Allocation validations and audit logging.

### Weeks 8–9: Scheduling
- Employee directory.
- Calendar-based job assignment.

### Weeks 10–11: Photos
- Mobile-friendly upload.
- Photo gallery and tagging per job.

### Weeks 12–13: Reporting + hardening
- Cost/labor reports.
- Permission hardening.
- UAT and go-live checklist.

---

## Risks and Mitigations

- **OCR inaccuracies:** Add review step and confidence thresholds.
- **Receipt variety:** Train templates and keep parser rules configurable.
- **Adoption resistance:** Keep workflow fast; limit required fields.
- **Data integrity:** Enforce allocation balancing and full audit logs.

---

## Nice-to-have (Phase 2)
- Vendor price trend analysis.
- Duplicate receipt detection.
- GPS and geofenced clock-in/out for employees.
- AI categorization of line items to cost codes.
- QuickBooks sync.
