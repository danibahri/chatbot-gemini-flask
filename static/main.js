import { streamGemini } from "./gemini-api.js";

// Ambil elemen DOM yang diperlukan
let form = document.querySelector("form");
let promptInput = document.querySelector('input[name="prompt"]');
let chatBox = document.querySelector(".chat-box");

// Tambahkan pesan sambutan saat halaman dimuat
window.onload = () => {
  let welcomeMessage = document.createElement("div");
  welcomeMessage.className = "message ai";
  welcomeMessage.textContent =
    "Selamat datang, Dani! Saya adalah asisten Anda yang siap membantu.";
  chatBox.appendChild(welcomeMessage);
};

// Fungsi untuk menambahkan pesan pengguna ke chatbox
function addUserMessage(message) {
  let userMessage = document.createElement("div");
  userMessage.className = "message user";
  userMessage.textContent = message;
  chatBox.appendChild(userMessage);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Fungsi untuk menambahkan pesan AI ke chatbox
function addAIMessage(message) {
  let aiMessage = document.createElement("div");
  aiMessage.className = "message ai";
  aiMessage.innerHTML = message;
  chatBox.appendChild(aiMessage);
  chatBox.scrollTop = chatBox.scrollHeight;
  return aiMessage;
}

// Fungsi untuk melakukan pewarnaan sintaks
function highlightCode() {
  if (window.Prism) {
    Prism.highlightAll();
  }
}

// Fungsi untuk menangani form submit
form.onsubmit = async (ev) => {
  ev.preventDefault();
  let userInput = promptInput.value.trim();
  if (!userInput) return;

  // Tampilkan pesan pengguna di chatbox
  addUserMessage(userInput);

  // Kosongkan input setelah mengirim
  promptInput.value = "";

  // Tampilkan placeholder pesan AI "Sedang menjawab..."
  let aiMessageElement = addAIMessage("Sedang menjawab...");

  try {
    // Panggil API Gemini dengan input pengguna
    let contents = [{ type: "text", text: userInput }];
    let stream = streamGemini({ model: "gemini-pro", contents });

    // Tampung respons secara bertahap
    let buffer = [];
    let isCodeBlock = false;

    for await (let chunk of stream) {
      buffer.push(chunk);
      let responseText = buffer.join("");

      // Deteksi apakah respons berisi kode (```)
      if (responseText.includes("```")) {
        isCodeBlock = true;
        // Pisahkan blok kode dan teks biasa
        let formattedResponse = formatCodeResponse(responseText);
        aiMessageElement.innerHTML = formattedResponse;
        highlightCode();
      } else {
        aiMessageElement.textContent = responseText;
      }

      chatBox.scrollTop = chatBox.scrollHeight;
    }
  } catch (e) {
    aiMessageElement.textContent = "Terjadi kesalahan: " + e.message;
  }
};

// Fungsi untuk memformat respons yang berisi blok kode
function formatCodeResponse(responseText) {
  let codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
  return responseText.replace(codeRegex, (match, lang, code) => {
    // Gunakan Prism.js untuk pewarnaan sintaks
    let language = lang ? `language-${lang}` : "";
    return `<pre><code class="${language}">${escapeHTML(code)}</code></pre>`;
  });
}

// Fungsi untuk menghindari karakter HTML berbahaya
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
