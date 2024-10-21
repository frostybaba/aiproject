const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Google Generative AI ayarları
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html'); // HTML dosyasını gönder
});

io.on('connection', (socket) => {
  console.log('Yeni bir kullanıcı bağlandı');

  socket.on('chat message', async (msg) => {
    console.log(`Mesaj alındı: ${msg}`);
    const response = await getGeminiResponse(msg);
    io.emit('chat message', response);
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı');
  });
});

// Google Generative AI'den yanıt almak için fonksiyon
async function getGeminiResponse(userMessage) {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(userMessage);
    return result.response.text(); // Gelen yanıtı döndür
  } catch (error) {
    console.error('API isteği hatası:', error);
    return 'Üzgünüm, bir hata oluştu.';
  }
}
