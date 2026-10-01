/*******************************************************
 * CAREER APPLICATION BACKEND — Google Apps Script
 * Secure-by-default recruitment form backend.
 *
 * Spreadsheet ID:
 * 1kQGy40kI02EX1XINjAVyNToP5CMAt_AufjAdgdfZqfg
 *
 * Deploy as Web App:
 * Execute as: Me
 * Who has access: Anyone
 *******************************************************/

const CONFIG = {
  SPREADSHEET_ID: "1kQGy40kI02EX1XINjAVyNToP5CMAt_AufjAdgdfZqfg",
  SHEET_NAME: "Applications",
  EMAIL_TO: "jainal.dcitbd@gmail.com",
  UPLOAD_FOLDER_NAME: "Career Applications - Techno World BD & Green City Developments BD",
  MAX_FILE_BYTES: 5 * 1024 * 1024,
  MIN_SUBMIT_INTERVAL_MS: 15000
};

const HEADERS = [
  "Application ID","Submitted At","Position","Full Name","NID","Father Name","Mother Name",
  "DOB","Gender","Marital Status","Nationality","Phone","WhatsApp","Email","Social Profile",
  "Current Address","Permanent Address","Education","Institution","Experience Years",
  "Last Company","Skills","Expected Salary","Joining Availability","Responsibility Answers",
  "Photo URL","NID File URL","CV URL","Experience Certificate URL","Source Page","User Agent"
];

function doGet() {
  return json_({ok:true,service:"Career Application API",status:"online"});
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("Empty request.");
    const data = JSON.parse(e.postData.contents);
    if (String(data.website || "").trim()) throw new Error("Automated submission rejected.");
    rateLimit_();
    validate_(data);

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sh = getOrCreateSheet_(ss);
    const folder = getOrCreateFolder_();
    const uploaded = uploadFiles_(data.files || {}, folder);
    const responsibilityAnswers = collectResponsibilities_(data);

    sh.appendRow([
      safe_(data.applicationId), new Date(), safe_(data.position), safe_(data.fullName), safe_(data.nid),
      safe_(data.fatherName), safe_(data.motherName), safe_(data.dob), safe_(data.gender), safe_(data.maritalStatus),
      safe_(data.nationality), safe_(data.phone), safe_(data.whatsapp), safe_(data.email), safe_(data.socialProfile),
      safe_(data.currentAddress), safe_(data.permanentAddress), safe_(data.education), safe_(data.institution),
      safe_(data.experienceYears), safe_(data.lastCompany), safe_(data.skills), safe_(data.expectedSalary),
      safe_(data.joiningAvailability), responsibilityAnswers, uploaded.photo || "", uploaded.nidFile || "",
      uploaded.cv || "", uploaded.experienceCertificate || "", safe_(data.sourcePage), safe_(data.userAgent)
    ]);

    sendPremiumEmail_(data, uploaded, responsibilityAnswers);
    return json_({ok:true, applicationId:data.applicationId});
  } catch (err) {
    console.error(err);
    return json_({ok:false,error:String(err && err.message || err)});
  } finally {
    lock.releaseLock();
  }
}

function rateLimit_() {
  const cache = CacheService.getScriptCache();
  const key = "lastSubmitGlobal";
  const last = Number(cache.get(key) || 0);
  const now = Date.now();
  if (last && now - last < CONFIG.MIN_SUBMIT_INTERVAL_MS) throw new Error("Please wait a few seconds and try again.");
  cache.put(key, String(now), Math.ceil(CONFIG.MIN_SUBMIT_INTERVAL_MS / 1000));
}

function validate_(d) {
  const required = ["applicationId","position","fullName","nid","fatherName","motherName","dob",
    "gender","phone","email","currentAddress","permanentAddress","education","skills"];
  required.forEach(k => { if (!String(d[k] || "").trim()) throw new Error("Missing required field: " + k); });

  const allowedPositions = [
    "Social Media & Content Executive — Techno World BD",
    "Land Sales & Customer Relationship Executive — Green City Developments BD"
  ];
  if (!allowedPositions.includes(String(d.position))) throw new Error("Invalid position.");

  if (!d.files || !d.files.photo || !d.files.nidFile || !d.files.cv) throw new Error("Required files are missing.");

  ["photo","nidFile","cv","experienceCertificate"].forEach(k => {
    if (d.files[k] && d.files[k].data) {
      const bytes = Utilities.base64Decode(d.files[k].data).length;
      if (bytes > CONFIG.MAX_FILE_BYTES) throw new Error(k + " is larger than 5MB.");
    }
  });
}

function getOrCreateSheet_(ss) {
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) sh = ss.insertSheet(CONFIG.SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,HEADERS.length).setFontWeight("bold").setBackground("#102238").setFontColor("#ffffff");
    sh.autoResizeColumns(1, HEADERS.length);
  }
  return sh;
}

function getOrCreateFolder_() {
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty("UPLOAD_FOLDER_ID");
  if (saved) { try { return DriveApp.getFolderById(saved); } catch (_) {} }
  const it = DriveApp.getFoldersByName(CONFIG.UPLOAD_FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(CONFIG.UPLOAD_FOLDER_NAME);
  props.setProperty("UPLOAD_FOLDER_ID", folder.getId());
  return folder;
}

function uploadFiles_(files, folder) {
  const out = {};
  Object.keys(files).forEach(key => {
    const f = files[key];
    if (!f || !f.data) return;
    const blob = Utilities.newBlob(Utilities.base64Decode(f.data), f.mimeType || "application/octet-stream", sanitizeFilename_(f.name || key));
    const file = folder.createFile(blob);
    out[key] = file.getUrl();
  });
  return out;
}

function collectResponsibilities_(d) {
  const out = [];
  Object.keys(d).filter(k => k.indexOf("resp_") === 0).forEach(k => out.push(k.replace("resp_","") + ": " + safe_(d[k])));
  return out.join(" | ");
}

function sendPremiumEmail_(d, uploaded, responsibilityAnswers) {
  const name = safe_(d.fullName);
  const position = safe_(d.position);
  const company = position.indexOf("Social Media") === 0 ? "Techno World BD" : "Green City Developments BD";
  const maskedNid = maskNid_(d.nid);

  const rows = [
    ["Application ID",d.applicationId],["Position",position],["Full Name",d.fullName],["NID",maskedNid],
    ["Father Name",d.fatherName],["Mother Name",d.motherName],["DOB",d.dob],["Gender",d.gender],
    ["Marital Status",d.maritalStatus],["Phone",d.phone],["WhatsApp",d.whatsapp],["Email",d.email],
    ["Current Address",d.currentAddress],["Permanent Address",d.permanentAddress],["Education",d.education],
    ["Institution",d.institution],["Experience",d.experienceYears + " years"],["Last Company",d.lastCompany],
    ["Skills",d.skills],["Expected Salary",d.expectedSalary],["Joining Availability",d.joiningAvailability],
    ["Responsibility Confirmation",responsibilityAnswers]
  ];
  const tr = rows.map(r => `<tr><td style="padding:9px 12px;border-bottom:1px solid #e9eef5;color:#64748b;font-weight:600;width:180px">${esc_(r[0])}</td><td style="padding:9px 12px;border-bottom:1px solid #e9eef5;color:#0f172a">${esc_(r[1])}</td></tr>`).join("");

  const html = `<div style="margin:0;background:#f4f7fb;padding:28px;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:760px;margin:auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e5eaf1"><div style="padding:26px 28px;background:linear-gradient(135deg,#07111f,#12345b);color:#fff"><div style="font-size:12px;letter-spacing:2px;color:#9fc8ff;font-weight:700">NEW CAREER APPLICATION</div><h1 style="margin:8px 0 4px;font-size:27px">${esc_(name)}</h1><div style="color:#c7d7ea">${esc_(position)}</div></div><div style="padding:24px 28px"><div style="padding:14px 16px;border-radius:12px;background:#f0f7ff;border:1px solid #d9eaff;margin-bottom:18px"><b>Company:</b> ${esc_(company)} &nbsp; • &nbsp; <b>Application ID:</b> ${esc_(d.applicationId)}</div><table style="border-collapse:collapse;width:100%;font-size:13px">${tr}</table><h3 style="margin:24px 0 10px">Documents in restricted application folder</h3><ul style="line-height:1.9"><li>Photo: ${link_(uploaded.photo)}</li><li>NID: ${link_(uploaded.nidFile)}</li><li>CV: ${link_(uploaded.cv)}</li><li>Experience Certificate: ${link_(uploaded.experienceCertificate)}</li></ul><p style="font-size:12px;color:#64748b">For privacy, the full NID number and uploaded files are not attached directly to this email. Use the secured company Drive/Sheet access to review them.</p></div><div style="padding:18px 28px;background:#07111f;color:#9fb0c5;font-size:12px">Automatically generated by the official recruitment application system.</div></div></div>`;
  const plain = rows.map(r => r[0] + ": " + r[1]).join("\n") + "\n\nDocuments:\nPhoto: " + (uploaded.photo||"") + "\nNID: " + (uploaded.nidFile||"") + "\nCV: " + (uploaded.cv||"") + "\nExperience Certificate: " + (uploaded.experienceCertificate||"");

  GmailApp.sendEmail(CONFIG.EMAIL_TO, "New Job Application — " + d.position + " — " + d.fullName, plain, {htmlBody:html, name:"Career Application System"});
}

function maskNid_(v) {
  const s = String(v || "").trim();
  if (s.length <= 4) return "••••";
  return "••••••••" + s.slice(-4);
}
function link_(url) { return url ? `<a href="${escAttr_(url)}" target="_blank">Open file</a>` : "Not uploaded"; }
function esc_(v) { return String(v == null ? "" : v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
function escAttr_(v){ return esc_(v); }
function safe_(v){ return String(v == null ? "" : v).slice(0,5000); }
function sanitizeFilename_(n){ return String(n).replace(/[^\w.\-()\u0980-\u09FF ]/g,"_").slice(0,120); }
function json_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
