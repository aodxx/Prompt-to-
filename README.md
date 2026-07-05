# คลัง Prompt Template — คู่มือติดตั้ง

แอปนี้มี 3 ส่วน: **Google Sheet** (ฐานข้อมูล) + **Google Apps Script** (Web API หลังบ้าน) + **GitHub Pages** (หน้าบ้าน PWA)

- Sheet ID: `1SDJ5q6ELNH3YN1fano2JpDMana8z8d0ZYFn20b3VnpY`
- Drive Folder ID (เก็บรูปตัวอย่าง): `1If5Wnj_78YMyJD8FM4AmmeojLq4hnpcT`
- Repo: `https://github.com/aodxx/Prompt-to-`

---

## ขั้นตอนที่ 1 — ตั้งค่า Google Apps Script (หลังบ้าน)

1. เปิด Google Sheet ตาม ID ด้านบน
2. เมนู **ส่วนขยาย (Extensions) → Apps Script**
3. ลบโค้ดเดิมทั้งหมด แล้ววางไฟล์ `Code.gs` ที่แนบมาแทน
4. กด **Deploy → New deployment**
   - ไอคอนเฟือง → เลือกประเภท **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด **Deploy** แล้วอนุญาตสิทธิ์ (Authorize access) ตามที่ระบบขอ (สิทธิ์เข้าถึง Sheet และ Drive)
5. คัดลอก **Web app URL** ที่ได้ (รูปแบบ `https://script.google.com/macros/s/xxxxx/exec`)

> ทุกครั้งที่แก้ไขโค้ด `Code.gs` ต้องกด **Deploy → Manage deployments → แก้ไข (ดินสอ) → Version: New version → Deploy** ใหม่ URL เดิมจะใช้งานต่อได้

Sheet จะถูกสร้างชีตชื่อ `Prompts` อัตโนมัติพร้อมหัวตารางในการเรียกใช้ครั้งแรก ไม่ต้องสร้างเองล่วงหน้า

---

## ขั้นตอนที่ 2 — ใส่ Web App URL ในหน้าบ้าน

เปิดไฟล์ `index.html` หาบรรทัดนี้ (อยู่ในส่วน `<script>` ท้ายไฟล์):

```js
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/PUT_YOUR_DEPLOYMENT_ID_HERE/exec'
};
```

แทนที่ด้วย Web App URL ที่คัดลอกมาจากขั้นตอนที่ 1

---

## ขั้นตอนที่ 3 — Deploy ขึ้น GitHub Pages

repo ที่ใช้คือ **`Prompt-to-`** (ชื่อมีขีดกลางต่อท้าย ตามที่ตั้งไว้) ไฟล์ทุกไฟล์ในโปรเจ็กต์นี้อ้างอิง path แบบ absolute เป็น `/Prompt-to-/...` ไว้แล้ว (ตรงกับพฤติกรรมของ GitHub Pages ที่ไม่ได้อยู่ root domain)

1. Push ไฟล์ทั้งหมดนี้ขึ้น repo `aodxx/Prompt-to-` (ที่ branch `main` หรือ `master`)
   ```
   index.html
   manifest.json
   sw.js
   icons/icon-192.png
   icons/icon-512.png
   ```
2. เข้า repo → **Settings → Pages**
3. Source: **Deploy from a branch** → เลือก branch ที่ push ไว้ → โฟลเดอร์ `/ (root)`
4. กด Save รอ 1-2 นาที จะได้ลิงก์ `https://aodxx.github.io/Prompt-to-/`

---

## ขั้นตอนที่ 4 — ติดตั้งเป็นแอป (PWA)

- **มือถือ (Android/Chrome):** เปิดลิงก์ → เมนู ⋮ → "เพิ่มลงในหน้าจอหลัก"
- **iPhone (Safari):** เปิดลิงก์ → ปุ่มแชร์ → "เพิ่มไปยังหน้าจอโฮม"
- **เดสก์ท็อป (Chrome/Edge):** เปิดลิงก์ → ไอคอนติดตั้งที่แถบ URL

---

## โครงสร้างข้อมูลใน Sheet (`Prompts`)

| คอลัมน์ | ความหมาย |
|---|---|
| ID | รหัสอ้างอิง (สร้างอัตโนมัติ) |
| Name | ชื่อ Template |
| Category | หมวดหมู่ |
| Tags | แท็ก คั่นด้วยจุลภาค |
| Content | เนื้อหา Prompt ใช้ `{{ชื่อตัวแปร}}` สำหรับส่วนที่ต้องการให้กรอกทีหลัง |
| Description | คำอธิบายเพิ่มเติม (ยังไม่แสดงผลใน UI เวอร์ชันนี้ เผื่อขยายภายหลัง) |
| ImageURL | ลิงก์รูปตัวอย่าง (สำหรับ Prompt ประเภทสร้างภาพ) |
| CreatedAt / UpdatedAt | เวลาสร้าง/แก้ไขล่าสุด |

**ตัวอย่างการเขียน Content:**
```
ช่วยเขียนบทความเรื่อง {{หัวข้อ}} ความยาว {{จำนวนคำ}} คำ โทนเสียงแบบ {{โทนเสียง}}
```
แอปจะสร้างช่องกรอก 3 ช่องให้อัตโนมัติในโหมดฟอร์ม

---

## ฟีเจอร์ที่มีอยู่แล้วในเวอร์ชันนี้

- ค้นหาแบบ Real-time + กรองตามหมวดหมู่
- ตัวแปรอัตโนมัติจาก `{{...}}` พร้อมโหมดฟอร์ม/โหมดข้อความอิสระ
- ปุ่ม Copy to Clipboard พร้อม Toast แจ้งเตือน
- แนบรูปตัวอย่างสำหรับ Prompt สร้างภาพ (อัปโหลดขึ้น Google Drive ผ่าน hidden-iframe POST เพื่อเลี่ยงปัญหา CORS ของ Apps Script)
- ติดตั้งเป็นแอป (PWA) ได้ทั้งมือถือและเดสก์ท็อป

## จุดที่ยังออกแบบไว้แบบพื้นฐาน รอส่วนขยายภายหลัง

- ระบบ Favorite / จำนวนการใช้งาน (Usage Count) — ยังไม่ได้ทำ เพราะรอบแรกเลือกโครงสร้างฟิลด์แบบพื้นฐาน (ชื่อ/หมวดหมู่/เนื้อหา) แต่เผื่อคอลัมน์ `Description` และ `ImageURL` ไว้ให้แล้วจากสเปกที่ส่งมาเพิ่ม
- การทำงานแบบออฟไลน์ตอนนี้แคชได้เฉพาะหน้าเปล่า (App Shell) ข้อมูล Prompt ยังต้องใช้อินเทอร์เน็ตดึงจาก Sheet ทุกครั้ง
# Prompt-to-
