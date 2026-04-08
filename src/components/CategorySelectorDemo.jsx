import React, { useState } from 'react';
import CategorySelector from './CategorySelector';

export default function CategorySelectorDemo() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
  };

  const handleSubcategoryChange = (subcategoryItem) => {
    setSelectedSubcategory(subcategoryItem);
  };

  const handleNext = () => {
    setSubmittedData({
      category: selectedCategory,
      subcategory: selectedSubcategory,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Category Selector</h1>
          <p className="text-gray-600">
            Fast, mobile-first interface for selecting issue categories
          </p>
        </div>

        {/* Main Component */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <CategorySelector
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            onCategoryChange={handleCategoryChange}
            onSubcategoryChange={handleSubcategoryChange}
            onNext={handleNext}
          />
        </div>

        {/* State Display */}
        {(selectedCategory || selectedSubcategory) && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Current Selection</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                <span className="font-medium">Category:</span> {selectedCategory || 'Not selected'}
              </p>
              <p>
                <span className="font-medium">Subcategory:</span>{' '}
                {selectedSubcategory?.label || 'Not selected'}
              </p>
              {selectedSubcategory && (
                <>
                  <p>
                    <span className="font-medium">AI Category:</span> {selectedSubcategory.aiCategory}
                  </p>
                  <p>
                    <span className="font-medium">AI Subcategory:</span>{' '}
                    {selectedSubcategory.aiSubcategory}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Submitted Data */}
        {submittedData && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 mb-2">✓ Selection Submitted</h3>
            <pre className="bg-white p-3 rounded text-xs overflow-auto text-gray-700 border border-green-200">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubcategory(null);
                setSubmittedData(null);
              }}
              className="mt-3 w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <h3 className="font-semibold text-amber-900 mb-2">How to Use</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800">
            <li>Click a main category (Roads, Garbage, Lights, etc.)</li>
            <li>Select a subcategory from the options shown</li>
            <li>Complete selection automatically triggers submission</li>
            <li>View the selected data above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
