# CivicLens 🔎

### Simplifying access to information through technology.

CivicLens is a modern web platform designed to make **Right to Information (RTI) applications easier, clearer, and more accessible**.

Instead of navigating complicated procedures and paperwork, users can create, manage, and track their RTI applications through a simple digital interface.

The goal is straightforward:

> **Make information accessible. Make the process simpler. Give citizens a clearer path to accountability.**

---

## ✨ What is CivicLens?

The Right to Information Act gives citizens the ability to request information from public authorities. However, understanding what to ask, how to structure an application, and keeping track of submitted requests can still be confusing.

**CivicLens acts as a digital companion for the RTI process.**

It provides a centralized experience where users can:

* Create structured RTI applications
* Organize and manage their RTI requests
* Track application progress
* Access their previous applications
* Manage their profile
* Authenticate securely
* Export application information for further use

The platform is designed with a clean, responsive interface so that the RTI process feels less like paperwork and more like a guided digital workflow.

---

## 🎯 Problem Statement

Many citizens are unaware of how to effectively use the RTI process.

Common difficulties include:

* Understanding how to frame an RTI request
* Knowing what information can be requested
* Structuring an application correctly
* Keeping track of multiple applications
* Maintaining records of submitted requests
* Navigating a process that can feel bureaucratic and intimidating

CivicLens aims to reduce this friction by bringing the workflow into one accessible platform.

---

## 💡 Our Approach

CivicLens focuses on three core principles:

### 1. Simplicity

A clean interface guides users through the application process without unnecessary complexity.

### 2. Organization

Applications are stored in one place so users can easily revisit and manage their RTI requests.

### 3. Accessibility

The platform turns a traditionally document-heavy process into a structured digital experience that can be accessed from modern devices.

---

## 🚀 Key Features

### 📝 RTI Application Creation

Create structured RTI applications through a dedicated application workflow.

Users can enter the necessary details and prepare their request without having to manually format everything from scratch.

### 📂 My RTIs

A dedicated space for managing previously created RTI applications.

Users can view and organize their requests instead of keeping scattered documents or notes.

### 📊 Dashboard

The dashboard provides a centralized overview of the user's RTI activity and serves as the main workspace after authentication.

### 👤 User Profile

Users can manage their account information through a dedicated profile section.

### 🔐 Authentication

CivicLens uses **Convex Auth** for authentication, including email-based OTP authentication and support for authenticated application workflows.

Protected routes ensure that user-specific functionality is accessible only to authenticated users.

### 📄 Document Export

The application includes support for generating downloadable documents, making it easier to take a completed RTI request beyond the platform.

### 📱 Responsive Interface

The UI is designed to work across different screen sizes, making CivicLens usable on desktops, tablets, and mobile devices.

### 🎨 Modern UI

The application uses reusable UI components, smooth animations, responsive layouts, and a consistent visual system to keep the experience intuitive and engaging.

---

## 🛠️ Tech Stack

| Layer               | Technology      |
| ------------------- | --------------- |
| Frontend            | React 19        |
| Language            | TypeScript      |
| Build Tool          | Vite            |
| Routing             | React Router v7 |
| Styling             | Tailwind CSS v4 |
| UI Components       | shadcn/ui       |
| Icons               | Lucide React    |
| Backend             | Convex          |
| Database            | Convex          |
| Authentication      | Convex Auth     |
| Animations          | Framer Motion   |
| Data Visualization  | Recharts        |
| Validation          | Zod             |
| Forms               | React Hook Form |
| Document Generation | jsPDF, docx     |
| Package Manager     | Bun / npm       |

The repository currently uses React 19, Vite, TypeScript, React Router, Tailwind CSS, shadcn/ui, Convex, Convex Auth, Framer Motion, and Three.js among its core dependencies.

---

## 🏗️ Architecture

CivicLens follows a modern frontend + serverless architecture.

```text
                         ┌─────────────────────┐
                         │      CivicLens      │
                         │      Web Client     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   React + Vite      │
                         │   TypeScript        │
                         └──────────┬──────────┘
                                    │
                   ┌────────────────┴────────────────┐
                   │                                 │
                   ▼                                 ▼
          ┌─────────────────┐              ┌─────────────────┐
          │  Convex Auth    │              │  Convex Backend │
          │ Authentication  │              │   + Database    │
          └─────────────────┘              └────────┬────────┘
                                                     │
                                                     ▼
                                            ┌─────────────────┐
                                            │  RTI Application │
                                            │      Data        │
                                            └─────────────────┘
```

The backend logic and data layer are organized under `src/convex`, including authentication, user management, RTI application operations, HTTP handling, and the database schema.

---

## 📁 Project Structure

```text
CivicLens/
│
├── public/                 # Static assets
│
├── src/
│   ├── assets/             # Application assets
│   │
│   ├── components/         # Reusable UI components
│   │
│   ├── convex/             # Backend, database & authentication
│   │   ├── auth/           # Authentication configuration
│   │   ├── rtiApplications.ts
│   │   ├── schema.ts
│   │   ├── users.ts
│   │   └── http.ts
│   │
│   ├── hooks/              # Custom React hooks
│   │
│   ├── lib/                # Utility functions
│   │
│   ├── pages/              # Application pages
│   │   ├── About.tsx
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Landing.tsx
│   │   ├── MyRTIs.tsx
│   │   ├── NewRTI.tsx
│   │   ├── Profile.tsx
│   │   └── NotFound.tsx
│   │
│   ├── types/              # TypeScript types
│   ├── index.css           # Global styling
│   ├── main.tsx            # Application entry point
│   └── instrumentation.tsx
│
├── .env.example            # Environment variable template
├── convex.json             # Convex configuration
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

The current repository structure separates pages, reusable components, hooks, utilities, types, and Convex backend functionality into dedicated directories.

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js 18+
* npm or Bun
* A Convex account/project

---

### 1. Clone the repository

```bash
git clone https://github.com/thanishkaykb/CivicLens.git
cd CivicLens
```

---

### 2. Install dependencies

Using npm:

```bash
npm install
```

Or using Bun:

```bash
bun install
```

---

### 3. Configure environment variables

Create your local environment file:

```bash
cp .env.example .env
```

Configure the required Convex environment variables according to your Convex deployment.

Typical client-side configuration includes:

```env
CONVEX_DEPLOYMENT=your_convex_deployment
VITE_CONVEX_URL=your_convex_url
```

Authentication-related environment variables are configured on the Convex backend.

**Never commit private keys, authentication secrets, or production credentials to GitHub.**

The repository already includes an `.env.example` file for environment configuration.

---

### 4. Start the development server

```bash
npm run dev
```

Or:

```bash
bun run dev
```

Vite will start the local development server.

---

## 🔐 Authentication

CivicLens uses **Convex Auth** for authentication.

The authentication flow includes:

```text
User
  │
  ▼
Authentication Page
  │
  ▼
Email OTP Verification
  │
  ▼
Authenticated Session
  │
  ▼
Protected Dashboard
  │
  ├── My RTIs
  ├── New RTI
  ├── Profile
  └── Application Management
```

Authenticated routes are protected using the application's authentication flow, while user information is accessed through the project's authentication hooks.

---

## 🧭 Application Flow

A typical CivicLens user journey looks like this:

```text
Landing Page
     │
     ▼
Sign In / Sign Up
     │
     ▼
Dashboard
     │
     ├───────────────┐
     │               │
     ▼               ▼
New RTI           My RTIs
     │               │
     ▼               ▼
Create Request   View Requests
     │               │
     └───────┬───────┘
             ▼
       Manage RTI Data
             │
             ▼
       Export / Use Request
```

---

## 🧩 Core Modules

### Landing

Introduces CivicLens and communicates the purpose of the platform.

### Authentication

Handles user sign-in and registration using Convex Auth.

### Dashboard

Provides the authenticated user's central workspace.

### New RTI

Allows users to create a new RTI application.

### My RTIs

Provides access to previously created RTI applications.

### Profile

Provides account and user information management.

### About

Explains the purpose and concept behind CivicLens.

These modules correspond to the current page structure in `src/pages`.

---

## 🎨 Design & UX

CivicLens follows a modern application design approach focused on:

* Responsive layouts
* Clear visual hierarchy
* Reusable UI components
* Accessible interactions
* Smooth page transitions
* Consistent typography and spacing
* Light and dark theme compatibility
* Minimal visual clutter

Framer Motion is used for interface animations, while shadcn/ui and Tailwind CSS provide the component and styling foundation.

---

## 🛡️ Security Considerations

CivicLens uses authenticated access for user-specific functionality.

Important security practices include:

* Keep environment variables private
* Never expose authentication secrets in frontend code
* Validate user input
* Protect backend operations with authorization checks
* Use environment-specific configuration
* Do not commit `.env` files containing secrets

For production deployments, always use secure credentials and properly configured authentication settings.

---

## 📈 Future Scope

CivicLens can be extended into a more complete civic-tech platform with features such as:

* 🤖 AI-assisted RTI drafting
* Intelligent question suggestions
* RTI application quality checking
* Government department discovery
* Location-based Public Information Officer lookup
* Application status reminders
* Email and notification alerts
* RTI response document management
* Appeal workflow support
* Analytics and civic transparency dashboards
* Multilingual support for Indian languages
* Accessibility-focused modes
* Mobile application support

The long-term vision is to move from simply **creating RTIs** to building a complete digital ecosystem for citizen information access.

---

## 🌍 Why CivicLens?

Technology should not only make things faster.

It should make complicated systems easier to understand.

CivicLens explores how modern web technologies can reduce friction between citizens and public institutions by transforming a document-heavy process into a clearer, more approachable digital workflow.

```text
                    INFORMATION
                         │
                         ▼
                    CIVICLENS
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
         Simpler                  Organized
         Process                   Requests
             │                       │
             └───────────┬───────────┘
                         ▼
                  INFORMED CITIZENS
```

---

## 🧪 Development Commands

### Start development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Run linting

```bash
npm run lint
```

### Format code

```bash
npm run format
```

These scripts are defined in the project's `package.json`.

---

## 🤝 Contributing

Contributions, ideas, and improvements are welcome.

To contribute:

```bash
# Fork the repository

# Clone your fork
git clone https://github.com/<your-username>/CivicLens.git

# Create a branch
git checkout -b feature/your-feature

# Make your changes

# Commit
git commit -m "Add your feature"

# Push
git push origin feature/your-feature
```

Then open a Pull Request.

---

## 📜 License

This project is available under the license specified in the repository.

---

## 👩‍💻 Author

**Thanishka Yogesh**

Computer Science Engineering Student
Sri Sairam Engineering College

Built with curiosity, code, and a simple question:

> **What if accessing information could be easier?**

---

## ⭐ Support

If you find CivicLens interesting, consider giving the repository a ⭐ on GitHub.

Your feedback, ideas, and contributions can help shape the next version of the project.

---

<p align="center">
  <b>CivicLens</b><br>
  Making civic information easier to access, understand, and act on.
</p>
