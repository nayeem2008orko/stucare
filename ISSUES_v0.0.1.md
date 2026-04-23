# StuCare v0.0.1 — Initial Release Known Issues

**Release:** v0.0.1  
**Status:** In Development  
**Opened:** April 2026

---

## Summary

This is the first working build of StuCare. Core functionality is operational across all three services (frontend, backend, algorithm). The following issues have been identified and are tracked for the next release.

---

## 🐛 Known Bugs

### [BUG-001] Login/Register error message causes brief flash on render
**Severity:** Low  
**Component:** Frontend — `Login.jsx`, `Register.jsx`  
**Description:** When an auth error occurs (wrong password, duplicate email), the error message appears correctly but causes a brief visual flash due to React state re-render. The page does not actually reload but visually appears to.  
**Steps to reproduce:**
1. Go to `/login`
2. Enter wrong password
3. Click Sign In
4. Observe brief flash before error message settles  

**Expected:** Smooth error message appearance with no flash  
**Actual:** Brief flash/flicker on error state update  

---

### [BUG-002] Daily plan not regenerating when available hours selector changes
**Severity:** Medium  
**Component:** Frontend — `Dashboard.jsx`  
**Description:** Changing the "Available hours" dropdown on the dashboard does not automatically regenerate the plan. The user must manually click "Regenerate".  
**Expected:** Plan regenerates automatically on hours change  
**Actual:** Requires manual regeneration click  

---

### [BUG-003] Cached daily plan served even after new tasks are added
**Severity:** Medium  
**Component:** Backend — `planner.service.js`  
**Description:** Once a daily plan is generated and cached in the database, adding new tasks from the Planner does not invalidate the cache. The old plan continues to be served until midnight.  
**Expected:** Plan invalidated when tasks are added or modified  
**Actual:** Stale plan served until next day  

---

### [BUG-004] JWT access token expiry causes silent failure
**Severity:** Medium  
**Component:** Frontend — `api/client.js`  
**Description:** When the 15-minute access token expires, API calls fail silently. The 401 interceptor clears localStorage and redirects to login, but no message is shown to the user explaining why they were logged out.  
**Expected:** User sees "Session expired, please log in again" message  
**Actual:** Silent redirect to login page  

---

### [BUG-005] Deadline stored with timezone offset causing off-by-one date display
**Severity:** Low  
**Component:** Backend — PostgreSQL / Frontend date rendering  
**Description:** Deadlines are stored as `DATE` in PostgreSQL but returned with UTC timezone offset (`2026-04-24T18:00:00.000Z`). This causes the displayed date to appear one day behind in some timezones.  
**Expected:** Deadline displayed as entered (e.g. April 24)  
**Actual:** May display as April 23 depending on user timezone  

---

### [BUG-006] Onboarding does not handle partial task creation failure
**Severity:** Low  
**Component:** Frontend — `Onboarding.jsx`  
**Description:** If one task fails to create during onboarding (e.g. validation error), the user is still redirected to the dashboard with remaining tasks created. No feedback is given about which tasks failed.  
**Expected:** Clear feedback on failed task creation, option to retry  
**Actual:** Silent failure, user redirected with partial data  

---

## ⚠️ Limitations

### [LIMIT-001] No token refresh mechanism implemented
**Component:** Frontend / Backend  
**Description:** Refresh tokens are generated and stored but the frontend does not automatically use them to get a new access token when the current one expires. Users are logged out after 15 minutes of inactivity.  
**Planned fix:** Implement axios response interceptor to auto-refresh on 401  

---

### [LIMIT-002] Daily plan limited to one generation per day
**Component:** Backend — `planner.service.js`  
**Description:** The `UNIQUE(user_id, plan_date)` constraint means only one plan can exist per user per day. Regenerating overwrites plan items but does not fully reset the plan.  

---

### [LIMIT-003] Chat history not displayed on page load
**Component:** Frontend — `Chatbot.jsx`  
**Description:** Chat history is saved to the database and used for AI context, but is not loaded and displayed when the user opens the chatbot page. Each session starts with only the welcome message.  
**Planned fix:** Fetch last N messages from `/api/chatbot/history` on mount  

---

### [LIMIT-004] No mobile responsive layout
**Component:** Frontend  
**Description:** The sidebar layout is not responsive. On screens smaller than 768px the sidebar overlaps or squishes the main content.  
**Planned fix:** Add hamburger menu and collapsible sidebar for mobile  

---

### [LIMIT-005] Algorithm service must be manually started
**Component:** Algorithm — `app.py`  
**Description:** The Python algorithm service is a separate process that must be started manually alongside the Node backend. There is no process manager or health-check retry logic if it goes down.  

---

## 🔜 Planned for v0.0.2

- [ ] Fix token auto-refresh (LIMIT-001)
- [ ] Fix cached plan invalidation on task change (BUG-003)  
- [ ] Load and display chat history on chatbot open (LIMIT-003)
- [ ] Mobile responsive sidebar (LIMIT-004)
- [ ] Session expired user feedback (BUG-004)
- [ ] Fix timezone date display offset (BUG-005)

---

## Environment

| Service | Version |
|---|---|
| Node.js | v25.2.1 |
| React | 19.2.5 |
| Vite | 8.0.8 |
| Python | 3.14.0 |
| Flask | latest |
| PostgreSQL | local |
| Tailwind CSS | 3.4.19 |
| React Router | 7.14.0 |

---

*This issue was auto-generated for the v0.0.1 initial release of StuCare.*
