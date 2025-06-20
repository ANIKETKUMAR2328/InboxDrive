import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import axios from "axios";
import { Mail, FolderOpen, Upload, ArrowLeft, User, LogOut, File, Image, Video, HardDrive, Microscope as Microsoft } from "lucide-react";

interface Profile {
  name: string;
  email: string;
}

interface DriveItem {
  id: string;
  name: string;
  folder?: any;
  file?: {
    mimeType?: string;
  };
  '@microsoft.graph.downloadUrl'?: string;
}

interface Email {
  id: string;
  subject?: string;
  from?: {
    emailAddress?: {
      address: string;
    };
  };
  receivedDateTime: string;
}

interface StorageQuota {
  used: number;
  total: number;
}

function App() {
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
  const [folderStack, setFolderStack] = useState<string[]>([]);
  const [view, setView] = useState<"onedrive" | "mail">("onedrive");
  const [emails, setEmails] = useState<Email[]>([]);
  const [storage, setStorage] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = accounts.length > 0;

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((e) => {
      console.error("Login error:", e);
    });
  };

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  useEffect(() => {
    if (isLoggedIn) {
      setLoading(true);
      instance
        .acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        })
        .then(async (response) => {
          const token = response.accessToken;
          setAccessToken(token);
          await Promise.all([
            fetchProfile(token),
            fetchDriveItems(token),
            fetchStorage(token),
            fetchEmails(token)
          ]);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Token acquisition failed:", error);
          setLoading(false);
        });
    }
  }, [isLoggedIn, instance, accounts]);

  const fetchProfile = async (token: string) => {
    try {
      const res = await axios.get("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile({
        name: res.data.displayName,
        email: res.data.mail || res.data.userPrincipalName,
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  };

  const fetchDriveItems = async (token: string, folderId: string | null = null) => {
    try {
      const endpoint = folderId
        ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`
        : `https://graph.microsoft.com/v1.0/me/drive/root/children`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDriveItems(res.data.value);
    } catch (err) {
      console.error("Error loading drive items:", err);
    }
  };

  const fetchStorage = async (token: string) => {
    try {
      const res = await axios.get("https://graph.microsoft.com/v1.0/me/drive", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStorage(res.data.quota);
    } catch (error) {
      console.error("Storage fetch error:", error);
    }
  };

  const fetchEmails = async (token: string) => {
    try {
      const res = await axios.get("https://graph.microsoft.com/v1.0/me/messages?$top=10", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmails(res.data.value);
    } catch (error) {
      console.error("Email fetch error:", error);
    }
  };

  const handleOpenFolder = (id: string) => {
    setFolderStack((prev) => [...prev, id]);
    fetchDriveItems(accessToken!, id);
  };

  const handleGoBack = () => {
    const newStack = [...folderStack];
    newStack.pop();
    const lastFolder = newStack[newStack.length - 1] || null;
    setFolderStack(newStack);
    fetchDriveItems(accessToken!, lastFolder);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !accessToken) return;

    const uploadPath = folderStack[folderStack.length - 1] || "root";
    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${uploadPath}:/${file.name}:/content`;

    try {
      await axios.put(uploadUrl, file, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": file.type,
        },
      });
      alert("✅ Upload successful");
      fetchDriveItems(accessToken, uploadPath === "root" ? null : uploadPath);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("❌ Upload failed");
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (item: DriveItem) => {
    if (item.folder) return <FolderOpen className="w-8 h-8 text-ms-blue" />;
    if (item.file?.mimeType?.startsWith("image")) return <Image className="w-8 h-8 text-ms-green" />;
    if (item.file?.mimeType?.startsWith("video")) return <Video className="w-8 h-8 text-ms-purple" />;
    return <File className="w-8 h-8 text-ms-gray" />;
  };

  if (!isLoggedIn) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <Microsoft className="w-12 h-12 text-ms-blue" />
              <h1 className="login-title">InboxDrive</h1>
              <p className="login-subtitle">Access your Microsoft 365 files and emails</p>
            </div>
            <button onClick={handleLogin} className="login-button">
              <Microsoft className="w-5 h-5" />
              Sign in with Microsoft
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your Microsoft data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <Microsoft className="w-8 h-8 text-ms-blue" />
            <h1 className="app-title">InboxDrive</h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              <User className="w-5 h-5" />
              <div className="user-details">
                <span className="user-name">{profile?.name}</span>
                <span className="user-email">{profile?.email}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-button">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button
          onClick={() => setView("onedrive")}
          className={`nav-button ${view === "onedrive" ? "nav-button-active" : ""}`}
        >
          <HardDrive className="w-5 h-5" />
          OneDrive
        </button>
        <button
          onClick={() => setView("mail")}
          className={`nav-button ${view === "mail" ? "nav-button-active" : ""}`}
        >
          <Mail className="w-5 h-5" />
          Mail
        </button>
      </nav>

      <main className="app-main">
        {view === "onedrive" && (
          <div className="onedrive-view">
            <div className="onedrive-header">
              {folderStack.length > 0 && (
                <button onClick={handleGoBack} className="back-button">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              
              <div className="upload-section">
                <label className="upload-button">
                  <Upload className="w-4 h-4" />
                  Upload File
                  <input
                    type="file"
                    onChange={handleUpload}
                    className="upload-input"
                  />
                </label>
              </div>
            </div>

            {storage && (
              <div className="storage-info">
                <div className="storage-header">
                  <HardDrive className="w-5 h-5" />
                  <span>Storage: {formatBytes(storage.used)} / {formatBytes(storage.total)}</span>
                </div>
                <div className="storage-bar">
                  <div 
                    className="storage-progress"
                    style={{ width: `${(storage.used / storage.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="files-grid">
              {driveItems.map((item) => (
                <div key={item.id} className="file-card">
                  <div className="file-icon">
                    {getFileIcon(item)}
                  </div>
                  <div className="file-info">
                    <h3 className="file-name">{item.name}</h3>
                    {item.folder ? (
                      <button
                        onClick={() => handleOpenFolder(item.id)}
                        className="file-action-button"
                      >
                        Open folder
                      </button>
                    ) : (
                      <a
                        href={item["@microsoft.graph.downloadUrl"]}
                        target="_blank"
                        rel="noreferrer"
                        className="file-action-button"
                      >
                        Open file
                      </a>
                    )}
                  </div>
                  {item.file?.mimeType?.startsWith("image") && item["@microsoft.graph.downloadUrl"] && (
                    <div className="file-preview">
                      <img
                        src={item["@microsoft.graph.downloadUrl"]}
                        alt={item.name}
                        className="preview-image"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "mail" && (
          <div className="mail-view">
            <div className="mail-header">
              <Mail className="w-6 h-6" />
              <h2>Recent Messages</h2>
            </div>
            <div className="emails-list">
              {emails.map((email) => (
                <div key={email.id} className="email-card">
                  <div className="email-header">
                    <h3 className="email-subject">
                      {email.subject || "(No Subject)"}
                    </h3>
                    <span className="email-date">
                      {new Date(email.receivedDateTime).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="email-sender">
                    From: {email.from?.emailAddress?.address}
                  </p>
                  <span className="email-time">
                    {new Date(email.receivedDateTime).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;