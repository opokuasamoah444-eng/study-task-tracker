STUDENT STUDY TASK TRACKER — SUPABASE VERSION

FILES
- index.html: page structure, login, registration and task tracker.
- style.css: application design.
- script.js: Supabase authentication and task operations.
- config.js: Supabase project URL and publishable/anon key.
- supabase-setup.sql: database table and Row Level Security policies.

SETUP

1. Create a free Supabase project at https://supabase.com.
2. In the Supabase dashboard, open SQL Editor.
3. Create a new query, paste the contents of supabase-setup.sql and run it.
4. Open Project Settings -> API (or API Keys, depending on the dashboard).
5. Copy the Project URL and the publishable key (or legacy anon key).
6. Open config.js and replace the two placeholder values:
   window.SUPABASE_URL = "your project URL";
   window.SUPABASE_ANON_KEY = "your publishable/anon key";
7. Save all files.
8. Open the project folder in Visual Studio Code.
9. Run index.html using the Live Server extension.

AUTHENTICATION
- A student can create an account using an email and password.
- A registered student can log in and log out.
- Depending on Supabase Auth email confirmation settings, a new user may need to confirm their email before logging in.
- For a classroom demo, configure this under Authentication -> Providers -> Email in your Supabase project. Do not disable confirmation for a real public application without considering the security implications.

DATABASE AND SECURITY
- Tasks are stored in the Supabase PostgreSQL database, not only in the browser.
- Row Level Security (RLS) policies ensure that each authenticated user can only access rows whose user_id matches their own account ID.
- The browser code uses only the Supabase publishable/anon key. Never put the service_role/secret key in frontend code.

FEATURES
- Add task title and subject/course.
- Reject blank task titles.
- List saved tasks.
- Mark tasks complete or incomplete.
- Delete tasks.
- Filter all, incomplete or completed tasks.
- Set High, Normal or Low priority.
- Data remains saved after page refresh and can be accessed after signing in again.

NOTE
This is a frontend-only application connected directly to Supabase Auth and its database using the Supabase JavaScript client. Use Live Server or another local web server rather than opening the file directly.
