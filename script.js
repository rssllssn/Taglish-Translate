document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const sourceText = document.getElementById('source-text');
    const targetText = document.getElementById('target-text');
    const sourceLang = document.getElementById('source-lang');
    const targetLang = document.getElementById('target-lang');
    const swapBtn = document.getElementById('swap-btn');
    const copyBtn = document.getElementById('copy-btn');
    const vibeContainer = document.getElementById('vibe-container');
    const vibeRadios = document.querySelectorAll('input[name="vibe"]');
    const charCount = document.querySelector('.char-count');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const translateBtn = document.getElementById('translate-action-btn');
    const micBtn = document.getElementById('mic-btn');
    const ttsBtn = document.getElementById('tts-btn');

    // State
    const maxChars = 5000;

    // Check if we need to show the vibe selector (Target = Taglish)
    const updateVibeVisibility = () => {
        if (targetLang.value === 'taglish') {
            vibeContainer.classList.remove('hidden');
        } else {
            vibeContainer.classList.add('hidden');
        }
    };

    // Initialize visibility
    updateVibeVisibility();

    // Event Listeners for language dropdowns
    sourceLang.addEventListener('change', () => {
        if (sourceLang.value === targetLang.value) {
            // Prevent same languages by swapping
            handleSwap(false);
        }
    });

    targetLang.addEventListener('change', () => {
        if (sourceLang.value === targetLang.value) {
            handleSwap(false);
        } else {
            updateVibeVisibility();
        }
    });

    // Swap logic
    const handleSwap = (autoTranslate = false) => {
        const tempLang = sourceLang.value;
        sourceLang.value = targetLang.value;
        targetLang.value = tempLang;

        // Swap text sizes visually by not passing strict content but maybe just holding what's on the screen. 
        // A real translate keeps the translated text as the new source.
        if (targetText.value) {
             sourceText.value = targetText.value;
             targetText.value = '';
        }

        updateVibeVisibility();
        updateCharCount();
        if (autoTranslate) {
            translate();
        }
    };

    swapBtn.addEventListener('click', () => handleSwap(false));

    // Text Input logic
    const updateCharCount = () => {
        const length = sourceText.value.length;
        charCount.textContent = `${length} / ${maxChars}`;
        if (length > maxChars) {
            charCount.style.color = '#f28b82'; // Red warning
        } else {
            charCount.style.color = 'var(--text-secondary)';
        }
    };

    sourceText.addEventListener('input', () => {
        // Enforce max chars visually
        if (sourceText.value.length > maxChars) {
            sourceText.value = sourceText.value.substring(0, maxChars);
        }
        updateCharCount();
    });

    // Vibe changes no longer auto-translate
    vibeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            // Wait for manual translation
        });
    });
    
    // Speech-to-Text Logic
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isRecording = false;

    if (SpeechRecognition && micBtn) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        const setRecognitionLang = () => {
            const langMap = {
                'en': 'en-US',
                'tl': 'tl-PH',
                'taglish': 'tl-PH' // Default to Philippines tagalog for speech recognition
            };
            recognition.lang = langMap[sourceLang.value] || 'en-US';
        };

        recognition.onstart = () => {
            isRecording = true;
            micBtn.style.color = '#f28b82'; // Red indicator when recording
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const currentText = sourceText.value;
            sourceText.value = currentText ? currentText + ' ' + transcript : transcript;
            updateCharCount();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isRecording = false;
            micBtn.style.color = 'var(--text-secondary)';
        };

        recognition.onend = () => {
            isRecording = false;
            micBtn.style.color = 'var(--text-secondary)';
        };

        micBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                setRecognitionLang();
                recognition.start();
            }
        });
    } else if (micBtn) {
        micBtn.style.display = 'none'; // Hide button if API is completely unsupported
        console.warn("Speech Recognition API is not supported in this browser.");
    }

    // Text-to-Speech Logic
    const synth = window.speechSynthesis;

    if (synth && ttsBtn) {
        ttsBtn.addEventListener('click', () => {
            const textToSpeak = targetText.value;
            if (!textToSpeak) return;
            
            // Prevent overlapping speech
            if (synth.speaking) {
                synth.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            
            // Map the language
            const langMap = {
                'en': 'en-US',
                'tl': 'tl-PH',
                'taglish': 'tl-PH'
            };
            utterance.lang = langMap[targetLang.value] || 'en-US';
            
            // Visual feedback
            const icon = ttsBtn.querySelector('.material-symbols-outlined');
            icon.textContent = 'record_voice_over';
            ttsBtn.style.color = 'var(--accent-color)';
            
            utterance.onend = () => {
                icon.textContent = 'volume_up';
                ttsBtn.style.color = 'var(--text-secondary)';
            };
            
            utterance.onerror = (e) => {
                console.error("Speech synthesis error", e);
                icon.textContent = 'volume_up';
                ttsBtn.style.color = 'var(--text-secondary)';
            };

            synth.speak(utterance);
        });
    } else if (ttsBtn) {
        ttsBtn.style.display = 'none';
        console.warn("Speech Synthesis API is not supported in this browser.");
    }

    // Translate Action happens at the bottom after initialization

    // Copy to clipboard
    copyBtn.addEventListener('click', async () => {
        if (!targetText.value) return;
        try {
            await navigator.clipboard.writeText(targetText.value);
            const icon = copyBtn.querySelector('.material-symbols-outlined');
            icon.textContent = 'check'; // Show checkmark
            setTimeout(() => {
                icon.textContent = 'content_copy';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy!', err);
        }
    });


    // Main API Call
    const translate = async () => {
        const textToTranslate = sourceText.value.trim();
        const srcLang = sourceLang.value;
        const tgtLang = targetLang.value;
        const selectedVibe = document.querySelector('input[name="vibe"]:checked').value;

        // Reset error state
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';

        if (!textToTranslate) {
            targetText.value = '';
            return;
        }

        // Show loading state visually
        loadingIndicator.classList.remove('hidden');

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: textToTranslate,
                    source: srcLang,
                    target: tgtLang,
                    vibe: selectedVibe
                })
            });

            if (response.status === 429) {
                throw new Error("Rate limit exceeded. Please wait a bit before requesting more translations.");
            }

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to translate text.");
            }

            const data = await response.json();
            targetText.value = data.translation;
            
        } catch (error) {
            console.error(error);
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        } finally {
            loadingIndicator.classList.add('hidden');
        }
    };

    // Translate Action
    translateBtn.addEventListener('click', translate);
});
