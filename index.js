// index.js 파일

const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// JSON 요청 본문을 파싱할 수 있도록 설정
app.use(express.json());

// 프록시 엔드포인트 - POST 요청을 수신
app.post("/proxy", async (req, res) => {
  try {
    // OpenAI API 요청 전송
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
          "Content-Type": "application/json"
        }
      }
    );

    // 응답 데이터 반환
    res.json(response.data);
  } catch (error) {
    console.error("API 요청 중 오류 발생:", error);
    res.status(500).json({ error: "API 요청 실패" });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`프록시 서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
