import React, { useState, useCallback, useEffect } from "react";

// Types for VS Code API
declare const acquireVsCodeApi: () => {
  postMessage: (message: any) => void;
};

interface Step {
  id: string;
  type: string;
  selector: string;
  value: string;
  description: string;
  isExpanded: boolean;
}

const App: React.FC = () => {
  const [url, setUrl] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Test if VS Code API is available
  let vscode: any = null;
  try {
    vscode = acquireVsCodeApi();
  } catch (error) {
    console.error("VS Code API not available:", error);
  }

  const addStep = useCallback(() => {
    const newStep: Step = {
      id: `step-${Date.now()}`,
      type: "click",
      selector: "",
      value: "",
      description: "",
      isExpanded: false, // Start closed
    };
    setSteps((prev) => [...prev, newStep]);
  }, []);

  const removeStep = useCallback((stepId: string) => {
    setSteps((prev) => prev.filter((step) => step.id !== stepId));
  }, []);

  // Add initial step on mount
  useEffect(() => {
    console.log("App mounting...");
    setIsLoaded(true);
    addStep();

    // Listen for messages from the extension
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case "addStep":
          addStep();
          break;
        case "removeStep":
          removeStep(message.stepId);
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [addStep, removeStep]);

  const updateStep = useCallback(
    (stepId: string, field: keyof Step, value: any) => {
      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, [field]: value } : step
        )
      );
    },
    []
  );

  const toggleStep = useCallback((stepId: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, isExpanded: !step.isExpanded } : step
      )
    );
  }, []);

  const executeWorkflow = useCallback(() => {
    const workflowData = {
      url,
      steps: steps.map((step, index) => ({
        id: step.id,
        type: step.type,
        selector: step.selector,
        value: step.value,
        description: step.description,
        order: index + 1,
      })),
    };

    vscode.postMessage({
      type: "execute",
      data: workflowData,
    });
  }, [url, steps, vscode]);

  const getStepTitle = (step: Step, index: number) => {
    if (step.type && step.type !== "click") {
      return `Step ${index + 1}: ${
        step.type.charAt(0).toUpperCase() + step.type.slice(1)
      }`;
    }
    return `Step ${index + 1}`;
  };

  return (
    <div className="container">
      {/* Debug info */}
      <div
        style={{
          background: "#333",
          padding: "8px",
          marginBottom: "16px",
          fontSize: "12px",
        }}
      >
        <div>App Loaded: {isLoaded ? "Yes" : "No"}</div>
        <div>Steps: {steps.length}</div>
        <div>VS Code API: {vscode ? "Available" : "Not Available"}</div>
      </div>

      <div className="section">
        <h3>URL Configuration</h3>
        <div className="input-group">
          <label htmlFor="url-input">Target URL</label>
          <input
            type="url"
            id="url-input"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
      </div>

      <div className="section">
        <h3>Workflow Scripts</h3>
        <button className="button secondary add-step-btn" onClick={addStep}>
          + Add Step
        </button>
        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={step.id} className="accordion">
              <div
                className="accordion-header"
                onClick={() => toggleStep(step.id)}
              >
                <span className="accordion-title">
                  {getStepTitle(step, index)}
                </span>
                <div className="accordion-actions">
                  <button
                    className="button small danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStep(step.id);
                    }}
                    title="Remove Step"
                  >
                    ×
                  </button>
                  <span className="accordion-toggle">
                    {step.isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>
              <div
                className={`accordion-content ${
                  !step.isExpanded ? "hidden" : ""
                }`}
              >
                <div className="input-group">
                  <label>Step Type</label>
                  <select
                    className="step-type-select"
                    value={step.type}
                    onChange={(e) =>
                      updateStep(step.id, "type", e.target.value)
                    }
                  >
                    <option value="click">Click Element</option>
                    <option value="input">Input Text</option>
                    <option value="wait">Wait</option>
                    <option value="navigate">Navigate</option>
                    <option value="screenshot">Take Screenshot</option>
                    <option value="custom">Custom Script</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Selector/Target</label>
                  <input
                    type="text"
                    placeholder="CSS selector or element description"
                    value={step.selector}
                    onChange={(e) =>
                      updateStep(step.id, "selector", e.target.value)
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Value/Text</label>
                  <input
                    type="text"
                    placeholder="Text to input or click target"
                    value={step.value}
                    onChange={(e) =>
                      updateStep(step.id, "value", e.target.value)
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Describe what this step does..."
                    value={step.description}
                    onChange={(e) =>
                      updateStep(step.id, "description", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="execute-section">
        <button className="button execute-btn" onClick={executeWorkflow}>
          Execute Workflow
        </button>
      </div>
    </div>
  );
};

export default App;
