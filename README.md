https://inbox-drive.vercel.app/ : LiNK TO THE WORKING WEBSITE .

# InboxDrive

InboxDrive is a full-stack web application that integrates Microsoft services using the Microsoft Graph API. It allows users to securely access and manage their **Outlook emails** and **OneDrive files** through a sleek, professional interface.

## Features

### Authentication
- Microsoft OAuth 2.0 Login via Azure AD
- Secure access token handling

### OneDrive Integration
- Browse OneDrive folders and files
- Preview images and videos inline in a grid format
- Upload files to OneDrive
- View OneDrive storage usage with a dynamic progress bar

### Outlook Mail Integration
- View recent Outlook emails
- Toggle between Mail and OneDrive view

### Dashboard
- Storage usage indicator
- Simple toggle UI for switching between services

### UI/UX
- Professional Microsoft-themed interface
- Clean navigation and responsive design
- Blue and white theme for a minimal, clean experience

---

## Tech Stack

**Frontend:**
- React.js
- Tailwind CSS
- Microsoft Fluent UI (optional for theme)

**Backend:**
- Node.js
- Express.js

**APIs and Services:**
- Microsoft Graph API
- Azure Active Directory (for OAuth)

---

## Project Structure

/InboxDrive
├── public/
├── src/
│ ├── components/
│ ├── pages/
│ ├── services/
│ ├── App.js
│ └── index.js
├── server/
│ ├── index.js
│ └── auth/
├── .env
├── package.json
└── README.md
