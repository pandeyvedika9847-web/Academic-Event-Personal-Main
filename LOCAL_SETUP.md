# Local Setup Guide

This guide is written for non-technical users.

## Before You Start

You only need to do this setup once on each computer.

After setup is done, you will usually start the project with:

```bash
npm run local:start
```

## Windows

1. Open the Start menu.
2. Search for `PowerShell`.
3. Right-click `Windows PowerShell`.
4. Click `Run as administrator`.
5. Paste this command:

```powershell
winget install Oracle.MySQL
```

When the installer opens:

1. Choose `Server only`
2. Keep port `3306`
3. Set the root password to:
   `academic_events_local_password`
4. Keep the service name as `MySQL80`
5. Finish the installation

Then start MySQL:

```powershell
Start-Service MySQL80
```

Open MySQL:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

When asked for the password, type:

```text
academic_events_local_password
```

Paste this SQL exactly:

```sql
CREATE DATABASE academic_events_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'academic_events'@'localhost' IDENTIFIED BY 'academic_events_local_password';
GRANT ALL PRIVILEGES ON academic_events_local.* TO 'academic_events'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Then open `backend/.env` and set:

```env
DB_ROOT_PASSWORD=academic_events_local_password
```

## macOS

1. Open the `Terminal` app.
2. Paste this command:

```bash
brew install mysql@8.0
```

If you already installed MySQL some other way on your Mac, that is fine too, but the automatic project scripts work best with the Homebrew version above.

3. Start MySQL:

```bash
brew services start mysql@8.0
```

4. Open MySQL:

```bash
mysql -u root
```

If that does not work, try:

```bash
mysql -u root -p
```

5. Paste this SQL exactly:

```sql
CREATE DATABASE academic_events_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'academic_events'@'localhost' IDENTIFIED BY 'academic_events_local_password';
GRANT ALL PRIVILEGES ON academic_events_local.* TO 'academic_events'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Then open `backend/.env` and make sure this line is empty:

```env
DB_ROOT_PASSWORD=
```

Homebrew MySQL usually creates the local root user with no password by default.

## Project Setup

From the project folder, run:

```bash
npm install
npm --prefix backend install
npm run local:setup
```

Then start everything:

```bash
npm run local:start
```

## If Something Fails

Run this command:

```bash
npm run local:doctor
```

It will check your local MySQL and environment files.
