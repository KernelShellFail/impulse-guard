# Impulse Guard - Documentation

## Overview
**Impulse Guard** is a Chrome Extension and Node.js backend system designed to curb impulse buying. By intercepting "Buy Now" and "Add to Cart" buttons on e-commerce sites (specifically optimized for Amazon India), it introduces a friction layer—a popup that calculates the "time cost" of the item based on your hourly wage and enforces a mandatory waiting period before you can proceed.

It now features **AI Analysis via Google Gemini**, which analyzes the product you are buying, gives you pros and cons, and dynamically sets the wait timer based on the AI's verdict.

---

## Features
- **Checkout Interception:** Automatically detects checkout and cart buttons using event delegation.
- **Price Extraction:** Intelligently scrapes the price of the item from the page, prioritizing the actual discounted price.
- **Time-Cost Calculation:** Converts the monetary cost of the item into "hours of your life" based on a configurable hourly rate.
- **AI Analysis:** Sends the product title, price, and your hourly rate to the Google Gemini API to generate pros, cons, and a verdict on whether you should buy it.
- **Dynamic Friction Timer:** The AI determines how long you should wait (between 5 and 30 seconds) based on the cost and necessity of the item.
- **Customizable Settings:** Users can set their own hourly earning rate via the extension popup.

---

## Tech Stack
- **Frontend:** Chrome Extension (Manifest V3), Vanilla JavaScript, HTML, CSS.
- **Backend:** Node.js, Express, TypeScript.
- **AI Engine:** Google Gemini API (`@google/genai`).

---

## Project Structure

```text
/
├── extension/               # Chrome Extension Files
│   ├── manifest.json        # Extension configuration and permissions
│   ├── content.js           # Injected script: intercepts clicks, extracts price, calls AI, shows modal
│   ├── popup.html           # Extension menu UI (Settings)
│   ├── popup.js             # Logic for saving/loading the hourly rate
│   ├── content.css          # Styling for the friction modal and AI analysis
│   └── icons/               # Extension icons
├── server/                  # Backend Server Files
│   └── server.ts            # Express server handling the Gemini API connection
├── package.json             # Node.js dependencies and scripts
└── README.md                # This documentation file
```

---

## Installation & Setup

### 1. Start the Backend Server
The extension relies on a local backend server to communicate with the Gemini API and determine the waiting time.

1. Open your terminal and navigate to the project root directory.
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The server will start running at `http://localhost:3000`.*

### 2. Install the Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle switch in the top right corner).
3. Click the **Load unpacked** button in the top left.
4. Select the `extension` folder from this project directory.
5. The "Impulse Guard Prototype" extension should now appear in your list of extensions.

---

## How to Use

1. **Set Your Hourly Rate:**
   - Click the puzzle piece icon in the top right of Chrome and pin **Impulse Guard**.
   - Click the Impulse Guard icon to open the settings popup.
   - Enter your hourly earning rate in INR (₹) (e.g., `500`).
   - Click **Save Settings**.

2. **Test the Extension:**
   - Go to an e-commerce site like [Amazon.in](https://www.amazon.in).
   - Find a product and click **Add to Cart** or **Buy Now**.
   - The Impulse Guard modal will appear, blocking the immediate action.
   - It will display the price and the equivalent hours of work.
   - The AI will analyze the product and display **Pros**, **Cons**, and a **Verdict**.
   - Once the AI finishes and the timer reaches zero, you can click **Continue Purchase** to proceed.

---

## How It Works (Under the Hood)

1. **Event Delegation (`content.js`):** 
   The extension listens to all clicks on the document in the *capture phase*. If the clicked element (or its parent) matches known checkout button selectors, it intercepts the event.
2. **Price Parsing (`content.js`):**
   It scans the DOM for specific price classes (prioritizing the discounted price and ignoring the M.R.P.), strips out commas, and converts it to a float. It also tracks the price continuously to handle variant changes.
3. **API Request (`content.js` -> `server.ts`):**
   The extension sends a `POST` request to `http://localhost:3000/api/analyze` with the extracted price, product title, URL, and user's hourly rate.
4. **AI Logic (`server.ts` -> `Gemini`):**
   The server constructs a prompt and sends it to the Google Gemini API using the `@google/genai` SDK. The AI returns a JSON object containing the verdict, pros, cons, and a recommended timer.
5. **Modal Rendering (`content.js` & `content.css`):**
   The extension injects a modal into the page, displays the AI's analysis, runs the countdown timer, and temporarily disables the "Continue" button.
6. **Resuming the Action:**
   If the user clicks "Continue Purchase", the extension temporarily flags the button to bypass the guard (`dataset.igBypass = "true"`) and programmatically clicks the original button again to resume the checkout flow.

---

## Customization & Development

### Changing the API URL
If you deploy the backend to a live server, you must update the `backendUrl` variable in `/extension/content.js`:
```javascript
// Change this line in content.js
const backendUrl = 'https://your-deployed-url.com';
```

---

## Troubleshooting

- **"Fallback: This costs X hours..." message:** This means the Node.js server cannot reach the Gemini API. Ensure you have internet access and the server is running.
- **Popup doesn't show up on Amazon:** Ensure the local server is running (`npm run dev`). If you updated `content.js`, make sure you went to `chrome://extensions/` and clicked the **Reload** icon for the extension.
- **"Failed to fetch" error in console:** The extension cannot reach the backend. Verify that `http://localhost:3000` is running and accessible.
