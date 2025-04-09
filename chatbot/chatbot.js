// Knowledge base - predefined questions and answers
const knowledgeBase = [
    {
        question: "hello",
        answer: "Hello! How can I assist you today?"
    },
    {
        question: "what are your opening hours",
        answer: "We're open Monday to Friday, 9 AM to 5 PM."
    },
    {
        question: "where are you  located",
        answer: "Our headquarters is at 123 Main Street, Anytown."
    },
    {
        question: "how can i contact support",
        answer: "You can email us at support@example.com or call +1 234 567 890."
    },
    {
        question: "do you offer refunds",
        answer: "Yes, we offer refunds within 30 days of purchase with a receipt."
    },
    {
        question: "what payment methods do you accept",
        answer: "We accept Visa, MasterCard, American Express, and PayPal."
    },
    {
        question: "how long does shipping take",
        answer: "Standard shipping takes 3-5 business days within the country."
    },
    {
        question: "can i track my order",
        answer: "Yes, you'll receive a tracking number once your order ships."
    },
    {
        question: "do you ship internationally",
        answer: "Yes, we ship to most countries with additional shipping fees."
    },
    {
        question: "what is your return policy",
        answer: "Items can be returned within 30 days in original condition."
    }
];

// DOM elements
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const muteBtn = document.getElementById('mute-btn');
const chatMessages = document.getElementById('chatbot-messages');
let isVoiceMuted = false;
let isBotVoiceMuted = false;
let recognition;

// Initialize speech synthesis
const synth = window.speechSynthesis;

// Add message to chat
function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'bot-message';
    messageDiv.innerHTML = `<p>${text}</p>`;
    chatMessages.appendChild(messageDiv);
    
    // Limit to 5 most recent messages
    const messages = chatMessages.querySelectorAll('.bot-message, .user-message');
    if (messages.length > 5) {
        chatMessages.removeChild(messages[0]);
    }
    
    // Auto-scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize speech synthesis
function initSpeechSynthesis() {
    if (!('speechSynthesis' in window)) {
        console.error('Speech Synthesis not supported');
        muteBtn.style.display = 'none';
        return;
    }

    // Load voices and log them for debugging
    const loadVoices = () => {
        const voices = synth.getVoices();
        console.log('Available voices:', voices);
    };

    synth.onvoiceschanged = loadVoices;
    
    // Chrome needs this to load voices
    if (synth.getVoices().length === 0) {
        setTimeout(loadVoices, 200);
    }
}

// Speak a message
function speakMessage(text) {
    if (isBotVoiceMuted || !('speechSynthesis' in window)) return;
    
    synth.cancel(); // Cancel any ongoing speech

    // Use the avatar's lip sync function if available
    if (typeof window.speakTextWithLipSync === 'function') {
        window.speakTextWithLipSync(text);
        return; // Let avatar.js handle the speech completely
    }

    // Fallback if avatar system isn't loaded
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Voice selection
    const voices = synth.getVoices();
    if (voices.length > 0) {
        const preferredVoice = voices.find(v => v.lang.includes('en')) || voices[0];
        utterance.voice = preferredVoice;
    }

    // Basic mouth movement triggers (if no avatar system)
    utterance.onstart = () => {
        if (typeof startAvatarSpeech === 'function') {
            startAvatarSpeech();
        }
    };

    utterance.onend = utterance.onerror = () => {
        if (typeof stopAvatarSpeech === 'function') {
            stopAvatarSpeech();
        }
    };

    synth.speak(utterance);
}

// Handle user input
async function handleUserInput() {
    const text = userInput.value.trim().toLowerCase();
    if (text === '') return;
    
    addMessage(text, true);
    userInput.value = '';
    
    // Find matching question in knowledge base
    const matchedQuestion = knowledgeBase.find(item => 
        text.includes(item.question.toLowerCase())
    );
    
    if (matchedQuestion) {
        setTimeout(() => {
            addMessage(matchedQuestion.answer, false);
            speakMessage(matchedQuestion.answer);
        }, 500);
    } else {
        setTimeout(() => {
            const fallback = "I can't answer that because of my limited knowledge.";
            addMessage(fallback, false);
            speakMessage(fallback);
        }, 500);
    }
}

// Initialize voice recognition
function initVoiceRecognition() {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
            voiceBtn.textContent = '🎤 Listening...';
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            handleUserInput();
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            voiceBtn.textContent = '🎤';
        };
        
        recognition.onend = () => {
            voiceBtn.textContent = '🎤';
        };
    } catch (e) {
        console.error('Speech recognition not supported', e);
        voiceBtn.style.display = 'none';
    }
}

// Event listeners
sendBtn.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserInput();
});

voiceBtn.addEventListener('click', () => {
    if (recognition) {
        recognition.start();
    } else {
        alert('Voice recognition not supported in your browser');
    }
});

muteBtn.addEventListener('click', () => {
    isBotVoiceMuted = !isBotVoiceMuted;
    muteBtn.textContent = isBotVoiceMuted ? '🔇' : '🔊';
    if (isBotVoiceMuted && synth.speaking) {
        synth.cancel();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initVoiceRecognition();
    initSpeechSynthesis();
    
    // Temporary test button (remove after testing)
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test Voice';
    testBtn.style.position = 'fixed';
    testBtn.style.top = '10px';
    testBtn.style.left = '10px';
    testBtn.style.zIndex = '1000';
    testBtn.addEventListener('click', () => {
        speakMessage("This is a test of the voice output system.");
    });
    document.body.appendChild(testBtn);
});