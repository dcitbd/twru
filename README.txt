CAREER APPLICATION SYSTEM

Files:
- index.html: complete GitHub Pages frontend; CSS + JS are embedded. Logos are embedded as base64, so no extra frontend image files are required.
- Code.gs: Google Apps Script backend.

SETUP:
1. Open the Google Sheet:
   https://docs.google.com/spreadsheets/d/1kQGy40kI02EX1XINjAVyNToP5CMAt_AufjAdgdfZqfg/edit
2. Extensions -> Apps Script.
3. Paste Code.gs and save.
4. Deploy -> New deployment -> Web app.
   Execute as: Me
   Who has access: Anyone
5. Copy the Web App /exec URL.
6. In index.html replace:
   PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE
   with that /exec URL.
7. Upload index.html to GitHub Pages (repository root is fine).
8. The Apps Script will create/use an "Applications" sheet tab and a Drive folder for uploaded documents.

IMPORTANT:
- Keep the application spreadsheet private. It contains NID and other personal information.
- The backend stores uploaded files in the Google account's Drive and emails them to jainal.dcitbd@gmail.com.
- The experience certificate becomes required when the applicant enters more than 0 years of experience.
- The frontend sends files as base64 JSON. The included 5MB-per-file limit is intended to stay within Apps Script/Gmail limits.
