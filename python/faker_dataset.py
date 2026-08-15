from faker import Faker
import pandas as pd
import random
import os
from tqdm import tqdm

# ---------------------------------------
# Initialize Faker
# ---------------------------------------

fake = Faker("en_IN")

NUM_RECORDS = 100000

# ---------------------------------------
# Static Data
# ---------------------------------------

colleges = [
    "SDM College Ujire",
    "St. Joseph Engineering College",
    "NMAM Institute of Technology",
    "Canara Engineering College",
    "Mangalore University",
    "Manipal Institute of Technology",
    "Sahyadri College of Engineering",
    "Alva's College",
    "Vivekananda College",
    "Government First Grade College",
    "PES University",
    "RV College of Engineering",
    "BMS College of Engineering",
    "MS Ramaiah Institute of Technology",
    "JSS Science and Technology University",
    "Dayananda Sagar College",
    "Jain University",
    "Christ University",
    "Presidency University",
    "Acharya Institute of Technology",
    "KLE Technological University",
    "MIT Manipal",
    "NIT Surathkal",
    "Srinivas University",
    "Mangalore Institute of Technology"
]

courses = [
    "BCA",
    "BSc",
    "BCom",
    "BA",
    "BBA",
    "BE Computer Science",
    "BE Information Science",
    "BE Electronics",
    "BE Mechanical",
    "BE Civil"
]

districts = [
    "Bengaluru Urban",
    "Bengaluru Rural",
    "Mysuru",
    "Mangaluru",
    "Udupi",
    "Belagavi",
    "Shivamogga",
    "Tumakuru",
    "Kodagu",
    "Mandya",
    "Raichur",
    "Ballari",
    "Bidar",
    "Kalaburagi",
    "Chikkamagaluru",
    "Dakshina Kannada",
    "Uttara Kannada",
    "Hassan",
    "Dharwad",
    "Vijayapura"
]

scholarship_types = [
    "Green Merit",
    "Need Based",
    "Eco Excellence",
    "Sports",
    "Rural Support"
]

status_list = [
    "Pending",
    "Approved",
    "Rejected"
]

# ---------------------------------------
# Create Data Folder
# ---------------------------------------

os.makedirs("../data", exist_ok=True)

records = []

print("Generating Green Scholarship Dataset...")

# ---------------------------------------
# Generate Records
# ---------------------------------------

for i in tqdm(range(NUM_RECORDS)):

    student_id = f"GS{100001+i}"

    name = fake.name()

    gender = random.choice(["Male", "Female"])

    dob = fake.date_of_birth(minimum_age=17, maximum_age=25)

    email = fake.email()

    phone = str(random.randint(6000000000, 9999999999))

    college = random.choice(colleges)

    course = random.choice(courses)

    year = random.randint(1, 4)

    district = random.choice(districts)

    state = "Karnataka"

    income = random.randint(20000, 150000)

    percentage = round(random.uniform(50, 100), 2)

    trees = random.randint(0, 100)

    green_activities = random.randint(0, 15)

    nss = random.choice(["Yes", "No"])

    if nss == "Yes":
        nss_hours = random.randint(10, 120)
    else:
        nss_hours = 0

    volunteer_hours = random.randint(0, 200)

    recycling = random.randint(0, 15)

    cleaning = random.randint(0, 12)

    water = random.randint(0, 10)

    energy = random.randint(0, 10)

    green_score = (
            trees * 2
            + green_activities * 5
            + nss_hours
            + volunteer_hours
            + recycling * 3
            + cleaning * 2
            + water * 4
            + energy * 4
    )

    scholarship = random.choice(scholarship_types)

    application_date = fake.date_between(
        start_date="-2y",
        end_date="today"
    )

    status = random.choice(status_list)

    if (
            percentage >= 75
            and income <= 60000
            and green_score >= 100
    ):
        eligibility = "Eligible"
    else:
        eligibility = "Not Eligible"

    records.append({

        "StudentID": student_id,
        "StudentName": name,
        "Gender": gender,
        "DOB": dob,
        "Email": email,
        "Phone": phone,
        "College": college,
        "Course": course,
        "Year": year,
        "District": district,
        "State": state,
        "FamilyIncome": income,
        "Percentage": percentage,
        "TreesPlanted": trees,
        "GreenActivities": green_activities,
        "NSS_NCC_Participation": nss,
        "NSS_NCC_Hours": nss_hours,
        "VolunteerHours": volunteer_hours,
        "RecyclingDrives": recycling,
        "CampusCleaningDrives": cleaning,
        "WaterConservationActivities": water,
        "EnergySavingCampaigns": energy,
        "GreenScore": green_score,
        "ScholarshipType": scholarship,
        "ApplicationDate": application_date,
        "Status": status,
        "Eligibility": eligibility

    })

# ---------------------------------------
# Create DataFrame
# ---------------------------------------

df = pd.DataFrame(records)

# ---------------------------------------
# Save Files
# ---------------------------------------

csv_path = "../data/GreenScholarship_100000.csv"
excel_path = "../data/GreenScholarship_100000.xlsx"

df.to_csv(csv_path, index=False)

df.to_excel(excel_path, index=False)

print("\nDataset Generated Successfully!")
print(df.head())
print("\nTotal Records:", len(df))
print("\nCSV Saved :", csv_path)
print("Excel Saved:", excel_path)
