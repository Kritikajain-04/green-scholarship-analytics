# 🌿 Green Scholarship Analytics System

A full-stack web application for managing and analyzing the Karnataka Green Scholarship Program. Built with **Flask** + **Snowflake** + **Chart.js**.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://green-scholarship-analytics.onrender.com)

---

## 🚀 Features

- **Student Portal** — Login, apply for scholarships, track eligibility
- **Analytics Dashboard** — Live charts powered by Snowflake (100,000+ student records)
- **Eligibility Engine** — Real-time Green Score computation
- **Resource Downloads** — PDF guidelines, forms, and certificates
- **Contact Support** — Integrated support form
- **Responsive Design** — Works on desktop and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, Flask 3.0, Gunicorn |
| Database | Snowflake (cloud data warehouse) |
| Frontend | HTML5, Vanilla CSS, JavaScript, Chart.js |
| Hosting | Render.com |
| Charts | Chart.js v4 |
| Icons | Font Awesome 6 |

---

## ⚙️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/kritikajain-04/green-scholarship-analytics.git
cd green-scholarship-analytics
```

### 2. Create a virtual environment
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your actual Snowflake credentials
```

### 5. Run the development server
```bash
python app.py
```
Visit: http://localhost:5000

---

## 🔐 Environment Variables

Create a `.env` file (never commit this!):

```env
SNOWFLAKE_ACCOUNT=your-account-identifier
SNOWFLAKE_USER=your-username
SNOWFLAKE_PASSWORD=your-password
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=GREEN_SCHOLARSHIP_DB
SNOWFLAKE_SCHEMA=ANALYTICS
FLASK_SECRET_KEY=your-strong-random-secret-key
```

---

## 🌐 Production Deployment (Render.com)

1. Fork/clone this repository
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repository
4. Set **Build Command**: `pip install -r requirements.txt`
5. Set **Start Command**: `gunicorn app:app --workers 2 --timeout 120`
6. Add all environment variables listed above in Render's **Environment** tab
7. Deploy!

---

## 📊 Database Schema

The app connects to a Snowflake table `GREENSCHOLARSHIP_DATA` with 27 columns including:
- Student demographics (Name, College, District, Gender, Year)
- Academic performance (Percentage)
- Environmental activities (TreesPlanted, VolunteerHours, RecyclingDrives, etc.)
- Computed GreenScore and Eligibility status

---

## 🔒 Security

- All Snowflake credentials stored as server-side environment variables only
- No credentials in frontend HTML, JavaScript, or GitHub
- Session-based authentication with Flask secure sessions
- HTTPS enforced in production (Render provides SSL automatically)

---

## 📁 Project Structure

```
green-scholarship-analytics/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── Procfile               # Render/Heroku start command
├── runtime.txt            # Python version specification
├── .env.example           # Environment variable template
├── .gitignore             # Files excluded from Git
├── templates/             # Jinja2 HTML templates
│   ├── base.html          # Shared layout
│   ├── portal.html        # Login/Register page
│   ├── home.html          # Home dashboard
│   ├── apply.html         # Scholarship application
│   ├── eligibility.html   # Eligibility checker
│   ├── index.html         # Analytics dashboard
│   ├── resources.html     # Downloads & FAQs
│   ├── contact.html       # Contact form
│   └── profile.html       # Student profile
├── static/
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   ├── images/            # Logos and illustrations
│   └── downloads/         # Downloadable PDF files
└── python/
    └── faker_dataset.py   # Dataset generation script
```

---

## 📄 License

© 2026 Green Scholarship Analytics. All rights reserved.
