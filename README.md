# 📅 Shift & Attendance Tracker

A beautiful, mobile-first Web App designed to track daily shifts, manage compensations, and generate exportable scorecards for your staff (Maids, Cooks, Cleaners, Nannies, etc). 

It is entirely serverless. It uses your browser's local memory for instant interactions, and backs up data privately to your very own Google Sheet using Google Apps Script. 

Because of this architecture, **you can host this app once and share the link with all your colleagues**. When they open the link, they provide their own Google Sheet webhook, meaning everyone's data remains 100% private to them!

---

## 🚀 Features

- **Dynamic Shifts**: Track anything from "Breakfast & Lunch" to "Dinner Only", or "Cooking & Cleaning". The entire UI adapts dynamically.
- **Sunday Compensation**: Automatically manages penalties and tracks make-up days.
- **Reporting Dashboard**: Generate weekly or monthly scorecards with visual pie charts.
- **WhatsApp Ready**: Export reports as Text Logs or high-quality Images for easy sharing with your staff.
- **100% Private & Serverless**: All data is routed directly to your personal Google Sheet. No shared databases, no backend maintenance.
- **PWA Ready**: Installs to your phone's Home Screen as a native app with a custom icon.

---

## 🛠️ End-to-End Setup Guide

Follow these steps to host your own version of the app and connect it to your private database.

### Step 1: Deploy to Vercel (Hosting)
You need to host the frontend code so you (and your friends) can access it on your phones.
1. Create a free account on [Vercel](https://vercel.com).
2. Connect your GitHub account and import this repository.
3. Vercel will automatically detect it as a **Vite/React** project. Leave all default settings and click **Deploy**.
4. Once deployed, you will get a live URL (e.g., `https://maid-tracker.vercel.app`). Share this URL with anyone!

---

### Step 2: Set up the Database (Google Sheets)
Every person who uses the app needs to do this step to create their own private database.

1. Go to [Google Sheets](https://sheets.new) and create a new spreadsheet.
2. Add the following column headers in Row 1 (exactly as written):
   - `Date` | `Day Name` | `Arrival Time` | `Late` | `Day Status` | `Shift 1` | `Shift 2` | `Shift 3` | `Notes`
3. Click on **Extensions > Apps Script** in the top menu.
4. Delete any code there, and paste the following:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  var row = [
    data.date || '',
    data.day_name || '',
    data.arrival_time || '',
    data.late ? 'Yes' : 'No',
    data.day_status || '',
    data.breakfast_status || '',
    data.lunch_status || '',
    data.dinner_status || '',
    data.notes || ''
  ];
  
  // If row exists for this date, update it. Otherwise, append.
  var dataRange = sheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < dataRange.length; i++) {
    var dateVal = dataRange[i][0];
    var dateStr = "";
    if (typeof dateVal === 'object') {
       var y = dateVal.getFullYear();
       var m = ("0" + (dateVal.getMonth() + 1)).slice(-2);
       var d = ("0" + dateVal.getDate()).slice(-2);
       dateStr = y + "-" + m + "-" + d;
    } else {
       dateStr = String(dateVal);
    }
    
    if (dateStr === data.date) {
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      found = true;
      break;
    }
  }
  
  if (!found) sheet.appendRow(row);
  return ContentService.createTextOutput(JSON.stringify({"status": "success"})).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var records = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    
    var dateVal = row[0];
    var dateStr = typeof dateVal === 'object' 
      ? dateVal.getFullYear() + "-" + ("0" + (dateVal.getMonth() + 1)).slice(-2) + "-" + ("0" + dateVal.getDate()).slice(-2)
      : String(dateVal);
      
    records.push({
      date: dateStr,
      arrival_time: row[2],
      late: row[3] === 'Yes',
      day_status: row[4],
      breakfast_status: row[5],
      lunch_status: row[6],
      dinner_status: row[7],
      notes: row[8]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({ records: records })).setMimeType(ContentService.MimeType.JSON);
}
```
5. Click **Deploy > New Deployment** in the top right.
6. Click the gear icon next to "Select type" and choose **Web app**.
7. Set **Execute as:** `Me` (your email).
8. Set **Who has access:** `Anyone`.
9. Click **Deploy**. *(Note: Google will ask you to authorize permissions. Click Advanced > Go to project).*
10. **Copy the Web App URL** provided at the end.

---

### Step 3: Connect the App
Now, tell the app where to send your data!

1. Open the Vercel URL on your phone's browser (Safari or Chrome).
2. Tap the **Settings** icon at the bottom right.
3. Paste the Google Apps Script URL you just copied into the **"Google Sheets Webhook URL"** box.
4. **Customize your Shifts**: Scroll down to the Shift Configuration section. You can enable, rename, and add custom emojis for the exact shifts you want to track (e.g. 🍳 Breakfast, 🍲 Dinner). 
5. Tap **Save Settings**. 

*(Your app is now fully functional and connected securely to your Google Sheet!)*

---

### Step 4: Install to Home Screen
For the best experience, install it as a native app:
- **iPhone (Safari)**: Tap the Share button at the bottom (box with an arrow pointing up) and select **"Add to Home Screen"**.
- **Android (Chrome)**: Tap the 3 dots in the top right corner and select **"Add to Home Screen"**.

It will now appear as an app on your phone with a beautiful custom icon. Enjoy!
