// components/PlanFormFields.js
import React from "react";

const PlanFormFields = ({ plan, onChange, isNewPlan }) => {
  if (!plan) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle nested arrays like 'highlights' and 'points'
    if (name.startsWith("highlights-")) {
      const index = parseInt(name.split("-")[1]);
      const newHighlights = [...(plan.highlights || [])]; // Ensure it's an array
      newHighlights[index] = value;
      onChange({ ...plan, highlights: newHighlights });
    } else if (name.startsWith("points-")) {
      const [key, index, subKey] = name.split("-");
      const newPoints = [...(plan.points || [])]; // Ensure it's an array
      if (!newPoints[index]) newPoints[index] = {}; // Initialize if undefined
      if (subKey === "text") {
        newPoints[index].text = value;
      } else if (subKey === "enabled") {
        newPoints[index].enabled = checked;
      }
      onChange({ ...plan, points: newPoints });
    } else if (name === "min" || name === "max") {
      onChange({ ...plan, [name]: parseFloat(value) || 0 });
    } else {
      onChange({
        ...plan,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const addHighlight = () => {
    const newHighlights = [...(plan.highlights || []), ""]; // Add an empty string for a new highlight
    onChange({ ...plan, highlights: newHighlights });
  };

  const removeHighlight = (indexToRemove) => {
    const newHighlights = (plan.highlights || []).filter(
      (_, index) => index !== indexToRemove
    );
    onChange({ ...plan, highlights: newHighlights });
  };

  const addPoint = () => {
    const newPoints = [...(plan.points || []), { text: "", enabled: true }]; // Default new points to enabled
    onChange({ ...plan, points: newPoints });
  };

  const removePoint = (indexToRemove) => {
    const newPoints = (plan.points || []).filter(
      (_, index) => index !== indexToRemove
    );
    onChange({ ...plan, points: newPoints });
  };

  // Define the explicit order for fields to ensure consistent layout
  const fieldDisplayOrder = [
    "plan",
    "subTitle",
    "description",
    "price",
    "roi",
    "min",
    "max",
    "highlights",
    "points",
    "cta",
    "enabled",
    "barColor",
    "buttonStyle",
  ];

  const renderField = (key, value) => {
    // This array helps determine if a field should be placed in the 2-column grid or span full width
    const gridTwoColumnFields = [
      "plan",
      "subTitle",
      "price",
      "roi",
      "cta",
      "barColor",
      "buttonStyle",
      "min",
      "max",
    ];

    // plan_id is handled separately as read-only and is not part of this renderField logic for iteration
    if (key === "plan_id") {
      return null;
    }

    // Determine if the field should span full width
    const isFullWidthField = [
      "description",
      "highlights",
      "points",
      "enabled",
    ].includes(key);
    const wrapperClasses = `mb-4 ${isFullWidthField ? "col-span-full" : ""}`;

    if (gridTwoColumnFields.includes(key)) {
      return (
        <div className={wrapperClasses} key={key}>
          <label
            htmlFor={key}
            className="block text-sm font-medium text-gray-700 capitalize"
          >
            {key.replace(/([A-Z])/g, " $1").trim()}:
          </label>
          <input
            type={["min", "max"].includes(key) ? "number" : "text"}
            name={key}
            id={key}
            value={value || ""} // Ensure value is not null/undefined for controlled input
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      );
    } else if (key === "description") {
      return (
        <div className={wrapperClasses} key={key}>
          <label
            htmlFor={key}
            className="block text-sm font-medium text-gray-700 capitalize"
          >
            {key}:
          </label>
          <textarea
            name={key}
            id={key}
            value={value || ""} // Ensure value is not null/undefined
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      );
    } else if (key === "highlights") {
      const currentHighlights = plan.highlights || [];
      return (
        <div className={wrapperClasses} key={key}>
          <label className="block text-sm font-medium text-gray-700 capitalize">
            {key}:
          </label>
          {(isNewPlan && currentHighlights.length === 0
            ? ["", ""]
            : currentHighlights
          ).map(
            // Always show at least two fields for new plans, or existing
            (item, index) => (
              <div
                key={`highlights-${index}`}
                className="flex items-center mb-2 space-x-2"
              >
                <input
                  type="text"
                  name={`highlights-${index}`}
                  value={item || ""} // Ensure value is not null/undefined
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={`Highlight ${index + 1}`}
                />
                {(currentHighlights.length > 0 || isNewPlan) && ( // Allow removing if there's at least one or it's a new plan (allowing initial removal)
                  <button
                    type="button"
                    onClick={() => removeHighlight(index)}
                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            )
          )}
          <button
            type="button"
            onClick={addHighlight}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Add Highlight
          </button>
        </div>
      );
    } else if (key === "points") {
      const currentPoints = plan.points || [];
      return (
        <div className={wrapperClasses} key={key}>
          <label className="block text-sm font-medium text-gray-700 capitalize">
            {key}:
          </label>
          {(isNewPlan && currentPoints.length === 0
            ? [
                { text: "", enabled: true },
                { text: "", enabled: true },
              ]
            : currentPoints
          ).map(
            // Always show at least two fields for new plans, or existing
            (point, index) => (
              <div
                key={`points-${index}`}
                className="flex items-center space-x-2 mb-2"
              >
                <input
                  type="text"
                  name={`points-${index}-text`}
                  value={point.text || ""} // Ensure value is not null/undefined
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={`Point Text ${index + 1}`}
                />
                <input
                  type="checkbox"
                  name={`points-${index}-enabled`}
                  checked={point.enabled || false} // Ensure checked is not null/undefined
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">Enabled</label>
                {(currentPoints.length > 0 || isNewPlan) && ( // Allow removing if there's at least one or it's a new plan (allowing initial removal)
                  <button
                    type="button"
                    onClick={() => removePoint(index)}
                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            )
          )}
          <button
            type="button"
            onClick={addPoint}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Add Point
          </button>
        </div>
      );
    } else if (key === "enabled") {
      return (
        <div className={wrapperClasses} key={key}>
          <input
            type="checkbox"
            name={key}
            id={key}
            checked={value || false} // Ensure checked is not null/undefined
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor={key}
            className="ml-2 block text-sm text-gray-900 capitalize"
          >
            {key}:
          </label>
        </div>
      );
    }
    return null; // Don't render unrecognized keys
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Conditionally render plan_id field at the top if needed for debugging/display */}
      {plan.plan_id && (
        <div className="mb-4 col-span-full" key="plan_id_display">
          {" "}
          {/* Unique key */}
          <label
            htmlFor="plan_id"
            className="block text-sm font-medium text-gray-700 capitalize"
          >
            Plan ID:
          </label>
          <input
            type="text"
            name="plan_id"
            id="plan_id"
            value={plan.plan_id}
            readOnly // Make it read-only
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none bg-gray-100 sm:text-sm"
          />
        </div>
      )}
      {/* Map over the defined order of fields */}
      {fieldDisplayOrder.map((key) => {
        // Only render fields that exist in the plan object
        if (Object.prototype.hasOwnProperty.call(plan, key)) {
          return renderField(key, plan[key]);
        }
        return null;
      })}
    </div>
  );
};

export default PlanFormFields;
