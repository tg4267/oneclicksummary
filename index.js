const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS and JSON middleware
app.use(cors());
app.use(express.json());

const REQUEST_LIMIT = 5; // Daily limit
const userRequests = {}; // Track requests per user (by IP)

// Reset daily limits at midnight
const resetDailyLimits = () => {
  for (const user in userRequests) {
    userRequests[user] = 0;
  }
};
setInterval(resetDailyLimits, 24 * 60 * 60 * 1000);

app.post("/proxy", async (req, res) => {
  const userIP = req.ip;

  // action: "checkLimit" 처리
  if (req.body.action === "checkLimit") {
    const remaining = REQUEST_LIMIT - (userRequests[userIP] || 0);
    return res.json({ remaining }); // 남은 횟수 반환
  }

  // Initialize user count if not present
  if (!userRequests[userIP]) userRequests[userIP] = 0;

  // Check if limit exceeded
  if (userRequests[userIP] >= REQUEST_LIMIT) {
    return res.status(429).json({
      error: "Daily limit exceeded.",
      remaining: 0
    });
  }

  try {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: req.body.messages,
      max_tokens: req.body.max_tokens,
      temperature: req.body.temperature,
    }, {
      headers: { 
        Authorization: `Bearer ${process.env.API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    userRequests[userIP] += 1;
    const remaining = REQUEST_LIMIT - userRequests[userIP];

    res.json({
      ...response.data,
      remaining
    });
  } catch (error) {
    console.error("Error during API request:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
