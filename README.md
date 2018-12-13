# COLA scraper
cola-scraper is a command-line application written in Node.js (puppeteer library) that scrapes and downloads an colas data.
https://www.ttbonline.gov/colasonline/publicSearchColasBasicProcess.do?action=search
This scraper scrape each TTB ID and export all data to csv, store on AWS MongoDB (3.4).

# Requirement
- Scrape all COLA details in the last 15 years, store to aws mongodb.
- Deploy to aws ec2 (deploy to multitple instances to speed up)
- Update incomming cola data.

# Technique
- Node.js Puppeteer library to scrape data
- AWS MongoDB

# Question
- Do you need an admin panel to show extracted data? If then, it must has search functionalities based on date, title or others
- After all the past cola details are kept, I can use cronjob to get latest data uploaded by cola team. Do you want it? Or admin can click button to scrape new data. What is your option.
