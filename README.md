# 🏥 MediLink - Advanced Medicine Donation & Healthcare Logistics Platform

**MediLink** is a trust-first, AI-enabled healthcare logistics platform designed to reduce medical waste and improve pharmaceutical accessibility. It creates a secure, verified circular economy connecting **Donors**, **NGOs**, **Delivery Agents**, and **System Admins**.

---

## 🚀 System Architecture & Data Flow

MediLink is built as a highly responsive, serverless SPA (Single Page Application) with real-time data synchronization.

-   **Frontend:** React (Vite) + TypeScript for type-safe, performant UI.
-   **Backend:** Firebase (Authentication & Firestore NoSQL) for real-time logistics and user management.
-   **Intelligence:** Google Gemini API for OCR label extraction and domain-restricted voice assistance.
-   **Logistics:** Leaflet.js for interactive tracking with simulated movement logic.

---

## ✨ Core Modules & Features

### 1. 🔐 Role-Based Access Control (RBAC) & Identity
-   **Manual Verification:** All non-donor accounts (NGO/Delivery) require manual Admin approval of Government ID credentials.
-   **Secure Handshakes:** 4-digit pickup codes ensure a secure "Chain of Custody" during medicine handover.
-   **Reputation System:** Users earn reputation scores (0-100) based on successful donations, unlocking "Fast-Track" status.

### 2. 💊 Donor Module: Smart Cabinet & Gamification
-   **Smart Cabinet:** Tracks personal inventory with automatic expiry classification (Safe, Expiring Soon, Expired).
-   **AI Scanning:** Uses Gemini Vision to extract medicine names and dates from photos, reducing manual entry errors.
-   **MediCoins:** Earn coins for verified donations.
-   **Impact Stats:** Tracks "Lives Impacted," "Waste Prevented (kg)," and community ranking.

### 3. 🛡️ NGO Operations Center
-   **Quality Control:** Physical verification queue for incoming shipments.
-   **Need Index:** Fulfill medicine requests from the community using verified stock.
-   **Supply Requests:** Request bulk supplies directly from the Admin warehouse.

### 4. 🚚 Logistics & 2-Phase Tracking
-   **Phase 1:** Agent Hub ➡️ Donor Location.
-   **Phase 2:** Donor Location ➡️ NGO Destination.
-   **GPS Simulation:** Real-time movement logic with Linear Interpolation (LERP) for smooth map visualization.

### 5. 🤖 MediBot - AI Voice Assistant
-   **Domain-Restricted:** Strictly refuses non-healthcare/non-platform queries (e.g., sports, coding, movies).
-   **Language Mirroring:** Native support for English, Telugu Script, and **Tenglish** (Romanized Telugu).
-   **Voice Interface:** Integrated Browser Speech API for pulsing voice input and on-demand text-to-speech.

### 6. 🚨 Admin Command Center
-   **Intelligent Routing:** Gemini-powered suggestions for routing donations based on NGO needs and proximity.
-   **Emergency Protocols:** Global "Disaster Alert" toggle that doubles impact rewards and prioritizes life-saving meds.
-   **Verification Desk:** Full interface for reviewing user credentials and identity proofs.

---

## 🛠️ Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | React 19 (Vite) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS (Medical-Grade Teal Theme) |
| **Database** | Firebase Firestore (Real-time NoSQL) |
| **Auth** | Firebase Authentication |
| **AI** | Google Gemini API (Flash & Pro Models) |
| **Maps** | Leaflet.js |
| **Icons** | Lucide-React |

---

## 🛡️ Security & Ethics
-   **Privacy First:** No personal medical history is stored; only pharmaceutical asset data.
-   **Human-in-the-Loop:** AI only suggests; humans (Admins/NGOs) make all final medical and logistics decisions.
-   **Abuse Prevention:** Soft-rule flags for "Opened" medicine claims and reputation penalties for rejected items.

---

## 🔮 Roadmap
-   **Blockchain Ledger:** Immutable audit trails for specialized/high-value narcotics.
-   **IoT Integration:** Weight-sensing "Smart Bins" for automatic inventory updates.
-   **Offline Sync:** Local-first storage for areas with low connectivity.

---

*Developed with passion for sustainable healthcare and medical waste reduction.*
© 2026 MediLink Platform. Built for the future of pharmaceutical circularity.
