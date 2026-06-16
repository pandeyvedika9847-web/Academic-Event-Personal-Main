# Academic Events Hub

Academic Events Hub is a Next.js frontend with an Express, Sequelize, and MySQL backend for discovering, publishing, moderating, and tracking academic events.

## Architecture

- `app/`: Next.js App Router frontend
- `components/`: shared UI components
- `lib/`: frontend config, API, session, and route helpers
- `backend/`: Express API, Sequelize models, local DB scripts, mailers, and maintenance scripts
- `scripts/local/`: local development automation

## Environment

Copy the example files and fill in real values.

```bash
cp .env.example .env.local
cp backend/.env.example backend/.env
```

Required backend variables:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_ROOT_USER` and `DB_ROOT_PASSWORD` for automatic local DB bootstrap
- `JWT_SECRET`
- `ADMIN_CODE`
- `GOOGLE_CLIENT_ID` for Google Sign-In
- `GOOGLE_ALLOWED_HOSTED_DOMAIN` if Google accounts must be restricted to one Workspace domain
- `FRONTEND_BASE_URL`
- `ALLOWED_ORIGINS`

Required frontend variables:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_ORIGIN`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for the Google Identity Services button


## Google Cloud Sign-In Setup

Use Google Identity Services with a **Web application** OAuth client. This app uses the Google ID token only; it does not request Google API access tokens and does not need a redirect callback URL for local sign-in.

### 1. Create or select a Google Cloud project

1. Open `https://console.cloud.google.com/`.
2. Use the project selector in the top bar.
3. Select an existing project or click **New Project**.
4. Give it a clear name, for example `Academic Events Hub Local`, then create/select it.

### 2. Configure the OAuth consent screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**.
2. Choose the user type:
   - **External** for normal Gmail/Google accounts.
   - **Internal** only if this is inside a Google Workspace organization and should be limited to that organization.
3. Fill the required app information:
   - **App name**: `Academic Events Hub`
   - **User support email**: your email
   - **Developer contact information**: your email
4. For local development, add yourself under **Test users** if the app is in testing mode.
5. Save the consent screen.

### 3. Create the OAuth client ID

1. Go to **APIs & Services** → **Credentials**.
2. Click **Create Credentials** → **OAuth client ID**.
3. Set **Application type** to **Web application**.
4. Name it `Academic Events Hub Local Web`.
5. Under **Authorized JavaScript origins**, add exactly:

   ```text
   http://localhost:3000
   ```

6. Leave **Authorized redirect URIs** empty for this Google Identity Services button flow.
7. Click **Create**.
8. Copy the generated **Client ID**. It will look like:

   ```text
   1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
   ```

Do not use the client secret in this app. The frontend and backend both need only the Client ID; the backend verifies the Google ID token audience against it.

### 4. Add local environment values

Put the same Google Client ID in both local env files.

Frontend `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_ORIGIN=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Backend `backend/.env`:

```env
FRONTEND_BASE_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_ALLOWED_HOSTED_DOMAIN=
```

Use `GOOGLE_ALLOWED_HOSTED_DOMAIN` only when sign-in must be restricted to one Google Workspace domain. Example:

```env
GOOGLE_ALLOWED_HOSTED_DOMAIN=iitbhu.ac.in
```

When this is set, the backend checks Google's verified `hd` claim. Do not use this for public Gmail accounts.

### 5. Prepare the local database for Google users

`npm run local:setup` and `npm run local:start` run the Google auth migration automatically. For an existing local database, run it manually once if Google sign-in fails with a missing `google_id` column:

```bash
npm --prefix backend run db:migrate:gauth
```

The migration is idempotent. It makes password nullable for Google-only accounts and adds the unique `google_id` column.

### 6. Start and test locally

Start the app:

```bash
npm run local:start
```

Open the frontend:

```text
http://localhost:3000/login
```

Test an existing account:

1. Click **Continue with Google**.
2. Choose a Google account whose email matches an existing local user.
3. The backend links that user to Google's stable `sub` identifier and signs in with the normal app session.

Test a new Google user:

1. Click **Continue with Google** using an email not already in the database.
2. The app redirects to:

   ```text
   http://localhost:3000/signup/google
   ```

3. Choose `student`, `faculty`, or `admin` and fill the required profile fields.
4. Submit the form. The backend creates a Google-only user and signs in with the normal app session.

Password login for that Google-only user should then show:

```text
This account uses Google Sign-In. Please continue with Google.
```

### 7. Production Google Cloud values

Before deploying, create a separate OAuth client or update the existing one with production origins.

Add each frontend origin under **Authorized JavaScript origins**, for example:

```text
https://your-production-domain.com
https://www.your-production-domain.com
```

Keep **Authorized redirect URIs** empty unless the app is changed to use an authorization-code redirect flow later.

Set production env vars in the hosting provider:

```env
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
NEXT_PUBLIC_API_ORIGIN=https://your-api-domain.com
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-api-domain.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
FRONTEND_BASE_URL=https://your-production-domain.com
ALLOWED_ORIGINS=https://your-production-domain.com,https://www.your-production-domain.com
```

### 8. Common local Google sign-in issues

- `origin_mismatch`: add `http://localhost:3000` to **Authorized JavaScript origins** for the OAuth client ID you put in `.env.local`.
- `Google sign-in is not configured`: set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local` and restart the frontend.
- `Google sign-in is not configured on the server`: set `GOOGLE_CLIENT_ID` in `backend/.env` and restart the backend.
- `Google sign-in session expired`: retry sign-in; the backend nonce cookie is short-lived.
- `Google auth database migration has not been run`: run `npm --prefix backend run db:migrate:gauth`, then restart the backend.
- Workspace/domain rejection: clear `GOOGLE_ALLOWED_HOSTED_DOMAIN` or sign in with an account from that Google Workspace domain.

## Local Development

### One-time setup

Follow `LOCAL_SETUP.md` if you are setting up MySQL for the first time.

Install dependencies:

```bash
npm install
npm --prefix backend install
```

Initialize the local environment. This bootstraps the database, synchronizes the base Sequelize schema, and runs the Google auth migration:

```bash
npm run local:setup
```

### Start the app locally

```bash
npm run local:start
```

Frontend default URL: `http://localhost:3000`

Backend default URL: `http://localhost:4000`

### Health check

```bash
npm run local:doctor
```

## Viewing the Local MySQL Database with DBeaver on Windows

DBeaver Community is a free GUI for opening the local MySQL database, browsing tables, viewing rows, and running SQL without using the MySQL command line.

### 1. Confirm the app database exists

From the project folder, run the normal local setup first:

```bash
npm run local:setup
```

This creates/syncs the local database and runs the Google auth migration. If you only need to repair the Google auth columns, run:

```bash
npm --prefix backend run db:migrate:gauth
```

### 2. Install DBeaver Community

1. Open `https://dbeaver.io/download/`.
2. Download **DBeaver Community** for **Windows**.
3. Run the installer.
4. Keep the default install options unless your machine requires a custom location.
5. Open **DBeaver** from the Start menu.

### 3. Create a MySQL connection

1. In DBeaver, click **New Database Connection**.
   - It may be a plug icon with a plus sign.
   - You can also use **Database** → **New Database Connection** from the top menu.
2. Search for `MySQL`.
3. Select **MySQL**.
4. Click **Next**.
5. Enter the same values from `backend/.env`:

   ```text
   Server Host: 127.0.0.1
   Port: 3306
   Database: academic_events_local
   Username: academic_events
   Password: academic_events_local_password
   ```

6. Click **Test Connection**.
7. If DBeaver asks to download the MySQL driver, click **Download**.
8. After the test succeeds, click **Finish**.

If your `backend/.env` has different database values, use those instead. The connection must match:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=academic_events_local
DB_USER=academic_events
DB_PASSWORD=academic_events_local_password
```

### 4. Open and view tables

1. In the left sidebar, expand your new connection.
2. Expand the database:

   ```text
   academic_events_local
   ```

3. Expand **Tables**.
4. Double-click a table, for example:

   ```text
   User
   Event
   Bookmark
   EventRegistration
   UserPreference
   ```

5. Click the **Data** tab to view rows.
6. Click the **Properties** or **Columns** tab to view the table structure.

For Google sign-in, open the `User` table and confirm the columns include:

```text
google_id
password
email
role
is_verified
```

Google-only users should have `google_id` filled and `password` set to `NULL`.

### 5. Run SQL manually in DBeaver

1. Right-click the connection or database.
2. Click **SQL Editor** → **New SQL Script**.
3. Paste a query, for example:

   ```sql
   SELECT id, full_name, email, role, google_id, is_verified
   FROM User
   ORDER BY id DESC;
   ```

4. Press **Ctrl + Enter** to run the query.

Useful local checks:

```sql
SHOW TABLES;
DESCRIBE User;
SELECT id, email, google_id FROM User WHERE google_id IS NOT NULL;
```

### 6. Editing data safely

You can edit cells directly in the **Data** tab, but be careful:

1. Click a cell.
2. Change the value.
3. Click **Save** in DBeaver's bottom toolbar or press **Ctrl + S**.

Avoid editing these unless you know exactly why:

```text
id
password
google_id
reset_password_token
reset_password_expire
```

Do not paste plain-text passwords into the `password` column. Passwords must be created through the app so they are bcrypt-hashed.

### 7. Common DBeaver connection problems

- **Connection refused**: MySQL is not running. Start MySQL, then try **Test Connection** again.
- **Access denied for user**: the username or password does not match `backend/.env`.
- **Unknown database**: run `npm run local:setup`, then reconnect.
- **No tables shown**: right-click the connection and click **Refresh**.
- **Missing `google_id` in `User`**: run `npm --prefix backend run db:migrate:gauth`, then refresh the `User` table.

## Quality Checks

Run the full verification loop:

```bash
npm run check
```

Run backend checks directly:

```bash
npm --prefix backend run check
```

## Database Scripts

```bash
npm --prefix backend run db:check
npm --prefix backend run db:sync
npm --prefix backend run db:migrate:gauth
npm --prefix backend run db:reset
```

## Maintenance Scripts

Backend maintenance scripts are blocked in production by default.

- `npm --prefix backend run seed`
- `node backend/seed-more.js`
- `node backend/seed-past.js`
- `node backend/cleanup.js`
- `node backend/update-dates.js`
- `node backend/wipe-events.js`

## Deployment Notes

- Do not commit `.env` files.
- Do not commit `node_modules`.
- Set backend env vars in your hosting provider instead of `vercel.json`.
- Set matching frontend and backend origins before going live.
- Rotate any credentials that were previously committed in older history.

## Current Verification Target

The expected local verification loop is:

- `npm run build`
- `npm --prefix backend test`
- `npm run check`
- `npm --prefix backend run check`
