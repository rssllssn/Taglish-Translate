const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// A simple in-memory store for rate limiting
// NOTE: This resets on cold start and does not sync across Vercel regions/instances.
// For production, consider using Vercel KV or Upstash Redis.
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 100; // max requests
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function getClientIp(req) {
    // Vercel populates this header
    return req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
    const now = Date.now();
    const userRecord = rateLimitMap.get(ip);

    if (!userRecord) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return false;
    }

    if (now > userRecord.resetTime) {
        // Window expired, reset
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return false;
    }

    if (userRecord.count >= RATE_LIMIT_MAX) {
        return true;
    }

    // Increment
    userRecord.count += 1;
    rateLimitMap.set(ip, userRecord);
    return false;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const ip = getClientIp(req);
        
        if (isRateLimited(ip)) {
            return res.status(429).json({ 
                error: 'Too many requests. Please try again later.' 
            });
        }

        const { text, source, target, vibe } = req.body;

        if (!text || !source || !target) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!process.env.OPENAI_API_KEY) {
             console.error("OPENAI_API_KEY is missing from environment variables.");
             return res.status(500).json({ error: 'Server configuration error' });
        }

        // Construct the prompt based on languages and vibe
        let systemPrompt = `You are a professional, highly accurate translation engine. You translate natively between English, Tagalog, and Taglish. Returning ONLY the raw translated text with no conversational filler, quotes, or markdown.`;

        if (target === 'taglish') {
             if (vibe === 'formal') {
                 systemPrompt += `\nThe user has requested 'Formal Taglish'. Use polite language, respectful terms (e.g., 'po' and 'opo'), and intermix English and Tagalog in a professional, courteous manner akin to modern business or formal conversations in Metro Manila.`;
             } else {
                 systemPrompt += `\nThe user has requested 'Casual Taglish'. Use natural, colloquial, everyday conversational language. It should sound like how young people and friends talk in Metro Manila, mixing English and Tagalog seamlessly. Slang is acceptable.`;
             }
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Translate the following text from ${source} to ${target}:\n\n${text}` }
            ],
            max_tokens: 1500,
            temperature: 0.7,
        });

        const translation = completion.choices[0].message.content.trim();

        res.status(200).json({ translation });

    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Failed to process translation request.' });
    }
}
