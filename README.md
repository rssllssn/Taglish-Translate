# Taglish Translate 🇵🇭

A beautiful, sleek, and responsive translation web application built to facilitate seamless translation between English, Tagalog, and **Taglish**.

## Live Demo
[https://taglish-translate.vercel.app/](https://taglish-translate.vercel.app/)

## Features

- **Trilingual Translation:** Instantly translate between English, Tagalog, and Taglish.
- **Taglish "Vibes":** When translating *into* Taglish, users can select between "Casual" (colloquial, everyday slang) and "Formal" (professional, polite language) tones.
- **Speech-to-Text Integration:** Natively use your microphone to dictate text directly into the translator using the Web Speech API.
- **Premium Interface:** Features a stunning "glassmorphism" dark-mode aesthetic inspired by modern Google services.
- **Vercel Serverless Architecture:** The frontend is entirely static, powered by lightning-fast, edge-deployed Vercel serverless functions (`/api/translate`).
- **OpenAI Powered:** Leverages the OpenAI `gpt-3.5-turbo` model with highly specific system prompts to achieve localized, accurate Taglish translations that standard translation engines struggle with.
- **Rate Limited:** Built-in IP rate limiting (100 requests per hour) using Upstash/Vercel-friendly design to prevent API abuse.
- **Copy to Clipboard:** One-click copying of translated text.

## Tech Stack

- **Frontend:** Pure HTML5, CSS3, and Vanilla JavaScript.
- **Backend:** Node.js (Vercel Serverless Functions) with `openai` SDK.
- **Hosting:** Vercel.

## Local Development Setup

To run this application locally, you will need Node.js and an OpenAI API key.

1. Clone the repository:
   ```bash
   git clone https://github.com/rssllssn/Taglish-Translate.git
   cd Taglish-Translate
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Copy `.env.example` to `.env` and insert your OpenAI API Key:
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```
4. Start the Vercel local development server (requires Vercel CLI):
   ```bash
   vercel dev
   ```
   *Alternatively, you can just open `index.html` in your browser for the frontend UI, but the translation API will not function without a running backend.*

## Author
**Russell Sioson**
- GitHub: [rssllssn](https://github.com/rssllssn)
- Email: rxssellsioson@gmail.com
