# Mental Bank - Architecture & Project Overview

**Version:** 1.1.10
**Last Updated:** January 2026
**Platform:** React Native (Expo) - iOS, Android, Web

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture Patterns](#architecture-patterns)
5. [Data Models](#data-models)
6. [Key Components](#key-components)
7. [Navigation Structure](#navigation-structure)
8. [Business Logic](#business-logic)
9. [Development & Deployment](#development--deployment)
10. [Design System](#design-system)

---

## Application Overview

### What is Mental Bank?

Mental Bank is a personal productivity and mindset training application built on the "Mental Bank" psychological framework. It helps users track personal value, build positive habits, and program their subconscious to accept higher levels of success through consistent reinforcement.

### Core Concept

The app tracks two types of income:
- **Fantasy Income (Value Events)**: Personal accomplishments and effort assigned monetary value based on an annual goal
- **Reality Income**: Actual money received from business/salary

The difference creates a "running balance" that shows progress toward annual goals, helping users visualize their personal development journey.

### Key Features

1. **Contract System** - Set annual income goals with auto-calculated "mental pay rate" (goal ÷ 1000)
2. **Value Events** - Pre-defined actions across three categories (Happiness, Success, Prosperity) with customizable pay rates, tags, and recurrence patterns
3. **Daily Ledger** - Log daily value events and reality income with running balance calculations
4. **Happenings/Journal** - Daily notes and drawing canvas with Apple Pencil support
5. **Affirmations Library** - Create and track daily affirmations
6. **Calendar History** - Visual calendar with day indicators and historical ledger access
7. **Weekly/Monthly Reviews** - Track commitment compliance with progress visualizations
8. **Backup/Restore** - Full data export/import functionality with CSV support
9. **Cross-platform** - Runs on iOS, Android, and Web

---

## Technology Stack

### Core Framework
- **React Native** 0.81.5
- **Expo SDK** 54 (managed workflow)
- **React** 19.1.0 (with new architecture support)
- **TypeScript** 5.9.2

### Navigation
- `@react-navigation/native` v7
- `@react-navigation/bottom-tabs` v7 (4-tab navigation)
- `@react-navigation/native-stack` v7 (stack navigators)

### UI & Interactions
- `react-native-reanimated` 4.1.1 - 60fps animations
- `react-native-gesture-handler` 2.28.0 - Touch gestures
- `react-native-keyboard-controller` 1.18.5 - Keyboard management
- `react-native-safe-area-context` 5.6.0 - Safe area handling
- `expo-blur` 15.0.7 - iOS blur effects
- `expo-haptics` 15.0.7 - Haptic feedback
- `@expo/vector-icons` 15.0.2 - Feather icon set

### Graphics & Drawing
- `@shopify/react-native-skia` 2.2.12 - High-performance 2D canvas
- `react-native-svg` 15.15.0 - SVG rendering

### Storage
- `@react-native-async-storage/async-storage` 2.2.0 - Local key-value storage (no backend)

### Platform Features
- `@react-native-community/datetimepicker` 8.5.1 - Native date picker
- `expo-document-picker` 14.0.7 - File selection
- `expo-file-system` 19.0.19 - File operations
- `expo-sharing` 14.0.7 - Share functionality
- `expo-clipboard` 8.0.7 - Clipboard access

### Development Tools
- **ESLint** 9.25.0 with expo-config
- **Prettier** 3.6.2 (code formatting)
- **babel-plugin-module-resolver** 5.0.2 (`@/` path aliases)

---

## Project Structure

```
mentalbank/
├── App.tsx                    # Root component with providers
├── index.js                   # Expo entry point
├── app.json                   # Expo configuration
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript config with @ alias
├── babel.config.js            # Babel config with path resolution
├── eslint.config.js           # ESLint with Expo & Prettier
├── design_guidelines.md       # Comprehensive design specs
├── replit.md                  # Project documentation
│
├── screens/                   # 8 screen components (~3,000 LOC)
│   ├── LedgerScreen.tsx       # Main daily ledger (1,864 lines)
│   ├── AddValueEventScreen.tsx # Value event modal (930 lines)
│   ├── ValueEventsScreen.tsx  # Event definitions manager (1,223 lines)
│   ├── ContractScreen.tsx     # Annual goal setting (432 lines)
│   ├── SettingsScreen.tsx     # Settings & backup (922 lines)
│   ├── CalendarScreen.tsx     # History calendar (196 lines)
│   ├── AffirmationsScreen.tsx # Affirmations library (524 lines)
│   └── AddRealityIncomeScreen.tsx # Reality income entry (135 lines)
│
├── components/                # 14 reusable components (~800 LOC)
│   ├── ThemedView.tsx         # Themed container
│   ├── ThemedText.tsx         # Themed text
│   ├── Button.tsx             # Custom button with animations
│   ├── Card.tsx               # Card container
│   ├── StyledInput.tsx        # Form input
│   ├── DrawingCanvas.tsx      # Skia drawing canvas (289 lines)
│   ├── ValueEventRow.tsx      # Event list item
│   ├── ErrorBoundary.tsx      # Error boundary wrapper
│   ├── ErrorFallback.tsx      # Error UI (180 lines)
│   ├── HeaderTitle.tsx        # Custom header title
│   ├── ScreenScrollView.tsx   # Base scroll view
│   ├── ScreenKeyboardAwareScrollView.tsx # Keyboard-aware scroll
│   ├── ScreenFlatList.tsx     # Base flat list
│   └── Spacer.tsx             # Layout spacer
│
├── navigation/                # 7 navigation files
│   ├── MainTabNavigator.tsx   # 4-tab bottom navigation
│   ├── ContractStackNavigator.tsx
│   ├── LedgerStackNavigator.tsx
│   ├── ValueEventsStackNavigator.tsx
│   ├── SettingsStackNavigator.tsx
│   ├── CalendarStackNavigator.tsx
│   └── screenOptions.ts       # Common nav options
│
├── utils/                     # Core business logic (~550 LOC)
│   ├── types.ts               # TypeScript interfaces (100 lines)
│   ├── storage.ts             # AsyncStorage abstraction (364 lines)
│   └── calculations.ts        # Business calculations (170 lines)
│
├── constants/
│   └── theme.ts               # Design system (173 lines)
│
├── hooks/                     # 4 custom hooks
│   ├── useTheme.ts            # Theme context hook
│   ├── useColorScheme.ts      # Platform color scheme
│   ├── useColorScheme.web.ts  # Web-specific override
│   └── useScreenInsets.ts     # Safe area calculations
│
├── assets/images/             # App icons & empty states
│   ├── icon.png               # App icon (1024x1024)
│   ├── splash-icon.png        # Splash screen
│   ├── favicon.png            # Web favicon
│   ├── android-icon-*.png     # Android adaptive icons
│   ├── avatar-preset.png      # Default avatar
│   ├── empty-ledger.png       # Empty state illustration
│   └── empty-calendar.png     # Empty calendar illustration
│
├── scripts/
│   ├── build.js               # Web build script
│   └── landing-page-template.html # Landing page template
│
└── public/
    └── mental-bank-backup-corrected.json # Sample backup data
```

**Code Statistics:**
- Total application code: ~8,725 lines
- 8 screens, 14 components, 3 utility modules
- 4 custom hooks, 7 navigation files
- No test files currently

---

## Architecture Patterns

### Architecture Style

**Local-First Application**
- All data stored in AsyncStorage
- No backend server or API
- Single-user application
- Works completely offline

**Component-Based Architecture**
- Atomic design principles
- Reusable UI primitives
- Screen-container pattern
- Screens manage data, components handle presentation

### State Management

**No Global State Library**
- Local component state with React hooks (`useState`, `useEffect`)
- Data fetched on screen focus using `useFocusEffect`
- Optimistic UI updates with immediate feedback
- Storage abstraction layer handles persistence

**Data Flow:**
```
User Action → Component State → Storage Layer → AsyncStorage
                    ↓
            UI Update (Optimistic)
```

### Design Patterns

1. **Separation of Concerns**
   - Calculation logic in `utils/calculations.ts`
   - Storage operations in `utils/storage.ts`
   - UI components separate from business logic

2. **Custom Hooks**
   - `useTheme` - Theme context access
   - `useScreenInsets` - Safe area calculations
   - `useColorScheme` - Platform color scheme detection

3. **Error Boundaries**
   - `ErrorBoundary` wraps app for graceful error handling
   - `ErrorFallback` provides user-friendly error UI
   - Development mode shows detailed error info

4. **Platform-Specific Code**
   - iOS blur effects
   - Android edge-to-edge display
   - Web fallbacks for native features

5. **Composition Over Inheritance**
   - Base screen components (`ScreenScrollView`, `ScreenFlatList`)
   - Themed components (`ThemedView`, `ThemedText`)
   - Composed into complex screens

### Code Organization

- **Path Aliases:** `@/` prefix for clean imports
- **Type Definitions:** Centralized in `utils/types.ts`
- **Constants:** Design tokens in `constants/theme.ts`
- **Navigation:** Separated by stack (one file per stack navigator)

---

## Data Models

### Core Interfaces

Located in `/home/user/mentalbank/utils/types.ts`:

#### Contract
```typescript
interface Contract {
  annualGoal: number;        // User's annual income goal
  mentalPayRate: number;     // Auto-calculated: annualGoal / 1000
  startDate: string;         // YYYY-MM-DD format
}
```

#### Value Event Definition
```typescript
interface ValueEventDefinition {
  id: string;
  name: string;
  description?: string;
  category: "happiness" | "success" | "prosperity";
  defaultUnits: number;
  unitType: string;          // hours, items, pages, tasks, etc.
  payRateMultiplier: number; // Multiplied by mentalPayRate
  isActive: boolean;
  createdAt: string;
  usageCount: number;
  tags?: string[];           // Organization tags
  recurrence: "daily" | "weekly" | "monthly" | "yearly";
}
```

#### Value Event (Logged Instance)
```typescript
interface ValueEvent {
  id: string;
  date: string;              // YYYY-MM-DD
  description: string;
  units: number;
  unitType: string;
  payRate: number;
  amount: number;            // Calculated: units * payRate
  valueEventDefinitionId?: string; // Reference to definition
}
```

#### Reality Income
```typescript
interface RealityIncome {
  id: string;
  date: string;
  description: string;
  amount: number;            // Actual money received
  source?: string;
}
```

#### Day Happenings (Journal)
```typescript
interface DayHappenings {
  date: string;
  notes: string;
  drawingPaths?: DrawingPath[];
}

interface DrawingPath {
  path: string;              // SVG path string
  color: string;
  width: number;
}
```

#### Affirmation
```typescript
interface Affirmation {
  id: string;
  text: string;
  category?: "happiness" | "success" | "prosperity" | "general";
  createdAt: string;
  usageCount: number;
}

interface DailyAffirmations {
  date: string;
  affirmationIds: string[];
  customAffirmations?: string[];
}
```

#### User Profile & Settings
```typescript
interface UserProfile {
  displayName: string;
  avatarUri?: string;
}

interface AppSettings {
  defaultPayRate: number;
  applePencilPressure: number;
  exportFormat: "pdf" | "csv";
}
```

### Storage Keys

AsyncStorage keys (all prefixed with `@mental_bank_`):
- `contract`
- `value_events` (array)
- `value_event_definitions` (array)
- `reality_income` (array)
- `happenings` (array)
- `affirmations` (array)
- `daily_affirmations` (array)
- `profile`
- `settings`

---

## Key Components

### Screens (8 total)

#### LedgerScreen (1,864 LOC)
The main daily ledger screen - most complex component in the app.

**Responsibilities:**
- Display today's value events and reality income
- Show running balance calculation
- Happenings section (notes + drawing canvas)
- Affirmations display
- Weekly/monthly review compliance tracking

**Key Features:**
- Real-time balance calculations
- Empty states with illustrations
- Swipeable list items for delete
- Collapsible sections
- Apple Pencil drawing support

#### ValueEventsScreen (1,223 LOC)
Manage value event definitions.

**Features:**
- Organized by category (Happiness, Success, Prosperity)
- Tag-based filtering
- Collapsible category sections
- Usage count tracking
- Active/inactive toggle

#### AddValueEventScreen (930 LOC)
Modal for logging value events.

**Unique UX:**
- Step-by-step picker (category → tag → event)
- Search functionality to filter events
- Prevents overwhelming lists
- Unit and pay rate customization
- Quick add from recent events

#### SettingsScreen (922 LOC)
Settings and data management.

**Features:**
- Profile customization (name, avatar)
- Full backup/restore (JSON export/import)
- CSV export for spreadsheet analysis
- Data reset with confirmation
- Version display

#### ContractScreen (432 LOC)
Annual goal setting.

**Features:**
- Annual income goal input
- Auto-calculated mental pay rate (goal ÷ 1000)
- Contract start date selection
- Visual goal progress display

#### AffirmationsScreen (524 LOC)
Affirmations library management.

**Features:**
- Create/edit/delete affirmations
- Category organization
- Usage tracking
- Daily affirmation selection

#### CalendarScreen (196 LOC)
Historical ledger access.

**Features:**
- Monthly calendar view
- Day indicators (has data, is today)
- Navigate to specific date's ledger

#### AddRealityIncomeScreen (135 LOC)
Log actual income received.

**Features:**
- Amount input
- Description and source fields
- Subtracts from fantasy deposits

### Reusable Components (14 total)

**Base Components:**
- `ThemedView` / `ThemedText` - Automatic theme support
- `Button` - Animated custom button
- `Card` - Container with styling
- `StyledInput` - Form input component
- `Spacer` - Layout spacing

**Screen Containers:**
- `ScreenScrollView` - Base scroll view
- `ScreenKeyboardAwareScrollView` - Keyboard-aware scroll
- `ScreenFlatList` - Base flat list

**Specialized:**
- `DrawingCanvas` - Skia-based drawing with Apple Pencil (289 LOC)
- `ValueEventRow` - List item for value events
- `ErrorBoundary` / `ErrorFallback` - Error handling (180 LOC)
- `HeaderTitle` - Custom navigation header

---

## Navigation Structure

### Tab Navigator (4 tabs)

```
MainTabNavigator
├── Contract Tab
│   └── ContractStackNavigator
│       └── ContractMain
├── Ledger Tab ⭐ (initial route)
│   └── LedgerStackNavigator
│       ├── LedgerMain
│       ├── AddValueEvent (modal)
│       ├── AddRealityIncome (modal)
│       └── Calendar
├── Value Events Tab
│   └── ValueEventsStackNavigator
│       └── ValueEventsMain
└── Settings Tab
    └── SettingsStackNavigator
        ├── SettingsMain
        └── Affirmations
```

### Navigation Features
- iOS blur effects on tab bar
- Custom header titles with icons
- Modal presentations for add/edit screens
- Platform-specific navigation options
- Deep linking support (`mentalbank://`)

---

## Business Logic

### Mental Bank Calculations

Located in `/home/user/mentalbank/utils/calculations.ts`:

#### Core Formula
```typescript
mentalPayRate = annualGoal / 1000

valueEventAmount = units × payRate
  where payRate = mentalPayRate × payRateMultiplier

deposits = Σ(all value event amounts)
realityIncome = Σ(all reality income amounts)
netBalance = deposits - realityIncome
runningBalance = cumulative netBalance from contract start date
progress = (netBalance / annualGoal) × 100
```

#### Key Functions
- `calculateMentalPayRate(annualGoal)`
- `calculateValueEventAmount(units, payRate)`
- `calculateDailyBalance(valueEvents, realityIncome)`
- `calculateRunningBalance(allDays, contractStartDate)`
- `calculateProgress(runningBalance, annualGoal)`

### Storage Abstraction

Located in `/home/user/mentalbank/utils/storage.ts`:

**Key Functions:**
- `loadContract()` / `saveContract(contract)`
- `loadValueEvents()` / `saveValueEvents(events)`
- `loadValueEventDefinitions()` / `saveValueEventDefinitions(definitions)`
- `loadRealityIncome()` / `saveRealityIncome(income)`
- `loadHappenings()` / `saveHappenings(happenings)`
- `loadAffirmations()` / `saveAffirmations(affirmations)`
- `exportAllData()` - Full backup
- `importAllData(jsonData)` - Restore from backup
- `resetAllData()` - Clear all data

**Features:**
- JSON serialization/deserialization
- Error handling with fallbacks
- Versioned backup format
- Data validation on import

---

## Development & Deployment

### Development Commands

```bash
# Development with Replit proxy
npm run dev

# Standard Expo development
npm start

# Platform-specific
npm run android
npm run ios
npm run web

# Code quality
npm run lint
npm run format
```

### Web Build

```bash
# Build for static hosting
npx expo export --platform web --output-dir static-build
```

**Output:** `static-build/` directory for static hosting

### Native Builds (EAS)

```bash
# iOS preview build
npx eas build --platform ios --profile preview

# Android preview build
npx eas build --platform android --profile preview

# Over-the-air update
npx eas update --auto
```

### Environment Configuration

**Expo Config (`app.json`):**
- Bundle ID: `com.mentalbank.app`
- Version: `1.1.10`
- Orientation: Portrait only
- New Architecture: Disabled
- React Compiler: Disabled (experimental)

**Platform-Specific:**
- **iOS:** Tablet support enabled, blur effects
- **Android:** Edge-to-edge, adaptive icons, predictive back disabled
- **Web:** Single-page output, fallback for native features

### Testing Strategy

**Current State:** No automated tests

**Recommended (if implementing):**
- Jest for unit tests
- React Native Testing Library for components
- Test coverage priorities:
  - Calculation utilities
  - Storage operations
  - Data validation
  - Critical user flows

**Quality Assurance:**
- ESLint with Expo configuration
- Prettier for code formatting
- TypeScript strict mode
- Manual testing on all platforms

---

## Design System

Located in `/home/user/mentalbank/constants/theme.ts`:

### Color Palette

**Primary Colors:**
- Primary Green: `#10B981` (Emerald)
- Primary Gold: `#F59E0B` (Amber)
- Secondary Sage: `#84CC16` (Lime)
- Secondary Lavender: `#A855F7` (Purple)

**Categories:**
- Happiness: `#10B981` (Green)
- Success: `#F59E0B` (Gold)
- Prosperity: `#A855F7` (Purple)

**Light Theme:**
- Background: `#FFFFFF`
- Card: `#F9FAFB`
- Border: `#E5E7EB`
- Text Primary: `#111827`
- Text Secondary: `#6B7280`

**Dark Theme:**
- Background: `#111827`
- Card: `#1F2937`
- Border: `#374151`
- Text Primary: `#F9FAFB`
- Text Secondary: `#9CA3AF`

### Typography

```typescript
sizes: {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  xxxxl: 36
}

weights: {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700"
}
```

### Spacing

```typescript
spacing: {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40
}
```

### Shadows & Effects

- Border radius: `8px` default, `12px` large
- iOS blur: `light` / `dark` based on theme
- Haptic feedback on interactions
- Smooth animations with Reanimated

---

## Key Technical Decisions

### Why Expo Managed Workflow?
- Cross-platform development (iOS, Android, Web)
- Hot reload for faster development
- Built-in platform features (blur, haptics, file system)
- Simplified build process with EAS

### Why AsyncStorage (No Backend)?
- Local-first privacy (no data leaves device)
- Offline-first experience
- Simpler architecture (no auth, no API)
- Perfect for single-user productivity app

### Why No Global State Library?
- Simple data flow with local state
- Storage abstraction handles persistence
- Each screen manages its own data
- Refetch on focus ensures data freshness
- Avoids complexity for small app

### Why TypeScript?
- Type safety for data models
- Better IDE support
- Catch errors at compile time
- Self-documenting code

### Why React Navigation v7?
- Native stack navigators for performance
- Platform-specific navigation patterns
- Modal presentations
- Deep linking support

---

## Future Considerations

### Potential Enhancements
- Automated testing suite
- Data sync across devices (iCloud, Google Drive)
- Statistics and insights dashboard
- Goal templates and presets
- Export to more formats (PDF with charts)
- Reminders and notifications
- Widgets for home screen

### Technical Improvements
- Enable React Native New Architecture
- Add performance monitoring
- Implement error tracking (Sentry)
- Add analytics (privacy-respecting)
- Optimize bundle size
- Implement code splitting

### Architecture Evolution
- Consider global state if complexity increases
- Add caching layer for calculations
- Implement data migration system
- Add versioned schema for backward compatibility

---

## Resources

**Documentation:**
- `design_guidelines.md` - Comprehensive design specifications
- `replit.md` - Project documentation and version history
- This file - Architecture and technical overview

**Entry Points:**
- `index.js` - Expo entry point
- `App.tsx` - Root component with providers
- `navigation/MainTabNavigator.tsx` - Navigation root

**Key Files:**
- `utils/types.ts` - All TypeScript interfaces
- `utils/storage.ts` - Data persistence layer
- `utils/calculations.ts` - Business logic
- `constants/theme.ts` - Design system

---

*This document provides a comprehensive overview of the Mental Bank application's architecture, design decisions, and implementation details. For specific design specifications, refer to `design_guidelines.md`. For development history, see `replit.md`.*
