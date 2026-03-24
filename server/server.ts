import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini API (API key is automatically provided in this environment)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// API Endpoint for Impulse Guard Extension
app.post('/api/analyze', async (req, res) => {
  const { price, hourlyRate, title, url } = req.body;
  const numPrice = parseFloat(price) || 0;
  const numRate = parseFloat(hourlyRate) || 500;
  const workHours = (numPrice / numRate).toFixed(1);

  console.log(`Analyzing purchase: ${title} for ₹${numPrice} (${workHours} hours)`);

  const prompt = `You are an anti-impulse buying financial advisor.
The user is considering buying this product: "${title}".
Price: ₹${numPrice}.
User's hourly wage: ₹${numRate}.
Cost in life hours: ${workHours} hours.

Analyze if this is a worthwhile purchase. Provide 2 pros, 2 cons, a short verdict, and a recommended wait time in seconds (between 5 and 30).`;

  try {
    // Call Google Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: {
              type: Type.STRING,
              description: "A short verdict on whether to buy it."
            },
            pros: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 pros of buying."
            },
            cons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 cons of buying."
            },
            timer: {
              type: Type.INTEGER,
              description: "Recommended wait time in seconds (5-30)."
            }
          },
          required: ["verdict", "pros", "cons", "timer"]
        }
      }
    });

    const aiResponse = JSON.parse(response.text?.trim() || "{}");

    res.json({
      message: aiResponse.verdict || "Take a moment to think about this.",
      pros: aiResponse.pros || [],
      cons: aiResponse.cons || [],
      timer: aiResponse.timer || 15
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    // Fallback logic if API fails
    res.json({
      message: `Fallback: This costs ${workHours} hours of your life. Are you sure you need it?`,
      pros: ["You might actually need it."],
      cons: ["It costs money.", "Might be an impulse buy."],
      timer: 10
    });
  }
});

// Serve the React app as a landing page
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Vite middleware for development
  import('vite').then(async ({ createServer }) => {
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
