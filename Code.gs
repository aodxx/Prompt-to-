/**
 * ==========================================================
 *  PROMPT TEMPLATE PWA - Backend (Google Apps Script)
 * ==========================================================
 *  Sheet ID : 1SDJ5q6ELNH3YN1fano2JpDMana8z8d0ZYFn20b3VnpY
 *  Drive ID : 1If5Wnj_78YMyJD8FM4AmmeojLq4hnpcT  (โฟลเดอร์เก็บรูปตัวอย่าง)
 *
 *  วิธี Deploy:
 *  1. เปิด Google Sheet ตาม ID ด้านบน -> ส่วนขยาย (Extensions) -> Apps Script
 *  2. วางไฟล์นี้ทับไฟล์ Code.gs ที่มีอยู่ทั้งหมด
 *  3. กด Deploy > New deployment > เลือกประเภท "Web app"
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  4. คัดลอก Web app URL ไปใส่ในไฟล์ index.html ตรงตัวแปร CONFIG.API_URL
 *  5. ทุกครั้งที่แก้โค้ดนี้ ต้องกด Deploy > Manage deployments > แก้ไข (ไอคอนดินสอ)
 *     -> Version: New version -> Deploy ใหม่ (URL เดิมใช้ได้ต่อ)
 * ==========================================================
 */

var SHEET_ID = '1SDJ5q6ELNH3YN1fano2JpDMana8z8d0ZYFn20b3VnpY';
var DRIVE_FOLDER_ID = '1If5Wnj_78YMyJD8FM4AmmeojLq4hnpcT';
var SHEET_NAME = 'Prompts';

var HEADERS = ['ID', 'Name', 'Category', 'Tags', 'Content', 'Description', 'ImageURL', 'CreatedAt', 'UpdatedAt'];

// ---------- Helpers ----------

function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function rowToObject_(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    obj[headers[i]] = row[i] !== undefined ? row[i] : '';
  }
  return obj;
}

function findRowById_(sheet, id) {
  var data = sheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][0]) === String(id)) {
      return r + 1; // 1-indexed sheet row
    }
  }
  return -1;
}

// ---------- Entry points ----------

function doGet(e) {
  try {
    var action = e.parameter.action || 'list';

    if (action === 'list') return actionList_();
    if (action === 'get') return actionGet_(e.parameter.id);
    if (action === 'create') return actionCreate_(e.parameter.data);
    if (action === 'update') return actionUpdate_(e.parameter.id, e.parameter.data);
    if (action === 'delete') return actionDelete_(e.parameter.id);
    if (action === 'checkUpload') return actionCheckUpload_(e.parameter.id);

    return jsonOut_({ ok: false, error: 'unknown action: ' + action });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var action = e.parameter.action;
    if (action === 'uploadImage') {
      return actionUploadImage_(e.parameter.uploadId, e.parameter.fileName, e.parameter.imageData, e.parameter.mimeType);
    }
    return jsonOut_({ ok: false, error: 'unknown action: ' + action });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

// ---------- Actions ----------

function actionList_() {
  var sheet = getSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var items = [];
  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === '' || data[r][0] === undefined) continue;
    items.push(rowToObject_(headers, data[r]));
  }
  return jsonOut_({ ok: true, items: items });
}

function actionGet_(id) {
  var sheet = getSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rowIndex = findRowById_(sheet, id);
  if (rowIndex === -1) return jsonOut_({ ok: false, error: 'not found' });
  return jsonOut_({ ok: true, item: rowToObject_(headers, data[rowIndex - 1]) });
}

function actionCreate_(dataStr) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var payload = JSON.parse(dataStr || '{}');
    var sheet = getSheet_();
    var now = new Date().toISOString();
    var id = Utilities.getUuid();

    var row = [
      id,
      payload.Name || '',
      payload.Category || '',
      payload.Tags || '',
      payload.Content || '',
      payload.Description || '',
      payload.ImageURL || '',
      now,
      now
    ];
    sheet.appendRow(row);
    return jsonOut_({ ok: true, item: rowToObject_(HEADERS, row) });
  } finally {
    lock.releaseLock();
  }
}

function actionUpdate_(id, dataStr) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var payload = JSON.parse(dataStr || '{}');
    var sheet = getSheet_();
    var rowIndex = findRowById_(sheet, id);
    if (rowIndex === -1) return jsonOut_({ ok: false, error: 'not found' });

    var current = sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
    var currentObj = rowToObject_(HEADERS, current);
    var now = new Date().toISOString();

    var updated = [
      currentObj.ID,
      payload.Name !== undefined ? payload.Name : currentObj.Name,
      payload.Category !== undefined ? payload.Category : currentObj.Category,
      payload.Tags !== undefined ? payload.Tags : currentObj.Tags,
      payload.Content !== undefined ? payload.Content : currentObj.Content,
      payload.Description !== undefined ? payload.Description : currentObj.Description,
      payload.ImageURL !== undefined ? payload.ImageURL : currentObj.ImageURL,
      currentObj.CreatedAt,
      now
    ];
    sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([updated]);
    return jsonOut_({ ok: true, item: rowToObject_(HEADERS, updated) });
  } finally {
    lock.releaseLock();
  }
}

function actionDelete_(id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var rowIndex = findRowById_(sheet, id);
    if (rowIndex === -1) return jsonOut_({ ok: false, error: 'not found' });
    sheet.deleteRow(rowIndex);
    return jsonOut_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// ---------- Image upload (hidden-iframe POST + cache polling, CORS workaround) ----------

function actionUploadImage_(uploadId, fileName, base64Data, mimeType) {
  try {
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, mimeType || 'image/png', fileName || (Utilities.getUuid() + '.png'));
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var url = 'https://lh3.googleusercontent.com/d/' + file.getId();

    CacheService.getScriptCache().put(
      'upload_' + uploadId,
      JSON.stringify({ status: 'done', url: url }),
      600 // 10 minutes
    );
  } catch (err) {
    CacheService.getScriptCache().put(
      'upload_' + uploadId,
      JSON.stringify({ status: 'error', error: String(err) }),
      600
    );
  }
  // The response body is not readable by the parent page (hidden iframe target),
  // the client polls action=checkUpload instead.
  return HtmlService.createHtmlOutput('uploaded');
}

function actionCheckUpload_(uploadId) {
  var cached = CacheService.getScriptCache().get('upload_' + uploadId);
  if (!cached) return jsonOut_({ ok: true, status: 'pending' });
  var result = JSON.parse(cached);
  return jsonOut_({ ok: true, status: result.status, url: result.url, error: result.error });
}
