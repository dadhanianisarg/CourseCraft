# 🚀 CourseCraft — Next-Gen Online Education & Ed-Tech Platform

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v16%2B-brightgreen.svg?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18.2-lightgrey.svg?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green.svg?logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.2.7-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-1.9.5-764ABC.svg?logo=redux)](https://redux-toolkit.js.org/)
[![Razorpay](https://img.shields.io/badge/Payment-Razorpay-02042B.svg?logo=razorpay)](https://razorpay.com/)
[![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-3448C5.svg?logo=cloudinary)](https://cloudinary.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](#license)

**CourseCraft** is a full-stack, enterprise-grade Ed-Tech Learning Management System (LMS) designed to deliver a seamless, interactive, and engaging learning experience for students, while equipping instructors with rich tools to create, manage, and monetize educational content globally.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [👨‍🎓 Student Portal](#-student-portal)
  - [👩‍🏫 Instructor Portal](#-instructor-portal)
  - [🔒 Security & Authentication](#-security--authentication)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Schema & Data Models](#-database-schema--data-models)
- [Project Directory Structure](#-project-directory-structure)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Database Seeding](#-database-seeding)
- [Deployment](#-deployment)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)

---

## 🌐 Overview

CourseCraft addresses the modern challenge of online education by offering an all-in-one ed-tech ecosystem. Built on the **MERN Stack (MongoDB, Express.js, React, Node.js)**, CourseCraft bridges the gap between students seeking quality instruction and instructors looking to publish and track multi-media courses.

### Core Highlights:
- **Interactive Video Player**: Seamless lecture consumption with sub-section navigation and real-time completion tracking.
- **Multi-Step Course Creation Wizard**: Instructors can dynamically structure courses into sections, subsections, and video lectures.
- **Secure Payment Gateway Integration**: Native checkout powered by **Razorpay** with automated email payment receipts.
- **Cloud-Based Media Management**: Media streaming and asset storage handled via **Cloudinary**.
- **Real-Time Instructor Analytics**: Interactive performance dashboards using **Chart.js** displaying student enrollment and total revenue metrics.

---

## ✨ Key Features

### 👨‍🎓 Student Portal
* **Course Exploration & Cataloging**: Browse courses categorized by domain (Web Development, Data Science, AI/ML, Cloud Computing, etc.) with advanced filtering.
* **Course Landing Pages**: Detailed course views with preview video, total duration, curriculum breakdown, student ratings, and instructor details.
* **Cart & Wishlist Management**: Add courses to cart, review items, and manage wishlist state powered by Redux.
* **Instant Checkout**: Purchase courses via Razorpay payment gateway integration with instant enrollment.
* **Interactive Learning Dashboard**: Dedicated view for watching video lectures, marking lessons as complete, and viewing progress bars.
* **Ratings & Reviews**: Rate courses on a 5-star scale and provide written reviews once enrolled.
* **Profile Management**: Update personal details, change account password, and upload custom avatars to Cloudinary.

### 👩‍🏫 Instructor Portal
* **Multi-Step Course Creation Wizard**:
  1. **Course Information**: Title, description, tags, category, pricing, thumbnail upload, and requirements/instructions.
  2. **Course Builder**: Add, edit, reorder, or delete course sections and subsections (video content upload & duration calculation).
  3. **Publishing Control**: Toggle courses between `Draft` and `Published` states.
* **Instructor Dashboard & Analytics**:
  - Interactive visual charts (Chart.js) showing total students enrolled and revenue per course.
  - Quick summary cards for overall performance metrics.
* **Course Management**: View all created courses, inspect enrollment numbers, edit existing content, or remove courses.

### 🔒 Security & Authentication
* **Email Verification via OTP**: One-Time Passwords (OTP) sent to user emails during signup powered by Nodemailer.
* **Role-Based Access Control (RBAC)**: Enforced backend middleware (`isStudent`, `isInstructor`, `isAdmin`) safeguarding sensitive endpoints.
* **JWT & Cookie Authentication**: Secure HTTP-only cookies and JSON Web Tokens for session management.
* **Password Encryption**: Password hashing utilizing `bcrypt`.
* **Password Reset Workflow**: Tokenized password reset links sent via email with expiration limits.

---

## 🛠 Tech Stack

### **Frontend (Client)**
- **Framework**: React 18 (CRA)
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- **Styling**: Tailwind CSS, Custom CSS (`richblack` dark mode theme system)
- **Routing**: React Router v6 (`react-router-dom`)
- **Media Player**: Video-React (`video-react`)
- **Data Visualization**: Chart.js (`chart.js`, `react-chartjs-2`)
- **Forms & Validation**: React Hook Form (`react-hook-form`), React Dropzone (`react-dropzone`)
- **UI Utilities**: React Hot Toast, Swiper JS, React Type Animation, React Rating Stars, React Icons

### **Backend (Server)**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Payment Processing**: Razorpay Node SDK (`razorpay`)
- **File & Media Storage**: Cloudinary SDK (`cloudinary`, `express-fileupload`)
- **Mailing Service**: Nodemailer (`nodemailer`)
- **Security**: JSON Web Token (`jsonwebtoken`), Bcrypt (`bcrypt`), Cookie Parser (`cookie-parser`), CORS (`cors`)

---

## 🏗 System Architecture

CourseCraft follows a decoupled Client-Server RESTful Architecture:

```
+-----------------------------------------------------------------------+
|                             CLIENT (React)                            |
|  +-------------------+   +--------------------+   +----------------+  |
|  | Student Dashboard |   | Instructor Dashboard|   | Course Catalog |  |
|  +---------+---------+   +---------+----------+   +-------+--------+  |
|            |                       |                      |           |
|            +-----------------------+----------------------+           |
|                                    | (REST APIs / JSON)               |
+------------------------------------|----------------------------------+
                                     v
+-----------------------------------------------------------------------+
|                           SERVER (Express / Node)                     |
|  +--------------------+  +--------------------+  +-----------------+  |
|  | Auth Middleware    |  | Role Controller    |  | Payment Service |  |
|  | (JWT & Bcrypt)     |  | (Student/Inst/Admin)|  | (Razorpay SDK)  |  |
|  +---------+----------+  +---------+----------+  +--------+--------+  |
+------------|-----------------------|----------------------|-----------+
             |                       |                      |
             v                       v                      v
+-----------------------+  +-------------------+  +---------------------+
| MongoDB (Atlas)       |  | Cloudinary API    |  | Nodemailer (SMTP)   |
| Database & Schemas    |  | Videos & Images   |  | OTP & Email Notices |
+-----------------------+  +-------------------+  +---------------------+
```

---

## 📊 Database Schema & Data Models

CourseCraft relies on 9 interconnected Mongoose models:

| Model | Key Fields & Relationships |
| :--- | :--- |
| **`User`** | `firstName`, `lastName`, `email`, `password`, `accountType` (Student/Instructor/Admin), `additionalDetails` (ref: Profile), `courses` [ref: Course], `courseProgress` [ref: courseProgress], `image` |
| **`Profile`** | `gender`, `dateOfBirth`, `about`, `contactNumber` |
| **`Course`** | `courseName`, `courseDescription`, `instructor` (ref: User), `whatYouWillLearn`, `courseContent` [ref: Section], `ratingAndReviews` [ref: RatingAndReview], `price`, `thumbnail`, `tag`, `category` (ref: Category), `studentsEnrolled` [ref: User], `instructions`, `status` (Draft/Published) |
| **`Section`** | `sectionName`, `subSection` [ref: SubSection] |
| **`SubSection`** | `title`, `timeDuration`, `description`, `videoUrl` |
| **`CourseProgress`** | `courseID` (ref: Course), `userId` (ref: User), `completedVideos` [ref: SubSection] |
| **`Category`** | `name`, `description`, `courses` [ref: Course] |
| **`RatingAndReview`** | `user` (ref: User), `rating`, `review`, `course` (ref: Course) |
| **`OTP`** | `email`, `otp`, `createdAt` (expires automatically via TTL index) |

---

## 📁 Project Directory Structure

```text
CourseCraft-An-Online-Education-Platform/
├── public/                     # Static assets & index.html
├── server/                     # Backend Node/Express Server
│   ├── config/                 # DB, Cloudinary, Razorpay & Mailer configs
│   │   ├── database.js
│   │   ├── cloudinary.js
│   │   ├── razorpay.js
│   │   └── nodemailer.js
│   ├── controllers/            # API Route Logic & Handlers
│   │   ├── Auth.js
│   │   ├── Category.js
│   │   ├── ContactUs.js
│   │   ├── Course.js
│   │   ├── courseProgress.js
│   │   ├── Payments.js
│   │   ├── Profile.js
│   │   ├── RatingAndReview.js
│   │   ├── ResetPassword.js
│   │   ├── Section.js
│   │   └── Subsection.js
│   ├── mail/                   # HTML Email Templates (OTP, Payment Success, etc.)
│   ├── middlewares/            # Auth & Role Control Middlewares
│   │   └── auth.js
│   ├── models/                 # Mongoose Data Models
│   │   ├── Category.js
│   │   ├── Course.js
│   │   ├── CourseProgress.js
│   │   ├── OTP.js
│   │   ├── Profile.js
│   │   ├── RatingAndRaview.js
│   │   ├── Section.js
│   │   ├── SubSection.js
│   │   └── User.js
│   ├── routes/                 # Express Express Router Definitions
│   │   ├── Contact.js
│   │   ├── Course.js
│   │   ├── Payments.js
│   │   ├── Profile.js
│   │   └── User.js
│   ├── utils/                  # Mail Sender & Cloudinary Uploader Utilities
│   ├── seedCategories.js       # Database Category Seeder Script
│   ├── index.js                # Express Application Entry Point
│   └── package.json            # Server dependencies
├── src/                        # Frontend React Application
│   ├── assets/                 # Images, Logos, Icons & Banners
│   ├── components/             # Reusable UI Components
│   │   ├── common/             # Navbar, Footer, Modals, Rating Stars
│   │   ├── ContactPage/        # Contact forms
│   │   └── core/               # Feature-specific components
│   │       ├── AboutPage/
│   │       ├── Auth/           # Login, Signup, Protected/Open Routes
│   │       ├── Catalog/        # Category course cards & slider
│   │       ├── Course/         # Course details page components
│   │       ├── Dashboard/      # Student & Instructor Dashboard views
│   │       ├── HomePage/       # Hero section, Code blocks, Timeline
│   │       └── ViewCourse/     # Video player & lesson navigation
│   ├── data/                   # Navbar links, Footer links, Static Data
│   ├── hooks/                  # Custom React Hooks
│   ├── pages/                  # Top-level Page Components
│   ├── reducer/                # Root Redux Reducer
│   ├── services/               # Axios API Services & Endpoints
│   ├── slices/                 # Redux Slices (auth, cart, course, profile, viewCourse)
│   ├── utils/                  # Formatting & Constants Helpers
│   ├── App.js                  # Main Application Router
│   ├── index.js                # React Entry Point
│   └── index.css               # Global Tailwind CSS Styles
├── tailwind.config.js          # Tailwind CSS Configuration & Theme Extension
├── package.json                # Frontend dependencies & root scripts
└── README.md                   # Documentation
```

---

## 📡 API Reference

### 🔐 Auth Routes (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/sendotp` | Public | Send verification OTP to email |
| `POST` | `/signup` | Public | Register new Student or Instructor account |
| `POST` | `/login` | Public | Authenticate user & issue JWT |
| `POST` | `/changepassword` | Authenticated | Change user account password |
| `POST` | `/reset-password-token` | Public | Generate tokenized password reset link |
| `POST` | `/reset-password` | Public | Reset password using token |

### 📚 Course Routes (`/api/v1/course`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/createCourse` | Instructor | Create new course |
| `POST` | `/editCourse` | Instructor | Edit existing course details |
| `DELETE`| `/deleteCourse` | Instructor | Delete a course |
| `GET`  | `/getInstructorCourses` | Instructor | Fetch all courses created by instructor |
| `POST` | `/addSection` | Instructor | Add section to course |
| `POST` | `/updateSection` | Instructor | Update section title |
| `POST` | `/deleteSection` | Instructor | Delete section from course |
| `POST` | `/addSubSection` | Instructor | Add subsection (video lecture) to section |
| `POST` | `/updateSubSection` | Instructor | Update subsection details/video |
| `POST` | `/deleteSubSection` | Instructor | Delete subsection |
| `GET`  | `/getAllCourses` | Public | Fetch all published courses |
| `POST` | `/getCourseDetails` | Public | Fetch single course public details |
| `POST` | `/getFullCourseDetails` | Authenticated | Fetch full course details & user progress |
| `POST` | `/updateCourseProgress` | Student | Mark lecture video as completed |
| `POST` | `/createCategory` | Admin | Create new course category |
| `GET`  | `/showAllCategories` | Public | List all categories |
| `POST` | `/getCategoryPageDetails` | Public | Get courses by category |
| `POST` | `/createRating` | Student | Add rating & review for enrolled course |
| `GET`  | `/getAverageRating` | Public | Calculate course average rating |
| `GET`  | `/getReviews` | Public | Fetch all platform reviews |

### 👤 Profile Routes (`/api/v1/profile`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET`  | `/getUserDetails` | Authenticated | Fetch authenticated user profile |
| `PUT`  | `/updateProfile` | Authenticated | Update user bio, DOB, gender, contact |
| `PUT`  | `/updateDisplayPicture` | Authenticated | Upload new profile image to Cloudinary |
| `DELETE`| `/deleteProfile` | Authenticated | Permanently delete user account |
| `GET`  | `/getEnrolledCourses` | Student | Fetch enrolled courses & completion progress |
| `GET`  | `/instructorDashboard` | Instructor | Fetch instructor statistics & chart data |

### 💳 Payment Routes (`/api/v1/payment`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/capturePayment` | Student | Create Razorpay order for course purchase |
| `POST` | `/verifyPayment` | Student | Verify Razorpay payment signature & enroll student |
| `POST` | `/sendPaymentSuccessEmail` | Student | Send email receipt after successful payment |

### 📧 Contact Route (`/api/v1/reach`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/contact` | Public | Submit contact us message |

---

## ⚙️ Environment Variables

### 1. Backend Environment Configuration (`server/.env`)

Create a `.env` file inside the `server/` directory:

```env
PORT=4000
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/CourseCraftDb
JWT_SECRET=your_jwt_secret_key

# Nodemailer Credentials
MAIL_HOST=smtp.gmail.com
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_gmail_app_password
MAIL_PORT=587

# Cloudinary Credentials
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
FOLDER_NAME=CourseCraft

# Razorpay Credentials
RAZORPAY_KEY=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Frontend Environment Configuration (`.env`)

Create a `.env` file in the root project directory:

```env
REACT_APP_BASE_URL=http://localhost:4000
REACT_APP_RAZORPAY_KEY=your_razorpay_key_id
```

---

## 🚦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0.0 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Cloud Atlas Cluster)
- [Cloudinary Account](https://cloudinary.com/) (For image and video uploads)
- [Razorpay Account](https://razorpay.com/) (For payment gateway integration in test mode)

### 💻 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dadhanianisarg/CourseCraft.git
   cd CourseCraft-An-Online-Education-Platform
   ```

2. **Install Client & Concurrently Dependencies**:
   ```bash
   npm install
   ```

3. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Configure Environment Variables**:
   Set up both `server/.env` and root `.env` as documented in [Environment Variables](#-environment-variables).

5. **Run the Application**:
   Run both frontend and backend concurrently using the root npm script:
   ```bash
   npm run dev
   ```
   - **Frontend**: Running on `http://localhost:3000`
   - **Backend API**: Running on `http://localhost:4000`

---

## 🌱 Database Seeding

To populate initial course categories in MongoDB (e.g. Web Development, Data Science, AI/ML, DevOps, UI/UX Design):

```bash
cd server
node seedCategories.js
```

---

## 🌐 Deployment

### **Frontend Deployment (Vercel)**
1. Connect repository to [Vercel](https://vercel.com).
2. Set Environment Variable: `REACT_APP_BASE_URL` pointing to live backend API URL.
3. Build Command: `npm run build`
4. Output Directory: `build`

### **Backend Deployment (Render / Railway)**
1. Create a Web Service on [Render](https://render.com).
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `node index.js`
5. Configure environment variables in the service dashboard.

---

## 🔮 Future Enhancements

- [ ] **Live Interactive Classes**: WebRTC or Zoom integration for live instructor sessions.
- [ ] **Quiz & Assessment Engine**: Automated quizzes, coding tests, and assignment submissions.
- [ ] **Certificates of Completion**: Automated PDF certificate generation upon 100% course progress.
- [ ] **Discussion Forums**: Course-specific Q&A threads and student community channels.
- [ ] **AI-Powered Recommendations**: Personalised course suggestions based on user learning history.

---

## 📜 License

This project is licensed under the [ISC License](LICENSE).

---

<p center>
  Made with ❤️ by <strong>CourseCraft Team</strong>
</p>