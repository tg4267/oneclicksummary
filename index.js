const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 미들웨어와 JSON 파서 미들웨어 추가
app.use(cors());
app.use(express.json());

app.post("/proxy", async (req, res) => {
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

    res.json(response.data);
  } catch (error) {
    console.error("API 요청 중 오류 발생:", error);
    res.status(500).json({ error: "API 요청 실패" });
  }
});

// 로컬 테스트용 코드 (Vercel에서는 무시됨)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`프록시 서버가 http://localhost:${PORT}에서 실행 중입니다.`);
  });
}

module.exports = app; // Vercel이 함수형 모듈을 인식하도록 내보내기
