const textInput = document.getElementById('textInput');
const translatedTextInput = document.getElementById('translatedTextInput');
const languageSelect = document.getElementById('languageSelect'); // For speech language
const translateLanguageSelect = document.getElementById('translateLanguageSelect'); // For translation target language
const speakButton = document.getElementById('speakButton');
const stopButton = document.getElementById('stopButton');
const clearButton = document.getElementById('clearButton');
const translateButton = document.getElementById('translateButton');
const messageBox = document.getElementById('messageBox');

let voices = []; // Array to store available voices
let selectedVoice = null; // To store the currently selected voice for speech
let isSpeaking = false; // Flag to track if speech is ongoing

// Mapping of language codes to display names for Gemini API prompt
const languageNames = {
    'en-US': 'English (US)',
    'en-IN': 'English (India)',
    'hi-IN': 'Hindi',
    'mr-IN': 'Marathi',
    'ta-IN': 'Tamil',
    'ra-IN': 'Hindi', // Rajasthani fallback for translation
    'bh-IN': 'Hindi'  // Bhojpuri fallback for translation
};

/**
 * Populates the voices array and sets up the initial voice selection.
 * This function is called when voices are loaded.
 */
function populateVoiceList() {
    voices = window.speechSynthesis.getVoices();
    // Only proceed with voice selection if voices are actually loaded
    if (voices.length > 0) {
        updateVoiceSelection();
        // Attempt to set default speech language to en-IN if an Indian English voice is available
        const hasIndianEnglishVoice = voices.some(voice => voice.lang === 'en-IN' && (voice.name.toLowerCase().includes('india') || voice.name.toLowerCase().includes('indian') || voice.name.toLowerCase().includes('google')));
        if (hasIndianEnglishVoice) {
            languageSelect.value = 'en-IN';
            translateLanguageSelect.value = 'en-IN'; // Also set translation target to Indian English
            updateVoiceSelection(); // Re-run selection to pick the en-IN voice
        }
    } else {
        messageBox.textContent = 'Loading voices... Please wait or try refreshing if voices do not appear.';
        speakButton.disabled = true;
    }
}

/**
 * Updates the selected voice based on the chosen speech language and gender.
 * It iterates through available voices to find the best match,
 * prioritizing Indian accents for relevant languages.
 */
function updateVoiceSelection() {
    const selectedSpeechLang = languageSelect.value;
    const selectedGender = document.querySelector('input[name="voiceGender"]:checked').value;
    let foundVoice = null;
    messageBox.textContent = ''; // Clear previous message

    if (voices.length === 0) {
        messageBox.textContent = 'No voices loaded yet. Please wait.';
        speakButton.disabled = true;
        return;
    }

    // Helper function to check if a voice name indicates an Indian accent
    const isIndianAccent = (voiceName) => {
        const lowerName = voiceName.toLowerCase();
        // Common indicators for Indian voices from various providers
        return lowerName.includes('india') || lowerName.includes('indian') || lowerName.includes('google') || lowerName.includes('microsoft') || lowerName.includes('sangeeta') || lowerName.includes('ravi');
    };

    // Helper to determine if a voice name suggests male gender
    const isMaleVoice = (voiceNameLower) => voiceNameLower.includes('male') || voiceNameLower.includes('boy') || voiceNameLower.includes('david') || voiceNameLower.includes('ravi');
    // Helper to determine if a voice name suggests female gender
    const isFemaleVoice = (voiceNameLower) => voiceNameLower.includes('female') || voiceNameLower.includes('girl') || voiceNameLower.includes('zira') || voiceNameLower.includes('sangeeta');


    // --- Step 1: Try to find an Indian accent voice for the selected speech language and gender ---
    for (const voice of voices) {
        if (voice.lang === selectedSpeechLang) {
            const voiceNameLower = voice.name.toLowerCase();
            if (selectedGender === 'male' && isMaleVoice(voiceNameLower) && isIndianAccent(voice.name)) {
                foundVoice = voice;
                break;
            } else if (selectedGender === 'female' && isFemaleVoice(voiceNameLower) && isIndianAccent(voice.name)) {
                foundVoice = voice;
                break;
            }
        }
    }

    // --- Step 2: If no Indian accent voice, try any voice for the selected speech language and gender ---
    if (!foundVoice) {
        for (const voice of voices) {
            if (voice.lang === selectedSpeechLang) {
                const voiceNameLower = voice.name.toLowerCase();
                if (selectedGender === 'male' && isMaleVoice(voiceNameLower)) {
                    foundVoice = voice;
                    break;
                } else if (selectedGender === 'female' && isFemaleVoice(voiceNameLower)) {
                    foundVoice = voice;
                    break;
                }
            }
        }
    }

    // --- Step 3: Fallback for Rajasthani/Bhojpuri speech to Hindi, prioritizing Indian accent ---
    if (!foundVoice && (selectedSpeechLang === 'ra-IN' || selectedSpeechLang === 'bh-IN')) {
        messageBox.textContent = 'Rajasthani/Bhojpuri speech voices not directly supported. Attempting Hindi (Indian accent).';
        for (const voice of voices) {
            if (voice.lang === 'hi-IN') {
                const voiceNameLower = voice.name.toLowerCase();
                if (selectedGender === 'male' && isMaleVoice(voiceNameLower) && isIndianAccent(voice.name)) {
                    foundVoice = voice;
                    break;
                } else if (selectedGender === 'female' && isFemaleVoice(voiceNameLower) && isIndianAccent(voice.name)) {
                    foundVoice = voice;
                    break;
                }
            }
        }
    }

    // --- Step 4: If still no voice for selected speech language/gender/accent, try any voice for the selected speech language (no gender preference) ---
    if (!foundVoice) {
         for (const voice of voices) {
            if (voice.lang === selectedSpeechLang) {
                foundVoice = voice;
                break;
            }
        }
    }

    // --- Step 5: Final fallback to a generic English voice ---
    if (!foundVoice) {
        messageBox.textContent = 'No specific voice found for selected speech language/gender. Using a default English voice.';
        foundVoice = voices.find(voice => voice.lang.startsWith('en'));
    }

    selectedVoice = foundVoice;

    if (!selectedVoice) {
        messageBox.textContent = 'No speech synthesis voices available on this browser. Please check your browser settings.';
        speakButton.disabled = true;
    } else {
        speakButton.disabled = false;
        // Confirm selection, especially if an Indian accent voice was preferred
        if (isIndianAccent(selectedVoice.name) && (selectedSpeechLang.includes('IN') || selectedSpeechLang === 'en-US')) {
            messageBox.textContent = `Speech Voice selected: ${selectedVoice.name} (Indian Accent Preferred).`;
        } else {
            messageBox.textContent = `Speech Voice selected: ${selectedVoice.name}.`;
        }
    }
}

/**
 * Handles the speak button click event.
 * Creates a SpeechSynthesisUtterance and speaks the text.
 * It speaks the translated text if available, otherwise the original text.
 */
speakButton.addEventListener('click', () => {
    const textToSpeak = translatedTextInput.value.trim() || textInput.value.trim(); // Speak translated text if available, else original
    if (!textToSpeak) {
        messageBox.textContent = 'Please enter some text or translate to speak.';
        return;
    }

    if (!selectedVoice) {
        messageBox.textContent = 'No speech voice selected or available. Please try again or check your browser settings.';
        return;
    }

    // Stop any ongoing speech before starting new one
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang; // Ensure utterance lang matches voice lang

    utterance.onstart = () => {
        messageBox.textContent = 'Speaking...';
        isSpeaking = true;
        speakButton.innerHTML = '<div class="loading-spinner mr-3"></div> <span>Speaking...</span>';
        speakButton.disabled = true;
        stopButton.disabled = false;
    };

    utterance.onend = () => {
        messageBox.textContent = 'Speech finished.';
        isSpeaking = false;
        speakButton.innerHTML = '<i class="fas fa-volume-up mr-3"></i> <span>Speak Text</span>';
        speakButton.disabled = false;
        stopButton.disabled = true;
    };

    utterance.onerror = (event) => {
        messageBox.textContent = `Error: ${event.error}. Try a different voice or language.`;
        isSpeaking = false;
        speakButton.innerHTML = '<i class="fas fa-volume-up mr-3"></i> <span>Speak Text</span>';
        speakButton.disabled = false;
        stopButton.disabled = true;
        console.error('SpeechSynthesisUtterance error:', event);
    };

    window.speechSynthesis.speak(utterance);
});

/**
 * Handles the stop button click event.
 * Stops any ongoing speech.
 */
stopButton.addEventListener('click', () => {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        messageBox.textContent = 'Speech stopped.';
        isSpeaking = false;
        speakButton.innerHTML = '<i class="fas fa-volume-up mr-3"></i> <span>Speak Text</span>';
        speakButton.disabled = false;
        stopButton.disabled = true;
    }
});

/**
 * Handles the clear button click event.
 * Clears both original and translated text areas.
 */
clearButton.addEventListener('click', () => {
    textInput.value = '';
    translatedTextInput.value = '';
    messageBox.textContent = 'All text cleared.';
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        speakButton.innerHTML = '<i class="fas fa-volume-up mr-3"></i> <span>Speak Text</span>';
        speakButton.disabled = false;
        stopButton.disabled = true;
    }
});

/**
 * Handles the translate button click event.
 * Calls the Gemini API to translate the text.
 */
translateButton.addEventListener('click', async () => {
    const textToTranslate = textInput.value.trim();
    if (!textToTranslate) {
        messageBox.textContent = 'Please enter text in the "Enter Text" box to translate.';
        return;
    }

    const targetLangCode = translateLanguageSelect.value;
    const targetLanguageName = languageNames[targetLangCode] || targetLangCode;

    messageBox.textContent = `Translating to ${targetLanguageName}...`;
    translateButton.innerHTML = '<div class="loading-spinner mr-3"></div> <span>Translating...</span>';
    translateButton.disabled = true;

    try {
        let chatHistory = [];
        // Construct a clear prompt for translation
        chatHistory.push({ role: "user", parts: [{ text: `Translate the following text to ${targetLanguageName}: "${textToTranslate}"` }] });
        const payload = { contents: chatHistory };
        const apiKey = ""; // Canvas will provide this at runtime
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const translatedText = result.candidates[0].content.parts[0].text;
            translatedTextInput.value = translatedText; // This line directly updates the textarea with ONLY the translated text.
            messageBox.textContent = `Translation complete.`; // Status message goes to messageBox.

            // Automatically set speech language to translated language if it's a direct match
            if (languageSelect.value !== targetLangCode) {
                languageSelect.value = targetLangCode;
                updateVoiceSelection(); // Update voice based on new speech language
            }

        } else {
            messageBox.textContent = 'Translation failed: No valid response from API. Please try again.';
            console.error('Gemini API response structure unexpected:', result);
        }
    } catch (error) {
        messageBox.textContent = `Translation error: ${error.message}.`;
        console.error('Translation fetch error:', error);
    } finally {
        translateButton.innerHTML = '<i class="fas fa-exchange-alt mr-3"></i> <span>Translate Text</span>';
        translateButton.disabled = false;
    }
});


// Event listener for when voices are loaded or changed
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = populateVoiceList;
} else {
    // Fallback for browsers that don't fire onvoiceschanged immediately
    populateVoiceList();
}

// Event listeners for speech language and gender changes
languageSelect.addEventListener('change', updateVoiceSelection);
document.querySelectorAll('input[name="voiceGender"]').forEach(radio => {
    radio.addEventListener('change', updateVoiceSelection);
});

// Initial setup when the page loads
window.onload = () => {
    // Set default text
    textInput.value = "Hello! This is a multi-language text-to-speech and translation converter.";
    // Disable stop button initially
    stopButton.disabled = true;
    // populateVoiceList will be called by onvoiceschanged or its fallback, handling voice selection and default language setting.
};
