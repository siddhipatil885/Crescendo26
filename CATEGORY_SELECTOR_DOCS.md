# CategorySelector Component Documentation

## Overview
`CategorySelector` is a mobile-first, visually intuitive component for selecting issue categories and subcategories in the CIVIX civic reporting app. It replaces traditional dropdowns with large, tappable buttons with icons and smooth animations.

## Core Features

### ✅ Main Requirements Met
- **5 Large Category Buttons**: Roads, Garbage, Lights, Danger, Other
- **2-3 Subcategory Buttons**: Context-specific options per category
- **Mobile-First**: 2-column grid on mobile, scales up on larger screens
- **No Dropdowns**: Pure button-based selection flow
- **Fast & Frictionless**: Complete selection in 3-5 seconds
- **Touch-Friendly**: Large 120px minimum button heights
- **Visual Feedback**: Icons, colors, hover states, active states, checkmarks
- **Smooth Animations**: Fade-in transitions between steps
- **Progress Indicator**: Visual step progress bar

### 🎨 Design Features

#### Category Buttons
- Rounded-2xl corners (28px border-radius)
- Gradient icon backgrounds
- Color-coded per category with distinct hover/active states
- Large centered icons with labels
- Checkmark indicator on selection
- Scale animation on active/hover states
- Soft shadows for depth

#### Subcategory Buttons
- Rounded-xl corners (12px border-radius)
- Full-width buttons with equal padding
- Checkmark on right side
- Same color scheme as parent category
- Subtle shadows and transitions

#### Color Scheme
| Category | Colors | Usage |
|----------|--------|-------|
| **Roads** | Orange (400-500) | Potholes, road damage |
| **Garbage** | Green (400-500) | Waste, dumping |
| **Lights** | Yellow (400-500) | Electrical, streetlights |
| **Danger** | Red (400-500) | Fire hazards, wires |
| **Other** | Gray (400-500) | Miscellaneous |

## Usage

### Basic Implementation
```jsx
import CategorySelector from './components/CategorySelector';

export default function ReportIssue() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleSubcategoryChange = (subcategoryItem) => {
    setSelectedSubcategory(subcategoryItem);
    // subcategoryItem = {
    //   id: 'pothole',
    //   label: 'Pothole',
    //   aiCategory: 'Roads & Infrastructure',
    //   aiSubcategory: 'Roads & Potholes'
    // }
  };

  return (
    <CategorySelector
      selectedCategory={selectedCategory}
      selectedSubcategory={selectedSubcategory}
      onCategoryChange={handleCategoryChange}
      onSubcategoryChange={handleSubcategoryChange}
      onNext={() => console.log('Move to next step')}
    />
  );
}
```

### Props

```typescript
interface CategorySelectorProps {
  // Current selections
  selectedCategory: string | null;                    // e.g., 'roads', 'garbage'
  selectedSubcategory: SubcategoryItem | null;       // Full subcategory object

  // Callbacks
  onCategoryChange: (categoryId: string | null) => void;
  onSubcategoryChange: (item: SubcategoryItem | null) => void;
  onNext?: () => void;                               // Optional callback when subcategory selected

  // Optional state
  isStepCompleted?: boolean;                         // Visual indicator of completion
}

interface SubcategoryItem {
  id: string;                       // Unique identifier
  labelKey: string;                 // UI i18n key used for display text
  aiCategory: string;               // Maps to AI_CATEGORY_MAP
  aiSubcategory: string;            // AI subcategory name
}
```

## Subcategory Mapping

### Roads
```text
- Pothole → Roads & Infrastructure / Roads & Potholes
- Road Damage → Roads & Infrastructure / Roads & Potholes
- Other → Roads & Infrastructure / Traffic Obstruction
```

### Garbage
```text
- Overflowing Bin → Sanitation & Public Health / Garbage & Waste
- Dumped Waste → Sanitation & Public Health / Garbage & Waste
- Other → Sanitation & Public Health / Garbage & Waste
```

### Lights
```text
- Not Working → Electrical Issues / Streetlight Not Working
- Flickering → Electrical Issues / Streetlight Not Working
- Other → Electrical Issues / Power Outage
```

### Danger
```text
- Fire Hazard → Illegal Activities & Violations / Unauthorized Construction
- Open Wires → Electrical Issues / Exposed / Hanging Wires
- Other → General Civic Issues / Other
```

### Other
```text
- Skip & Describe → General Civic Issues / Other
```

## State Management

### Integration with ReportIssue.jsx
The component works seamlessly with the existing ReportIssue form:

```jsx
<CategorySelector
  selectedCategory={selectedCategory}
  selectedSubcategory={selectedSubcategory}
  onCategoryChange={(categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
  }}
  onSubcategoryChange={(subcategoryItem) => {
    if (subcategoryItem) {
      setSelectedSubcategory(subcategoryItem);
      setOverrides((current) => ({
        ...current,
        aiCategory: subcategoryItem.aiCategory,
        subcategory: subcategoryItem.aiSubcategory,
      }));
    }
  }}
/>
```

## UX Flow

### User Journey (< 5 seconds)
1. **Step 1** - User sees 5 category buttons
2. **User taps** category (e.g., "Pothole under Roads")
3. **Step 2** - Shows 2-3 subcategory buttons
4. **User taps** subcategory (e.g., "Pothole")
5. **Auto-advance** to description input (onNext triggers)
6. **User enters** description
7. **User submits** form

## Future Extensibility

### AI Classification (Future Ready)
The component structure allows easy removal of subcategory selection:

```jsx
// Future: Skip to description directly for AI classification
if (useAIClassification) {
  return <DescriptionInput onSubmit={handleSubmit} />;
}
```

### Adding New Categories
Simply extend `MAIN_CATEGORIES` and `SUBCATEGORIES_MAP`:

```javascript
const MAIN_CATEGORIES = [
  // ... existing categories
  {
    id: 'water',
    label: 'Water',
    icon: Droplets,
    color: 'from-blue-400 to-blue-500',
    bgLight: 'bg-blue-50',
    borderActive: 'border-blue-500',
    textActive: 'text-blue-600',
  },
];

const SUBCATEGORIES_MAP = {
  // ... existing
  water: [
    { id: 'leak', label: 'Leak', aiCategory: '...', aiSubcategory: '...' },
    // ...
  ],
};
```

## Accessibility Features

- Large touch targets (120px minimum)
- High contrast colors
- Clear focus states (border highlight)
- Semantic button elements
- Checkmark indicators for confirmation
- Progress bar for orientation

## Performance Optimizations

- **Minimal Re-renders**: State updates batched efficiently
- **Smooth Animations**: 300ms fade-in, GPU-accelerated
- **Optimized Grid**: CSS Grid for 2-column layout (flexes on larger screens)
- **No External Dependencies**: Uses built-in Lucide icons and Tailwind CSS

## Styling Classes

All styling uses Tailwind CSS with these utilities:
- `rounded-2xl` / `rounded-xl` for buttons
- `shadow-md` / `shadow-lg` for depth
- `scale-105` / `scale-95` for interaction feedback
- `border-2` for clear focus states
- `transition-all duration-200` for smooth animations
- Grade-based color scale (400-500) for visual hierarchy

## Browser Support

- All modern browsers (iOS Safari 12+, Android Chrome)
- Touch-optimized for mobile
- Responsive by default
- No polyfills required

## File Location
`/src/components/CategorySelector.jsx`

## Related Files
- Integration: `/src/pages/citizen/ReportIssue.jsx`
- Styles: `/src/index.css` (fadeIn animation)
- Constants: `/src/utils/constants.js` (AI_CATEGORY_MAP mapping)
