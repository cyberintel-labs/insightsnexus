/**
 * Notes Manager Module
 * 
 * This module handles the global notes functionality for the investigation application.
 * It provides a collapsible notes panel where users can write and manage their investigation notes.
 * 
 * Key Features:
 * - Collapsible notes panel with toggle functionality
 * - Real-time word and character counting
 * - Auto-save integration with project save system
 * - Export notes functionality
 * - Clear notes functionality
 * - Responsive design with dark mode support
 * 
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0)
 */

// Global notes state
let notesPanelOpen = false;
let notesContent = '';
let wordCount = 0;
let charCount = 0;

// DOM elements
let notesPanel = null;
let notesToggleBtn = null;
let notesTextarea = null;
let wordCountElement = null;
let charCountElement = null;
let clearNotesBtn = null;
let exportNotesBtn = null;

/**
 * Initialize Notes Manager
 * 
 * Sets up the notes panel functionality and event listeners.
 * Should be called after DOM is loaded.
 */
export function initNotesManager() {
    // Get DOM elements
    notesPanel = document.getElementById('notes-panel');
    notesToggleBtn = document.getElementById('notes-toggle-btn');
    notesTextarea = document.getElementById('global-notes-textarea');
    wordCountElement = document.getElementById('notes-word-count');
    charCountElement = document.getElementById('notes-char-count');
    clearNotesBtn = document.getElementById('clear-notes-btn');
    exportNotesBtn = document.getElementById('export-notes-btn');

    // Add event listeners
    if (notesTextarea) {
        notesTextarea.addEventListener('input', handleNotesInput);
        notesTextarea.addEventListener('keydown', handleNotesKeydown);
    }

    if (clearNotesBtn) {
        clearNotesBtn.addEventListener('click', clearNotes);
    }

    if (exportNotesBtn) {
        exportNotesBtn.addEventListener('click', exportNotes);
    }

    // Don't load notes automatically - they should be loaded with projects
    // loadNotesFromStorage();

    // Update word/character count
    updateStats();

    console.log('Notes Manager initialized');
}

/**
 * Toggle Notes Panel
 * 
 * Opens or closes the notes panel and adjusts the main content layout.
 * Also updates the body class for CSS adjustments.
 */
export function toggleNotesPanel() {
    if (!notesPanel || !notesToggleBtn) return;

    notesPanelOpen = !notesPanelOpen;
    
    if (notesPanelOpen) {
        notesPanel.classList.add('open');
        document.body.classList.add('notes-panel-open');
    } else {
        notesPanel.classList.remove('open');
        document.body.classList.remove('notes-panel-open');
    }

    // Focus textarea when opening
    if (notesPanelOpen && notesTextarea) {
        setTimeout(() => {
            notesTextarea.focus();
        }, 300); // Wait for animation to complete
    }
}

/**
 * Handle Notes Input
 * 
 * Processes text input in the notes textarea and updates statistics.
 * Also triggers auto-save functionality.
 */
function handleNotesInput(event) {
    const content = event.target.value;
    notesContent = content;
    
    updateStats();
    saveNotesToStorage();
}

/**
 * Handle Notes Keydown
 * 
 * Processes keyboard shortcuts for the notes textarea.
 * Currently supports Ctrl+S for manual save.
 */
function handleNotesKeydown(event) {
    // Ctrl+S for manual save (though auto-save is enabled)
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveNotesToStorage();
        showTemporaryMessage('Notes saved');
    }
}

/**
 * Update Statistics
 * 
 * Calculates and displays word count and character count for the notes.
 */
function updateStats() {
    if (!notesTextarea || !wordCountElement || !charCountElement) return;

    const content = notesTextarea.value;
    charCount = content.length;
    
    // Count words (split by whitespace and filter empty strings)
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    wordCount = content.trim() === '' ? 0 : words.length;

    // Update display
    wordCountElement.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
    charCountElement.textContent = `${charCount} character${charCount !== 1 ? 's' : ''}`;
}

/**
 * Clear Notes
 * 
 * Clears all notes content after user confirmation.
 */
function clearNotes() {
    if (!notesTextarea) return;

    const confirmed = confirm('Are you sure you want to clear all notes? This action cannot be undone.');
    if (confirmed) {
        notesTextarea.value = '';
        notesContent = '';
        updateStats();
        saveNotesToStorage();
        showTemporaryMessage('Notes cleared');
    }
}

/**
 * Export Notes
 * 
 * Exports the current notes content as a text file for download.
 */
function exportNotes() {
    if (!notesContent.trim()) {
        alert('No notes to export');
        return;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `investigation-notes-${timestamp}.txt`;
    
    const blob = new Blob([notesContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showTemporaryMessage('Notes exported');
}

/**
 * Save Notes to Local Storage (Project-Specific)
 * 
 * Saves the current notes content to browser's local storage for persistence.
 * Uses the current project filename to create project-specific storage.
 */
function saveNotesToStorage() {
    try {
        const currentProject = localStorage.getItem('lastSavedFile');
        if (currentProject) {
            const projectKey = `investigation-notes-${currentProject}`;
            localStorage.setItem(projectKey, notesContent);
        }
    } catch (error) {
        console.warn('Failed to save notes to localStorage:', error);
    }
}

/**
 * Load Notes from Local Storage (Project-Specific)
 * 
 * Loads previously saved notes from browser's local storage for the current project.
 */
function loadNotesFromStorage() {
    try {
        const currentProject = localStorage.getItem('lastSavedFile');
        if (currentProject) {
            const projectKey = `investigation-notes-${currentProject}`;
            const savedNotes = localStorage.getItem(projectKey);
            if (savedNotes && notesTextarea) {
                notesTextarea.value = savedNotes;
                notesContent = savedNotes;
            }
        }
    } catch (error) {
        console.warn('Failed to load notes from localStorage:', error);
    }
}

/**
 * Get Notes Content
 * 
 * Returns the current notes content for integration with save system.
 * 
 * @returns {string} Current notes content
 */
export function getNotesContent() {
    return notesContent;
}

/**
 * Set Notes Content
 * 
 * Sets the notes content programmatically (used when loading projects).
 * 
 * @param {string} content - Notes content to set
 */
export function setNotesContent(content) {
    notesContent = content || '';
    if (notesTextarea) {
        notesTextarea.value = notesContent;
        updateStats();
        saveNotesToStorage();
    }
}

/**
 * Clear Notes for Project Switch
 * 
 * Clears the current notes content when switching to a new project.
 * This ensures notes don't carry over between different projects.
 */
export function clearNotesForProjectSwitch() {
    notesContent = '';
    if (notesTextarea) {
        notesTextarea.value = '';
        updateStats();
    }
}

/**
 * Show Temporary Message
 * 
 * Displays a temporary status message to the user.
 * 
 * @param {string} message - Message to display
 */
function showTemporaryMessage(message) {
    // Use existing status message system if available
    if (window.setStatusMessage) {
        setStatusMessage(message);
    } else {
        console.log(`Notes: ${message}`);
    }
}

/**
 * Check if Notes Panel is Open
 * 
 * Returns the current state of the notes panel.
 * 
 * @returns {boolean} True if notes panel is open
 */
export function isNotesPanelOpen() {
    return notesPanelOpen;
}

/**
 * Open Notes Panel
 * 
 * Opens the notes panel if it's currently closed.
 */
export function openNotesPanel() {
    if (!notesPanelOpen) {
        toggleNotesPanel();
    }
}

/**
 * Close Notes Panel
 * 
 * Closes the notes panel if it's currently open.
 */
export function closeNotesPanel() {
    if (notesPanelOpen) {
        toggleNotesPanel();
    }
}

// Make toggleNotesPanel available globally for HTML onclick handlers
window.toggleNotesPanel = toggleNotesPanel;
