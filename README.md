# 📅 SlotBook - Full-Stack Slot Booking System

A modern, responsive slot booking web application built with **React**, **Node.js / Express**, and **PostgreSQL**, featuring concurrent booking conflict protection (`SELECT ... FOR UPDATE`), JWT authentication, and session-based time periods.

---

## 🚀 Features

- **User Authentication**: Secure registration and login using `bcryptjs` password hashing and signed `JSON Web Tokens (JWT)`.
- **Date & Session-Based Filtering**:
  - Horizontal date picker for quick access to upcoming days.
  - Split sessions:
    - **Morning**: 9:00 AM – 5:00 PM
    - **Afternoon**: 2:00 PM – 8:00 PM
    - **Night**: 11:00 PM – 5:00 AM
- **Double-Booking Protection**: Database transactions with PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) ensure two users can never simultaneously reserve the same slot.
- **Interactive Modals**:
  - "Do you want to select this slot?" confirmation dialog.
  - "Slot booked successfully!" success dialog with direct navigation to bookings.
- **My Bookings Dashboard**: Clean overview of booked dates, time intervals, confirmation status, and cancellation capabilities.
- **Admin Panel**:
  - Manual single-slot creator.
  - ⚡ 1-Click Future Slots Bulk Generator.

---

## ☁️ 1-Click Free Cloud Deployment (Render)

This repository includes a `render.yaml` blueprint for 24/7 free cloud hosting on **Render**:

1. Log in or sign up at [Render.com](https://render.com) (Free, no credit card required).
2. Go to **Dashboard** &rarr; click **New +** &rarr; select **Blueprint**.
3. Connect your GitHub repository: `https://github.com/padminK/CODECRAFT_SD_01`.
4. Click **Apply**:
   - Render automatically provisions a free **PostgreSQL Database** (`slotbooking-db`).
   - Render builds the React client and launches the **Web Service** (`slot-booking-app`).
5. Your app will be live 24/7 with a free HTTPS URL (e.g. `https://slot-booking-app.onrender.com`).

---

## 💻 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/)

### 1. Clone & Configure
```bash
git clone https://github.com/padminK/CODECRAFT_SD_01.git
cd CODECRAFT_SD_01
```

Create `.env` inside `slot-booking/server/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/slotbooking"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5000
```

### 2. Install & Run
```bash
# Install dependencies
npm run install:all

# Run backend (port 5000)
npm run dev:server

# In a second terminal, run frontend (port 5173)
npm run dev:client
```

Open `http://localhost:5173` in your browser.
