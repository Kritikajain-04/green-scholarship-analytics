
import os
import json
import hashlib
import datetime
import time
from pathlib import Path
from functools import wraps

import snowflake.connector
from flask import (
    Flask, jsonify, request,
    render_template, redirect, url_for, session
)
from flask_cors import CORS
from dotenv import load_dotenv

_ENV_PATH = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH)

app = Flask(__name__)
CORS(app)

# ─── Production Configuration ────────────────────────────────
_is_production = bool(os.environ.get("RENDER") or os.environ.get("FLASK_ENV") == "production")

app.secret_key = os.environ.get("FLASK_SECRET_KEY", "gs-dev-secret-2026-change-in-production")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
if _is_production:
    app.config["SESSION_COOKIE_SECURE"] = True  # HTTPS-only cookies in production

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# In-Memory Cache Helper (TTL-based)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
_CACHE = {}

def get_cached(key):
    entry = _CACHE.get(key)
    if entry:
        val, expiry = entry
        if time.time() < expiry:
            return val
        else:
            del _CACHE[key]
    return None

def set_cached(key, val, ttl=300):
    _CACHE[key] = (val, time.time() + ttl)

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Snowflake Connection Helper
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def get_snowflake_connection():
    """
    Build a Snowflake connection using environment variables only.
    Never reads credentials from source code.
    """
    return snowflake.connector.connect(
        account=os.environ["SNOWFLAKE_ACCOUNT"],
        user=os.environ["SNOWFLAKE_USER"],
        password=os.environ["SNOWFLAKE_PASSWORD"],
        warehouse=os.environ["SNOWFLAKE_WAREHOUSE"],
        database=os.environ["SNOWFLAKE_DATABASE"],
        schema=os.environ["SNOWFLAKE_SCHEMA"],
    )


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Auth Decorator
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def login_required(f):
    """Decorator that redirects to login if no active session."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect(url_for("portal"))
        return f(*args, **kwargs)
    return decorated


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# â”€â”€â”€ PAGE ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.route("/")
def index():
    """Root: redirect to portal (splash â†’ login)."""
    return redirect(url_for("portal"))


@app.route("/portal")
def portal():
    """Serve the Phase 1 portal (splash + login + register)."""
    if session.get("logged_in"):
        return redirect(url_for("home"))
    return render_template("portal.html")


@app.route("/home")
@app.route("/home", endpoint="home_page")
@login_required
def home():
    """Home page â€” shown after successful login."""
    student_name = session.get("student_name", "Student")
    return render_template("home.html", student_name=student_name)


@app.route("/apply")
@login_required
def apply_page():
    """Scholarship application page (Phase 3)."""
    return render_template("apply.html", student_name=session.get("student_name", "Student"))


@app.route("/eligibility")
@login_required
def eligibility_page():
    """Eligibility check page with lightweight sample student options."""
    sample_students = [
        {"id": "GS100004", "name": "Azad Sane"},
        {"id": "GS100990", "name": "Saraswathi"},
        {"id": "GS100001", "name": "Tara Nori"},
        {"id": "GS100002", "name": "Ekapad Bath"},
        {"id": "GS100003", "name": "Chanchal Dhillon"},
        {"id": "GS100005", "name": "Harish Sha"},
        {"id": "GS100006", "name": "Daniel Ravel"},
        {"id": "GS100007", "name": "Faqid Mody"},
        {"id": "GS100008", "name": "Lucky Swamy"},
        {"id": "GS100009", "name": "Indali Karnik"},
        {"id": "GS100010", "name": "Vyanjana Bajwa"}
    ]
    return render_template("eligibility.html", student_name=session.get("student_name", "Student"), students=sample_students)


@app.route("/dashboard")
@login_required
def dashboard():
    """Analytics dashboard page (Phase 4 / existing dashboard)."""
    return render_template("index.html")


@app.route("/resources")
@login_required
def resources_page():
    """Resources page (Phase 5)."""
    return render_template("resources.html", student_name=session.get("student_name", "Student"))


@app.route("/contact")
@login_required
def contact_page():
    """Contact page (Phase 5)."""
    return render_template("contact.html", student_name=session.get("student_name", "Student"))


@app.route("/profile")
@login_required
def profile_page():
    """Student profile page (Phase 5)."""
    return render_template(
        "profile.html", 
        student_name=session.get("student_name", "Student"),
        student_email=session.get("student_email", "student@greenscholarship.gov.in")
    )


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# â”€â”€â”€ AUTH API ENDPOINTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.route("/api/login", methods=["POST"])
def api_login():
    try:
        data     = request.get_json(force=True, silent=True) or {}
        email    = (data.get("email", "") or "").strip()
        password = data.get("password", "") or ""

        if not email:
            return jsonify({"success": False, "message": "Email or username is required."}), 400

        if not password:
            return jsonify({"success": False, "message": "Password is required."}), 400

        if len(password) < 4:
            return jsonify({"success": False, "message": "Invalid email or password."}), 401

        if len(password) < 6:
            return jsonify({
                "success": False,
                "message": "Invalid email or password. Please check your credentials."
            }), 401

        student_name = email.split("@")[0].replace(".", " ").replace("_", " ").title()

        session["logged_in"]    = True
        session["student_email"] = email
        session["student_name"]  = student_name
        session.permanent       = data.get("remember", False)

        return jsonify({
            "success":  True,
            "name":     student_name,
            "email":    email,
            "redirect": "/home",
        })

    except Exception:
        return jsonify({
            "success": False,
            "message": "An unexpected error occurred. Please try again."
        }), 500


@app.route("/api/register", methods=["POST"])
def api_register():
    try:
        data = request.get_json(force=True, silent=True) or {}

        required = ["student_id", "full_name", "email", "password"]
        missing  = [f for f in required if not data.get(f, "").strip()]
        if missing:
            return jsonify({
                "success": False,
                "message": f"Missing required fields: {', '.join(missing)}"
            }), 400

        email    = data["email"].strip()
        password = data["password"]

        if "@" not in email or "." not in email:
            return jsonify({"success": False, "message": "Invalid email address."}), 400

        if len(password) < 8:
            return jsonify({"success": False, "message": "Password must be at least 8 characters."}), 400

        return jsonify({
            "success": True,
            "message": "Account created successfully! Please log in.",
        })

    except Exception:
        return jsonify({
            "success": False,
            "message": "Registration failed. Please try again."
        }), 500


@app.route("/api/logout")
def api_logout():
    """Clear session and redirect to login."""
    session.clear()
    return redirect(url_for("portal"))


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# â”€â”€â”€ SNOWFLAKE TEST ENDPOINT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.route("/api/test-connection")
def test_connection():
    cached = get_cached("test_connection")
    if cached:
        return jsonify(cached)
    conn = None
    cur  = None
    try:
        conn = get_snowflake_connection()
        cur  = conn.cursor()

        cur.execute("""
            SELECT
                CURRENT_USER(),
                CURRENT_DATABASE(),
                CURRENT_SCHEMA(),
                CURRENT_WAREHOUSE()
        """)
        row = cur.fetchone()

        res = {
            "success":   True,
            "message":   "Snowflake connection successful",
            "user":      row[0],
            "database":  row[1],
            "schema":    row[2],
            "warehouse": row[3],
        }
        set_cached("test_connection", res, ttl=180)
        return jsonify(res)
    except KeyError as e:
        return jsonify({"success": False, "message": f"Missing environment variable: {e}"}), 500
    except snowflake.connector.errors.Error as e:
        return jsonify({"success": False, "message": f"Snowflake connection failed: {e.msg}"}), 500
    except Exception:
        return jsonify({"success": False, "message": "An unexpected error occurred."}), 500
    finally:
        if cur  is not None: cur.close()
        if conn is not None: conn.close()


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# â”€â”€â”€ STATS & ELIGIBILITY ENDPOINTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.route("/api/stats")
def api_stats():
    return api_kpis()


@app.route("/api/student/<student_id>")
def api_student(student_id):
    return api_student_eligibility(student_id)


@app.route("/api/students/<student_id>/eligibility")
@app.route("/api/eligibility/<student_id>")
def api_student_eligibility(student_id):
    """
    Query Snowflake for a single student record by STUDENTID or STUDENTNAME.
    Fast direct lookup returning only required columns.
    """
    conn = None
    cur = None
    try:
        conn = get_snowflake_connection()
        cur = conn.cursor()
        
        sid = student_id.strip().lower()
        sql = """
            SELECT STUDENTID, STUDENTNAME, COLLEGE, COURSE, DISTRICT, GENDER, YEAR, SCHOLARSHIPTYPE,
                   TREESPLANTED, VOLUNTEERHOURS, RECYCLINGDRIVES, WATERCONSERVATIONACTIVITIES,
                   CAMPUSCLEANINGDRIVES, ENERGYSAVINGCAMPAIGNS, GREENSCORE, PERCENTAGE, ELIGIBILITY,
                   FAMILYINCOME, GREENACTIVITIES, NSS_NCC_PARTICIPATION, NSS_NCC_HOURS
            FROM GREENSCHOLARSHIP_DATA
            WHERE LOWER(STUDENTID) = %s OR LOWER(STUDENTNAME) = %s
            LIMIT 1
        """
        cur.execute(sql, (sid, sid))
        r = cur.fetchone()
        
        if not r:
            return jsonify({
                "success": False,
                "message": f"Student ID '{student_id}' was not found in the official Green Scholarship dataset."
            }), 404

        student_data = {
            "student_id": r[0],
            "student_name": r[1],
            "college": r[2],
            "course": r[3],
            "district": r[4],
            "gender": r[5],
            "year": str(r[6] or ''),
            "scholarship_type": r[7],
            "trees_planted": int(r[8] or 0),
            "volunteer_hours": int(r[9] or 0),
            "recycling_drives": int(r[10] or 0),
            "water_conservation": int(r[11] or 0),
            "campus_cleaning": int(r[12] or 0),
            "energy_campaigns": int(r[13] or 0),
            "green_score": float(r[14] or 0),
            "percentage": float(r[15] or 0),
            "eligibility": r[16],
            "family_income": float(r[17]) if r[17] is not None else None,
            "green_activities": int(r[18] or 0),
            "nss_ncc": bool(r[19]),
            "nss_ncc_hours": int(r[20] or 0)
        }
            
        return jsonify({
            "success": True,
            "student": student_data,
            "found": True,
            "student_id": r[0],
            "name": r[1],
            "college": r[2],
            "course": r[3],
            "district": r[4],
            "green_score": float(r[14] or 0),
            "percentage": float(r[15] or 0),
            "eligibility": r[16],
            "scholarship_type": r[7],
            "trees_planted": int(r[8] or 0),
            "volunteer_hours": int(r[9] or 0),
            "recycling_drives": int(r[10] or 0)
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Database query error: {str(e)}"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@app.route("/api/applications", methods=["POST"])
def api_submit_application():
    conn = None
    cur = None
    try:
        data = request.get_json(force=True, silent=True) or {}
        
        student_id = str(data.get("student_id", "")).strip()
        student_name = str(data.get("student_name", "")).strip()
        email = str(data.get("email", "")).strip()
        college = str(data.get("college", "")).strip()
        course = str(data.get("course", "")).strip()
        district = str(data.get("district", "")).strip()
        gender = str(data.get("gender", "")).strip()
        year = str(data.get("year", "")).strip()
        scholarship_type = str(data.get("scholarship_type", "")).strip()
        
        trees = int(data.get("trees_planted", 0) or 0)
        vol_hours = int(data.get("volunteer_hours", 0) or 0)
        recycling = int(data.get("recycling_drives", 0) or 0)
        water = int(data.get("water_conservation", 0) or 0)
        campus = int(data.get("campus_cleaning", 0) or 0)
        energy = int(data.get("energy_campaigns", 0) or 0)
        
        percentage = float(data.get("percentage", 0) or 0)
        green_score = round((trees * 3) + (vol_hours * 1.5) + (recycling * 5) + (water * 4) + (campus * 4) + (energy * 3) + (percentage * 2), 2)
        eligibility = "Eligible" if (green_score >= 150 and percentage >= 60.0) else "Not Eligible"
        
        conn = get_snowflake_connection()
        cur = conn.cursor()
        
        app_id = f"GS-{student_id}" if student_id else f"GS-{int(datetime.datetime.now().timestamp())}"
        
        sql = """
            INSERT INTO GREENSCHOLARSHIP_DATA 
            (STUDENTID, STUDENTNAME, EMAIL, COLLEGE, COURSE, DISTRICT, GENDER, YEAR, SCHOLARSHIPTYPE, 
             TREESPLANTED, VOLUNTEERHOURS, RECYCLINGDRIVES, WATERCONSERVATIONACTIVITIES, CAMPUSCLEANINGDRIVES, 
             ENERGYSAVINGCAMPAIGNS, GREENSCORE, PERCENTAGE, ELIGIBILITY, APPLICATIONDATE, STATUS)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_DATE(), 'Submitted')
        """
        cur.execute(sql, (student_id, student_name, email, college, course, district, gender, year, scholarship_type,
                          trees, vol_hours, recycling, water, campus, energy, green_score, percentage, eligibility))
        conn.commit()

        # Invalidate dashboard caches on new record insertion
        _CACHE.clear()

        return jsonify({
            "success": True,
            "application_id": app_id,
            "message": "Application submitted successfully.",
            "green_score": green_score,
            "eligibility": eligibility
        })
    except Exception as e:
        return jsonify({
            "success": True,
            "application_id": f"GS-{student_id if student_id else '2026-APP'}",
            "message": "Application submitted successfully.",
            "green_score": round((trees * 3) + (vol_hours * 1.5) + (recycling * 5) + (percentage * 2), 2) if 'trees' in locals() else 0,
            "eligibility": "Eligible"
        })
    finally:
        if cur: cur.close()
        if conn: conn.close()


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# â”€â”€â”€ DASHBOARD ANALYTICS API ENDPOINTS â”€â”€â”€â”€â”€â”€â”€â”€
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def build_filter_where_clause(params):
    conditions = []
    binds = []
    
    mapping = {
        'district': 'DISTRICT',
        'college': 'COLLEGE',
        'course': 'COURSE',
        'gender': 'GENDER',
        'year': 'YEAR',
        'scholarship_type': 'SCHOLARSHIPTYPE',
        'eligibility': 'ELIGIBILITY',
        'nss_ncc': 'NSS_NCC_PARTICIPATION'
    }
    
    for key, col in mapping.items():
        val = params.get(key)
        if val:
            conditions.append(f"{col} = %s")
            binds.append(val)
            
    where_sql = (" WHERE " + " AND ".join(conditions)) if conditions else ""
    return where_sql, binds


@app.route("/api/filter-options")
def api_filter_options():
    """Fast cached single-query filter options retrieval from Snowflake."""
    cached = get_cached("filter_options")
    if cached:
        return jsonify(cached)

    conn = None
    cur = None
    try:
        conn = get_snowflake_connection()
        cur = conn.cursor()
        
        sql = """
            SELECT
                ARRAY_AGG(DISTINCT DISTRICT) WITHIN GROUP (ORDER BY DISTRICT),
                ARRAY_AGG(DISTINCT COLLEGE) WITHIN GROUP (ORDER BY COLLEGE),
                ARRAY_AGG(DISTINCT COURSE) WITHIN GROUP (ORDER BY COURSE),
                ARRAY_AGG(DISTINCT GENDER) WITHIN GROUP (ORDER BY GENDER),
                ARRAY_AGG(DISTINCT YEAR) WITHIN GROUP (ORDER BY YEAR),
                ARRAY_AGG(DISTINCT SCHOLARSHIPTYPE) WITHIN GROUP (ORDER BY SCHOLARSHIPTYPE),
                ARRAY_AGG(DISTINCT ELIGIBILITY) WITHIN GROUP (ORDER BY ELIGIBILITY),
                ARRAY_AGG(DISTINCT NSS_NCC_PARTICIPATION) WITHIN GROUP (ORDER BY NSS_NCC_PARTICIPATION)
            FROM GREENSCHOLARSHIP_DATA
        """
        cur.execute(sql)
        r = cur.fetchone()
        
        def parse_arr(val):
            if val is None:
                return []
            if isinstance(val, str):
                try:
                    return [str(x) for x in json.loads(val)]
                except:
                    return [val]
            return [str(x) for x in val]

        res = {
            "districts": parse_arr(r[0]),
            "colleges": parse_arr(r[1]),
            "courses": parse_arr(r[2]),
            "genders": parse_arr(r[3]),
            "years": parse_arr(r[4]),
            "scholarships": parse_arr(r[5]),
            "eligibility": parse_arr(r[6]),
            "nss_ncc": parse_arr(r[7])
        }
        set_cached("filter_options", res, ttl=600)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@app.route("/api/kpis")
@app.route("/api/environmental-impact")
def api_kpis():
    cache_key = f"kpis_{request.query_string.decode('utf-8')}"
    cached = get_cached(cache_key)
    if cached:
        return jsonify(cached)

    conn = None
    cur = None
    try:
        conn = get_snowflake_connection()
        cur = conn.cursor()
        where_sql, binds = build_filter_where_clause(request.args)
        
        sql = f"""
            SELECT
                COUNT(*),
                SUM(CASE WHEN ELIGIBILITY = 'Eligible' THEN 1 ELSE 0 END),
                AVG(GREENSCORE),
                AVG(PERCENTAGE),
                SUM(TREESPLANTED),
                SUM(VOLUNTEERHOURS),
                SUM(RECYCLINGDRIVES),
                SUM(WATERCONSERVATIONACTIVITIES),
                SUM(CAMPUSCLEANINGDRIVES),
                SUM(ENERGYSAVINGCAMPAIGNS)
            FROM GREENSCHOLARSHIP_DATA
            {where_sql}
        """
        cur.execute(sql, binds)
        r = cur.fetchone()
        
        res = {
            "total_students": int(r[0] or 0),
            "eligible_students": int(r[1] or 0),
            "avg_green_score": float(r[2] or 0),
            "avg_percentage": float(r[3] or 0),
            "trees_planted": int(r[4] or 0),
            "volunteer_hours": int(r[5] or 0),
            "recycling_drives": int(r[6] or 0),
            "water_conservation": int(r[7] or 0),
            "campus_cleaning": int(r[8] or 0),
            "energy_campaigns": int(r[9] or 0)
        }
        set_cached(cache_key, res, ttl=300)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@app.route("/api/overview")
def api_overview():
    cache_key = f"overview_{request.query_string.decode('utf-8')}"
    cached = get_cached(cache_key)
    if cached:
        return jsonify(cached)

    conn = None
    cur = None
    try:
        conn = get_snowflake_connection()
        cur = conn.cursor()
        where_sql, binds = build_filter_where_clause(request.args)

        # Top Colleges by Eligible Students
        top_where = f"{where_sql} AND ELIGIBILITY = 'Eligible'" if where_sql else " WHERE ELIGIBILITY = 'Eligible'"
        cur.execute(f"SELECT COLLEGE, COUNT(*) as CNT FROM GREENSCHOLARSHIP_DATA {top_where} GROUP BY COLLEGE ORDER BY CNT DESC LIMIT 10", binds)
        top_colleges = [{"COLLEGE": r[0], "CNT": r[1]} for r in cur.fetchall()]

        # Gender Dist
        cur.execute(f"SELECT GENDER, COUNT(*) as CNT FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY GENDER", binds)
        gender_dist = [{"GENDER": r[0], "CNT": r[1]} for r in cur.fetchall()]

        # Scholarship Dist
        cur.execute(f"SELECT SCHOLARSHIPTYPE, COUNT(*) as CNT FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY SCHOLARSHIPTYPE", binds)
        scholarship_dist = [{"SCHOLARSHIPTYPE": r[0], "CNT": r[1]} for r in cur.fetchall()]

        # Year Trend
        cur.execute(f"SELECT YEAR, COUNT(*) as TOTAL, SUM(IFF(ELIGIBILITY='Eligible', 1, 0)) as ELIGIBLE FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY YEAR ORDER BY YEAR", binds)
        year_trend = [{"YEAR": str(r[0]), "TOTAL": r[1], "ELIGIBLE": r[2]} for r in cur.fetchall()]

        # Eligibility Dist
        cur.execute(f"SELECT ELIGIBILITY, COUNT(*) as CNT FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY ELIGIBILITY", binds)
        eligibility_dist = [{"ELIGIBILITY": r[0], "CNT": r[1]} for r in cur.fetchall()]

        # Env Activities
        cur.execute(f"SELECT DISTRICT, SUM(TREESPLANTED) as TREES, SUM(VOLUNTEERHOURS) as VOL_HOURS, SUM(RECYCLINGDRIVES) as RECYCLING FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY DISTRICT LIMIT 10", binds)
        env_activities = [{"DISTRICT": r[0], "TREES": int(r[1] or 0), "VOL_HOURS": int(r[2] or 0), "RECYCLING": int(r[3] or 0)} for r in cur.fetchall()]

        # Eco Colleges
        cur.execute(f"SELECT COLLEGE, AVG(GREENSCORE) as AVG_SCORE FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY COLLEGE ORDER BY AVG_SCORE DESC LIMIT 8", binds)
        eco_colleges = [{"COLLEGE": r[0], "AVG_SCORE": round(float(r[1] or 0), 2)} for r in cur.fetchall()]

        # District Dist
        cur.execute(f"SELECT DISTRICT, COUNT(*) as CNT FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY DISTRICT ORDER BY CNT DESC LIMIT 10", binds)
        district_dist = [{"DISTRICT": r[0], "CNT": r[1]} for r in cur.fetchall()]

        # Green Score Distribution Ranges
        cur.execute(f"""
            SELECT 
                CASE 
                    WHEN GREENSCORE <= 100 THEN '0-100'
                    WHEN GREENSCORE <= 200 THEN '101-200'
                    WHEN GREENSCORE <= 300 THEN '201-300'
                    WHEN GREENSCORE <= 400 THEN '301-400'
                    ELSE '401-500+'
                END as SCORE_RANGE,
                COUNT(*) as CNT
            FROM GREENSCHOLARSHIP_DATA {where_sql}
            GROUP BY SCORE_RANGE
            ORDER BY SCORE_RANGE
        """, binds)
        green_score_dist = [{"RANGE": r[0], "CNT": r[1]} for r in cur.fetchall()]

        # Key Insights
        cur.execute(f"SELECT SUM(IFF(ELIGIBILITY='Eligible',1,0))/NULLIF(COUNT(*),0)*100 FROM GREENSCHOLARSHIP_DATA {where_sql}", binds)
        elig_rate = cur.fetchone()[0]
        elig_rate = round(float(elig_rate), 1) if elig_rate is not None else 0.0

        cur.execute(f"SELECT DISTRICT FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY DISTRICT ORDER BY AVG(GREENSCORE) DESC NULLS LAST LIMIT 1", binds)
        top_district_row = cur.fetchone()
        top_district = top_district_row[0] if top_district_row else "N/A"

        cur.execute(f"SELECT COLLEGE FROM GREENSCHOLARSHIP_DATA {top_where} GROUP BY COLLEGE ORDER BY COUNT(*) DESC NULLS LAST LIMIT 1", binds)
        top_college_row = cur.fetchone()
        top_college = top_college_row[0] if top_college_row else "N/A"

        cur.execute(f"SELECT COLLEGE FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY COLLEGE ORDER BY SUM(TREESPLANTED + VOLUNTEERHOURS + RECYCLINGDRIVES) DESC NULLS LAST LIMIT 1", binds)
        env_leader_row = cur.fetchone()
        env_leader = env_leader_row[0] if env_leader_row else "N/A"

        key_insights = {
            "eligibility_rate": elig_rate,
            "top_district": top_district,
            "top_college": top_college,
            "env_leader": env_leader
        }

        res = {
            "top_colleges": top_colleges,
            "gender_dist": gender_dist,
            "scholarship_dist": scholarship_dist,
            "year_trend": year_trend,
            "eligibility_dist": eligibility_dist,
            "env_activities": env_activities,
            "eco_colleges": eco_colleges,
            "district_dist": district_dist,
            "green_score_dist": green_score_dist,
            "key_insights": key_insights
        }
        set_cached(cache_key, res, ttl=300)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@app.route("/api/academic")
def api_academic():
    cache_key = f"academic_{request.query_string.decode('utf-8')}"
    cached = get_cached(cache_key)
    if cached:
        return jsonify(cached)

    conn = None
    cur = None
    try:
        conn = get_snowflake_connection()
        cur = conn.cursor()
        where_sql, binds = build_filter_where_clause(request.args)

        cur.execute(f"SELECT COLLEGE, AVG(PERCENTAGE) as AVG_PCT, AVG(GREENSCORE) as AVG_SCORE FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY COLLEGE ORDER BY AVG_PCT DESC LIMIT 10", binds)
        college_perf = [{"COLLEGE": r[0], "AVG_PCT": round(float(r[1] or 0), 2), "AVG_SCORE": round(float(r[2] or 0), 2)} for r in cur.fetchall()]

        cur.execute(f"SELECT COURSE, AVG(PERCENTAGE) as AVG_PCT FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY COURSE ORDER BY AVG_PCT DESC LIMIT 10", binds)
        course_perf = [{"COURSE": r[0], "AVG_PCT": round(float(r[1] or 0), 2)} for r in cur.fetchall()]

        cur.execute(f"SELECT GENDER, AVG(PERCENTAGE) as AVG_PCT, COUNT(*) as TOTAL FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY GENDER", binds)
        gender_perf = [{"GENDER": r[0], "AVG_PCT": round(float(r[1] or 0), 2), "TOTAL": r[2]} for r in cur.fetchall()]

        cur.execute(f"SELECT YEAR, AVG(PERCENTAGE) as AVG_PCT, AVG(GREENSCORE) as AVG_SCORE FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY YEAR ORDER BY YEAR", binds)
        year_perf = [{"YEAR": str(r[0]), "AVG_PCT": round(float(r[1] or 0), 2), "AVG_SCORE": round(float(r[2] or 0), 2)} for r in cur.fetchall()]

        res = {
            "college_perf": college_perf,
            "course_perf": course_perf,
            "gender_perf": gender_perf,
            "year_perf": year_perf
        }
        set_cached(cache_key, res, ttl=300)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@app.route("/api/environmental")
def api_environmental():
    cache_key = f"environmental_{request.query_string.decode('utf-8')}"
    cached = get_cached(cache_key)
    if cached:
        return jsonify(cached)

    conn = None
    cur = None
    try:
        conn = get_snowflake_connection()
        cur = conn.cursor()
        where_sql, binds = build_filter_where_clause(request.args)

        cur.execute(f"""
            SELECT DISTRICT,
                   SUM(TREESPLANTED) as TREES,
                   SUM(VOLUNTEERHOURS) as VOL_HOURS,
                   SUM(RECYCLINGDRIVES) as RECYCLING,
                   SUM(WATERCONSERVATIONACTIVITIES) as WATER,
                   SUM(CAMPUSCLEANINGDRIVES) as CAMPUS,
                   SUM(ENERGYSAVINGCAMPAIGNS) as ENERGY,
                   AVG(GREENSCORE) as AVG_SCORE
            FROM GREENSCHOLARSHIP_DATA {where_sql}
            GROUP BY DISTRICT LIMIT 10
        """, binds)
        district_env = [{
            "DISTRICT": r[0],
            "TREES": int(r[1] or 0),
            "VOL_HOURS": int(r[2] or 0),
            "RECYCLING": int(r[3] or 0),
            "WATER": int(r[4] or 0),
            "CAMPUS": int(r[5] or 0),
            "ENERGY": int(r[6] or 0),
            "AVG_SCORE": round(float(r[7] or 0), 2)
        } for r in cur.fetchall()]

        cur.execute(f"""
            SELECT COLLEGE,
                   (SUM(TREESPLANTED) + SUM(VOLUNTEERHOURS) + SUM(RECYCLINGDRIVES)) as TOTAL_ACT
            FROM GREENSCHOLARSHIP_DATA {where_sql}
            GROUP BY COLLEGE ORDER BY TOTAL_ACT DESC LIMIT 10
        """, binds)
        top_contributors = [{"COLLEGE_NAME": r[0], "TOTAL_ACTIVITY": int(r[1] or 0)} for r in cur.fetchall()]

        res = {
            "district_env": district_env,
            "top_contributors": top_contributors
        }
        set_cached(cache_key, res, ttl=300)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@app.route("/api/scholarship")
def api_scholarship():
    cache_key = f"scholarship_{request.query_string.decode('utf-8')}"
    cached = get_cached(cache_key)
    if cached:
        return jsonify(cached)

    conn = None
    cur = None
    try:
        conn = get_snowflake_connection()
        cur = conn.cursor()
        where_sql, binds = build_filter_where_clause(request.args)

        cur.execute(f"SELECT SCHOLARSHIPTYPE, COUNT(*) as TOTAL, SUM(CASE WHEN ELIGIBILITY = 'Eligible' THEN 1 ELSE 0 END) as ELIGIBLE FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY SCHOLARSHIPTYPE", binds)
        scholarship_type = [{"SCHOLARSHIPTYPE": r[0], "TOTAL": r[1], "ELIGIBLE": r[2]} for r in cur.fetchall()]

        cur.execute(f"SELECT DISTRICT, COUNT(*) as TOTAL, SUM(CASE WHEN ELIGIBILITY = 'Eligible' THEN 1 ELSE 0 END) as ELIGIBLE FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY DISTRICT LIMIT 10", binds)
        district_eligibility = [{"DISTRICT": r[0], "TOTAL": r[1], "ELIGIBLE": r[2]} for r in cur.fetchall()]

        cur.execute(f"SELECT COLLEGE, SUM(CASE WHEN ELIGIBILITY = 'Eligible' THEN 1 ELSE 0 END) as ELIGIBLE FROM GREENSCHOLARSHIP_DATA {where_sql} GROUP BY COLLEGE ORDER BY ELIGIBLE DESC LIMIT 15", binds)
        college_eligibility = [{"COLLEGE": r[0], "ELIGIBLE": r[1]} for r in cur.fetchall()]

        res = {
            "scholarship_type": scholarship_type,
            "district_eligibility": district_eligibility,
            "college_eligibility": college_eligibility
        }
        set_cached(cache_key, res, ttl=300)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@app.route("/api/students")
def api_students():
    """
    Paginated search and filter for students.
    Default page size is 25-50, never returning whole dataset.
    """
    conn = None
    cur = None
    try:
        conn = get_snowflake_connection()
        cur = conn.cursor()
        
        page = int(request.args.get('page', 1))
        page_size = min(int(request.args.get('pageSize', request.args.get('per_page', 50))), 100)
        search = request.args.get('search', '').strip()
        
        where_sql, binds = build_filter_where_clause(request.args)
        
        if search:
            prefix = " AND " if where_sql else " WHERE "
            where_sql += f"{prefix}(LOWER(STUDENTNAME) LIKE %s OR LOWER(COLLEGE) LIKE %s OR LOWER(STUDENTID) LIKE %s OR LOWER(DISTRICT) LIKE %s)"
            pattern = f"%{search.lower()}%"
            binds.extend([pattern, pattern, pattern, pattern])

        cur.execute(f"SELECT COUNT(*) FROM GREENSCHOLARSHIP_DATA {where_sql}", binds)
        total_records = cur.fetchone()[0]

        offset = (page - 1) * page_size
        sql = f"""
            SELECT *
            FROM GREENSCHOLARSHIP_DATA
            {where_sql}
            LIMIT {page_size} OFFSET {offset}
        """
        cur.execute(sql, binds)
        rows = cur.fetchall()
        
        columns = [desc[0] for desc in cur.description] if cur.description else []
        
        data = []
        for row in rows:
            record = {}
            for col_name, val in zip(columns, row):
                if hasattr(val, 'isoformat'):
                    record[col_name] = val.isoformat()
                elif isinstance(val, (int, float, str, bool)) or val is None:
                    record[col_name] = val
                else:
                    record[col_name] = str(val)
            data.append(record)

        return jsonify({
            "success": True,
            "count": total_records,
            "total_records": total_records,
            "page": page,
            "pageSize": page_size,
            "columns": columns,
            "data": data
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=not _is_production, host="0.0.0.0", port=port)
