# 📅 Maid Tracker - User Guide

Welcome to Maid Tracker! This is a completely private, mobile-first app designed to track daily shifts, manage compensations, and generate scorecards for your staff (Maids, Cooks, Cleaners, Nannies, etc). 

Even though you access this app via a web link, **your data is 100% private and never stored on our servers.** Instead, the app acts as a remote control that saves and syncs data directly to your very own, personal Google Sheet!

Follow the 3 quick steps below to set up your private database and connect it to your app.

---

## 🚀 Features

- **Dynamic Shifts**: Track anything from "Breakfast & Lunch" to "Dinner Only", or "Cooking & Cleaning". The entire app adapts dynamically to your needs.
- **Sunday Compensation**: Automatically manages penalties and tracks make-up days.
- **Reporting Dashboard**: Generates monthly scorecards with visual pie charts.
- **100% Private & Serverless**: All data is routed directly to your personal Google Sheet. No one else has access to it.
- **App Experience**: Installs directly to your phone's Home Screen so it feels like a native iOS/Android app.

---

## 🛠️ Setup Guide

### Step 1: Create your Private Database (Google Sheets)
First, we need to create a spreadsheet that only you have access to, where all your data will be stored securely.

1. Go to [Google Sheets](https://sheets.new) and create a brand new spreadsheet.
2. Add the following column headers in Row 1 (type them exactly as written):
   - **Column A:** `Date` 
   - **Column B:** `Day Name` 
   - **Column C:** `Arrival Time` 
   - **Column D:** `Late` 
   - **Column E:** `Day Status` 
   - **Column F:** `Breakfast` 
   - **Column G:** `Lunch` 
   - **Column H:** `Dinner` 
   - **Column I:** `Notes`
3. Click on **Extensions > Apps Script** in the top menu of your Google Sheet.
4. Delete any code that is already there, and paste the following code block exactly as is:

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
  
  // If a record already exists for this date, update it. Otherwise, add a new row.
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
6. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
7. Under **Execute as:** select `Me` (your email).
8. Under **Who has access:** select `Anyone`.
9. Click **Deploy**. *(Note: Google will ask you to authorize permissions. Click "Review Permissions" > choose your account > click "Advanced" at the bottom > click "Go to project" > Allow).*
10. **Copy the Web App URL** provided to you at the very end.

---

### Step 2: Connect the App
Now that your database is ready, let's link it to the app!

1. Open the App link that was shared with you on your phone's browser (Safari or Chrome).
2. Tap the **Settings** icon at the bottom right.
3. Paste the Google Apps Script Web App URL you just copied into the **"Google Sheets Webhook URL"** box.
4. **Customize your Shifts**: Scroll down to the Shift Configuration section. You can enable, rename, and add custom emojis for the exact shifts you want to track (e.g. 🍳 Breakfast, 🍲 Dinner). 
5. Tap **Save Settings**. 

*(Your app is now fully functional and connected securely to your Google Sheet! When you make an entry in the app, it will instantly appear in your Sheet.)*

---

### Step 3: Install to Home Screen
For the best experience, you should install it to your phone so it opens in full-screen like a real app:

- **iPhone (Safari)**: Tap the Share button at the bottom (the square with an arrow pointing up) and select **"Add to Home Screen"**.
- **Android (Chrome)**: Tap the 3 dots in the top right corner and select **"Add to Home Screen"**.

It will now appear as an app on your phone with a beautiful custom icon. Enjoy!
