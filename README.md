# 🥗 FitMe v2 - AI Nutrition & Food Tracker

FitMe is a premium, modern AI-powered health and nutrition tracker that helps users log meals, track macronutrients, and analyze their eating habits using cutting-edge AI. By integrating Gemini AI and Supabase, FitMe turns food tracking from a tedious chore into an effortless, insightful experience.

![FitMe Banner](https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Key Features

*   **📸 AI Food Snap (Gemini AI)**: Just take or upload a picture of your meal, and our integrated Gemini API will identify the food, estimate the portion size, and calculate calories, proteins, carbs, and fats automatically.
*   **📊 Dynamic Nutrition Dashboard**: Track daily intake against personalized goals, monitor progress with interactive charts, and stay on top of your macro splits.
*   **📈 Historical Analytics**: Visualize weekly/monthly nutritional trends, caloric distribution, and macro breakdown using interactive Recharts.
*   **🔐 Secure Authentication & Storage**: Fully backed by Supabase Auth for secure user accounts, Database for user profiles/logs, and Storage for food image uploads.
*   **🚀 Seamless Onboarding**: Personalized flow to calculate Daily Caloric Goals, Target Weight, and Macronutrient splits based on user biometrics and goals.
*   **📱 Fully Responsive Web UI**: Crafted with modern Tailwind CSS, featuring glassmorphism elements, micro-animations, and a highly polished dark-mode layout.

---

## 🛠️ Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions, TypeScript)
*   **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Auth)
*   **AI Engine**: [Google Gemini AI SDK](https://ai.google.dev/) (`@google/genai`)
*   **Charts & Visuals**: [Recharts](https://recharts.org/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom animations and variables

---

## 🚀 Getting Started

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18+ recommended) installed.

### 2. Clone the Repository

```bash
git clone https://github.com/lodaboka/Fitme.git
cd Fitme/fitme-app
```

### 3. Environment Setup

Create a `.env.local` file in the root of the `fitme-app` folder (copy from `.env.local.example`):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Google Health API (Optional)
GOOGLE_HEALTH_CLIENT_ID=your_oauth_client_id
GOOGLE_HEALTH_CLIENT_SECRET=your_oauth_client_secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app running.

---

## 📂 Project Structure

```
fitme-app/
├── src/
│   ├── app/                # Next.js App Router (pages & API routes)
│   │   ├── analytics/      # Weekly/monthly breakdown
│   │   ├── dashboard/      # User Home/Daily Logs
│   │   ├── onboarding/     # Initial metric calculator
│   │   ├── snap/           # AI Photo Analyzer
│   │   └── ...
│   ├── components/         # Reusable UI Components
│   └── lib/                # Supabase, Gemini client setup, and helper utilities
├── supabase/               # Migrations and database schemas
```

---

## 🛡️ License

This project is licensed under the MIT License.
