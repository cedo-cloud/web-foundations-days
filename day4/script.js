// Select all elements
const noteText = document.getElementById('note-text');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const clearBtn = document.getElementById('clear-btn');
const themeToggle = document.getElementById('theme-toggle');

const MAX_CHARS = 200;

// Update counts and warning classes
function updateCounts() {
    const text = noteText.value;
    const chars = text.length;
    
    // Calculate words (split by whitespace, filter out empty strings)
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    // Update text content
    charCount.textContent = `${chars} / ${MAX_CHARS} characters`;
    wordCount.textContent = `${words} words`;

    // Manage classes for character limit warnings
    charCount.classList.remove('warning', 'over');
    if (chars > MAX_CHARS) {
        charCount.classList.add('over');
    } else if (chars > 180) {
        charCount.classList.add('warning');
    }
}

// Clear function
function clearNote() {
    noteText.value = '';
    localStorage.removeItem('noteDraft');
    updateCounts();
}

// Event Listeners
noteText.addEventListener('input', () => {
    updateCounts();
    localStorage.setItem('noteDraft', noteText.value);
});

noteText.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        clearNote();
    }
});

clearBtn.addEventListener('click', clearNote);

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    
    if (document.body.classList.contains('dark')) {
        themeToggle.textContent = 'Light mode';
        localStorage.setItem('theme', 'dark');
    } else {
        themeToggle.textContent = 'Dark mode';
        localStorage.setItem('theme', 'light');
    }
});

// Initialization on load
function init() {
    // Restore theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggle.textContent = 'Light mode';
    } else {
        themeToggle.textContent = 'Dark mode';
    }

    // Restore draft
    const savedDraft = localStorage.getItem('noteDraft');
    if (savedDraft !== null) {
        noteText.value = savedDraft;
    }

    // Run initial counts
    updateCounts();
}

// Run init when script loads
init();