# Login Error Fix - Troubleshooting Guide

## Problem
Getting "TypeError: Failed to fetch" error when trying to login in the mobile app.

## Root Cause
The mobile app wasn't properly configured to access Supabase environment variables, causing network requests to fail.

## Solution Applied

### 1. Enhanced Error Handling in supabase.ts
Added better error handling and logging to help diagnose connection issues:
- Added console logs to show Supabase configuration on app start
- Added try-catch blocks in `signIn` and `signUp` methods
- Added helpful error messages for network issues

### 2. Added Supabase Config to app.json
Added Supabase URL and anon key to `app.json` extra section so the mobile app can access them:

```json
"extra": {
  "supabaseUrl": "https://pgmooiaxbythmnjtdavs.supabase.co",
  "supabaseAnonKey": "eyJhbGc..."
}
```

## How to Test

### Step 1: Restart the Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart
cd "e:\PROJECT 2025 - October\math4code-app"
npm start
```

### Step 2: Clear App Cache
Press `Shift + R` in the Expo terminal to reload the app with a fresh cache.

### Step 3: Check Console Logs
When the app starts, you should see:
```
Supabase Configuration: {
  url: 'https://pgmooiaxbythmnjtdavs.supabase.co',
  hasKey: true,
  platform: 'android' or 'ios'
}
```

### Step 4: Try Login Again
1. Enter your email and password
2. Tap "Sign In"
3. Check the console for login logs:
   - `🔐 Attempting login for: your@email.com`
   - `✅ Login successful` (if successful)
   - `❌ Login error: ...` (if there's an auth error)

## Common Issues & Solutions

### Issue 1: Still Getting "Failed to fetch"
**Possible Causes:**
- No internet connection
- Firewall blocking Supabase
- VPN interfering with connection

**Solutions:**
1. Check your internet connection
2. Try disabling VPN if you're using one
3. Check if you can access https://pgmooiaxbythmnjtdavs.supabase.co in your browser

### Issue 2: "Invalid login credentials"
**This is actually GOOD!** It means the network connection is working, but the email/password is wrong.

**Solution:** Make sure you're using the correct credentials or create a new account.

### Issue 3: Environment variables not loading
**Check console for:**
```
❌ Missing Supabase environment variables!
```

**Solution:**
1. Make sure you restarted the dev server after editing `app.json`
2. Try clearing cache with `Shift + R`
3. If still not working, try `npm start --clear`

## Testing Checklist

- [ ] Restart development server
- [ ] Clear app cache (Shift + R)
- [ ] Check console shows Supabase config
- [ ] Try login with valid credentials
- [ ] Check for success/error logs
- [ ] If successful, verify you're redirected to home screen

## Additional Debugging

If the issue persists, check the following in the console:

1. **Supabase URL is correct:**
   ```
   url: 'https://pgmooiaxbythmnjtdavs.supabase.co'
   ```

2. **Anon key is present:**
   ```
   hasKey: true
   ```

3. **Platform is detected:**
   ```
   platform: 'android' or 'ios' or 'web'
   ```

## Network Debugging Commands

To test if Supabase is reachable:

```bash
# Test from your computer
curl https://pgmooiaxbythmnjtdavs.supabase.co/rest/v1/

# Should return: {"message":"The server is running"}
```

## Next Steps After Fix

Once login is working:
1. Test signup flow
2. Test forgot password
3. Test Google OAuth (if configured)
4. Test on both Android and iOS if possible

---

**Note:** The changes made are:
1. Enhanced error handling in `supabase.ts`
2. Added Supabase config to `app.json`

Both changes are non-breaking and improve the app's reliability!
