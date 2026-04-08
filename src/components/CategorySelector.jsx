import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Lightbulb,
  Trash2,
  MessageCircle,
  MoreHorizontal,
  Check,
} from 'lucide-react';

const OTHER_CATEGORY_ID = 'other';

// Main categories with icons and colors
const MAIN_CATEGORIES = [
  {
    id: 'roads',
    labelKey: 'roads',
    icon: AlertTriangle,
    color: 'from-orange-400 to-orange-500',
    bgLight: 'bg-orange-50',
    borderActive: 'border-orange-500',
    textActive: 'text-orange-600',
  },
  {
    id: 'garbage',
    labelKey: 'garbage',
    icon: Trash2,
    color: 'from-green-400 to-green-500',
    bgLight: 'bg-green-50',
    borderActive: 'border-green-500',
    textActive: 'text-green-600',
  },
  {
    id: 'lights',
    labelKey: 'lights',
    icon: Lightbulb,
    color: 'from-yellow-400 to-yellow-500',
    bgLight: 'bg-yellow-50',
    borderActive: 'border-yellow-500',
    textActive: 'text-yellow-600',
  },
  {
    id: 'danger',
    labelKey: 'danger',
    icon: AlertTriangle,
    color: 'from-red-400 to-red-500',
    bgLight: 'bg-red-50',
    borderActive: 'border-red-500',
    textActive: 'text-red-600',
  },
  {
    id: 'other',
    labelKey: 'other',
    icon: MoreHorizontal,
    color: 'from-gray-400 to-gray-500',
    bgLight: 'bg-gray-50',
    borderActive: 'border-gray-500',
    textActive: 'text-gray-600',
  },
];

// Subcategories per main category
const SUBCATEGORIES_MAP = {
  roads: [
    { id: 'pothole', labelKey: 'pothole', aiCategory: 'Roads & Infrastructure', aiSubcategory: 'Roads & Potholes' },
    { id: 'road_damage', labelKey: 'road_damage', aiCategory: 'Roads & Infrastructure', aiSubcategory: 'Roads & Potholes' },
    { id: 'other_road', labelKey: 'other', aiCategory: 'Roads & Infrastructure', aiSubcategory: 'Traffic Obstruction' },
  ],
  garbage: [
    { id: 'overflowing_bin', labelKey: 'overflowing_bin', aiCategory: 'Sanitation & Public Health', aiSubcategory: 'Garbage & Waste' },
    { id: 'dumped_waste', labelKey: 'dumped_waste', aiCategory: 'Sanitation & Public Health', aiSubcategory: 'Garbage & Waste' },
    { id: 'other_garbage', labelKey: 'other', aiCategory: 'Sanitation & Public Health', aiSubcategory: 'Garbage & Waste' },
  ],
  lights: [
    { id: 'not_working', labelKey: 'not_working', aiCategory: 'Electrical Issues', aiSubcategory: 'Streetlight Not Working' },
    { id: 'flickering', labelKey: 'flickering', aiCategory: 'Electrical Issues', aiSubcategory: 'Streetlight Not Working' },
    { id: 'other_lights', labelKey: 'other', aiCategory: 'Electrical Issues', aiSubcategory: 'Power Outage' },
  ],
  danger: [
    { id: 'fire_hazard', labelKey: 'fire_hazard', aiCategory: 'Illegal Activities & Violations', aiSubcategory: 'Unauthorized Construction' },
    { id: 'open_wires', labelKey: 'open_wires', aiCategory: 'Electrical Issues', aiSubcategory: 'Exposed / Hanging Wires' },
    { id: 'other_danger', labelKey: 'other', aiCategory: 'General Civic Issues', aiSubcategory: 'Other' },
  ],
  other: [
    { id: 'skip', labelKey: 'skip_and_describe', aiCategory: 'General Civic Issues', aiSubcategory: 'Other' },
  ],
};

export default function CategorySelector({
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  onNext,
  isStepCompleted = false,
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState('category'); // 'category' or 'subcategory'

  const handleCategorySelect = (categoryId) => {
    onCategoryChange(categoryId);
    if (categoryId === OTHER_CATEGORY_ID) {
      const otherDefault = SUBCATEGORIES_MAP[OTHER_CATEGORY_ID]?.[0] || null;
      onSubcategoryChange(otherDefault);
      if (onNext) {
        setTimeout(() => onNext(), 300);
      }
      setStep('category');
      return;
    }
    setStep('subcategory');
  };

  const handleSubcategorySelect = (subcategoryItem) => {
    onSubcategoryChange(subcategoryItem);
    // Automatically move forward or trigger next step
    if (onNext) {
      setTimeout(() => onNext(), 300);
    } else {
      setStep('category');
    }
  };

  const handleBack = () => {
    setStep('category');
    onCategoryChange(null);
    onSubcategoryChange(null);
  };

  const selectedCategoryItem = MAIN_CATEGORIES.find((cat) => cat.id === selectedCategory);
  const subcategoryOptions = SUBCATEGORIES_MAP[selectedCategory] || [];

  return (
    <div className="w-full">
      {/* STEP 1: MAIN CATEGORY SELECTION */}
      {step === 'category' && (
        <div className="animate-fadeIn">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t('whats_the_issue')}</h2>
          <p className="text-sm text-gray-600 mb-5">{t('select_category_best_describes')}</p>

          {/* 2-Column Grid for Main Categories */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MAIN_CATEGORIES.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`
                    relative p-4 rounded-2xl transition-all duration-200 transform
                    flex flex-col items-center justify-center gap-2 min-h-[120px]
                    ${
                      isSelected
                        ? `${category.bgLight} border-2 ${category.borderActive} scale-105 shadow-lg`
                        : 'bg-white border-2 border-gray-200 hover:border-gray-300 active:scale-95'
                    }
                  `}
                >
                  {/* Icon with gradient background */}
                  <div
                    className={`p-3 rounded-full bg-gradient-to-br ${category.color} text-white shadow-md`}
                  >
                    <IconComponent size={28} strokeWidth={1.5} />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-sm font-bold text-center ${isSelected ? category.textActive : 'text-gray-700'}`}
                  >
                    {t(category.labelKey)}
                  </span>

                  {/* Checkmark indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                      <Check size={16} className={category.textActive} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: SUBCATEGORY SELECTION */}
      {step === 'subcategory' && selectedCategoryItem && (
        <div className="animate-fadeIn">
          <button
            onClick={handleBack}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 font-medium flex items-center gap-1"
          >
            ← {t('back_to_categories')}
          </button>

          <h2 className="text-lg font-bold text-gray-900 mb-2">{t('tell_us_more')}</h2>
          <p className="text-sm text-gray-600 mb-5">{t('what_type_issue')}</p>

          {/* Subcategory Buttons (Max 3) */}
          <div className="space-y-2.5">
            {subcategoryOptions.map((subcat) => {
              const isSelected = selectedSubcategory?.id === subcat.id;

              return (
                <button
                  key={subcat.id}
                  onClick={() => handleSubcategorySelect(subcat)}
                  className={`
                    w-full p-3.5 rounded-xl transition-all duration-150 transform
                    flex items-center justify-between
                    ${
                      isSelected
                        ? `${selectedCategoryItem.bgLight} border-2 ${selectedCategoryItem.borderActive} shadow-md`
                        : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                    }
                    active:scale-95
                  `}
                >
                  <span
                    className={`text-sm font-semibold ${isSelected ? selectedCategoryItem.textActive : 'text-gray-700'}`}
                  >
                    {t(subcat.labelKey)}
                  </span>

                  {isSelected && (
                    <Check
                      size={20}
                      className={`${selectedCategoryItem.textActive}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mt-6 flex gap-2">
        <div
          className={`h-1 flex-1 rounded-full transition-colors ${step === 'category' ? 'bg-gray-800' : 'bg-gray-800'}`}
        />
        <div
          className={`h-1 flex-1 rounded-full transition-colors ${step === 'subcategory' ? 'bg-gray-800' : 'bg-gray-300'}`}
        />
      </div>
    </div>
  );
}
