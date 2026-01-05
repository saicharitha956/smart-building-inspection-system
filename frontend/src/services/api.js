import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For file uploads
export const analyzeImage = async (formData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Analysis failed' };
  }
};

// For demo mode (if backend is not running)
export const mockAnalyzeImage = (imageData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock response based on your backend structure
      const mockDamages = ['minor_crack', 'major_crack', 'spalling', 'peeling', 'algae', 'stain', 'normal'];
      const detected = {};
      
      // Randomly generate 1-3 damages
      const numDamages = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numDamages; i++) {
        const damage = mockDamages[Math.floor(Math.random() * mockDamages.length)];
        detected[damage] = (detected[damage] || 0) + 1;
      }
      
      // Calculate severity
      const count = Object.values(detected).reduce((a, b) => a + b, 0);
      let severity = "Good";
      let score = 100;
      
      if (count > 0) {
        const penalties = {
          "major_crack": 15,
          "minor_crack": 8,
          "spalling": 20,
          "peeling": 10,
          "algae": 5,
          "stain": 5,
          "normal": 0
        };
        
        Object.keys(detected).forEach(d => {
          score -= penalties[d] * detected[d];
        });
        
        score = Math.max(score, 0);
        
        if (count <= 2) severity = "Moderate";
        else severity = "Critical";
      }
      
      const precautions = [
        "Regular inspection recommended",
        "Monitor damaged areas monthly",
        "Consider professional assessment"
      ];
      
      resolve({
        detected_damages: detected,
        severity,
        health_score: score,
        precautions
      });
    }, 1500);
  });
};

export default api;