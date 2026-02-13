

# CSOC Web Application — Implementation Plan

## Overview
A professional Cyber Security Operations Center (CSOC) web application with mock data, structured for future Palo Alto Cortex XDR API integration. Clean enterprise light theme with role-based access control.

---

## Phase 1: Foundation & Layout

### App Shell & Navigation
- **Left sidebar** with navigation: Dashboard, Incidents, Endpoints, Audit Log
- Audit Log menu item visible only to Manager/Admin roles
- **Top header bar** with: user display name, role badge, notification bell with counter, logout button
- Clean enterprise light theme with professional typography and consistent spacing

### Mock Authentication & RBAC
- Login page with role selection (Analyst, Manager, Admin)
- Role context provider that controls UI visibility throughout the app
- Role-restricted elements: export buttons (Manager/Admin), audit log page (Manager/Admin), advanced endpoint actions (Admin only)

---

## Phase 2: Dashboard

### KPI Cards
- Total Incidents, Critical Incidents, Prevented Incidents — color-coded cards

### Charts & Visualizations
- Incidents by Severity (bar/donut chart)
- Incident Trend over time (line chart — daily/weekly)

### Tables
- Top 10 Attackers (Source IP/Host)
- Top 10 Victims (Destination/Username)

### Global Time Filter
- Filter toggle: 24h / 7d / 30d / Custom date range
- All dashboard widgets update dynamically based on selected filter

---

## Phase 3: Incidents Management

### Incidents Table
- Columns: ID, Description, Severity, Alerts Count, Source, Destination, Date, Time, Status
- Search by ID/keyword, filter by severity/status/time range
- Sortable columns with pagination
- Severity color-coded badges
- Status badges (Open, Investigating, Contained, Closed)

### Incident Detail View
- Clicking "Investigate" opens a detailed view with: full description, alert summary, event timeline, related endpoints/users, recommended actions

### Response Actions (role-restricted)
- Isolate Endpoint, Kill Process, Quarantine File, Add to IOC Blocklist, Close Incident (with comment)
- Confirmation modal before executing any action
- Each action generates an audit log entry

### CSV Export
- Export filtered incident results as CSV (Manager/Admin only)
- File naming: `incidents_export_YYYYMMDD.csv`

---

## Phase 4: Endpoints Management

### Endpoints Table
- Columns: Name, Type, Status, OS, Agent Version, IP, Username, Last Seen
- Search by name/IP/user, filter by status/OS/last seen

### Endpoint Detail View
- Metadata display, related incidents list
- Quick actions: Isolate, Scan (Admin gets advanced actions)

---

## Phase 5: Audit Log & Notifications

### Audit Log Page (Manager/Admin only)
- Table: Timestamp, User, Role, Action Type, Target, Status, Comment
- Filters: date range, user, action type
- CSV export (Admin only)
- All response actions automatically create audit records

### Critical Alert Notification System
- Red top banner for new critical incidents with: Incident ID, description, time, "View Incident" button
- Bell icon dropdown showing recent critical alerts with counter badge
- Simulated polling every 30 seconds with structure ready for WebSocket upgrade

---

## Phase 6: API Integration Layer

### Service Architecture
- Abstracted API service layer with interface for all Cortex XDR operations
- Mock data provider implementing the interface (used now)
- Placeholder for real API provider (for future Cortex XDR connection)
- Toggle between mock and real mode via configuration
- When real integration is needed, we'll connect Lovable Cloud with edge functions to securely proxy Cortex XDR API calls (API keys stored as secrets, never exposed to frontend)

---

## Design & UX
- Clean enterprise light theme with clear contrast and professional spacing
- Severity color coding: Critical (red), High (orange), Medium (yellow), Low (blue), Info (gray)
- Sticky table headers, responsive desktop-first layout
- Consistent card/panel design across all pages
- Loading skeletons, empty states, and error handling throughout

