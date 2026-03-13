import dotenv from 'dotenv';
dotenv.config();

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY2;

/**
 * Uses Gemini to generate structured medicine info:
 * description, uses, sideEffects, genericAlternatives[], otcAvailable
 */
async function askGemini(medicineName, genericName) {
  const prompt = `You are a helpful pharmacist AI. For the medicine "${medicineName}" (generic: "${genericName}"), respond ONLY with a valid JSON object in this exact format:
{
  "description": "One sentence about what this medicine is",
  "primaryUses": ["Use 1", "Use 2", "Use 3"],
  "commonSideEffects": ["Side effect 1", "Side effect 2"],
  "genericAlternatives": [
    { "name": "Generic medicine name 1", "note": "Short note why it's similar" },
    { "name": "Generic medicine name 2", "note": "Short note" }
  ],
  "otcAvailable": true,
  "warningNote": "One important warning or null if none"
}
Return ONLY the JSON, no explanation, no markdown.`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      }),
    }
  );

  const data = await resp.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // Strip any markdown code fences
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
}

/**
 * Try to get a medicine image URL from Open FDA (free, no key needed)
 */
async function getMedicineImage(medicineName) {
  try {
    const encoded = encodeURIComponent(medicineName.split(' ')[0]);
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encoded}"&limit=1`;
    const resp = await fetch(url);
    const data = await resp.json();
    // FDA doesn't always have images, but returns structured data
    // Fall back to a placeholder image
    if (data?.results?.length) {
      return null; // FDA API has no image field; we'll use a reliable placeholder
    }
  } catch (_) {}
  return null;
}

export async function getMedicineInfo(req, res) {
  const { name, generic } = req.query;
  if (!name) return res.status(400).json({ success: false, message: 'name is required' });

  if (!GEMINI_KEY) {
    return res.status(500).json({ success: false, message: 'Gemini API key not configured' });
  }

  try {
    const [aiInfo] = await Promise.all([
      askGemini(name, generic || name),
    ]);

    // Use a free drug image service (via DuckDuckGo Instant Answer image or Wikimedia)
    // We provide a deterministic placeholder that shows name+category
    const imageUrl = `https://via.placeholder.com/300x200/0d9488/ffffff?text=${encodeURIComponent(name)}`;

    return res.json({
      success: true,
      medicineName: name,
      genericName: generic || '',
      imageUrl,
      ...aiInfo,
    });
  } catch (err) {
    console.error('Medicine info error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch medicine info' });
  }
}
