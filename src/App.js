import React, { useState, useEffect } from 'react';
import './App.css';
// Import the OpenAI service
import { assessInnovationWithChatAPI, getMockAssessment } from './api/openai-service';

function App() {
  // Categories and questions
  const categories = [
    {
      name: "Market Disruption Potential",
      questions: [
        { id: "md1", text: "Does the innovation create an entirely new market category?", weight: 3 },
        { id: "md2", text: "Does it significantly change how existing markets operate?", weight: 2 },
        { id: "md3", text: "Does it create substantial new value for customers?", weight: 2 },
        { id: "md4", text: "Can it potentially displace established market leaders?", weight: 2 },
        { id: "md5", text: "Does it solve a previously unsolved customer problem?", weight: 1 }
      ]
    },
    {
      name: "Technological Enablement Dependency",
      questions: [
        { id: "td1", text: "Does the innovation rely on technology not yet fully mature?", weight: 3 },
        { id: "td2", text: "Is it dependent on advancements from other technology providers?", weight: 3 },
        { id: "td3", text: "Are there technological barriers preventing immediate implementation?", weight: 2 },
        { id: "td4", text: "Does it require integration with external technological systems?", weight: 1 },
        { id: "td5", text: "Is specialized technological expertise needed from external sources?", weight: 1 }
      ]
    }
  ];

  // State for responses (initialized to all zeros)
  const initialResponses = {};
  categories.forEach(category => {
    category.questions.forEach(question => {
      initialResponses[question.id] = 0;
    });
  });

  const [responses, setResponses] = useState(initialResponses);
  const [companyName, setCompanyName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isLoading, setIsLoading] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');
  const [error, setError] = useState('');

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      // Only save if it's non-empty
      localStorage.setItem('openai_api_key', apiKey);
    }
  }, [apiKey]);

  // Load API key from localStorage on initial load
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Calculate matrix size based on window width
  const getMatrixSize = () => {
    if (windowWidth <= 500) return 250;
    if (windowWidth <= 768) return 300;
    return 500; // Increased default size to 500px
  };

  const matrixSize = getMatrixSize();

  // Effect for window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle radio button changes
  const handleResponseChange = (questionId, value) => {
    setResponses({
      ...responses,
      [questionId]: parseInt(value)
    });
  };

  // Toggle API key visibility
  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  // Function to call OpenAI for assessment
  const fetchAIAssessment = async () => {
    if (!companyName.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      let data;

      if (apiKey && apiKey.trim()) {
        // If API key is provided, use it to call OpenAI
        data = await assessInnovationWithChatAPI(companyName, apiKey);
      } else {
        // If no API key, use mock assessment
        setError('No API key provided. Using mock assessment instead.');
        data = getMockAssessment(companyName);
      }

      // Update the form with AI-generated responses
      const newResponses = { ...responses };

      // Map the AI responses to our form
      Object.keys(data.assessment).forEach(questionId => {
        if (newResponses.hasOwnProperty(questionId)) {
          newResponses[questionId] = data.assessment[questionId];
        }
      });

      setResponses(newResponses);
      setAiReasoning(data.reasoning || '');
    } catch (error) {
      console.error('Error getting AI assessment:', error);
      setError(error.message || 'Failed to get AI assessment');

      // If API call fails, use mock assessment
      if (apiKey && apiKey.trim()) {
        setError(`API error: ${error.message}. Using mock assessment instead.`);
        const mockData = getMockAssessment(companyName);

        // Update with mock data
        const newResponses = { ...responses };
        Object.keys(mockData.assessment).forEach(questionId => {
          if (newResponses.hasOwnProperty(questionId)) {
            newResponses[questionId] = mockData.assessment[questionId];
          }
        });

        setResponses(newResponses);
        setAiReasoning(mockData.reasoning);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate scores
  const calculateScore = (categoryIndex) => {
    const category = categories[categoryIndex];
    let totalWeight = 0;
    let weightedSum = 0;

    category.questions.forEach(question => {
      totalWeight += question.weight;
      weightedSum += question.weight * responses[question.id];
    });

    return totalWeight > 0 ? (weightedSum / (totalWeight * 3) * 100) : 0;
  };

  // Score labels
  const getScoreLabel = (score) => {
    if (score < 30) return "Low";
    if (score < 70) return "Medium";
    return "High";
  };

  // Determine quadrant based on scores
  const determineQuadrant = (marketScore, techScore) => {
    if (marketScore >= 70 && techScore >= 70) {
      return {
        name: "Dependent Disruptor",
        color: "#9C27B0",
        description: "Revolutionary potential dependent on technology evolution"
      };
    } else if (marketScore >= 70 && techScore < 70) {
      return {
        name: "Breakthrough Innovator",
        color: "#4CAF50",
        description: "Revolutionary potential with available technology"
      };
    } else if (marketScore < 70 && techScore >= 70) {
      return {
        name: "Dependent Incrementalist",
        color: "#F44336",
        description: "Incremental improvements dependent on technology evolution"
      };
    } else {
      return {
        name: "Independent Improver",
        color: "#2196F3",
        description: "Near-term improvements using available technology"
      };
    }
  };

  // Calculate final scores
  const marketScore = calculateScore(0);
  const techScore = calculateScore(1);
  const quadrant = determineQuadrant(marketScore, techScore);

  return (
    <div className="container">
      <div className="header">
        <h2>Innovation Dependency Assessment Framework</h2>
      </div>

      {/* API Key Input */}
      <div className="input-group api-key-container">
        <label className="input-label" htmlFor="apiKey">
          OpenAI API Key:
        </label>
        <div className="input-row">
          <input
            type={showApiKey ? "text" : "password"}
            id="apiKey"
            className="text-input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OpenAI API key"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={toggleApiKeyVisibility}
            className="toggle-button"
          >
            {showApiKey ? "Hide" : "Show"}
          </button>
        </div>
        <div className="api-key-info">
          Your API key is stored in your browser's local storage and is only sent directly to OpenAI.
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
            Get an API key
          </a>
        </div>
      </div>

      {/* Company Name Input */}
      <div className="input-group">
        <label className="input-label" htmlFor="companyName">
          Company/Innovation Name:
        </label>
        <div className="input-row">
          <input
            type="text"
            id="companyName"
            className="text-input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter company or innovation name"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={fetchAIAssessment}
            disabled={isLoading || !companyName.trim()}
            className="ai-button"
          >
            {isLoading ? (
              <>
                <span className="loading-indicator"></span>
                Analyzing...
              </>
            ) : 'Auto-assess with AI'}
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Assessment Questions */}
      {categories.map((category, categoryIndex) => (
        <div key={categoryIndex} className="category">
          <h3 className="category-title">
            {category.name}
          </h3>

          {category.questions.map((question, questionIndex) => (
            <div key={questionIndex} className="question">
              <div className="question-text">
                {question.text}
                {question.weight > 1 &&
                  <span className="weight-indicator"> (Weight: {question.weight})</span>
                }
              </div>

              <div className="options">
                {[0, 1, 2, 3].map(value => (
                  <div key={value} className="option">
                    <input
                      type="radio"
                      id={`${question.id}_${value}`}
                      name={question.id}
                      value={value}
                      checked={responses[question.id] === value}
                      onChange={() => handleResponseChange(question.id, value)}
                    />
                    <label htmlFor={`${question.id}_${value}`}>
                      {value === 0 ? "Not at all" :
                       value === 1 ? "Slightly" :
                       value === 2 ? "Moderately" :
                       "Significantly"}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Results Section */}
      <div className="results">
        <h3 className="results-title">Assessment Results</h3>

        <div className="scores">
          <div className="score">
            <div className="score-title">Market Disruption Potential</div>
            <div className="score-value" style={{
              color: marketScore >= 70 ? '#4CAF50' : (marketScore >= 30 ? '#FF9800' : '#F44336')
            }}>
              {getScoreLabel(marketScore)} ({Math.round(marketScore)}%)
            </div>
          </div>

          <div className="score">
            <div className="score-title">Technological Dependency</div>
            <div className="score-value" style={{
              color: techScore >= 70 ? '#4CAF50' : (techScore >= 30 ? '#FF9800' : '#F44336')
            }}>
              {getScoreLabel(techScore)} ({Math.round(techScore)}%)
            </div>
          </div>
        </div>

        <div className="quadrant" style={{
          backgroundColor: quadrant.color + '22',
          border: `2px solid ${quadrant.color}`
        }}>
          <div className="quadrant-title" style={{ color: quadrant.color }}>
            {companyName ? `${companyName} is a:` : 'Result:'} {quadrant.name}
          </div>
          <div>{quadrant.description}</div>
        </div>

        {/* AI Reasoning Section */}
        {aiReasoning && (
          <div className="ai-reasoning">
            <h4>AI Assessment Reasoning</h4>
            <p>{aiReasoning}</p>
          </div>
        )}

        {/* Matrix Visualization */}
        <div className="matrix-container">
          <h4 className="matrix-title">Position on Innovation Dependency Matrix</h4>

          <div className="matrix" style={{
            width: `${matrixSize}px`,
            height: `${matrixSize}px`,
          }}>
            {/* Quadrant Backgrounds */}
            <div className="matrix-quadrant" style={{ top: '0', left: '0', width: '50%', height: '50%', backgroundColor: '#4CAF50' }}></div>
            <div className="matrix-quadrant" style={{ top: '0', left: '50%', width: '50%', height: '50%', backgroundColor: '#9C27B0' }}></div>
            <div className="matrix-quadrant" style={{ top: '50%', left: '0', width: '50%', height: '50%', backgroundColor: '#2196F3' }}></div>
            <div className="matrix-quadrant" style={{ top: '50%', left: '50%', width: '50%', height: '50%', backgroundColor: '#F44336' }}></div>

            {/* Grid lines */}
            <div className="matrix-line" style={{ top: '50%', left: '0', right: '0', height: '2px', position: 'absolute', backgroundColor: '#ccc' }}></div>
            <div className="matrix-line" style={{ top: '0', bottom: '0', left: '50%', width: '2px', position: 'absolute', backgroundColor: '#ccc' }}></div>

            {/* Quadrant Labels */}
            <div className="matrix-label" style={{ top: '25%', left: '25%', transform: 'translate(-50%, -50%)', color: '#4CAF50' }}>Breakthrough<br/>Innovator</div>
            <div className="matrix-label" style={{ top: '25%', left: '75%', transform: 'translate(-50%, -50%)', color: '#9C27B0' }}>Dependent<br/>Disruptor</div>
            <div className="matrix-label" style={{ top: '75%', left: '25%', transform: 'translate(-50%, -50%)', color: '#2196F3' }}>Independent<br/>Improver</div>
            <div className="matrix-label" style={{ top: '75%', left: '75%', transform: 'translate(-50%, -50%)', color:  '#F44336'}}>Dependent<br/>Incrementalist</div>

            {/* Axis Labels */}
            <div className="matrix-label" style={{ top: '10px', left: '50%', transform: 'translateX(-50%)' }}>High</div>
            <div className="matrix-label" style={{ bottom: '10px', left: '50%', transform: 'translateX(-50%)' }}>Low</div>
            <div className="matrix-label" style={{ top: '50%', left: '10px', transform: 'translateY(-50%)' }}>Low</div>
            <div className="matrix-label" style={{ top: '50%', right: '10px', transform: 'translateY(-50%)' }}>High</div>

            {/* Position dot */}
            <div className="matrix-position" style={{
              top: `${100 - marketScore}%`,
              left: `${techScore}%`,
            }}></div>

            {/* Vertical axis title - positioned with relative margin */}
            <div style={{
              position: 'absolute',
              top: '25%',
              left: '-50%',
              transform: 'rotate(-90deg)',
              transformOrigin: 'right center',
              width: '200px',
              textAlign: 'center',
              fontSize: '12px'
            }}>
              Market Disruption Potential
            </div>
          </div>

          {/* Horizontal axis title - Below the matrix */}
          <div style={{
            width: '100%',
            textAlign: 'center',
            marginTop: '30px',
            fontSize: '12px'
          }}>
            Technological Enablement Dependency
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
