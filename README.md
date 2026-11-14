# KVS-OYMS 2.0 — Demo Website

Independent front-end prototype for PM SHRI Kendriya Vidyalaya Ordnance Factory Medak.

## Current phase
- Responsive public homepage with four-slide Scouts & Guides hero carousel.
- Separate login page and role-based preview dashboards.
- Expanded Super Administrator preview: school and personal details, administrator approvals, all demo Login IDs, Cubs/Bulbuls/Scouts/Guides group management, circulars, photo gallery verification, reports, activity logs, account controls, portal settings, freeze/unfreeze approvals and demo accounts.
- Circular PDFs and gallery photos use IndexedDB browser storage rather than the old 1 MB localStorage limit.
- No live authentication, database, cloud file storage, email or cross-device sync yet.

## Demo use
- Super Administrator: `DEMO-SUPER-001` / `DEMO-ONLY`
- Other role preview: `DEMO-USER-001` / `DEMO-ONLY` and select a non-Super Administrator role.
- Do not enter real student information or personal passwords.

## Storage note
IndexedDB capacity depends on the visitor's browser and device. Files remain on that device and are not shared with other users. Shared multi-device storage and larger managed file quotas require a cloud storage backend after the design review.

## Important
This is an independently developed school portal prototype, not an official KVS application. Demo data is local to the browser. Secure account approvals, password/Login ID resets, audit logs and account suspension must be enforced by a server-side backend before real use.

## Approved homepage and programme improvements
- Homepage Upcoming Programmes strip shows up to three future published events.
- Super Administrator slideshow controls support ordering, hide/show, and an optional display end date.
- Public school/unit circulars render in a Date / Number / Subject / Download / View archive table.
- Event records support optional programme time, organiser, attachment URL and registration URL.

## Security and production-readiness plan
See [SECURITY-AND-PRODUCTION-PLAN.md](SECURITY-AND-PRODUCTION-PLAN.md) for the staged checklist. These improvements do not activate a production backend or change the demo authentication model. Do not enter real student data or personal passwords until the school has approved the production design and server-side controls have been implemented and tested.
