# EnsCookherichess - AI Gourmet Guide 🍽️🤖

EnsCookherichess, Google Maps API ve Google Gemini AI kullanarak çalışan akıllı bir restoran bulma ve analiz uygulamasıdır. Kullanıcının etrafındaki mekanları Google üzerinden canlı olarak bulur ve yapay zeka ile kullanıcı yorumlarını analiz ederek mekana gidip gitmemeniz gerektiğine dair tarafsız raporlar sunar.

## ✨ Özellikler

- **Canlı Harita:** Google Maps API entegrasyonu ile gerçek zamanlı mekan arama.
- **AI Analiz:** Google Places'tan gelen gerçek kullanıcı yorumlarını Gemini AI ile süzüp özetleme.
- **AI Asistan:** Doğal dilde sohbet ederek ("Canım ucuz tavuk dürüm çekiyor") mekan bulma.
- **Modern UI:** Google standartlarında, temiz ve hızlı arayüz.
- **Mobil Uyumluluk:** Responsive tasarım.

## 🚀 Kurulum

1. Bu depoyu klonlayın: `git clone https://github.com/kullaniciadin/EnsCookherichess.git`
2. `backend/config.sample.php` dosyasını `backend/config.php` olarak adlandırın.
3. [Google Cloud Console](https://console.cloud.google.com/) üzerinden bir Google Maps API Key alın.
4. [Google AI Studio](https://aistudio.google.com/) üzerinden bir Gemini API Key alın.
5. Anahtarları `config.php` dosyasına yerleştirin.
6. Projeyi bir PHP sunucusunda (XAMPP vb.) çalıştırın.

## 🛠️ Teknoloji Yığını

- **Frontend:** Vanilla JS, CSS3, HTML5
- **Maps:** Google Maps JavaScript API (Places Library)
- **AI:** Google Gemini Pro API
- **Backend:** PHP 8+ (API Proxy)

---
Developed by **Enes**
