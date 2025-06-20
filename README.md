# CrossFit 808 Website Development Roadmap

This document outlines a comprehensive step-by-step plan to build, secure, and launch the CrossFit808 website, with a future-ready foundation for mobile app and e-commerce integration.

---

## Phase 1: Foundation & Local Development

**Objective:** Establish the core structure and environment for development.

### Project Initialization & Code Retrieval
- **Action:** Clone the GitHub repository (`crossfit808-website`) to local machine.
- **Technology:** Git, GitHub

### Local Development Environment Setup
- **Action:** Install Node.js (includes npm).
- **Technology:** Node.js, npm (or Yarn)

### Install Project Dependencies
- **Action:** Install necessary packages for React.
- **Technology:** 
  - React  
  - Tailwind CSS  
  - Firebase SDK  
  - Lucide React (icons)  

### Local Firebase Integration
- **Action:** Paste `firebaseConfig` object into `src/App.js` for local use.
- **Technology:** Firebase

### Start Local Server
- **Action:** Run development server to view the site.
- **Technology:** `npm start`

---

## Phase 2: Core Website & Content Management

**Objective:** Build the website UI and implement content management tools for the gym owner.

### Core Website Structure & Design
- **Action:** Build out pages:  
  - Home  
  - About Us  
  - Programs  
  - Schedule  
  - Coaches  
  - Testimonials  
  - Contact  
- **Technology:** React, Tailwind CSS, HTML/CSS

**Note:** Branding with baby blue, black, and grey for a fresh and unique identity.

### Dynamic Blog Section
- **Action:** Admin interface to add/edit/delete blog posts; display publicly.
- **Technology:** Firebase Firestore, React

### Dynamic WOD (Workout of the Day)
- **Action:** Schedule and auto-display WODs by date; admin control.
- **Technology:** Firebase Firestore, React

### Online Store (Placeholder)
- **Action:** Create store section with placeholder button.
- **Technology:** React, HTML/CSS

### PushPress Integration
- **Action:** Add CTA button to link to PushPress calendar.
- **Technology:** React, External Link (modal optional)

---

## Phase 3: Deployment & Production Readiness

**Objective:** Optimize the site, secure it, and deploy for public access.

### Build for Production
- **Action:** Optimize React app.
- **Technology:** `npm run build`, Webpack

### Firebase Authentication for Owner
- **Action:** Replace anonymous login with secure owner login.
- **Technology:** Firebase Auth (Email/Password)

### Firebase Firestore Security Rules
- **Action:** Restrict write access to authenticated owner UID.
- **Technology:** Firebase Security Rules

### Secure Hosting with AWS
- **Action:** Deploy app as static website.
- **Technology:** AWS S3

### HTTPS & CDN
- **Action:** Use CloudFront with SSL for secure, fast delivery.
- **Technology:** AWS CloudFront, AWS Certificate Manager (ACM)

### DNS Configuration
- **Action:** Point `crossfit808.com` to CloudFront.
- **Technology:** AWS Route 53

### Environment Variables
- **Action:** Store API keys securely and load via environment variables.
- **Technology:** AWS Amplify, Netlify, or Vercel

---

## Phase 4: Advanced Features & Maintenance

**Objective:** Add advanced capabilities and prepare for long-term sustainability.

### Full Online Store Integration
- **Action:** Connect to full e-commerce platform.
- **Technology:** Shopify, WooCommerce, or custom API

### Member Score Tracking App (Future Project)
- **Action:** Allow members to log WOD scores.
- **Technology:**  
  - React Native (Mobile) or React (Web)  
  - Firebase Auth  
  - Firebase Firestore  

### Rich Text Editor for Admin
- **Action:** Enable formatting in WOD/blog editor.
- **Technology:** TinyMCE, Quill, or Slate.js

### SEO Optimization
- **Action:** Improve visibility in search engines.
- **Technology:** React Helmet, Google Search Console

### Performance & Monitoring
- **Action:** Monitor load times and user behavior.
- **Technology:** Google Analytics, Lighthouse

### Ongoing Content Updates
- **Action:** Gym owner updates WODs and blog content regularly.

---

## Security First

- HTTPS via AWS Certificate Manager  
- Firebase Auth & Role-based Firestore rules  
- Static hosting (no exposed backend)  
- CDN for global performance and DDoS protection

---

## Tech Stack Summary

| Frontend       | Backend / CMS       | Hosting & Security       | Third-Party Tools      |
|----------------|---------------------|---------------------------|-------------------------|
| React          | Firebase Firestore   | AWS S3, CloudFront, ACM   | PushPress               |
| Tailwind CSS   | Firebase Auth        | AWS Route 53              | Google Analytics        |
| Lucide React   | Firebase Security    | Environment Variables     | React Helmet            |

---

**Maintainer:** [Rachel Lai](https://github.com/yourusername)  
**Domain:** [https://crossfit808.com](https://crossfit808.com)
