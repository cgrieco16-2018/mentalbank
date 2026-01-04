# Mental Bank - Personal Productivity Tracker

## Overview

Mental Bank is a single-user, local-first React Native productivity application built with Expo. The app helps users track their personal value and productivity by setting income goals, logging daily "value events" with custom pay rates, and maintaining a visual ledger of their accomplishments. It features a calming, minimalist design with drawing capabilities, calendar views, and progress tracking against personal contracts/goals.

The application runs on iOS, Android, and Web platforms using Expo's cross-platform framework.

## Version Tracking

**IMPORTANT: Always increment the version in `app.json` when making changes.**

**Current Version: 1.1.10** (Last updated: November 29, 2025)

Version format: MAJOR.MINOR.PATCH
- PATCH (x.x.+1): Bug fixes, small improvements, UI tweaks
- MINOR (x.+1.0): New features, significant enhancements
- MAJOR (+1.0.0): Breaking changes, major redesigns

### Recent Changes
- 1.1.10: Fixed Weekly Review layout - date headers now perfectly align with status boxes by using identical row structure (header treated as data row with transparent elements)
- 1.1.9: Added Week/Month review modals in Ledger - clickable progress bars open commitment compliance views with daily grid (weekly) and heat map (monthly), recurrence picker added to Value Events form, recurrence now required for all value events
- 1.1.8: Implemented step-by-step picker for Ledger Add Value Event - Category → Tag → Event navigation with search bar, recently used shortcuts, and back navigation to prevent overwhelming lists
- 1.1.7: Added tag support for value events - tag picker in form (select existing or create new), tag grouping in Value Events screen (categories → tags → events hierarchy)
- 1.1.6: Value Events screen now shows collapsible category sections (collapsed by default), added tags and recurrence fields to data model
- 1.1.5: Fixed contract start date editing on web (now uses text input), fixed date display to prevent timezone drift
- 1.1.4: Removed Mental Pay Rate from Settings (now only shown on Contract), fixed backup restore loading on Contract screen
- 1.1.3: Fixed modal scrolling in iOS native builds, improved guidance popup scroll behavior
- 1.1.2: Added backup/restore functionality with full data export/import
- 1.1.1: Calendar history view, Reality Income tracking, affirmations library
- 1.1.0: Initial feature-complete release with Contract, Ledger, Value Events, Happenings
- 1.0.0: Initial release

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 with bottom tab navigation and native stack navigators
- **UI Components**: Custom themed components with light/dark mode support
- **Animations**: React Native Reanimated for smooth, performant animations
- **Gestures**: React Native Gesture Handler for touch interactions
- **Drawing**: Shopify React Native Skia for canvas-based drawing functionality

**Component Structure**:
- Atomic design pattern with reusable themed components (ThemedView, ThemedText, Button, Card)
- Screen-level components with integrated scroll views that handle keyboard awareness and safe area insets
- Custom hooks for theming (`useTheme`), color schemes, and screen insets

**Navigation Hierarchy**:
- 4-tab bottom navigation (Contract, Ledger, Value Events, Settings)
- Each tab has its own stack navigator allowing for nested screens
- Modal presentation for add/edit screens
- Calendar/History view accessible from Settings > History Calendar
- Transparent, blurred headers on iOS for modern aesthetics

**State Management**:
- Local component state with React hooks
- No global state management library (Redux, MobX, etc.)
- Data persistence handled through AsyncStorage

**Theming System**:
- Dual theme support (light/dark) defined in constants
- Theme colors include background layers (root, default, secondary, tertiary) for depth
- Platform-specific color schemes that adapt to system preferences
- Drawing color palette with calming tones (Sage, Lavender, Coral, Sky, Charcoal)

### Data Architecture

**Storage Solution**: AsyncStorage (React Native AsyncStorage)
- Key-value storage for all app data
- No backend server or database
- All data stored locally on device

**Data Models**:
1. **Contract**: Annual income goals, mental pay rate (auto-calculated as annual goal / 1000), start date
2. **ValueEventDefinition**: Pre-defined value events with name, category (Happiness/Success/Prosperity), default units, unit type, pay rate multiplier, optional tags for organization, and required recurrence pattern (daily/weekly/monthly/yearly) - these are intentionally designed actions that support goals
3. **ValueEvent**: Logged execution of a value event definition with units, pay rate, calculated amount, and reference to the definition
4. **RealityIncome**: Actual money received (business revenue, salary, payments) that subtracts from daily deposits
5. **DayHappenings**: Daily notes and drawing paths for journaling
6. **UserProfile**: Display name and avatar
7. **AppSettings**: Default pay rate, stylus pressure sensitivity, export format preferences

**Data Flow**:
- Storage utility module (`utils/storage.ts`) provides abstraction over AsyncStorage
- CRUD operations for contracts, value events, reality incomes, happenings, profile, and settings
- Calculations utility module (`utils/calculations.ts`) handles business logic for amounts, balances, progress
- Net calculations subtract reality income from value event deposits to track true progress

**Mental Bank Methodology**:
- Value Events represent "fantasy" deposits for personal value created (time, effort, skills)
- Reality Income represents actual money received (business revenue, salary, payments)
- Net Total = Deposits - Reality Income (can be negative per Mental Bank system)
- Running Balance tracks cumulative net progress toward annual goals

### Authentication & Authorization

**Authentication**: None required
- Single-user application
- No login, signup, or user management
- No authentication tokens or session management
- Profile customization available through Settings screen

**Rationale**: As a personal productivity tool, the app is designed for individual use on a personal device. Authentication would add unnecessary complexity and friction to the user experience.

### Key Features & Design Patterns

**Error Handling**:
- Custom ErrorBoundary component wrapping the entire app
- Development mode shows detailed error information
- Production mode shows user-friendly error screen with restart option

**Responsive Design**:
- Safe area context for notch/island support
- Dynamic inset calculations for headers and tab bars
- Keyboard-aware scroll views that adjust content when keyboard appears
- Platform-specific implementations (iOS blur effects, Android adaptations, web fallbacks)

**Performance Optimizations**:
- React 19 with new architecture enabled
- React Compiler experimental feature enabled
- Reanimated worklets for 60fps animations
- FlatList for efficient rendering of long lists

**Drawing Canvas**:
- Custom drawing component using Skia for high-performance rendering
- Color palette selection
- Eraser functionality
- Path storage as SVG strings for persistence
- Apple Pencil pressure sensitivity support (configurable)

**Platform Adaptations**:
- iOS: Blur effects, transparent headers, native gestures
- Android: Edge-to-edge display, adaptive icons
- Web: Fallback implementations for native-only features (KeyboardAwareScrollView)

**Backup & Restore**:
- Full data export to JSON file with versioning
- Import from backup file with complete data replacement
- Uses expo-file-system v19 class-based API (File, Paths.cache)
- Sharing via expo-sharing for cross-platform file export
- Document picker for selecting backup files to restore
- Clears all existing data before restore to prevent stale entries

## External Dependencies

### Core Framework
- **Expo SDK 54**: Cross-platform app development framework
- **React Native 0.81**: Mobile app framework
- **React 19**: UI library

### Navigation
- **@react-navigation/native**: Navigation framework
- **@react-navigation/bottom-tabs**: Tab-based navigation
- **@react-navigation/native-stack**: Native stack navigation

### UI & Interaction
- **react-native-reanimated**: High-performance animations
- **react-native-gesture-handler**: Native gesture handling
- **react-native-keyboard-controller**: Keyboard management
- **react-native-safe-area-context**: Safe area insets handling
- **@expo/vector-icons**: Icon library (Feather icons)
- **expo-blur**: Blur effects for iOS
- **expo-haptics**: Haptic feedback

### Graphics & Drawing
- **@shopify/react-native-skia**: 2D graphics rendering for drawing canvas
- **react-native-svg**: SVG rendering support

### Storage & Data
- **@react-native-async-storage/async-storage**: Local key-value storage

### Platform Features
- **@react-native-community/datetimepicker**: Native date/time picker
- **expo-web-browser**: In-app browser functionality
- **expo-splash-screen**: Splash screen management
- **expo-status-bar**: Status bar styling

### Development Tools
- **TypeScript**: Type safety
- **ESLint**: Code linting with Expo config
- **Prettier**: Code formatting
- **babel-plugin-module-resolver**: Path alias support (@/ for root imports)

### Design System Constants
- Centralized theme constants for colors, spacing, typography, border radius
- Shadow definitions for elevation
- Font family specifications
- Consistent spacing scale (xs, sm, md, lg, xl, xxl)