# KVS-OYMS 2.0 — Security and Production-Readiness Plan

## Current status

KVS-OYMS 2.0 remains an independent school-level front-end prototype. The current demo uses browser session/local storage and IndexedDB. Demo credentials are visible in the public project. Browser-stored circulars, gallery media, slides and event records do not synchronise across devices. Client-side role checks are for preview navigation only and are not an authorization boundary.

**Production status: Not production-ready.** Do not store real student names, dates of birth, personal contact details, BSG identifiers, passwords, or other private student records in this demo.

## Stage 1 — School approval and data governance

- Obtain written approval from the school authority and the responsible BSG/unit leadership before production use.
- Define the purpose and minimum data fields for each role; collect only what is necessary.
- Decide who is the data owner, who may approve accounts, how long records are retained, and how corrections/deletion requests are handled.
- Establish a process for parental/guardian permissions and school-approved publication of student photographs or videos, as applicable.
- Publish a clear privacy notice and contact point before collecting personal information.

## Stage 2 — Server-side identity and permissions

- Replace demo credentials with a maintained authentication service and secure server-side sessions.
- Store password hashes using a modern password-hashing algorithm; never store or email plain-text passwords.
- Enforce role permissions on the server for Super Administrator, Administrator, Unit Leader, Patrol Leader and Patrol Member. Hiding a menu item in JavaScript is not access control.
- Require verified email addresses and a secure account recovery process; add multi-factor authentication for privileged administrators.
- Add rate limiting, login-abuse monitoring, session expiry, secure logout and account suspension.
- Do not connect to official BSG identity systems unless an authorised integration/API and written permission are available.

## Stage 3 — Shared database and file storage

- Select and approve a managed database and private file-storage provider before implementation. No provider is activated by this plan.
- Design database access rules so each role can read or change only its permitted records.
- Keep student/private files private by default. Use short-lived signed download links where appropriate.
- Validate upload type, size and content on the server; scan uploaded files and restrict public media to approved items.
- Add automated backups, restore tests, retention rules and a documented recovery owner.
- Migrate any approved demo data only after review; do not automatically copy browser data into production.

## Stage 4 — Application and operational security

- Move secrets and API credentials to server-side environment variables; never commit them to the public repository or browser JavaScript.
- Enforce HTTPS, secure cookies, CSRF protection where applicable, input validation, output encoding and safe external-link handling.
- Keep dependencies updated and review third-party integrations.
- Record security-relevant actions in tamper-resistant server-side audit logs, including actor, action, timestamp and affected record without logging passwords or secrets.
- Add monitoring, error reporting, incident response contacts and a process for promptly disabling compromised accounts.
- Test accessibility, mobile layouts, authorization boundaries, file uploads, backups and restore procedures before launch.

## Stage 5 — Release gates

A production release should wait until all of the following are complete:

- [ ] Written school approval and data-governance decisions.
- [ ] Server-side authentication and authorization tested for every role.
- [ ] Database rules and private file access independently reviewed.
- [ ] Password recovery, administrator MFA, rate limits and session controls tested.
- [ ] Privacy notice, retention schedule and photo/media approval process published.
- [ ] Backups and a successful restore exercise completed.
- [ ] Security review and functional testing signed off.
- [ ] Production domain, HTTPS, monitoring and incident contacts confirmed.

## Current implementation boundary

The approved homepage improvements (Upcoming Programmes, slideshow controls, circular archive table and programme detail fields) are front-end preview features. Event links accept HTTP/HTTPS URLs; event records remain in this browser. Slideshow files and circular PDFs remain in this browser's IndexedDB. This document is a roadmap, not evidence that any production security control or backend has been deployed.
