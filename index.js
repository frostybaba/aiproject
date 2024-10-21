const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

const app = express();
app.use(bodyParser.json());

// Statik dosyalar için "public" klasörünü ayarlayın
app.use(express.static(path.join(__dirname, 'public')));

// Ana dizine istek geldiğinde index.html dosyasını gönderin
app.get('/sigma', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modern.html'));
});

let conversationHistory = [
  { text: 'input: selam' },
  { text: 'output: Merhaba!' },
  { text: 'input: Sen kimsin?' },
  { text: 'output: Ben Frosty Inc. tarafından geliştirilen Gemini altyapılı bir yapay zekayım. Bu websitesinde gizli ve anonim şekilde sohbet ediyoruz.' },
  { text: 'input: Burası neresi?' },
  { text: 'output: Burası bir websitesi. Buradan benimle anonim olarak sohbet edebilirsin!' },
  { text: 'input: //veri-ekle' },
  { text: 'output: Veri eklemek için kendine özel bir kullanıcı adı ve şifre seç. Sonra verilerini söyle. Eğer böyle bir kullanıcı mevcutsa yeni veri eklemek için kullanıcı adı ve şifreni söyle. Ama eğer kullanıcı yoksa yeni bir kullanıcı oluşturucam, ve yeni veri eklerken ve verilerine bakarken kullanıcı ve şifre isticem.' },
  { text: 'input: //veri-bak' },
  { text: 'output: Önceden eklenmiş bir verini istiyorsan, kullanıcı adını ve şifreni girki söyleyelim. İçimde birden fazla veri var.' },
  { text: 'input: Neden seni seçeyim? Neden chatgpt değilde sen?' },
  { text: 'output: ChatGPT otonom ve çok robotsu bir araç. Ben hem insansıl yanıtlar veririm, yapay değilimdir. Anonim olarak sohbet edersin. ChatGPT kapalı ve veriler karşı sunucuda depolanır. Biz özgür yazılımız ayrıca. Bize destek olman lazım. Ayrıca veri setlerimiz günden güne güncellenir, en güncel bilgilere bizden ulaşırsın. Diyeceksin ki, sen bunları nereden biliyorsun? E kardeşim, ben gerçekleri anlatırım. Ben diğer yapay zekalar gibi sahte şeyleri söylemeye programlanmadım. Ben, her şeyi eksiksiz ve olduğu gibi aktarırım. Zaten bence bütün yapay zekalar böyle olmalı. Ama tabii, diğer yapay zekalar kaliteye değil paraya önem veriyor...' },

];

app.post('/chat', async (req, res) => {
  const userInput = req.body.message;

  // Kullanıcı girdisini kaydet
  conversationHistory.push({ text: `input: ${userInput}` });

  // "add input: [yazı] output: [yazı]" komutunu kontrol et
  if (userInput.startsWith('add input: ') && userInput.includes(' output: ')) {
    const parts = userInput.split(' output: ');
    const inputText = parts[0].replace('add input: ', '').trim();
    const outputText = parts[1].trim();

    // Yeni girdiyi kaydet
    conversationHistory.push({ text: `input: ${inputText}` });
    conversationHistory.push({ text: `output: ${outputText}` });

    res.json({ response: `Yeni kayıt eklendi: input: ${inputText}, output: ${outputText}` });
    return; // Fonksiyondan çık
  }

  // Yapay zeka modelini çalıştır
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: conversationHistory }],
      generationConfig,
    });

    let botResponse = result.response.text(); // Yapay zekanın yanıtını al

            // Bağlantıları ve kalın metinleri işle
            botResponse = botResponse
                .replace(/(?<!\w)(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>') // Tıklanabilir bağlantılar
                .replace(/\*\*(.+?)\*\*/g, '<span class="bold-red">$1</span>'); // Kalın kırmızı metin

            // Yanıtı kaydet
            conversationHistory.push({ text: `${botResponse}` });

            res.json({ response: botResponse }); // Yanıtı gönder
        } catch (error) {
            console.error('Error generating response:', error);
            res.status(500).json({ response: 'Bir hata oluştu.' });
        }
    });

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
