import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# Ensure the static/downloads directory exists
os.makedirs("static/downloads", exist_ok=True)

def make_guidelines_pdf():
    pdf_path = "static/downloads/Green_Scholarship_Guidelines_2026.pdf"
    doc = SimpleDocTemplate(pdf_path, pagesize=letter,
                            rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
    story = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=20, leading=24,
        textColor=colors.HexColor('#1B7F3A'), spaceAfter=15
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=12, leading=16,
        textColor=colors.HexColor('#5A7A6A'), spaceAfter=25
    )
    h2_style = ParagraphStyle(
        'DocH2', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=14, leading=18,
        textColor=colors.HexColor('#173B2A'), spaceBefore=15, spaceAfter=10
    )
    body_style = ParagraphStyle(
        'DocBody', parent=styles['BodyText'],
        fontName='Helvetica', fontSize=10, leading=14,
        textColor=colors.HexColor('#2E3B34'), spaceAfter=8
    )
    
    story.append(Paragraph("Green Scholarship Program 2026", title_style))
    story.append(Paragraph("Official Application & Program Guidelines", subtitle_style))
    story.append(Spacer(1, 0.1 * inch))
    
    story.append(Paragraph("1. Objective", h2_style))
    story.append(Paragraph("The Green Scholarship Program aims to encourage active environmental participation among college and university students across Karnataka. By rewarding sustainability initiatives combined with academic excellence, the program fosters ecological awareness and community engagement.", body_style))
    
    story.append(Paragraph("2. Eligibility Criteria", h2_style))
    story.append(Paragraph("• Enrolled in an accredited higher education institution in Karnataka.<br/>"
                           "• Academic performance: Minimum of 75% marks in the preceding academic year.<br/>"
                           "• Annual Family Income: Must not exceed INR 60,000.<br/>"
                           "• Eco Engagement: Must achieve a minimum Green Score of 100 based on verified activities.", body_style))
    
    story.append(Paragraph("3. Green Score Computation", h2_style))
    story.append(Paragraph("Green Scores are calculated based on verified contributions to sustainability. The current score weights are calculated as follows:", body_style))
    
    data = [
        [Paragraph("<b>Activity Component</b>", body_style), Paragraph("<b>Metric Weight</b>", body_style), Paragraph("<b>Maximum Allowed</b>", body_style)],
        ["Trees Planted & Maintained", "2 Points per tree", "100 Trees (200 pts)"],
        ["Green Activities Participated", "5 Points per activity", "15 Activities (75 pts)"],
        ["NSS / NCC Contribution", "1 Point per hour", "120 Hours (120 pts)"],
        ["General Volunteerism", "1 Point per hour", "200 Hours (200 pts)"],
        ["Recycling & Waste Drives", "3 Points per drive", "15 Drives (45 pts)"],
        ["Campus Cleaning Campaigns", "2 Points per drive", "12 Drives (24 pts)"],
        ["Water & Energy Saving Campaigns", "4 Points per campaign", "10 Campaigns (40 pts)"]
    ]
    t = Table(data, colWidths=[2.5*inch, 1.8*inch, 2.0*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E8F5E9')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#1B7F3A')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#C8E6C9')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.15 * inch))
    
    story.append(Paragraph("4. Submission and Verification", h2_style))
    story.append(Paragraph("All entries must be accompanied by relevant proof: digital photos with GPS coordinates for tree plantation, logs signed by NSS/NCC coordinators, and income statements issued by competent local administrative authorities.", body_style))
    
    doc.build(story)
    print(f"Generated {pdf_path}")

def make_plantation_verification_form_pdf():
    pdf_path = "static/downloads/Plantation_Verification_Form.pdf"
    doc = SimpleDocTemplate(pdf_path, pagesize=letter,
                            rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
    story = []
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=18, leading=22,
        textColor=colors.HexColor('#0288D1'), spaceAfter=5
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=11, leading=14,
        textColor=colors.HexColor('#5A7A6A'), spaceAfter=25
    )
    body_style = ParagraphStyle('BodyText', parent=styles['BodyText'], fontSize=10, leading=14)
    
    story.append(Paragraph("Tree Plantation Proof & Verification Certificate", title_style))
    story.append(Paragraph("Official Form for Green Scholarship Eco Points Verification", subtitle_style))
    story.append(Spacer(1, 0.15 * inch))
    
    story.append(Paragraph("Please complete the following details clearly. Verified evidence (photos, coordinates) must be attached along with this form.", body_style))
    story.append(Spacer(1, 0.15 * inch))
    
    data = [
        ["Student Full Name:", ""],
        ["Student Registration ID:", ""],
        ["College Name:", ""],
        ["Branch & Year of Study:", ""],
        ["Number of Saplings Planted:", ""],
        ["Tree Species (e.g. Neem, Teak, Banyan):", ""],
        ["Geo-Coordinates (GPS Latitude/Longitude):", ""],
        ["Date of Plantation:", ""]
    ]
    t = Table(data, colWidths=[2.5*inch, 4.0*inch], rowHeights=25)
    t.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#B0BEC5')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F1F8E9')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.4 * inch))
    
    story.append(Paragraph("<b>Student Declaration:</b> I hereby declare that the details provided above are true to the best of my knowledge and the saplings are actively nurtured by me.", body_style))
    story.append(Spacer(1, 0.5 * inch))
    
    sig_data = [
        ["_________________________\nStudent Signature", "_________________________\nNSS/Green Officer Signature", "_________________________\nCollege Principal & Stamp"]
    ]
    sig_table = Table(sig_data, colWidths=[2.1*inch, 2.2*inch, 2.2*inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
    ]))
    story.append(sig_table)
    
    doc.build(story)
    print(f"Generated {pdf_path}")

def make_volunteer_logbook_pdf():
    pdf_path = "static/downloads/Volunteer_Logbook_Template.pdf"
    doc = SimpleDocTemplate(pdf_path, pagesize=letter,
                            rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=18, leading=22,
        textColor=colors.HexColor('#ED6C02'), spaceAfter=5
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=11, leading=14,
        textColor=colors.HexColor('#5A7A6A'), spaceAfter=20
    )
    body_style = ParagraphStyle('BodyText', parent=styles['BodyText'], fontSize=9, leading=12)
    
    story.append(Paragraph("NSS / NCC / Environmental Volunteer Logbook", title_style))
    story.append(Paragraph("Official Hours Logsheet for Green Scholarship Evaluation", subtitle_style))
    
    header_data = [
        ["Student Name:", "___________________________", "Register No:", "___________________________"],
        ["Institution:", "___________________________", "Program Name:", "NSS / NCC / Green Club"]
    ]
    ht = Table(header_data, colWidths=[1.2*inch, 2.4*inch, 1.2*inch, 2.4*inch], rowHeights=20)
    ht.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(ht)
    story.append(Spacer(1, 0.2 * inch))
    
    data = [
        ["Date", "Description of Activity Participated", "Hours", "Coordinator Name", "Signature & Stamp"]
    ]
    for _ in range(12):
        data.append(["", "", "", "", ""])
        
    log_table = Table(data, colWidths=[1.0*inch, 3.2*inch, 0.8*inch, 1.4*inch, 1.1*inch], rowHeights=24)
    log_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#CFD8DC')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FFE0B2')),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
    ]))
    story.append(log_table)
    
    doc.build(story)
    print(f"Generated {pdf_path}")

def make_bonafide_pdf():
    pdf_path = "static/downloads/Bonafide_Sample_Format.pdf"
    doc = SimpleDocTemplate(pdf_path, pagesize=letter,
                            rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
    story = []
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=18, leading=22,
        textColor=colors.HexColor('#9C27B0'), spaceAfter=5
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=11, leading=14,
        textColor=colors.HexColor('#5A7A6A'), spaceAfter=25
    )
    body_style = ParagraphStyle('BodyText', parent=styles['BodyText'], fontSize=10, leading=15)
    
    story.append(Paragraph("Bonafide Student & Income Certification Format", title_style))
    story.append(Paragraph("Sample Layout required for College Verification", subtitle_style))
    story.append(Spacer(1, 0.15 * inch))
    
    story.append(Paragraph("<b>TO WHOMSOEVER IT MAY CONCERN</b>", ParagraphStyle('Sub', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, spaceAfter=15)))
    
    bonafide_text = (
        "This is to certify that Mr./Ms. _________________________________________ "
        "Son/Daughter of Mr./Mrs. _________________________________________ is a bonafide student of "
        "____________________________________________________________________ (College/Institution Name) "
        "studying in _____________________ Course, ________ Year / Semester during the Academic Year 2025-2026. "
        "His/Her college registration / admission number is _________________________."
    )
    story.append(Paragraph(bonafide_text, body_style))
    story.append(Spacer(1, 0.2 * inch))
    
    income_text = (
        "As per college admission records and verification of certificates, his/her annual family income from all sources "
        "is declared to be INR _____________________ (Rupees ____________________________________________________ only)."
    )
    story.append(Paragraph(income_text, body_style))
    story.append(Spacer(1, 0.2 * inch))
    
    college_text = (
        "This certificate is issued at the request of the student to apply for the Karnataka Government Green Scholarship Scheme 2026."
    )
    story.append(Paragraph(college_text, body_style))
    story.append(Spacer(1, 0.6 * inch))
    
    sig_data = [
        ["Date: ______________\nPlace: ______________", "_____________________________________\nPrincipal Signature & College Seal"]
    ]
    sig_table = Table(sig_data, colWidths=[3.2*inch, 3.3*inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
    ]))
    story.append(sig_table)
    
    doc.build(story)
    print(f"Generated {pdf_path}")

if __name__ == "__main__":
    make_guidelines_pdf()
    make_plantation_verification_form_pdf()
    make_volunteer_logbook_pdf()
    make_bonafide_pdf()
