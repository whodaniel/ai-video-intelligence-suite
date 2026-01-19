# AI Video Intelligence Suite - User Journey & Architecture

## 🎯 Original Intent & Purpose

This extension was designed to automate the process of:

1. **Selecting YouTube videos** from your playlists
2. **Submitting them to Google AI Studio** for AI-powered analysis
3. **Extracting key information** (AI concepts, technical innovations, implementation details)
4. **Saving structured reports** in Markdown format

### The Complete Intended User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. SIGN IN                                                          │
│     └─→ Click extension icon                                         │
│     └─→ Sign in with Google (using Brand Account)                   │
│     └─→ Grant YouTube read-only access                               │
│                                                                      │
│  2. SELECT PLAYLIST                                                  │
│     └─→ Choose source playlist from dropdown                         │
│     └─→ Wait for videos to load (can be 600+ videos)                │
│     └─→ Videos display with thumbnails, duration, view count        │
│                                                                      │
│  3. FILTER & SELECT VIDEOS                                           │
│     └─→ Use search to filter by title/channel                        │
│     └─→ Check "Only videos > 10min" to skip shorts                  │
│     └─→ Click individual videos or "Select All"                      │
│                                                                      │
│  4. PROCESS VIDEOS (Automation Phase)                                │
│     └─→ Click "Process Selected (N videos)"                          │
│     └─→ AI Studio tab opens/activates                                │
│     └─→ ⚠️ THIS IS WHERE AUTOMATION SHOULD HAPPEN:                   │
│         ├─→ Click "+" or attachment button                           │
│         ├─→ Select "YouTube Video" option                            │
│         ├─→ Paste video URL                                          │
│         ├─→ Set start/end times (for long videos)                    │
│         ├─→ Click "Add" or "Save"                                    │
│         ├─→ Type AI extraction prompt                                │
│         ├─→ Click "Run"                                              │
│         ├─→ Wait for AI response                                     │
│         ├─→ Download/copy the report                                 │
│         └─→ Repeat for each video                                    │
│                                                                      │
│  5. VIEW PROGRESS (In Popup)                                         │
│     └─→ See "Processing Videos" view                                 │
│     └─→ Progress bar shows X/Y videos                                │
│     └─→ Activity Log shows each step                                 │
│     └─→ Current video thumbnail/title visible                        │
│     └─→ Pause/Resume/Stop controls                                   │
│                                                                      │
│  6. COMPLETION                                                       │
│     └─→ Notification: "Processed N videos"                           │
│     └─→ Reports saved to Downloads folder                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚨 Current Issues

### Issue 1: AI Studio UI Changed

**Status:** BROKEN
**Problem:** Google AI Studio's interface has been updated. The automation script looks for:

- Button text containing "note_add" or "add"
- Dropdown option labeled "YouTube Video"

These elements no longer exist in the current AI Studio UI.

**Required Fix:**

- Navigate to AI Studio manually
- Inspect the current DOM structure for adding YouTube videos
- Update selectors in `content-scripts/ai-studio.js`

### Issue 2: No Visual Feedback During Automation

**Status:** PARTIALLY BROKEN
**Problem:**

- Toolbar icon remains static (no badge/animation)
- Popup shows processing view but logs aren't visible
- User has no indication something is happening

**Required Fix:**

- Add `chrome.action.setBadgeText()` to show progress
- Add `chrome.action.setBadgeBackgroundColor()` for status colors
- Ensure activity logs are relayed to popup

### Issue 3: Toolbar Icon Shows Puzzle Piece

**Status:** COSMETIC ISSUE
**Cause:** Chrome caches extension icons aggressively
**Fix:**

1. Completely quit Chrome (not just close windows)
2. Reopen Chrome
3. Or: Remove extension entirely, reinstall

---

## 📁 File Architecture

```
ai-studio-automator/
├── manifest.json           # Extension configuration
├── background.js           # Service worker (auth, messaging, API)
├── popup.html              # Main popup UI
├── popup.js                # Popup logic
├── popup.css               # Popup styles
├── content-scripts/
│   ├── ai-studio.js        # ⚠️ AUTOMATOR - Needs updating for new UI
│   ├── youtube.js          # YouTube page interactions
│   └── notebooklm.js       # NotebookLM integration (future)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── services/               # (Legacy, integrated into background.js)
```

---

## 🔐 Security & Permissions

### YouTube API Scope

```
youtube.readonly
```

**This is READ-ONLY. The extension CANNOT:**

- Delete videos from playlists
- Modify playlist contents
- Upload or remove anything

### Other Permissions

- `storage` - Save settings and tokens locally
- `identity` - OAuth authentication
- `activeTab` - Interact with current tab
- `scripting` - Inject content scripts

---

## 📝 Recommended Next Steps

### Priority 1: Fix AI Studio Automation

1. Open AI Studio manually: https://aistudio.google.com/app/prompts/new_chat
2. Inspect how to add a YouTube video in current UI
3. Update `content-scripts/ai-studio.js` with correct selectors

### Priority 2: Add Visual Feedback

```javascript
// In background.js - when processing starts:
chrome.action.setBadgeText({ text: "1/5" });
chrome.action.setBadgeBackgroundColor({ color: "#10b981" });

// When processing:
chrome.action.setBadgeText({ text: "🔄" });

// When complete:
chrome.action.setBadgeText({ text: "✓" });

// When error:
chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
chrome.action.setBadgeText({ text: "!" });
```

### Priority 3: Fix Toolbar Icon

1. Compress icon128.png (currently 546KB is excessive)
2. Clear Chrome's extension icon cache
3. Verify PNG format is correct (not renamed JPEG)

---

## ❓ Open Questions

1. **AI Studio Access:** Does your Google account have access to add YouTube videos in AI Studio? This feature may require specific account types or settings.

2. **Manual Test:** Can you manually add a YouTube video to AI Studio? This will confirm the feature exists in your account.

3. **Scope Expansion:** Should the extension also integrate with NotebookLM as originally planned?
