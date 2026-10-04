# Student Management System Project README

This project is a Vue 3 + Express + MongoDB student management application created for CIS 3339 Homework 1.

## Project Summary

The application includes:

- Vue 3 frontend using the Composition API
- Vue Router for page navigation
- Pinia for shared application state
- Express REST API backend
- MongoDB persistence for students, courses, and enrollments
- Validation and duplicate prevention
- Cascading deletion behavior for related enrollments
- Production deployment through the backend on localhost

## Required Software

- Node.js and npm
- MongoDB Community Edition running locally
- A modern web browser

## Environment Setup

Create a local .env file in the repository root with:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/cis3339_homework1
```

## Install Dependencies

```bash
npm install
```

## Production Build

```bash
npm run build
```

## Start the Application

```bash
npm start
```

Then open the app in a browser:

```text
http://localhost:3000
```

## Notes

- The backend serves the built Vue app from the frontend dist directory.
- MongoDB is expected to be running locally before startup.
- The app initializes the required collections and schemas on startup without manual database setup.
