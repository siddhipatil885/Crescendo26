# CategorySelector - Visual Guide

## User Interface Screenshots (ASCII Layout)

### STEP 1: Main Category Selection

```
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   CIVIX Report Issue - Category Selection  [Step 1] ║
║                                                      ║
╟──────────────────────────────────────────────────────╢
║                                                      ║
║  What's the issue?                                   ║
║  Select the category that best describes the problem║
║                                                      ║
║  ┌─────────────────┐  ┌─────────────────┐           ║
║  │                 │  │                 │           ║
║  │      🔺 🔺      │  │      🗑️ 🗑️      │           ║
║  │      🔺 🔺      │  │      🗑️ 🗑️      │           ║
║  │                 │  │                 │           ║
║  │    Roads        │  │    Garbage      │           ║
║  │                 │  │                 │           ║
║  │  ✓ hover scale  │  │  soft shadow    │           ║
║  └─────────────────┘  └─────────────────┘           ║
║                                                      ║
║  ┌─────────────────┐  ┌─────────────────┐           ║
║  │                 │  │                 │           ║
║  │      💡 💡      │  │      ⚠️ ⚠️      │           ║
║  │      💡 💡      │  │      ⚠️ ⚠️      │           ║
║  │                 │  │                 │           ║
║  │    Lights       │  │    Danger       │           ║
║  │                 │  │                 │           ║
║  │  on hover       │  │  on hover       │           ║
║  └─────────────────┘  └─────────────────┘           ║
║                                                      ║
║       ┌─────────────────────────┐                    ║
║       │                         │                    ║
║       │   ⋯ ⋯ ⋯     Other      │                    ║
║       │   ⋯ ⋯ ⋯     Category   │                    ║
║       │                         │                    ║
║       └─────────────────────────┘                    ║
║                                                      ║
║  Progress: ■■■■■ □□□                                ║
║                                                      ║
╚══════════════════════════════════════════════════════╝

User Action: Taps "Roads" category
   ↓ Animation: Fade in, slight scale (105%)
```

### STEP 2: Subcategory Selection

```
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   CIVIX Report Issue - Subcategory      [Step 2]     ║
║                                                      ║
╟──────────────────────────────────────────────────────╢
║                                                      ║
║  ← Back to categories                                ║
║                                                      ║
║  Tell us more                                        ║
║  What type of issue is it?                           ║
║                                                      ║
║  ┌──────────────────────────────────────────┐        ║
║  │ 🔺 Pothole                          ✓    │        ║
║  │ [Orange background when selected]        │        ║
║  └──────────────────────────────────────────┘        ║
║                                                      ║
║  ┌──────────────────────────────────────────┐        ║
║  │ 🔺 Road Damage                           │        ║
║  │ [White bg, gray border on hover]         │        ║
║  └──────────────────────────────────────────┘        ║
║                                                      ║
║  ┌──────────────────────────────────────────┐        ║
║  │ 🔺 Other                                 │        ║
║  │ [Touch target, full width]               │        ║
║  └──────────────────────────────────────────┘        ║
║                                                      ║
║  Progress: ■■■■■■■■■ (step 2 complete)             ║
║                                                      ║
╚══════════════════════════════════════════════════════╝

User Action: Taps "Pothole"
   ↓ Animation: Checkmark appears, color highlights
   ↓ onNext() triggered
   ↓ Auto-advance to Description input
```

---

## Color & Layout Details

### Button Sizes
```
Main Categories (STEP 1):
Width:  100% grid item (2 cols on mobile)
Height: 120px minimum
Padding: 1rem (16px)
Gap: 0.75rem (12px)

Subcategories (STEP 2):
Width: 100%
Height: 56px (3.5rem)
Padding: 0.875rem 1rem
Gap: 0.625rem (10px)
```

### Visual Hierarchy
```
┌─────────────────────────┐
│  H2: "What's the issue?"│   Font size: 1.125rem (18px)
│  P: "Select category"   │   Font size: 0.875rem (14px)
└─────────────────────────┘
         ↓
    Category Buttons      Large icons (28px), Rounded-2xl
         ↓
    [SELECTED]            Checkmark + Border + Light bg
         ↓
    Subcategory Buttons   Full width, Rounded-xl
         ↓
    [SELECTED]            Checkmark + Text color highlight
         ↓
    Progress Bar          Visual step indicator
```

---

## Color Swatches

### Orange (Roads)
```
Icon Gradient    Background      Border Selected      Text Selected
┌──────────┐     ┌──────────┐    ┌──────────┐        ┌──────────┐
│ #F97316  │     │ #FEF3C7  │    │ #F97316  │        │ #EA580C  │
│→#CA8A04  │     │+opacity  │    │ 2px      │        │ #EA580C  │
└──────────┘     └──────────┘    └──────────┘        └──────────┘
```

### Green (Garbage)
```
Icon Gradient    Background      Border Selected      Text Selected
┌──────────┐     ┌──────────┐    ┌──────────┐        ┌──────────┐
│ #22C55E  │     │ #F0FDF4  │    │ #22C55E  │        │ #15803D  │
│→#16A34A  │     │+opacity  │    │ 2px      │        │ #15803D  │
└──────────┘     └──────────┘    └──────────┘        └──────────┘
```

### Yellow (Lights)
```
Icon Gradient    Background      Border Selected      Text Selected
┌──────────┐     ┌──────────┐    ┌──────────┐        ┌──────────┐
│ #EAB308  │     │ #FEFCE8  │    │ #EAB308  │        │ #B45309  │
│→#DCDA1C  │     │+opacity  │    │ 2px      │        │ #B45309  │
└──────────┘     └──────────┘    └──────────┘        └──────────┘
```

### Red (Danger)
```
Icon Gradient    Background      Border Selected      Text Selected
┌──────────┐     ┌──────────┐    ┌──────────┐        ┌──────────┐
│ #EF4444  │     │ #FEF2F2  │    │ #EF4444  │        │ #DC2626  │
│→#DC2626  │     │+opacity  │    │ 2px      │        │ #DC2626  │
└──────────┘     └──────────┘    └──────────┘        └──────────┘
```

### Gray (Other)
```
Icon Gradient    Background      Border Selected      Text Selected
┌──────────┐     ┌──────────┐    ┌──────────┐        ┌──────────┐
│ #9CA3AF  │     │ #F3F4F6  │    │ #9CA3AF  │        │ #4B5563  │
│→#6B7280  │     │+opacity  │    │ 2px      │        │ #4B5563  │
└──────────┘     └──────────┘    └──────────┘        └──────────┘
```

---

## Animation Timeline

### Step Transition (300ms)
```
0ms:    Category step fully visible
         Y: 0px, Opacity: 100%

300ms:  Fade out category step
         Y: -8px, Opacity: 0%

300ms:  Fade in subcategory step
         Y: 8px, Opacity: 0%

600ms:  Subcategory fully visible
         Y: 0px, Opacity: 100%
```

### Button Press (150ms)
```
0ms (press):     scale: 100%, borderColor: gray-300
75ms (active):   scale: 95%, borderColor: {category}
150ms (release): scale: 100%, borderColor: {category}
```

### Selection (instant)
```
0ms:     checkmark not visible, opacity: 0%
         border: gray-200
         
instant: border: {category-color}
         background: {category-light}
         checkmark: opacity: 100%
```

---

## Responsive Breakpoints

### Mobile (< 480px)
```
┌─────────────────────────┐
│ ┌──────┐ ┌──────┐       │
│ │ Road │ │Garbag│       │ 2 columns
│ └──────┘ └──────┘       │
│ ┌──────┐ ┌──────┐       │
│ │Lights│ │Danger│       │
│ └──────┘ └──────┘       │ 120px height
│ ┌──────────────┐        │ Tight padding
│ │    Other     │        │
│ └──────────────┘        │
└─────────────────────────┘

Subcategories: Full width
```

### Tablet (480px - 768px)
```
┌──────────────────────────────────┐
│ ┌──────────┐ ┌──────────┐        │
│ │  Road    │ │ Garbage  │        │ Still 2 columns
│ └──────────┘ └──────────┘        │ (optimal for thumbs)
│ ┌──────────┐ ┌──────────┐        │
│ │ Lights   │ │  Danger  │        │ Slightly larger
│ └──────────┘ └──────────┘        │ 140px height
│ ┌─────────────────────────┐      │
│ │       Other             │      │
│ └─────────────────────────┘      │
└──────────────────────────────────┘

Subcategories: Full width
```

### Desktop (768px+)
```
┌─────────────────────────────────────────────┐
│ ┌──────┐ ┌──────┐ ┌──────┐                  │
│ │ Road │ │Garbag│ │Lights│  3 columns      │
│ └──────┘ └──────┘ └──────┘  (nice on large)│
│ ┌──────┐ ┌──────┐                          │
│ │Danger│ │ Other│                          │ 160px height
│ └──────┘ └──────┘                          │
└─────────────────────────────────────────────┘

Subcategories: Multi-column grid (optional)
```

---

## Icon Details

### Lucide React Icons (28px)
```
Roads:     AlertTriangle  🔺
           ▲▲▲
           ▲▲▲
           ▲▲▲

Garbage:   Trash2         🗑️
           ┌─────┐
           │ ╱ ╲ │
           └─────┘
            │╱╱╱│

Lights:    Lightbulb      💡
           ┌───┐
           │ ◦ │
           │╱ ╲│
            ╲─╱

Danger:    AlertTriangle  ⚠️
           (same as Roads)

Other:     MoreHorizontal ⋯
           ⋯ ⋯ ⋯
```

---

## Touch Target Sizes

### Mobile Touch Recommendations (WCAG)
```
Recommended: 48x48px (W3C guidelines)
Our implementation: 120px + padding = ~140x160px

Main Category Buttons:
Width:  ~100px (half of 2-col grid with gap)
Height: 120px
Total area: ≥11,200px² ✓

Subcategory Buttons:
Width:  100% - 2rem padding (full width)
Height: 56px (3.5rem)
Total area: ≥100% width × 56px ✓

Checkmark/Icons:
Size:   28px
Touch area: Full button
```

---

## Shadow & Depth

### Shadow Levels

Default State:
```
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
           └─ Subtle, barely visible
```

Hover State:
```
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06)
           └─ More prominent, lifts slightly
```

Selected State:
```
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15)
           └─ Maximum depth, feels pressed
```

---

## Typography

### Font Stack
```
Body Font: "Inter", -apple-system, BlinkMacSystemFont,
           "Segoe UI", Roboto, sans-serif

Main Heading (Step Title):
  Size:   18px (1.125rem)
  Weight: 700 (bold)
  Color:  #1F2937 (gray-900)
  Line:   1.4

Description:
  Size:   14px (0.875rem)
  Weight: 400
  Color:  #6B7280 (gray-600)
  Line:   1.5

Button Labels:
  Size:   14px (0.875rem)
  Weight: 600 (semibold)
  Color:  {category-color}
  Line:   1.6

Uppercase Labels:
  Size:   11px (0.7rem)
  Weight: 700
  Color:  #6B7280 (gray-600)
  Transform: uppercase
  Letter-spacing: 0.05em
```

---

## Accessibility Features

### Focus States
```
Default:   border: 2px solid #E5E7EB (gray-200)

Focus:     outline: 2px solid #3B82F6 (blue-500)
           outline-offset: 2px

Active:    border: 2px solid {category-color}
           outline: none
```

### Contrast Ratios
```
White background (#FFFFFF)
Category text (#1F2937):        Ratio 12.5:1 ✓

Category light bg (e.g., #FEF3C7)
Category text (#1F2937):         Ratio 5.8:1 ✓

Icon gradient (#F97316)
White (#FFFFFF):                 Ratio 5.2:1 ✓
```

---

## Loading & Error States

### Loading Screen (While Preparing)
```
╔══════════════════════════════════════╗
║                                      ║
║     ⟳ Preparing complaint details... ║
║     (spinner animation)              ║
║                                      ║
║  [Categories grayed out, disabled]   ║
║                                      ║
╚══════════════════════════════════════╝
```

### Error State
```
╔══════════════════════════════════════╗
║                                      ║
║  ⚠ Error message here                ║
║  [Red background, error icon]        ║
║                                      ║
║  Categories shown but non-functional ║
║  [Try again option]                  ║
║                                      ║
╚══════════════════════════════════════╝
```

---

## Complete User Timeline

```
USER SEES:              Time    Component State
──────────────────────────────────────────────────
Category buttons        0s      Category step visible
Hovers over Roads       0.2s    Hover animation
Taps Roads              0.5s    Button scale animation
                        0.6s    onCategoryChange triggered
Fade effect             0.7s    Subcategory step fading in
See subcategories       1.0s    Subcategory step visible
Hovers over Pothole     1.2s    Hover animation
Taps Pothole            1.4s    Button scale + checkmark
                        1.5s    onSubcategoryChange triggered
                        1.6s    onNext() triggered
                        1.7s    Move to description input
Describe issue          2-4s    User types description
Submit                  4-5s    Issue created

TOTAL TIME: 4-5 seconds ✓
```

---

## Device Examples

### iPhone 12 Pro (390px)
```
┌──────────────────────┐
│ What's the issue?    │
│ Select category...   │
│ ┌──┐ ┌──┐           │ Perfect 2-col
│ │🔺│ │🗑│           │ Fits perfectly
│ │Ro│ │Ga│           │ Text visible
│ └──┘ └──┘           │ Easy to tap
│ ┌──┐ ┌──┐           │
│ │💡│ │⚠ │           │
│ │Li│ │Da│           │
│ └──┘ └──┘           │
│   ┌──────┐          │
│   │ Other│          │
│   └──────┘          │
└──────────────────────┘
```

### iPad (768px)
```
┌──────────────────────────────────┐
│ What's the issue?                │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │ 🔺  │ │ 🗑️  │ │ 💡  │        │ 3-column option
│ │Road │ │Garb │ │Lights│       │ (or still 2-col
│ └─────┘ └─────┘ └─────┘        │  for better UX)
│ ┌─────┐ ┌─────┐                 │
│ │ ⚠️  │ │ ⋯   │                 │
│ │Danger│ │Other │               │
│ └─────┘ └─────┘                 │
└──────────────────────────────────┘
```

---

## Component Hierarchy

```
CategorySelector (Main)
├── Step: "category"
│   ├── Heading
│   ├── Description
│   ├── Category Grid
│   │   ├── CategoryButton (Roads)
│   │   ├── CategoryButton (Garbage)
│   │   ├── CategoryButton (Lights)
│   │   ├── CategoryButton (Danger)
│   │   └── CategoryButton (Other)
│   └── Progress Bar
│
└── Step: "subcategory"
    ├── Back Button
    ├── Heading
    ├── Description
    ├── Subcategory List
    │   ├── SubcategoryButton
    │   ├── SubcategoryButton
    │   └── SubcategoryButton
    └── Progress Bar
```

---

**This visual guide helps understand the layout, colors, sizing, and user experience of the CategorySelector component.**
