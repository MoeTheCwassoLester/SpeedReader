class SpeedReader {
    constructor() {
        this.settings = {
            wpm: 250,
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#000000',
            textColor: '#ffffff',
            isBold: false,
            wordGrouping: 1,
            fontSize: 150,
            darkMode: true,
            settingsAccordionOpen: false
        };
        
        this.words = [];
        this.currentIndex = 0;
        this.isReading = false;
        this.isPaused = false;
        this.timer = null;
        this.orientationLocked = false;
        this.orientationSupported = false;
        
        this.loadSettings();
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
        this.initializeAccordion();
        this.checkOrientationSupport();
    }
    
    initializeElements() {
        // Text input elements
        this.textInput = document.getElementById('textInput');
        this.wordCount = document.getElementById('wordCount');
        
        // Control elements
        this.startBtn = document.getElementById('startBtn');
        this.statusInfo = document.getElementById('statusInfo');
        this.statusText = document.getElementById('statusText');
        this.noTextInfo = document.getElementById('noTextInfo');
        
        // Accordion elements
        this.settingsAccordionBtn = document.getElementById('settingsAccordionBtn');
        this.settingsAccordionContent = document.getElementById('settingsAccordionContent');
        this.settingsSummary = document.getElementById('settingsSummary');
        this.summaryWpm = document.getElementById('summaryWpm');
        this.summaryFont = document.getElementById('summaryFont');
        this.summaryBgColor = document.getElementById('summaryBgColor');
        this.summaryTextColor = document.getElementById('summaryTextColor');
        
        // WPM elements
        this.wpmInput = document.getElementById('wpmInput');
        this.wpmSlider = document.getElementById('wpmSlider');
        this.currentWpm = document.getElementById('currentWpm');
        this.wpmLevel = document.getElementById('wpmLevel');
        
        // Customization elements
        this.fontFamily = document.getElementById('fontFamily');
        this.backgroundColor = document.getElementById('backgroundColor');
        this.textColor = document.getElementById('textColor');
        this.boldToggle = document.getElementById('boldToggle');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.wordGrouping = document.getElementById('wordGrouping');
        this.wordGroupingValue = document.getElementById('wordGroupingValue');
        this.fontSize = document.getElementById('fontSize');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.previewBox = document.getElementById('previewBox');
        this.previewText = document.getElementById('previewText');
        
        // Reader elements
        this.fullscreenReader = document.getElementById('fullscreenReader');
        this.readerText = document.getElementById('readerText');
        this.pausedText = document.getElementById('pausedText');
        this.progressText = document.getElementById('progressText');
        this.orientationHint = document.getElementById('orientationHint');
    }
    
    bindEvents() {
        // Text input events
        this.textInput.addEventListener('input', () => this.processText());
        
        // Control events
        this.startBtn.addEventListener('click', () => this.toggleReading());
        
        // Accordion events
        this.settingsAccordionBtn.addEventListener('click', () => this.toggleAccordion());
        
        // WPM events
        this.wpmInput.addEventListener('input', (e) => this.updateWPM(parseInt(e.target.value)));
        this.wpmSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const snapped = Math.round(value / 50) * 50;
            this.updateWPM(snapped);
        });
        
        // Customization events
        this.fontFamily.addEventListener('change', (e) => this.updateSetting('fontFamily', e.target.value));
        this.backgroundColor.addEventListener('input', (e) => this.updateSetting('backgroundColor', e.target.value));
        this.textColor.addEventListener('input', (e) => this.updateSetting('textColor', e.target.value));
        this.boldToggle.addEventListener('change', (e) => this.updateSetting('isBold', e.target.checked));
        this.darkModeToggle.addEventListener('change', (e) => this.updateSetting('darkMode', e.target.checked));
        this.wordGrouping.addEventListener('input', (e) => this.updateSetting('wordGrouping', parseInt(e.target.value)));
        this.fontSize.addEventListener('input', (e) => this.updateSetting('fontSize', parseInt(e.target.value)));
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Fullscreen events
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());
    }
    
    checkOrientationSupport() {
        // Check if Screen Orientation API is supported
        this.orientationSupported = 'orientation' in screen && 'lock' in screen.orientation;
    }
    
    async lockOrientation() {
        if (!this.orientationSupported) {
            this.showOrientationHint();
            return false;
        }
        
        try {
            await screen.orientation.lock('landscape');
            this.orientationLocked = true;
            this.hideOrientationHint();
            return true;
        } catch (error) {
            console.warn('Failed to lock orientation:', error);
            this.showOrientationHint();
            return false;
        }
    }
    
    unlockOrientation() {
        if (this.orientationSupported && this.orientationLocked) {
            try {
                screen.orientation.unlock();
                this.orientationLocked = false;
            } catch (error) {
                console.warn('Failed to unlock orientation:', error);
            }
        }
        this.hideOrientationHint();
    }
    
    showOrientationHint() {
        if (this.orientationHint) {
            this.orientationHint.classList.remove('hidden');
        }
    }
    
    hideOrientationHint() {
        if (this.orientationHint) {
            this.orientationHint.classList.add('hidden');
        }
    }
    
    handleFullscreenChange() {
        const isFullscreen = !!(document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement || 
                               document.msFullscreenElement);
        
        if (!isFullscreen && this.isReading) {
            // Exited fullscreen while reading - stop reading and unlock orientation
            this.stopReading();
        }
    }
    
    initializeAccordion() {
        if (this.settings.settingsAccordionOpen) {
            this.settingsAccordionBtn.classList.remove('collapsed');
            this.settingsAccordionContent.classList.remove('collapsed');
        } else {
            this.settingsAccordionBtn.classList.add('collapsed');
            this.settingsAccordionContent.classList.add('collapsed');
        }
        this.updateSummary();
    }
    
    toggleAccordion() {
        const isCollapsed = this.settingsAccordionBtn.classList.contains('collapsed');
        
        if (isCollapsed) {
            this.settingsAccordionBtn.classList.remove('collapsed');
            this.settingsAccordionContent.classList.remove('collapsed');
            this.settings.settingsAccordionOpen = true;
        } else {
            this.settingsAccordionBtn.classList.add('collapsed');
            this.settingsAccordionContent.classList.add('collapsed');
            this.settings.settingsAccordionOpen = false;
        }
        
        this.saveSettings();
    }
    
    updateSummary() {
        // Update WPM summary
        this.summaryWpm.textContent = `${this.settings.wpm} WPM`;
        
        // Update font summary
        const fontName = this.settings.fontFamily.split(',')[0].replace(/['"]/g, '');
        this.summaryFont.textContent = fontName;
        
        // Update color swatches
        this.summaryBgColor.style.backgroundColor = this.settings.backgroundColor;
        this.summaryTextColor.style.backgroundColor = this.settings.textColor;
    }
    
    processText() {
        const text = this.textInput.value.trim();
        
        if (!text) {
            this.words = [];
            this.updateWordCount(0);
            this.updateStartButton();
            return;
        }
        
        // Split text and strip leading/trailing punctuation
        this.words = text
            .split(/\s+/)
            .map(word => word.replace(/^[.,;:!?'"()[\]{}]+|[.,;:!?'"()[\]{}]+$/g, ''))
            .filter(word => word.length > 0);
        
        this.updateWordCount(this.words.length);
        this.updateStartButton();
    }
    
    updateWordCount(count) {
        this.wordCount.textContent = `${count} words`;
    }
    
    updateStartButton() {
        const hasText = this.words.length > 0;
        this.startBtn.disabled = !hasText;
        
        if (this.isReading) {
            this.startBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
                Stop Reading
            `;
            this.startBtn.classList.add('stop');
            this.statusInfo.classList.remove('hidden');
            this.noTextInfo.classList.add('hidden');
            
            if (this.isPaused) {
                this.statusText.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; width: 1rem; height: 1rem; margin-right: 0.25rem;">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                    Paused - Press 'Tab' to resume
                `;
            } else {
                this.statusText.textContent = 'Press "Tab" to pause • "Esc" to stop';
            }
        } else {
            this.startBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5,3 19,12 5,21"></polygon>
                </svg>
                Start Reading
            `;
            this.startBtn.classList.remove('stop');
            this.statusInfo.classList.add('hidden');
            this.noTextInfo.classList.toggle('hidden', hasText);
        }
    }
    
    updateWPM(wpm) {
        if (isNaN(wpm) || wpm < 50 || wpm > 2000) {
            this.wpmInput.classList.add('invalid');
            return;
        }
        
        this.wpmInput.classList.remove('invalid');
        this.settings.wpm = wpm;
        this.wpmInput.value = wpm;
        this.wpmSlider.value = Math.min(wpm, 1000);
        this.currentWpm.textContent = `${wpm} WPM`;
        
        // Update level indicator
        let level = 'Beginner';
        if (wpm >= 600) level = 'Expert';
        else if (wpm >= 400) level = 'Advanced';
        else if (wpm >= 200) level = 'Intermediate';
        
        this.wpmLevel.textContent = `${level} level`;
        this.updateSummary();
        this.saveSettings();
    }
    
    updateSetting(key, value) {
        this.settings[key] = value;
        this.updateUI();
        this.updateSummary();
        this.saveSettings();
    }
    
    updateUI() {
        // Update form values
        this.wpmInput.value = this.settings.wpm;
        this.wpmSlider.value = Math.min(this.settings.wpm, 1000);
        this.fontFamily.value = this.settings.fontFamily;
        this.backgroundColor.value = this.settings.backgroundColor;
        this.textColor.value = this.settings.textColor;
        this.boldToggle.checked = this.settings.isBold;
        this.darkModeToggle.checked = this.settings.darkMode;
        this.wordGrouping.value = this.settings.wordGrouping;
        this.fontSize.value = this.settings.fontSize;
        
        // Update display values
        this.currentWpm.textContent = `${this.settings.wpm} WPM`;
        this.wordGroupingValue.textContent = this.settings.wordGrouping;
        this.fontSizeValue.textContent = this.settings.fontSize;
        
        // Update WPM level
        let level = 'Beginner';
        if (this.settings.wpm >= 600) level = 'Expert';
        else if (this.settings.wpm >= 400) level = 'Advanced';
        else if (this.settings.wpm >= 200) level = 'Intermediate';
        this.wpmLevel.textContent = `${level} level`;
        
        // Update theme
        document.documentElement.setAttribute('data-theme', this.settings.darkMode ? 'dark' : 'light');
        
        // Update preview
        this.updatePreview();
        
        // Update summary
        this.updateSummary();
    }
    
    updatePreview() {
        const numberWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
        const previewWords = numberWords.slice(0, this.settings.wordGrouping);
        this.previewText.textContent = previewWords.join(' ');
        
        this.previewBox.style.backgroundColor = this.settings.backgroundColor;
        this.previewBox.style.color = this.settings.textColor;
        this.previewBox.style.fontFamily = this.settings.fontFamily;
        this.previewBox.style.fontWeight = this.settings.isBold ? 'bold' : 'normal';
        this.previewBox.style.fontSize = `${this.settings.fontSize}%`;
    }
    
    toggleReading() {
        if (this.isReading) {
            this.stopReading();
        } else {
            this.startReading();
        }
    }
    
    async startReading() {
        if (this.words.length === 0) return;
        
        this.currentIndex = 0;
        this.isReading = true;
        this.isPaused = false;
        this.updateStartButton();
        
        // Show fullscreen reader first
        this.showFullscreenReader();
        
        // Try to enter fullscreen mode
        try {
            await this.enterFullscreen();
            // Try to lock orientation after entering fullscreen
            await this.lockOrientation();
        } catch (error) {
            console.warn('Fullscreen or orientation lock failed:', error);
        }
        
        this.nextWord();
    }
    
    async enterFullscreen() {
        const element = this.fullscreenReader;
        
        if (element.requestFullscreen) {
            await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            await element.msRequestFullscreen();
        }
    }
    
    async exitFullscreen() {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            await document.msExitFullscreen();
        }
    }
    
    stopReading() {
        this.isReading = false;
        this.isPaused = false;
        this.currentIndex = 0;
        this.clearTimer();
        this.updateStartButton();
        this.unlockOrientation();
        this.hideFullscreenReader();
        
        // Exit fullscreen if we're in it
        if (document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement) {
            this.exitFullscreen().catch(console.warn);
        }
    }
    
    togglePause() {
        if (!this.isReading) return;
        
        this.isPaused = !this.isPaused;
        this.updateStartButton();
        
        if (this.isPaused) {
            this.clearTimer();
            this.showPausedState();
        } else {
            this.hidePausedState();
            this.nextWord();
        }
    }
    
    nextWord() {
        if (!this.isReading || this.isPaused) return;
        
        if (this.currentIndex >= this.words.length) {
            this.stopReading();
            return;
        }
        
        this.showWords();
        this.updateProgress();
        
        // Calculate interval based on WPM and word grouping
        // For grouped words, we still want to maintain the same reading speed per word
        // So if we show 3 words at once, we give 3x the time for that group
        const wordsInCurrentGroup = Math.min(this.settings.wordGrouping, this.words.length - this.currentIndex);
        const intervalMs = (60000 / this.settings.wpm) * wordsInCurrentGroup;
        
        this.timer = setTimeout(() => {
            this.currentIndex += this.settings.wordGrouping;
            this.nextWord();
        }, intervalMs);
    }
    
    showWords() {
        const startIndex = this.currentIndex;
        const endIndex = Math.min(startIndex + this.settings.wordGrouping, this.words.length);
        const wordsToShow = this.words.slice(startIndex, endIndex).join(' ');
        
        this.readerText.textContent = wordsToShow;
        this.readerText.style.display = 'block';
        this.readerText.style.color = this.settings.textColor;
        this.readerText.style.fontFamily = this.settings.fontFamily;
        this.readerText.style.fontWeight = this.settings.isBold ? 'bold' : 'normal';
        
        // Convert percentage to rem properly: percentage / 100 * base size (3rem)
        const fontSizeRem = (this.settings.fontSize / 100) * 3;
        this.readerText.style.fontSize = `${fontSizeRem}rem`;
    }
    
    showPausedState() {
        this.readerText.style.display = 'none';
        this.pausedText.classList.remove('hidden');
        this.pausedText.style.color = this.settings.textColor;
        this.pausedText.style.fontFamily = this.settings.fontFamily;
    }
    
    hidePausedState() {
        this.pausedText.classList.add('hidden');
    }
    
    updateProgress() {
        const progress = Math.round((this.currentIndex / this.words.length) * 100);
        const current = this.currentIndex + 1;
        const total = this.words.length;
        this.progressText.textContent = `${progress}% • ${current} of ${total}`;
    }
    
    showFullscreenReader() {
        this.fullscreenReader.style.backgroundColor = this.settings.backgroundColor;
        this.fullscreenReader.classList.remove('hidden');
    }
    
    hideFullscreenReader() {
        this.fullscreenReader.classList.add('hidden');
    }
    
    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    
    handleKeyPress(e) {
        // Only handle Tab key for pause/resume when in fullscreen mode
        if (e.key === 'Tab' && this.isReading && !this.fullscreenReader.classList.contains('hidden')) {
            e.preventDefault();
            this.togglePause();
            return;
        }
        
        // Handle Escape key to stop reading
        if (e.key === 'Escape' && this.isReading) {
            e.preventDefault();
            this.stopReading();
            return;
        }
        
        // Note: Completely removed 'P' key handling - now 'P' can be typed freely in text input
    }
    
    saveSettings() {
        localStorage.setItem('speedReaderSettings', JSON.stringify(this.settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('speedReaderSettings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Failed to load settings:', e);
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SpeedReader();
});