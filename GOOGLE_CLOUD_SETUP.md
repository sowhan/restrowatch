# Google Cloud API Verification Guide

This guide provides step-by-step instructions to verify RestroWatch with Google Cloud APIs, ensuring production readiness.

## Prerequisites

- Google Cloud project
- Domain ownership (if not using localhost)
- Google Cloud SDK installed (optional but helpful)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown menu at the top
3. Click "NEW PROJECT"
4. Enter "RestroWatch" as project name
5. Click "CREATE"
6. Wait for the project to be created

## Step 2: Enable Required APIs

Depending on your use case, enable the following APIs:

### For OAuth 2.0 / User Authentication:
1. Go to **APIs & Services** > **Library**
2. Search for "Google Identity" or "OAuth 2.0"
3. Click on "Google+ API" (or relevant authentication API)
4. Click "ENABLE"

### For Other Common APIs:
- **Directions API** - for restaurant location mapping
- **Places API** - for restaurant information
- **Gmail API** - for email notifications
- **Cloud Functions** - for serverless operations

1. Search for each API
2. Click "ENABLE" for each one needed

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **CREATE CREDENTIALS** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Click "Configure Consent Screen"
   - Choose **External** user type
   - Click **CREATE**
   - Fill in the required fields:
     - App name: RestroWatch
     - User support email: support@restrowatch.app
     - Developer contact email: your-email@company.com
   - Click **SAVE AND CONTINUE**
   - Add required scopes (profile, email, openid)
   - Click **SAVE AND CONTINUE**
   - Click **BACK TO DASHBOARD**

4. Now create OAuth credentials:
   - Click **CREATE CREDENTIALS** > **OAuth client ID**
   - Choose **Web application**
   - Add authorized redirect URIs:
     ```
     http://localhost:3000
     http://localhost:3000/callback
     https://yourdomain.com
     https://yourdomain.com/callback
     ```
   - Click **CREATE**
   - Copy the **Client ID** and **Client Secret**
   - Store these securely (DO NOT commit to git)

## Step 4: Domain Verification

### For Production Domain:

1. Go to **APIs & Services** > **Credentials**
2. Look for "Domain verification" section
3. Add your domain:
   - Click **ADD DOMAIN**
   - Enter your domain (e.g., restrowatch.app)
4. Verify domain ownership:
   - **Option A - DNS TXT Record:**
     - Copy the verification code provided
     - Add a TXT record to your domain's DNS:
       ```
       TXT record name: google-site-verification
       TXT record value: [verification code]
       ```
     - Wait for DNS propagation (up to 48 hours)
     - Click "VERIFY"
   
   - **Option B - HTML File:**
     - Download the HTML verification file
     - Upload to your domain's root directory
     - Access via `https://yourdomain.com/[filename]`
     - Click "VERIFY"

## Step 5: Configure Application-Specific Passwords

If using Gmail API for notifications:

1. Enable 2-Step Verification on your Google Account
2. Go to [Application Passwords](https://myaccount.google.com/apppasswords)
3. Select Mail and the device/app type
4. Generate app password
5. Use this password in your RestroWatch `.env` file:
   ```
   GOOGLE_APP_PASSWORD=generated_password
   ```

## Step 6: Set Up OAuth Consent Screen for Production

1. Go to **APIs & Services** > **OAuth consent screen**
2. Update to **Production** user type (if not already)
3. Add:
   - Privacy policy URL: `https://yourdomain.com/privacy-policy`
   - Terms of service URL: `https://yourdomain.com/terms-of-service`
   - Support email: support@restrowatch.app

## Step 7: Create Service Account (Optional, for backend operations)

1. Go to **APIs & Services** > **Credentials**
2. Click **CREATE CREDENTIALS** > **Service Account**
3. Fill in service account details:
   - Service account name: restrowatch-backend
   - Service account ID: auto-generated
   - Click **CREATE AND CONTINUE**
4. Grant necessary roles (e.g., Editor for testing, specific roles for production)
5. Click **CONTINUE**
6. Create JSON key:
   - Click **ADD KEY** > **Create new key**
   - Choose **JSON**
   - Click **CREATE**
   - Store the JSON key securely (DO NOT commit to git)

## Step 8: Configure Environment Variables

Create a `.env` file in your backend directory:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Service Account (if using)
GOOGLE_SERVICE_ACCOUNT_EMAIL=restrowatch-backend@projectid.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/path/to/service-account-key.json

# Domain
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

**⚠️ SECURITY WARNING:** Never commit `.env` files to git. Add to `.gitignore`.

## Step 9: Request Production Verification

Once everything is configured:

1. Ensure your Privacy Policy and Terms of Service are accessible
2. Test OAuth flow thoroughly
3. Go to **APIs & Services** > **OAuth consent screen**
4. Review all information
5. Submit for verification (if your app accesses sensitive scopes)
6. Google will review within a few days

## Step 10: Enable Security Features

1. Go to **APIs & Services** > **Library**
2. Search and enable:
   - **Cloud Security Command Center** - for monitoring
   - **Cloud Logging** - for application logs
   - **Cloud Monitoring** - for performance metrics

## Step 11: Set Up SSL/TLS Certificate

1. Obtain an SSL certificate:
   - Use Let's Encrypt (free)
   - Use Google-managed certificates
   - Use your hosting provider's certificate

2. Configure your web server to use HTTPS
3. Update OAuth redirect URIs to use `https://` only

## Testing & Validation

- [ ] OAuth login works on staging
- [ ] Redirect URIs are correct
- [ ] Privacy Policy is accessible
- [ ] Terms of Service is accessible
- [ ] HTTPS is enforced
- [ ] Logo displays correctly
- [ ] No console errors or warnings
- [ ] Mobile responsive design verified

## Troubleshooting

### "Redirect URI mismatch" error
- Verify the exact redirect URI in Google Console matches your application
- Check for trailing slashes, protocols (http vs https), and ports

### API not accessible
- Ensure the API is enabled in Google Cloud Console
- Check billing is enabled
- Verify credentials have necessary permissions

### Domain verification failed
- Wait for DNS propagation (up to 48 hours)
- Verify DNS record is correctly added
- Try alternative verification method (HTML file)

## Resources

- [Google Cloud Documentation](https://cloud.google.com/docs)
- [OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Domain Verification Guide](https://support.google.com/webmasters/answer/9008080)

## Next Steps

1. Implement OAuth login in your application
2. Configure proper error handling
3. Set up logging and monitoring
4. Deploy to production
5. Monitor for issues
6. Keep dependencies updated

---

**For support**, contact: support@restrowatch.app
