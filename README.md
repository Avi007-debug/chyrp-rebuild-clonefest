# CloneFest 2025 – Modernized Chyrp Blog  

## Introduction  

This project was built as part of **CloneFest 2025 Problem Statement: Modernizing Chyrp**.  

**Background:**  
Chyrp was a lightweight, extensible blogging engine designed to be simple yet powerful. It introduced the concept of publishing content in multiple formats (“Feathers”), extending functionality with modules, and customizing appearance with themes. While innovative in its time, Chyrp now feels outdated compared to today’s modern, responsive, API-driven applications.  

**Our Challenge:**  
Rebuild Chyrp as a **modern web application** that preserves its flexibility and lightweight philosophy, while implementing its core features with today’s technologies.  

**Our Solution:**  
We developed a **full-stack blog platform** with the following stack:  
- **Frontend:** React (Vite) for a fast, responsive, modern UI  
- **Backend:** Flask for a lightweight yet scalable API layer (hosted on Render)  
- **Database:** PostgreSQL (hosted on Render) for structured, relational data handling  
- **Cloud Storage:** Supabase for handling media and file storage  
- **Hosting:** Vercel for seamless frontend deployment and accessibility  

The result is a **feature-rich blog application** that supports multiple content types, extensions, user management, comments, likes, and more — staying true to Chyrp’s spirit but reimagined for 2025.  

---

## Tech Stack
- **Frontend:** React (Vite)  
- **Backend:** Flask (Python)  
- **Database:** PostgreSQL  
- **Hosting & Deployment:** Vercel (frontend), Render (backend + DB), Supabase (cloud storage)  

---

## Deployment

This project is deployed using modern cloud tools:

- **Supabase** → Cloud storage  
- **Render** → Backend + Database hosting  
- **Vercel** → Frontend hosting  

🔗 **Live Demo:** [Chyrp Rebuild (CloneFest 2025)](https://chyrp-rebuild-clonefest-livid.vercel.app/)

---

## Installation (Local Setup)

### 1. Clone the Repository
```bash
git clone https://github.com/Avi007-debug/chyrp-rebuild-clonefest.git
cd chyrp-rebuild-clonefest
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## Database Setup

This project uses **PostgreSQL** as the backend database.
For Instructions, see [`docs/DB_SETUP.md`](database/DBSETUP.md).

---

## Features

### Core Features
- Easy to install, simple to maintain, extensible by design  
- Built with responsive and accessible **W3C-validated HTML5**  
- **Universal support** for plain text, Markdown, and raw markup  
- Blog personalization through extensions  
- User and visitor management with a rights model
- Theme support using templates  

### Feathers (Content Types)
- Text: publish textual blog entries  
- Photo: upload and display an image  
- Quote: post a quotation  
- Link: share external website links  
- Video: upload and display a video file  
- Audio: upload and play an audio file  
- Uploader: manage multiple file uploads  

### Modules (Enhancements)
- Cacher: cache pages to reduce server load  
- Categorize: assign categories to blog entries  
- Tags: apply multiple searchable tags  
- Comments: a complete commenting system  
- Likes: allow visitors to like posts  
- Read More: truncate long blog entries in feeds  
- Rights: set attribution and copyright for posts  
- Cascade: infinite scrolling for blog entries  
- Lightbox: on-page image viewer with protection  
- Sitemap: generate XML sitemaps for search engines  
- MAPTCHA: math-based spam prevention  
- Highlighter: syntax highlighting for code snippets  
- Easy Embed: embed external content easily  
- Post Views: maintain view counts for blog entries  
- MathJax: display mathematical notation cleanly  

## Contributors
- [@Avi007-debug](https://github.com/Avi007-debug)  
- [@santhoshgirivardhan](https://github.com/santhoshgirivardhan)  
- [@aaradhyasaxena0606](https://github.com/aaradhyasaxena0606)  
- [@nitinkrishnakmps2324-stack](https://github.com/nitinkrishnakmps2324-stack)  

---


## License
This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).
See the [LICENSE](./LICENSE) file for details.


---

## Credits
Inspired by the **CloneFest 2025 Problem Statement: Modernizing Chyrp** and built from scratch using React, Flask, and PostgreSQL.  

