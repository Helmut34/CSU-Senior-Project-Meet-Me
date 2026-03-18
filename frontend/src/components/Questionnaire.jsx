import { X, Check } from "lucide-react";
import { useState } from "react";

/*based off the basic google maps categories */
const venueTypeOptions = {
  "Food & Drink": [
    { value: "restaurant", label: "Restaurant" },
    { value: "cafe", label: "Cafe" },
    { value: "bar", label: "Bar" },
  ],
  Activities: [
    { value: "park", label: "Park" },
    { value: "movie_theater", label: "Movie Theater" },
    { value: "bowling_alley", label: "Bowling" },
  ],
};

const foodRelatedVenues = ["restaurant", "cafe", "bar"];
const foodOptions = [
  "American",
  "Mexican",
  "Italian",
  "Chinese",
  "Japanese",
  "Thai",
  "Indian",
  "Mediterranean",
  "Korean",
  "Vietnamese",
];
const dietaryOptions = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Halal",
  "Kosher",
];

const QuestionnaireWizard = ({
  formData,
  setFormData,
  questionnaire,
  onSubmit,
  onClose,
  submitting,
}) => {
  const [step, setStep] = useState(1);
  const hasFoodVenue = formData.venue_types.some((v) =>
    foodRelatedVenues.includes(v),
  );

  const toggleArrayItem = (field, item) => {
    const val =
      field === "food_preferences" || field === "dietary_restrictions"
        ? item.toLowerCase()
        : item;
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(val)
        ? prev[field].filter((i) => i !== val)
        : [...prev[field], val],
    }));
  };

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const steps = ["venue_types", "budget", "meeting_type"];
  if (hasFoodVenue) steps.push("food_preferences", "dietary_restrictions");
  steps.push("atmosphere", "travel_weight");

  const current = steps[step - 1];

  const renderStep = () => {
    switch (current) {
      case "venue_types":
        return (
          <div>
            <h3>What type of place?</h3>
            {Object.entries(venueTypeOptions).map(([category, venues]) => (
              <div key={category}>
                <h4>{category}</h4>
                {venues.map((v) => (
                  <label key={v.value} className="questionnaire-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.venue_types.includes(v.value)}
                      onChange={() => toggleArrayItem("venue_types", v.value)}
                    />
                    <span>{v.label}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        );
      case "budget":
        return (
          <div>
            <h3>Budget?</h3>
            <div className="questionnaire-options">
              {[
                ["low", "$ Budget"],
                ["medium", "$$ Mid-range"],
                ["high", "$$$ Fine dining"],
                ["any", "Any"],
              ].map(([val, label]) => (
                <button
                  type="button"
                  key={val}
                  className={`questionnaire-option ${formData.budget === val ? "selected" : ""}`}
                  onClick={() => setField("budget", val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        );
      case "meeting_type":
        return (
          <div>
            <h3>Type of meeting?</h3>
            <div className="questionnaire-options">
              {["casual", "formal", "active", "relaxed"].map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`questionnaire-option ${formData.meeting_type === t ? "selected" : ""}`}
                  onClick={() => setField("meeting_type", t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        );
      case "food_preferences":
        return (
          <div>
            <h3>Food preferences</h3>
            {foodOptions.map((food) => (
              <label key={food} className="questionnaire-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.food_preferences.includes(
                    food.toLowerCase(),
                  )}
                  onChange={() => toggleArrayItem("food_preferences", food)}
                />
                <span>{food}</span>
              </label>
            ))}
          </div>
        );
      case "dietary_restrictions":
        return (
          <div>
            <h3>Dietary restrictions (optional)</h3>
            {dietaryOptions.map((d) => (
              <label key={d} className="questionnaire-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.dietary_restrictions.includes(
                    d.toLowerCase(),
                  )}
                  onChange={() => toggleArrayItem("dietary_restrictions", d)}
                />
                <span>{d}</span>
              </label>
            ))}
          </div>
        );
      case "atmosphere":
        return (
          <div>
            <h3>Atmosphere?</h3>
            <div className="questionnaire-options">
              {["quiet", "lively", "outdoor", "indoor"].map((a) => (
                <button
                  type="button"
                  key={a}
                  className={`questionnaire-option ${formData.atmosphere === a ? "selected" : ""}`}
                  onClick={() => setField("atmosphere", a)}
                >
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
          </div>
        );
      case "travel_weight":
        return (
          <div>
            <h3>How far are you willing to travel?</h3>
            <p>Higher value = prefer venues closer to you</p>
            <input
              type="range"
              min="0.1"
              max="10.0"
              step="0.1"
              value={formData.travel_weight}
              onChange={(e) =>
                setField("travel_weight", parseFloat(e.target.value))
              }
            />
            <p>Current: {formData.travel_weight.toFixed(1)}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        <h2>{questionnaire ? "Update Preferences" : "Your Preferences"}</h2>
        <p>
          Step {step} of {steps.length}
        </p>

        {renderStep()}

        <div className="modal-actions">
          {step > 1 && (
            <button
              type="button"
              className="btn-reject"
              onClick={() => setStep(step - 1)}
            >
              Previous
            </button>
          )}
          {step < steps.length ? (
            <button
              type="button"
              className="btn-accept"
              onClick={() => setStep(step + 1)}
              disabled={
                current === "venue_types" && formData.venue_types.length === 0
              }
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn-accept"
              onClick={onSubmit}
              disabled={submitting || formData.venue_types.length === 0}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireWizard;
