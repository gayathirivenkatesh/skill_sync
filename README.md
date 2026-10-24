# AI-Based Student Skill & Mentorship Platform


## Overview

AI-Based Student Skill & Mentorship Platform is a full-stack web application designed to help students identify skill gaps, receive intelligent recommendations, and connect with suitable mentors for continuous learning and career development.

The platform combines AI-assisted analysis with modern web technologies to provide personalized mentorship and skill improvement workflows.

---

## Features

### Student Module

* Secure user registration and login
* Profile creation and skill management
* Skill gap identification
* Personalized mentor recommendations
* Progress tracking dashboard

### Mentor Module

* Mentor profile management
* View student requests
* Provide guidance and recommendations
* Track mentee progress

### Admin Module

* Manage users and platform activity
* Monitor mentor–student interactions
* Maintain platform workflows

### AI Features

* NLP-based skill analysis
* Recommendation engine
* Intelligent profile matching
* Personalized learning suggestions

---

## Tech Stack

### Frontend

* React.js
* HTML
* CSS
* JavaScript

### Backend

* Java
* Node.js
* Express.js

### Database

* MongoDB

### Authentication

* JWT (JSON Web Token)

### AI / NLP

* Hugging Face Sentence Transformers
* Gemini API

---

## System Architecture

Frontend (React.js)
↓
REST API Layer
↓
Backend (Node.js + Java)
↓
MongoDB Database
↓
AI Recommendation Engine

---

## Installation

### Clone Repository

```bash
git clone <YOUR_GITHUB_REPO_LINK>
cd skill_sync
```

### Install Frontend Dependencies

```bash
cd frontend
npm install
npm run dev
```

### Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

---

## Environment Variables

Create `.env`

```env
PORT=5000
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_api_key
```

---

## API Modules

### Authentication

* POST /signup
* POST /login

### Student

* GET /students
* PUT /student/profile

### Mentor

* GET /mentors
* POST /mentor/recommend

### Dashboard

* GET /dashboard

---

## Project Structure

```plaintext
project-root/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│
├── database/
├── docs/
└── README.md
```

---

## Future Improvements

* Real-time mentor chat
* Resume analysis
* Learning roadmap generation
* Performance analytics dashboard
* Mobile application support

---

## Contributors

Gayathiri V

---

## License

This project is developed for academic and learning purposes.
