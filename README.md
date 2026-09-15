# 📱 TaskXP — แอปจัดการภารกิจในรูปแบบ RPG

TaskXP คือ Mobile Application สำหรับจัดการภารกิจและพัฒนาตัวเอง โดยเปลี่ยนงานประจำวันให้เป็น Quest ผู้ใช้สามารถสะสม XP, Level, Streak และ Achievement เพื่อมองเห็นความก้าวหน้าของตัวเองอย่างเป็นระบบ

## 🚀 Project Overview

โปรเจกต์นี้พัฒนาด้วย React Native และ Expo มีระบบจัดการภารกิจ ปฏิทิน ประวัติการทำงาน รางวัล สถิติ และการแจ้งเตือนภายในแอป เหมาะสำหรับการฝึกทำ Mobile Application ที่มีหลายหน้าจอและมีการจัดการสถานะร่วมกัน

> โปรเจกต์นี้เผยแพร่ซอร์สโค้ดเพื่อแสดงทักษะการพัฒนาแอปพลิเคชันและโครงสร้างระบบ

## ✨ ระบบหลัก

- หน้า Home และรายการ Quest
- เพิ่ม แก้ไข ลบ และทำ Quest สำเร็จ
- XP, Level, Streak และ Achievement
- Quest History และ Quest Detail
- Quest Completion พร้อมหน้าสรุปรางวัล
- Calendar และ Daily Goal
- Progress และ Character Stats
- Reward Shop และระบบไอเท็ม
- Notifications ภายในแอป
- Friends และการค้นหาเพื่อน
- Profile และการตั้งค่า
- Login และ Onboarding
- Trash สำหรับกู้คืน Quest
- Help และหน้าคำแนะนำการใช้งาน

## 🧠 หลักการทำงานของระบบ

1. ผู้ใช้เริ่มต้นผ่าน Login หรือ Onboarding
2. ระบบโหลดข้อมูลโปรไฟล์ ภารกิจ และความก้าวหน้า
3. ผู้ใช้สร้างหรือเลือก Quest ที่ต้องการทำ
4. เมื่อทำ Quest สำเร็จ ระบบคำนวณ XP, Gold, Streak และ Achievement
5. Progress จะถูกบันทึกไว้ในอุปกรณ์ด้วย AsyncStorage
6. หน้าสถิติ ปฏิทิน และประวัติจะคำนวณจากข้อมูลที่บันทึกไว้
7. ระบบแจ้งเตือนจะแสดงสถานะ Quest, Achievement และงานที่เกินกำหนด

## 🛠️ เทคโนโลยี

| ด้าน | เทคโนโลยี |
| --- | --- |
| Framework | React Native |
| Platform | Expo |
| Language | JavaScript |
| Navigation | React Navigation |
| Storage | AsyncStorage |
| UI | React Native Components, Linear Gradient, Vector Icons |
| Date & Calendar | DateTimePicker, React Native Calendars |
| Notifications | Expo Notifications |
| Development | Visual Studio Code |

## 📂 โครงสร้างโปรเจกต์

```text
TaskXP/
├── App.js
├── app.json
├── package.json
├── assets/
├── src/
│   ├── components/     คอมโพเนนต์ UI ที่ใช้ร่วมกัน
│   ├── constants/       ภาษาและธีมของแอป
│   ├── context/         สถานะหลักและการบันทึกข้อมูล
│   ├── data/             ข้อมูลเริ่มต้นและข้อมูลตัวอย่าง
│   ├── screens/          หน้าจอทั้งหมดของแอป
│   └── utils/            ฟังก์ชันช่วยจัดการข้อมูลและวันที่
└── REPORT.md             รายงานการปรับปรุงและข้อจำกัด
```

## ▶️ วิธีเปิดโปรเจกต์

```bash
npm install
npx expo start
```

จากนั้นสามารถเปิดด้วย Expo Go บนมือถือ หรือเปิด Web Preview ด้วยคำสั่ง:

```bash
npx expo start --web
```

## 🌐 Web Preview

TaskXP สามารถนำไปทำเป็น Web Preview ได้ผ่าน Expo Web โดยอาจต้องปรับส่วนที่พึ่งพาความสามารถเฉพาะมือถือ เช่น Date Picker และ Push Notifications ให้เหมาะกับเบราว์เซอร์

## ✅ การตรวจสอบและการปรับปรุง

โปรเจกต์ผ่านการตรวจ Syntax ของไฟล์ JavaScript ทั้งหมด 35 ไฟล์แล้ว รายละเอียดการแก้ไขเชิงระบบอยู่ใน [REPORT.md](REPORT.md)

การปรับปรุงสำคัญประกอบด้วย:

- แก้ปัญหาวันที่และ Timezone ใน Calendar
- ปรับการแจก XP ของ Achievement ให้อยู่ใน Domain Logic
- เพิ่ม Slice-based Persistence และ Migration จากระบบเดิม
- ลดการเขียนข้อมูลซ้ำด้วย Debounced Storage
- ปรับการจัดการ Overdue Notifications
- ป้องกันการกดบันทึก Quest ซ้ำ
- ปรับ Empty State และ Friend Flow
- เพิ่ม Accessibility ให้ปุ่มสำคัญ

## ⚠️ ข้อจำกัดปัจจุบัน

- Login และ Onboarding ยังเป็น Demo Flow
- Feedback และ Bug Report ยังเป็น Demo Alert
- Notifications เป็นระบบภายในแอป ยังไม่ใช่ Push Notification ที่เชื่อม Backend
- ยังไม่ได้ทดสอบเต็มรูปแบบบนอุปกรณ์ Android และ iOS จริง
- ข้อมูลใช้ Local Storage ยังไม่มีระบบบัญชีหรือซิงก์ข้ามอุปกรณ์

## 👤 Developer

**Jiraphat Srajan (จิรภัทร สระจันทร์)**

นักศึกษาชั้นปีที่ 4 สาขา Information and Communication Technology (ICT) มหาวิทยาลัยศรีปทุม สนใจด้าน Web Development, Application Development และ UX/UI Design
