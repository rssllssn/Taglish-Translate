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

    // State
    const maxChars = 5000;
    let debounceTimer;

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
            handleSwap();
        } else {
            translate();
        }
    });

    targetLang.addEventListener('change', () => {
        if (sourceLang.value === targetLang.value) {
            handleSwap();
        } else {
            updateVibeVisibility();
            translate();
        }
    });

    // Swap logic
    const handleSwap = () => {
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
        translate();
    };

    swapBtn.addEventListener('click', handleSwap);

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

        // Debounce API call
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            translate();
        }, 800); // Wait 800ms after user stops typing
    });

    // Vibe changes trigger translation if there is text
    vibeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (sourceText.value.trim().length > 0) {
                translate();
            }
        });
    });

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
});
