# Math4Code Mobile App

A premium React Native mobile application for the Math4Code learning platform, built with Expo and TypeScript.

## 🚀 Features

### Student Features
- ✅ **Authentication** - Login, Signup with Supabase
- ✅ **Dashboard** - Beautiful stats cards, quick actions, continue learning
- 📚 **Courses** - Browse and enroll in courses
- 📝 **Exams** - Take exams and view results
- 🎁 **Rewards & Gamification** - Coins, streaks, missions, badges, leaderboard
- 👤 **Profile** - Manage account settings

### Premium Design
- 🎨 Gradient buttons and cards
- ✨ Glassmorphism effects
- 🌈 Vibrant color palette
- 📱 Bottom tab navigation
- 🎭 Smooth animations
- 🎯 Touch-optimized UI

## 📦 Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing
- **Supabase** for backend
- **React Query** for data fetching
- **Expo Linear Gradient** for premium effects
- **React Native Reanimated** for animations

## 🛠️ Setup

### Prerequisites
- Node.js 16+ installed
- Expo CLI installed globally: `npm install -g expo-cli`
- Expo Go app on your phone (for testing)

### Installation

1. **Navigate to the app folder**:
   ```bash
   cd math4code-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Run on your device**:
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator (macOS only)

## 📱 Running the App

### Development
```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS (macOS only)
npm run web        # Run on web browser
```

### Building for Production
```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## 📂 Project Structure

```
math4code-app/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── GradientButton.tsx
│   │   ├── InputField.tsx
│   │   └── GlassCard.tsx
│   ├── constants/         # Design system
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── hooks/             # Custom React hooks
│   │   └── useCurrentUser.ts
│   ├── navigation/        # Navigation setup
│   │   ├── AuthNavigator.tsx
│   │   └── StudentNavigator.tsx
│   ├── screens/           # App screens
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   └── student/
│   │       └── DashboardScreen.tsx
│   ├── services/          # API services
│   │   └── supabase.ts
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   └── utils/             # Helper functions
├── App.tsx                # Main app entry
└── package.json
```

## 🎨 Design System

### Colors
- **Primary**: Indigo (#6366F1)
- **Secondary**: Purple (#8B5CF6)
- **Success**: Green (#10B981)
- **Warning**: Amber (#F59E0B)
- **Error**: Red (#EF4444)

### Typography
- **Headings**: H1-H5 with bold weights
- **Body**: Regular, Large, Small variants
- **Captions**: Small text for labels

### Spacing
- Based on 4px grid system
- xs (4px) to 5xl (64px)

## 🔐 Authentication

The app uses Supabase for authentication:
- Email/Password login
- Sign up with referral code support
- Session persistence with AsyncStorage
- Auto-refresh tokens

## 🌐 API Integration

All API calls reuse the existing Supabase backend:
- `profiles` - User data
- `courses` - Course content
- `enrollments` - Course enrollments
- `exams` - Exam data
- `user_rewards` - Gamification data

## 🎯 Features Roadmap

- [x] Authentication (Login, Signup)
- [x] Student Dashboard
- [ ] Courses List & Details
- [ ] Video/PDF Player
- [ ] Exam Taking Flow
- [ ] Results & Analytics
- [ ] Rewards Hub
- [ ] Daily Missions
- [ ] Leaderboard
- [ ] Profile & Settings
- [ ] Admin Panel

## 🐛 Troubleshooting

### Common Issues

**1. Metro bundler errors**
```bash
npm start -- --clear
```

**2. Module not found errors**
```bash
rm -rf node_modules
npm install
```

**3. iOS build issues**
```bash
cd ios && pod install && cd ..
```

## 📝 Notes

- This is a **separate mobile app** - the web app is not affected
- Uses the **same Supabase backend** as the web app
- **No backend changes** required
- Designed for **Android and iOS**

## 🤝 Contributing

This is a private project for Math4Code.

## 📄 License

Private - All rights reserved

---

**Built with ❤️ using React Native & Expo**
