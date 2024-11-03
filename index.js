const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 미들웨어와 JSON 파서 미들웨어 추가
app.use(cors());
app.use(express.json());

// 일일 요청 제한 및 사용자별 요청 횟수 추적용 객체
const REQUEST_LIMIT = 5; // 하루 요청 제한 횟수
const userRequests = {};

// 자정마다 사용자 요청 횟수 초기화
const resetDailyLimits = () => {
  for (const user in userRequests) {
    userRequests[user] = 0;
  }
};
setInterval(resetDailyLimits, 24 * 60 * 60 * 1000); // 24시간마다 초기화

app.post("/proxy", async (req, res) => {
  const userIP = req.ip;

  // 요청 횟수 초기화 및 제한 검사
  if (!userRequests[userIP]) userRequests[userIP] = 0;
  if (userRequests[userIP] >= REQUEST_LIMIT) {
    return res.status(429).json({
      error: "일일 요청 한도를 초과했습니다.",
      remainingRequests: 0
    });
  }

  // 요청 처리 및 요청 횟수 증가
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: req.body.messages,
        max_tokens: req.body.max_tokens,
        temperature: req.body.temperature,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    userRequests[userIP] += 1;
    const remainingRequests = REQUEST_LIMIT - userRequests[userIP];
    res.json({
      ...response.data,
      remainingRequests: remainingRequests
    });
  } catch (error) {
    console.error("API 요청 중 오류 발생:", error);
    res.status(500).json({ error: "API 요청 실패" });
  }
});

// 로컬 테스트용 코드 (Vercel에서는 무시됨)
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
