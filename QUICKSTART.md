# 🚀 Math4Code Mobile App - Quick Start Guide

## ✅ What's Been Built

A **premium React Native mobile app** with:
- ✨ Beautiful authentication (Login/Signup)
- ✨ Student dashboard with stats
- ✨ Bottom tab navigation
- ✨ Premium UI components
- ✨ Supabase backend integration
- ✨ TypeScript for type safety

## 📱 Setup Instructions

### Step 1: Navigate to App Folder
```bash
cd math4code-app
```

### Step 2: Create Environment File
Create a file named `.env` in the `math4code-app` folder:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get these values from your web app's `.env.local` file!**

### Step 3: Install Dependencies (if needed)
```bash
npm install
```

### Step 4: Start the App
```bash
npm start
```

This will open Expo Dev Tools in your browser.

### Step 5: Run on Your Device

**Option A: Physical Device (Recommended)**
1. Install "Expo Go" app from Play Store (Android) or App Store (iOS)
2. Scan the QR code shown in terminal/browser
3. App will load on your phone!

**Option B: Android Emulator**
- Press `a` in the terminal
- Make sure Android Studio emulator is running

**Option C: iOS Simulator (Mac only)**
- Press `i` in the terminal
- Requires Xcode installed

## 🎯 What You Can Test

1. **Login Screen** - Beautiful gradient background
2. **Signup** - Create account with referral code
3. **Dashboard** - See stats, quick actions, courses
4. **Navigation** - Switch between 5 tabs
5. **Auto Login** - Session persists between app restarts

## 🎨 Features

### Authentication
- Email/password login
- Sign up with full name & referral code
- Auto session management
- Smooth transitions

### Dashboard
- Welcome header with user name
- 4 gradient stats cards
- Quick action buttons
- Course carousel
- Upcoming exams list
- Notification badge

### Navigation
- 5 bottom tabs:
  - 🏠 Home (Dashboard)
  - 📚 Courses
  - 📝 Exams
  - 🎁 Rewards
  - 👤 Profile

## 🐛 Troubleshooting

### "Module not found" errors
```bash
npm install
npm start -- --clear
```

### "Network request failed"
- Check your `.env` file has correct Supabase credentials
- Make sure you're connected to internet

### App won't load
```bash
# Clear cache and restart
npm start -- --clear
```

### Expo Go issues
- Make sure phone and computer are on same WiFi
- Try using tunnel mode: `npm start -- --tunnel`

## 📂 Project Structure

```
math4code-app/
├── src/
│   ├── components/          # UI components
│   │   ├── GradientButton.tsx
│   │   ├── InputField.tsx
│   │   └── GlassCard.tsx
│   ├── constants/           # Design system
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── navigation/          # Navigation
│   │   ├── AuthNavigator.tsx
│   │   └── StudentNavigator.tsx
│   ├── screens/             # Screens
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SignupScreen.tsx
│   │   └── student/
│   │       └── DashboardScreen.tsx
│   ├── services/            # Backend
│   │   └── supabase.ts
│   ├── hooks/               # Custom hooks
│   │   └── useCurrentUser.ts
│   └── types/               # TypeScript types
│       └── index.ts
├── App.tsx                  # Main entry
├── package.json
└── README.md
```

## 🎨 Design System

### Colors
- **Primary**: Indigo (#6366F1)
- **Secondary**: Purple (#8B5CF6)
- **Success**: Green (#10B981)
- **Warning**: Amber (#F59E0B)

### Components
- **GradientButton**: 4 variants, 3 sizes
- **InputField**: With labels, errors, icons
- **GlassCard**: Glassmorphism effect

## 📝 Next Steps

The core app is ready! You can now:

1. **Test the app** on your device
2. **Add more screens** (Courses, Exams, Rewards)
3. **Connect real data** from Supabase
4. **Customize design** to your liking
5. **Add features** as needed

## 💡 Tips

- Use `npm start -- --clear` to clear cache
- Press `r` in terminal to reload app
- Press `m` to toggle menu
- Shake device to open developer menu

## 🎉 You're All Set!

Your Math4Code mobile app is ready to use!

**Happy coding!** 🚀
