# Brainbrio Task Reminder 🧠

**Brainbrio Task Reminder** is a feature-rich browser extension designed to help you organize tasks, manage deadlines, and stay focused. Built with **Manifest V3**, it utilizes modern web technologies to provide reliable notifications and custom audio alerts.

![Version](https://img.shields.io/badge/version-2.0-blue) ![Manifest](https://img.shields.io/badge/manifest-v3-green)

## ✨ Key Features

### 📝 Smart Task Management
* **Quick Add:** Easily add tasks with a title, due date, and category.
* **Edit & Reschedule:** Modify task details, change groups, or update deadlines instantly.
* **Tabbed Views:** Filter your dashboard by **All**, **Today**, **Upcoming**, or view by **Groups**.

### 🗂️ Advanced Grouping
* **Built-in Categories:** Comes with Inbox, Work, Personal, and Shopping groups.
* **Custom Groups:** Create your own color-coded groups dynamically to fit your specific workflow.
* **Group Management:** Delete entire groups and automatically move their tasks to the Inbox.

### 🔔 Robust Notifications & Audio
* **Custom Alarms:** Set reminders to trigger at the exact time of the event, or **5, 10, 15, 30, or 60 minutes before**.
* **Custom Sound Support:** Upload your own **MP3 or WAV** files (max 2MB) to personalize your alarm sound.
* **Offscreen Audio:** Uses Chrome's `offscreen` API to ensure audio plays reliably from the background service worker.

### 🎨 User Experience
* **Dark/Light Mode:** Built-in theme toggle that saves your preference.
* **Visual Cues:** Badges for overdue tasks, group counts, and completion status.

## 🛠️ Installation (Developer Mode)

Since this extension is not yet in the Chrome Web Store, you can install it manually:

1.  Clone or download this repository.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Toggle **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the folder containing the extension files (`manifest.json`, `popup.html`, etc.).

## 🚀 Usage Guide

### Adding a Task
1.  Open the extension popup.
2.  Type your task in the input field.
3.  (Optional) Click the **Calendar Icon** to set a due date.
4.  (Optional) Select a **Group** (or create a new one).
5.  Click the **Add (+)** button or press Enter.

### Setting a Custom Alert Sound
1.  Click the **Settings (⚙️)** icon in the header.
2.  Under "Custom Alarm Sound," click **Choose File**.
3.  Select an MP3 or WAV file (under 2MB).
4.  Click **Preview** to test the sound.

### Managing Groups
* To create a new group, select **+ New Group** from the dropdown menu when adding or editing a task.
* To view or delete groups, click the **Groups** tab in the main navigation.

## 📂 Project Structure

```text
├── manifest.json       # Extension configuration (Manifest V3)
├── background.js       # Service worker (Alarms & Notifications)
├── popup.html          # Main UI structure
├── popup.js            # UI logic, state management, and storage
├── style.css           # Styling and Dark/Light mode variables
├── offscreen.html      # Hidden document for audio playback
└── offscreen.js        # Audio player logic (Message listener)