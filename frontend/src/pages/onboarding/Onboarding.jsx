import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { plannerApi } from "../../api/planner";

const empty = () => ({
  title: "",
  subject: "",
  difficulty: "medium",
  deadline: "",
  estimatedHours: 3,
});

export default function Onboarding() {
  const [subjects, setSubjects] = useState([empty()]);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(0);
  const navigate = useNavigate();

  const minDate = new Date().toISOString().split("T")[0];

  function updateSubject(i, field, value) {
    setSubjects((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    );
  }

  function addSubject() {
    if (subjects.length < 8) setSubjects((prev) => [...prev, empty()]);
  }

  function removeSubject(i) {
    if (subjects.length > 1)
      setSubjects((prev) => prev.filter((_, idx) => idx !== i));
  }

  function isValid() {
    return subjects.every(
      (s) => s.title.trim() && s.subject.trim() && s.deadline,
    );
  }

  async function handleSubmit() {
    if (!isValid()) {
      setError("Please fill in all fields and deadlines.");
      return;
    }

    setStep(2);
    setError("");
    let count = 0;

    for (const s of subjects) {
      try {
        await plannerApi.createTask({
          title: s.title,
          subject: s.subject,
          difficulty: s.difficulty,
          deadline: s.deadline,
          estimatedHours: s.estimatedHours,
        });
        count++;
        setCreated(count);
      } catch (e) {
        console.error("Task creation failed:", e.response?.data);
      }
    }

    await new Promise((r) => setTimeout(r, 1000));
    localStorage.setItem("stucare_onboarded", "true");
    navigate("/dashboard");
  }

  if (step === 2)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Building your study plan...
          </h2>
          <p className="text-gray-400 mb-6">
            Prioritizing subjects by deadline and difficulty.
          </p>
          <div className="space-y-2">
            {subjects.map((s, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 justify-center text-sm ${i < created ? "text-emerald-400" : "text-gray-500"}`}
              >
                <span>{i < created ? "✓" : "○"}</span>
                <span>
                  {s.title} — {s.subject}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome to <span className="text-indigo-400">StuCare</span>! 🎓
          </h1>
          <p className="text-gray-400 mt-2">
            Add your subjects and we'll build your personalized study plan.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {subjects.map((s, i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Subject {i + 1}</h3>
                {subjects.length > 1 && (
                  <button
                    onClick={() => removeSubject(i)}
                    className="text-gray-500 hover:text-red-400 text-sm transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Topic / Chapter *
                  </label>
                  <input
                    type="text"
                    value={s.title}
                    onChange={(e) => updateSubject(i, "title", e.target.value)}
                    placeholder="e.g. Calculus Chapter 3"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={s.subject}
                    onChange={(e) =>
                      updateSubject(i, "subject", e.target.value)
                    }
                    placeholder="e.g. Mathematics"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Difficulty *
                  </label>
                  <select
                    value={s.difficulty}
                    onChange={(e) =>
                      updateSubject(i, "difficulty", e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={s.deadline}
                    min={minDate}
                    onChange={(e) =>
                      updateSubject(i, "deadline", e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Estimated hours needed:{" "}
                    <span className="text-indigo-400 font-semibold">
                      {s.estimatedHours} hrs
                    </span>
                  </label>
                  <input
                    type="range"
                    value={s.estimatedHours}
                    min="1"
                    max="40"
                    step="0.5"
                    onChange={(e) =>
                      updateSubject(
                        i,
                        "estimatedHours",
                        parseFloat(e.target.value),
                      )
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 hr</span>
                    <span>20 hrs</span>
                    <span>40 hrs</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {subjects.length < 8 && (
          <button
            onClick={addSubject}
            className="mt-4 w-full border border-dashed border-gray-700 hover:border-indigo-500 text-gray-500 hover:text-indigo-400 py-3 rounded-xl transition-colors text-sm font-medium"
          >
            + Add Another Subject
          </button>
        )}

        <button
          onClick={handleSubmit}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors text-base"
        >
          Generate My Study Plan →
        </button>

        <p className="text-center text-gray-600 text-xs mt-4">
          You can add more subjects later from the Planner.
        </p>
      </div>
    </div>
  );
}
