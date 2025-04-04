// src/api/openai-service.js
// Frontend-only OpenAI API service (for demonstration purposes only)

// IMPORTANT: This approach is for demonstration purposes only.
// In a production environment, API keys should be kept secure on a backend server.

// Function to call OpenAI API directly from the frontend
export const assessInnovation = async (companyName, apiKey) => {
  if (!companyName.trim()) {
    throw new Error('Company name is required');
  }

  if (!apiKey || !apiKey.trim()) {
    throw new Error('OpenAI API key is required');
  }

  try {
    // Create the prompt for OpenAI
    const prompt = `
You are an innovation assessment expert. Analyze the company "${companyName}" in terms of their innovation strategy.

Provide responses to the following questions using integer values from 0 to 3, where:
0 = Not at all
1 = Slightly
2 = Moderately
3 = Significantly

Return your assessment as a JSON object with the following structure:
{
  "assessment": {
    "md1": [0-3], // Does the innovation create an entirely new market category?
    "md2": [0-3], // Does it significantly change how existing markets operate?
    "md3": [0-3], // Does it create substantial new value for customers?
    "md4": [0-3], // Can it potentially displace established market leaders?
    "md5": [0-3], // Does it solve a previously unsolved customer problem?
    "td1": [0-3], // Does the innovation rely on technology not yet fully mature?
    "td2": [0-3], // Is it dependent on advancements from other technology providers?
    "td3": [0-3], // Are there technological barriers preventing immediate implementation?
    "td4": [0-3], // Does it require integration with external technological systems?
    "td5": [0-3]  // Is specialized technological expertise needed from external sources?
  },
  "reasoning": "A brief 2-3 sentence explanation of your assessment and the key factors that influenced your ratings."
}

Base your analysis on publicly available information. If the company is not well-known, make reasonable assumptions based on similar companies or the industry they might be in.
`;

    // Call OpenAI API directly (WARNING: This exposes your API key in client-side code)
    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-instruct", // Use an appropriate model that works with completions API
        prompt: prompt,
        max_tokens: 1000,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get assessment from OpenAI');
    }

    const data = await response.json();

    // Extract and parse the JSON response
    const responseText = data.choices[0].text.trim();
    const jsonMatch = responseText.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    try {
      const parsedResponse = JSON.parse(jsonMatch[0]);
      return parsedResponse;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse response from OpenAI');
    }
  } catch (error) {
    console.error('Error in assessInnovation:', error);
    throw error;
  }
};

// Alternative implementation using Chat Completions API (more modern approach)
export const assessInnovationWithChatAPI = async (companyName, apiKey) => {
  if (!companyName.trim()) {
    throw new Error('Company name is required');
  }

  if (!apiKey || !apiKey.trim()) {
    throw new Error('OpenAI API key is required');
  }

  try {
    // Create the message for OpenAI Chat API
    const systemMessage = `You are an innovation assessment expert. Analyze companies in terms of their innovation strategy and provide numerical ratings.`;

    const userMessage = `Analyze the company "${companyName}" and provide ratings for these innovation assessment questions.
Rate each question from 0 to 3 where:
0 = Not at all
1 = Slightly
2 = Moderately
3 = Significantly

Questions:
md1: Does the innovation create an entirely new market category?
md2: Does it significantly change how existing markets operate?
md3: Does it create substantial new value for customers?
md4: Can it potentially displace established market leaders?
md5: Does it solve a previously unsolved customer problem?
td1: Does the innovation rely on technology not yet fully mature?
td2: Is it dependent on advancements from other technology providers?
td3: Are there technological barriers preventing immediate implementation?
td4: Does it require integration with external technological systems?
td5: Is specialized technological expertise needed from external sources?

Return your assessment as a JSON object with this structure:
{
  "assessment": {
    "md1": [number],
    "md2": [number],
    "md3": [number],
    "md4": [number],
    "md5": [number],
    "td1": [number],
    "td2": [number],
    "td3": [number],
    "td4": [number],
    "td5": [number]
  },
  "reasoning": "A brief 2-3 sentence explanation of your assessment and the key factors that influenced your ratings."
}

Only return the JSON object, nothing else.`;

    // Call OpenAI Chat API directly (WARNING: This exposes your API key in client-side code)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get assessment from OpenAI');
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content.trim();

    try {
      // Try to parse directly if the model returned just JSON
      const parsedResponse = JSON.parse(responseText);
      return parsedResponse;
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from the text
      const jsonMatch = responseText.match(/{[\s\S]*}/);
      if (jsonMatch) {
        try {
          const extractedJson = JSON.parse(jsonMatch[0]);
          return extractedJson;
        } catch (nestedError) {
          throw new Error('Failed to parse response from OpenAI');
        }
      } else {
        throw new Error('Could not find valid JSON in response');
      }
    }
  } catch (error) {
    console.error('Error in assessInnovationWithChatAPI:', error);
    throw error;
  }
};

// Fallback to mock assessment if API call fails
export const getMockAssessment = (companyName) => {
  return {
    assessment: {
      md1: Math.floor(Math.random() * 4),
      md2: Math.floor(Math.random() * 4),
      md3: Math.floor(Math.random() * 4),
      md4: Math.floor(Math.random() * 4),
      md5: Math.floor(Math.random() * 4),
      td1: Math.floor(Math.random() * 4),
      td2: Math.floor(Math.random() * 4),
      td3: Math.floor(Math.random() * 4),
      td4: Math.floor(Math.random() * 4),
      td5: Math.floor(Math.random() * 4),
    },
    reasoning: `This is a mock assessment for ${companyName} generated locally. Please provide a valid OpenAI API key to get a real assessment.`
  };
};
