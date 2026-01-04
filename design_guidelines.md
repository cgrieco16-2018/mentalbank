# Mental Bank App - Design Guidelines

## Architecture Decisions

### Authentication
**No authentication required** - This is a single-user, local-first productivity app.

**Profile/Settings Screen Requirements:**
- User-customizable avatar with 1 calming preset (minimalist icon representing prosperity/growth)
- Display name field for personalization
- App preferences:
  - Theme toggle (Light/Calming mode)
  - Apple Pencil pressure sensitivity settings
  - Default pay rate
  - Export format preference (PDF/CSV)

### Navigation Structure

**Root Navigation: Tab Bar (4 tabs)**
- **Tab 1 - Contract** (Document icon): Goal setting and contract page
- **Tab 2 - Ledger** (Book icon): Daily ledger entry (primary screen)
- **Tab 3 - Calendar** (Calendar icon): Historical view and past entries
- **Tab 4 - Settings** (Gear icon): Profile, preferences, export, reset

**Navigation Stack Hierarchy:**
- Contract Stack: Contract page only
- Ledger Stack: Daily Ledger → Add/Edit Value Event (modal)
- Calendar Stack: Calendar view → Past Day Detail
- Settings Stack: Settings → Profile → Export Options

## Screen Specifications

### 1. Contract Page
**Purpose:** Set annual income/prosperity goal and mental pay rate

**Layout:**
- **Header:** Custom transparent header, centered title "My Contract", no buttons
- **Main Content:** Scrollable form with large, comfortable input fields optimized for touch
- **Safe Area Insets:** Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

**Components:**
- Large hero section with motivational headline
- Input fields:
  - Annual income goal (currency input with $ symbol)
  - Mental pay rate per hour (currency input)
  - Contract start date (date picker)
- Visual indicator showing daily/weekly/monthly breakdown of goal
- "Save Contract" button (full-width, prominent)
- Confirmation alert on save

**Visual Design:**
- Spacious layout with generous padding between form sections
- Soft background gradient (warm neutral to light blue)
- Large, readable labels above each input
- Currency inputs with large, monospaced font

### 2. Daily Ledger Page (Primary Screen)
**Purpose:** Add and view value events for current day, track running balance

**Layout:**
- **Header:** Custom transparent header
  - Left: Date display with picker (tap to change date)
  - Right: "+" button to add new value event
- **Main Content:** Scrollable list of value events with sticky header showing daily total
- **Floating Elements:** Daily total card (pinned below header) + Happenings section (bottom sheet)
- **Safe Area Insets:** Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl (for main list), happenings section uses its own safe area

**Components:**
- **Daily Total Card** (sticky, elevated):
  - Today's total amount
  - Running balance since contract start
  - Visual progress bar showing % of annual goal
- **Value Events List:**
  - Each row shows: description, units/time, rate, calculated amount
  - Swipe actions: Edit (left), Delete (right)
  - Tap to expand and edit inline
  - Empty state with motivational prompt to add first event
- **Happenings/Notes Section:**
  - Collapsible bottom sheet (pull up to expand)
  - Tab switcher: "Type" / "Draw"
  - Type mode: Multi-line text input for affirmations/gratitude
  - Draw mode: Canvas supporting Apple Pencil with toolbar:
    - Pen tool (with pressure sensitivity)
    - Eraser
    - Color palette (5 calming colors)
    - Undo/Redo
    - Clear canvas
  - Auto-saves on input

**Interactions:**
- Smooth animations for adding/removing events
- Real-time calculation updates (debounced while typing)
- Happenings bottom sheet slides up with gentle spring animation

### 3. Add/Edit Value Event Modal
**Purpose:** Create or modify a single value event

**Layout:**
- **Native modal** presentation (centered card on iPad)
- **Header:** "Add Value Event" or "Edit Value Event"
  - Left: "Cancel" button
  - Right: "Save" button (disabled until valid)
- **Main Content:** Scrollable form
- **Safe Area Insets:** Modal handles its own insets

**Form Fields:**
- Description (text input, placeholder: "What value did you create?")
- Units/Time (numeric input with unit picker: hours, items, pages, etc.)
- Pay Rate (currency input, pre-filled with default from settings)
- Calculated Amount (read-only, auto-calculated, highlighted)

**Visual Design:**
- Large touch targets for all inputs
- Real-time calculation preview
- Validation feedback for required fields

### 4. Calendar/History Page
**Purpose:** Browse and access past ledger entries

**Layout:**
- **Header:** Default navigation header, title "History"
  - Right: Filter/search button
- **Main Content:** Month calendar view with indicators + scrollable list of days
- **Safe Area Insets:** Top: Spacing.xl (non-transparent header), Bottom: tabBarHeight + Spacing.xl

**Components:**
- Month calendar with:
  - Dots/badges on days with entries
  - Color coding: green (met daily goal), yellow (partial), gray (no entries)
- Below calendar: Scrollable list of recent days (last 30 days)
  - Each row: Date, daily total, number of events
  - Tap to navigate to that day's ledger (opens Ledger tab with selected date)

### 5. Settings Page
**Purpose:** Configure app preferences, export data, manage profile

**Layout:**
- **Header:** Default navigation header, title "Settings"
- **Main Content:** Scrollable grouped list
- **Safe Area Insets:** Top: Spacing.xl, Bottom: tabBarHeight + Spacing.xl

**Sections:**
- Profile (avatar, display name - taps to edit screen)
- Preferences:
  - Theme toggle
  - Apple Pencil pressure sensitivity slider
  - Default pay rate
- Data Management:
  - Export ledger (opens export options modal)
  - Reset balance (nested: Settings → Confirm Reset with double confirmation)
- About (version, privacy policy placeholder, terms placeholder)

## Design System

### Color Palette
**Calming, Motivational Theme:**
- **Primary:** Prosperity Green (#4CAF50) - for positive actions, running balance in the green
- **Secondary:** Warm Gold (#F9A825) - for goals, highlights, currency amounts
- **Background:**
  - Light mode: Soft Cream (#FAF9F6)
  - Calming mode: Pale Blue (#E8F4F8)
- **Surface:** Pure White (#FFFFFF) for cards and modals
- **Text:**
  - Primary: Deep Charcoal (#2C3E50)
  - Secondary: Medium Gray (#7F8C8D)
- **Accent Colors for Drawing:**
  - Sage Green (#A8BBA6)
  - Soft Lavender (#B8A8D6)
  - Warm Coral (#F08080)
  - Sky Blue (#87CEEB)
  - Charcoal (#2C3E50)

### Typography
- **Large Title (Goals/Totals):** SF Pro Display, 34pt, Bold
- **Title:** SF Pro Text, 28pt, Semibold
- **Body:** SF Pro Text, 17pt, Regular
- **Caption:** SF Pro Text, 13pt, Regular
- **Currency/Numbers:** SF Mono, 20pt, Medium (monospaced for alignment)

### Touch Targets & Apple Pencil
- Minimum touch target: 44x44 points
- Input fields: Minimum 56pt height for comfortable iPad typing
- Apple Pencil canvas: Full-bleed drawing area with palm rejection enabled
- Drawing tools: 44pt square buttons with 12pt spacing

### Visual Feedback
- All touchable elements: Scale down to 0.95 on press with 150ms spring animation
- Buttons: Subtle highlight overlay (opacity 0.1) on press
- **Floating Daily Total Card:**
  - Shadow specifications:
    - shadowOffset: { width: 0, height: 2 }
    - shadowOpacity: 0.10
    - shadowRadius: 2
- List items: Gentle highlight background (#F0F0F0) on press
- Form validation: Green checkmark for valid, red border for invalid

### Icons
- Use **SF Symbols** for all standard icons (iOS system icons)
- Custom icons only for:
  - App icon/logo (prosperity tree or ledger book)
  - Empty state illustrations (calming, minimalist style)

### Critical Assets
Generate the following assets matching the calming aesthetic:
1. **Profile Avatar Preset:** Minimalist icon of a growing tree or ascending graph (represents prosperity growth)
2. **Empty State Illustration (Ledger):** Simple line drawing of an open ledger book with a sparkle
3. **Empty State Illustration (Calendar):** Calendar page with checkmark and small plant growing from it

### Accessibility
- VoiceOver labels for all interactive elements
- Dynamic Type support (respect system font scaling)
- High contrast mode compatible
- Apple Pencil scribble support in text fields
- Haptic feedback on value event add/delete