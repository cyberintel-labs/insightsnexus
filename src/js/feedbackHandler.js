/**
 * Feedback Handler Module
 * 
 * This module handles the feedback functionality by opening the user's
 * default email client with a pre-populated subject line.
 * 

 * Copyright (c) 2024 Investigating Project
 * Licensed under the MIT License
 */

/**
 * Open Feedback Email
 * 
 * openFeedbackEmail()
 * 
 * Opens the user's default email client with a pre-populated subject line
 * for feedback submission. This provides a seamless experience without
 * requiring any configuration or server-side processing.
 */
function openFeedbackEmail() {
    try {
        // Create a pre-populated subject line
        const feedbackSubject = '[Insight Nexus] User Feedback';
        
        // Create email body template
        const emailBody = "";
        
        // Create mailto link with encoded subject and body
        const mailtoLink = `mailto:info@insightsnexus.org?subject=${encodeURIComponent(feedbackSubject)}&body=${encodeURIComponent(emailBody)}`;

        // Open email client
        window.location.href = mailtoLink;
        
        console.log('Feedback email client opened successfully');
        
    } catch (error) {
        console.error('Error opening email client:', error);
        
        // Fallback: Show alert if email client fails to open
        alert('Unable to open email client. Please send your feedback to info@insightsnexus.org with the subject "[Insight Nexus] User Feedback"');
    }
}

// Make function immediately available globally
window.openFeedbackEmail = openFeedbackEmail;

/**
 * Initialize Feedback Handler
 * 
 * initFeedbackHandler()
 * 
 * Initializes the feedback handler by making the openFeedbackEmail function
 * globally available.
 */
function initFeedbackHandler() {
    // Make function globally available 
    window.openFeedbackEmail = openFeedbackEmail;
    
    console.log('Feedback handler initialized successfully');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initFeedbackHandler);

export { 
    openFeedbackEmail
};