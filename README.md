# RestroWatch

Real-time restaurant review escalation dashboard for managing reviews across Swiggy and Zomato.

## Architecture

```
Gmail (Zomato/Swiggy emails)
    ↓ (poll every 60s)
FastAPI Backend (Python)
    ↓ (parse + AI tag)
Supabase (PostgreSQL + Realtime)
    ↓ (live subscriptions)
React Frontend (Vite + Tailwind)
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase project (free tier works)
- Google Cloud project with Gmail API enabled
- Anthropic API key

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `supabase/schema.sql`
3. Enable Realtime: Database → Replication → toggle on for `reviews` and `review_actions`
4. Create auth users in Authentication → Users (one owner, one per manager)
5. Link users to the `users` table:
   ```sql
   insert into users (id, name, role, restaurant_id) values
     ('<owner-auth-uuid>', 'Rajesh Kumar', 'owner', null),
     ('<mgr1-auth-uuid>', 'Arjun Shetty', 'manager', '<restaurant-uuid>');
   ```
6. Run seed data: `supabase/seed.sql`

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# Fill in your .env values
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

Frontend runs at `http://localhost:5173`

### 4. Gmail OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable the Gmail API: APIs & Services → Library → search "Gmail API" → Enable
4. Create OAuth2 credentials: APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:8000/gmail/oauth-callback`
5. Download the credentials JSON
6. Add `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` to `backend/.env`
7. Start the backend, visit Settings page → click "Connect Gmail" → complete OAuth flow
8. System starts polling automatically every 60 seconds

## Environment Variables

### Backend (`backend/.env`)
```
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GMAIL_CLIENT_ID=your-google-oauth-client-id
GMAIL_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_REDIRECT_URI=http://localhost:8000/gmail/oauth-callback
POLL_INTERVAL_SECONDS=60
```

### Frontend (`frontend/.env`)
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:8000
```

## Adding a Restaurant

```sql
insert into restaurants (name, city, cuisine, email_alias)
values ('New Restaurant', 'City', 'Cuisine Type', 'Email Alias');
```

The `email_alias` is how the restaurant name appears in email subjects.

## Adding a Manager

1. Create user in Supabase Dashboard → Authentication → Users → Add user
2. Copy the user's UUID
3. Insert into users table:
   ```sql
   insert into users (id, name, role, restaurant_id)
   values ('<auth-uuid>', 'Manager Name', 'manager', '<restaurant-uuid>');
   ```

## Deployment

### Backend (Render)
1. Push code to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables in Render dashboard

### Frontend (Vercel)
1. Push code to GitHub
2. Import on [Vercel](https://vercel.com)
3. Root directory: `frontend`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variables in Vercel dashboard
7. Update `VITE_API_URL` to your Render backend URL

## Gmail Token Refresh

The OAuth refresh token is long-lived. If it expires:
1. Go to Settings → Disconnect Gmail (if option exists)
2. Re-connect via OAuth flow
3. Or manually delete the row in `gmail_credentials` table and re-authenticate

## Troubleshooting

- **Gmail poll not working**: Check that OAuth tokens are stored in `gmail_credentials` table
- **No reviews appearing**: Verify emails are actually from `noreply@zomato.com` or `noreply@swiggy.in`
- **Realtime not working**: Ensure Realtime is enabled on `reviews` and `review_actions` tables in Supabase
- **Claude API errors**: Severity falls back to rule-based classification automatically
- **CORS errors**: Ensure backend CORS allows your frontend URL
