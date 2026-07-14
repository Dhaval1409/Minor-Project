# Aria Backend

AI appointment booking assistant backend — Express + TypeScript + LangChain + Telegram Bot.

Supports three business categories for this initial version:

- Hair Salon
- Makeup Salon
- Doctor Clinic

Appointments are free (no payment integration in this version). Uses an in-memory mock database (no real DB yet).

## Folder Structure

```text
aria-backend/
├── src/
│   ├── config/
│   │   └── telegram.ts          # Initializes and exports Telegram Bot instance
│   ├── controllers/
│   │   └── appointment.ts       # Business logic
│   ├── models/
│   │   └── appointment.ts       # Interfaces, types, mock database
│   ├── routes/
│   │   └── appointment.ts       # Express routes
│   ├── services/
│   │   └── aiService.ts         # LangChain conversation logic (shared by REST + Telegram)
│   ├── middleware/
│   │   └── errorHandler.ts      # Centralized error handling
│   ├── utils/
│   │   ├── AppError.ts
│   │   ├── apiResponse.ts
│   │   └── asyncHandler.ts
│   └── index.ts                 # Express server + Telegram bot startup
├── .env.example
├── package.json
└── tsconfig.json
```

> `services/`, `middleware/`, and `utils/` were added alongside the required structure to support centralized error handling and to let the Telegram bot and REST API share the same LangChain logic, without touching the required `config/controllers/models/routes` layout.

## Setup

```bash
npm install
cp .env.example .env
# fill in TELEGRAM_BOT_TOKEN, OPENAI_API_KEY, LANGCHAIN_API_KEY
npm run dev
```

Production build:

```bash
npm run build
npm start
```

## Environment Variables

```
PORT=5000
TELEGRAM_BOT_TOKEN=
LANGCHAIN_API_KEY=
OPENAI_API_KEY=
```

If `TELEGRAM_BOT_TOKEN` is not set, the server still starts — the Telegram bot simply won't initialize (logged as a warning). If `OPENAI_API_KEY` is missing, AI-driven conversation calls will throw a clear error when invoked, but the REST appointment CRUD API works independently of the AI layer.

## REST API

Base URL: `/appointments`

| Method | Endpoint            | Description                    |
|--------|----------------------|--------------------------------|
| POST   | `/appointments`      | Book a new appointment         |
| GET    | `/appointments`      | List all appointments (optional `?userId=`) |
| GET    | `/appointments/:id`  | Get a single appointment       |
| PUT    | `/appointments/:id`  | Update / reschedule appointment|
| DELETE | `/appointments/:id`  | Cancel an appointment          |

### Example: Book an appointment

```bash
curl -X POST http://localhost:5000/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "phone": "+1234567890",
    "businessType": "hair_salon",
    "service": "Haircut",
    "date": "2026-07-10",
    "time": "17:00"
  }'
```

Response:

```json
{
  "success": true,
  "message": "Appointment booked successfully.",
  "data": {
    "id": "…",
    "userId": "…",
    "name": "Jane Doe",
    "phone": "+1234567890",
    "businessType": "hair_salon",
    "service": "Haircut",
    "date": "2026-07-10",
    "time": "17:00",
    "status": "pending",
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

### Business types & services

| Business Type    | Services                                              |
|-------------------|--------------------------------------------------------|
| `hair_salon`      | Haircut, Hair Wash, Hair Spa, Beard Trim               |
| `makeup_salon`    | Bridal Makeup, Party Makeup, Facial, Hair Styling      |
| `doctor_clinic`   | General Checkup, Dentist, Skin Specialist, Eye Specialist |

## Error Responses

All errors follow this shape:

```json
{
  "success": false,
  "message": "Appointment not found"
}
```

## Telegram AI Assistant

Once `TELEGRAM_BOT_TOKEN` and `OPENAI_API_KEY` are set, message the bot in natural language, e.g.:

> I need a haircut tomorrow around 5 PM.

Aria (via LangChain) extracts business type/service/date/time across the conversation and books automatically once all fields are collected, replying with the appointment ID.

## Future Scalability

The current mock-database and modular service/config layout is designed so the following can be added later without restructuring:

- MongoDB / PostgreSQL (swap `models/appointment.ts` internals)
- Redis (swap Telegram session `Map` for Redis-backed sessions)
- WhatsApp Business API (add `config/whatsapp.ts` reusing `services/aiService.ts`)
- Google Calendar sync
- Razorpay / Stripe payments
- Authentication & Admin Dashboard
- Multi-business support
- Email / SMS notifications
