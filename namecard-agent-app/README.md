# Intelligent Namecard Agent

An AI-powered application that extracts information from namecard images, enriches the data, and exports to Excel format.

## Features

- 📸 Upload namecard images (PNG, JPG, WEBP)
- 🤖 AI-powered OCR extraction using Claude Vision API
- 🔍 Intelligent data enrichment (Industry, Company Size)
- 📊 Success rate tracking
- 💾 Export to Excel (CSV format)
- 💼 Save to database (customizable)

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)
- Claude AI API

## How to Deploy to Netlify

### Quick Deploy (5 minutes)

1. **Get your Anthropic API Key:**
   - Go to https://console.anthropic.com/
   - Create an account or login
   - Go to API Keys section
   - Create a new API key and copy it

2. **Deploy to Netlify:**
   
   **Option A: Drag & Drop**
   - Build locally first:
     ```bash
     npm install
     npm run build
     ```
   - Go to https://app.netlify.com/drop
   - Drag the `dist` folder
   
   **Option B: GitHub (Recommended)**
   - Push code to GitHub
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository
   - Netlify will auto-detect settings

3. **Add your API Key to Netlify:**
   - In your Netlify dashboard, go to: **Site settings** → **Environment variables**
   - Click "Add a variable"
   - Key: `VITE_ANTHROPIC_API_KEY`
   - Value: `your-api-key-here`
   - Click "Save"
   - **Important:** Redeploy your site after adding the environment variable

### Local Development

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your API key to `.env`:**
   ```
   VITE_ANTHROPIC_API_KEY=your_api_key_here
   ```

3. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:5173`

## Configuration

### Environment Variables

The app requires one environment variable:

- `VITE_ANTHROPIC_API_KEY` - Your Anthropic API key

**For Netlify:**
1. Go to Site settings → Environment variables
2. Add: `VITE_ANTHROPIC_API_KEY` = `your-api-key`
3. Redeploy your site

**For Local Development:**
1. Copy `.env.example` to `.env`
2. Add your API key to `.env`
3. Never commit `.env` to git (it's in .gitignore)

### Important Security Note:

⚠️ **The API key is exposed in the browser bundle.** This is fine for:
- Personal projects
- Demos
- Low-traffic apps
- Prototypes

For production apps with high traffic, consider:
- Adding rate limiting on Anthropic dashboard
- Using a backend proxy to hide the API key
- Monitoring usage to prevent abuse

## Customization

### Connect to Your Database

Replace the simulated `saveToDatabase` function in `src/App.jsx`:

```javascript
const saveToDatabase = async () => {
  setStep('saving');
  
  try {
    const response = await fetch('YOUR_BACKEND_API_URL/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enrichedData)
    });
    
    if (!response.ok) throw new Error('Failed to save');
    
    setStep('saved');
  } catch (error) {
    setError('Failed to save to database');
    setStep('enriched');
  }
};
```

### Modify Extraction Fields

Edit the prompt in the `extractNamecardData` function to extract additional fields.

### Change Enrichment Logic

Modify the prompt in the `enrichData` function to add custom enrichment logic.

## Project Structure

```
namecard-agent-app/
├── src/
│   ├── App.jsx          # Main component
│   ├── main.jsx         # Entry point
│   └── index.css        # Tailwind styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── netlify.toml         # Netlify settings
└── README.md           # This file
```

## Troubleshooting

**Build fails on Netlify:**
- Check that Node version is compatible (16+)
- Ensure all dependencies are in package.json

**API calls fail:**
- Check browser console for errors
- Verify image format is supported
- Ensure image size is under 5MB

**Styling issues:**
- Clear browser cache
- Rebuild with `npm run build`

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
