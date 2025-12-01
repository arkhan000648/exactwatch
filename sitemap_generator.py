import datetime
import os

# CONFIGURATION
BASE_URL = "https://exactwatch.shop/"

# List of your pages. 
# "path": The folder name (leave empty for homepage)
# "priority": 1.0 for home, 0.8 for main pages, 0.5 for others
# "freq": 'daily' or 'monthly'
pages = [
    {"path": "", "priority": "1.0", "type": "home"},         # Homepage
    {"path": "About/", "priority": "0.8", "type": "static"}, # About Page
    {"path": "Contact/", "priority": "0.8", "type": "static"}, # Contact Page
    {"path": "Terms/", "priority": "0.5", "type": "static"},   # Terms Page
    {"path": "Privacy/", "priority": "0.5", "type": "static"}, # Privacy Page
]

def generate_sitemap():
    # 1. Get Dates
    today = datetime.date.today()
    # Logic: First day of the current month
    first_of_month = today.replace(day=1)

    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    for page in pages:
        # Construct full URL
        url = BASE_URL + page["path"]
        
        # 2. Apply Date Logic based on your requirements
        if page["type"] == "home":
            # Homepage updates everyday
            lastmod = today.isoformat()
            changefreq = "daily"
        else:
            # Static pages update on the 1st of the month
            lastmod = first_of_month.isoformat()
            changefreq = "monthly"

        # 3. Create XML Entry
        xml_content += '  <url>\n'
        xml_content += f'    <loc>{url}</loc>\n'
        xml_content += f'    <lastmod>{lastmod}</lastmod>\n'
        xml_content += f'    <changefreq>{changefreq}</changefreq>\n'
        xml_content += f'    <priority>{page["priority"]}</priority>\n'
        xml_content += '  </url>\n'

    xml_content += '</urlset>'

    # 4. Write to file
    with open("sitemap.xml", "w") as f:
        f.write(xml_content)
    
    print("✅ sitemap.xml generated successfully.")
    print(f"Homepage Date: {today}")
    print(f"Static Pages Date: {first_of_month}")

if __name__ == "__main__":
    generate_sitemap()
