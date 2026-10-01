CAREER APPLICATION SYSTEM — CLEAN / SAFER VERSION

Files:
- index.html — single-file frontend; logos are embedded, no CDN/external JS/CSS.
- Code.gs — Google Apps Script backend.

IMPORTANT ABOUT THE CHROME “DANGEROUS SITE” WARNING
This code cannot directly remove a Google Safe Browsing warning. If Chrome blocks the GitHub Pages domain, fix the hosting/reputation/security issue and request a Google security review. Do not instruct applicants to bypass the warning.

DEPLOY BACKEND
1. Open script.google.com and create a project.
2. Replace Code.gs with the supplied Code.gs.
3. Deploy > New deployment > Web app.
4. Execute as: Me.
5. Who has access: Anyone.
6. Copy the /exec URL.
7. In index.html replace:
   PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE
   with the real /exec URL.
8. Upload index.html to your GitHub Pages site.

GITHUB PAGES
- Repository Settings > Pages.
- Use HTTPS.
- If you use a custom domain such as dcitbd.online, enable HTTPS after DNS is correctly configured.

GOOGLE SAFE BROWSING CHECK / REVIEW
1. Verify the site in Google Search Console.
2. Open Security & Manual Actions > Security Issues.
3. Check the exact flagged issue and remove any suspicious files, redirects, scripts, or injected content.
4. Make sure the recruitment page clearly identifies the companies and explains why NID/CV/photo are collected.
5. After fixing the issue, request a security review in Search Console.

PRIVACY CHANGES IN THIS VERSION
- No external CDN, analytics, fonts, or third-party JavaScript.
- Visible privacy/data-use notice.
- Honeypot field to reduce bot submissions.
- Server validates the selected position and required files.
- Server rate-limits submissions.
- Full NID is stored in the Sheet as requested, but the email notification masks the NID and does not attach raw applicant documents.
- Uploaded documents are stored in the configured Google Drive folder. Review the Drive folder sharing permissions and keep them restricted to authorized staff.

NOTE
Because the public frontend sends application data to an Apps Script web app, the endpoint itself is public. The backend therefore validates inputs, limits file sizes, rate-limits submissions, and rejects the honeypot. Do not put passwords, API keys, or private secrets in index.html.
