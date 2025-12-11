/**
 * Feedback Handler Module
 * 
 * This module handles the feedback functionality by opening the user's
 * default email client with a pre-populated subject line.
 * 

 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0)
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

/**
 * Open Support Email
 * 
 * openSupportEmail()
 * 
 * Opens the user's default email client with a pre-populated subject line
 * for support requests. This provides a seamless experience for users
 * experiencing issues with the application.
 */
function openSupportEmail() {
    try {
        // Create a pre-populated subject line
        const supportSubject = '[Insight Nexus - Support] User Support';
        
        // Create email body template with helpful prompts
        const emailBody = `Please describe the issue you are experiencing:`;
        
        // Create mailto link with encoded subject and body
        const mailtoLink = `mailto:info@insightsnexus.org?subject=${encodeURIComponent(supportSubject)}&body=${emailBody}`;

        // Open email client
        window.location.href = mailtoLink;
        
        console.log('Support email client opened successfully');
        
    } catch (error) {
        console.error('Error opening email client:', error);
        
        // Fallback: Show alert if email client fails to open
        alert('Unable to open email client. Please send your support request to info@insightsnexus.org with the subject "[Insight Nexus - Support] User Support"');
    }
}

// Make functions immediately available globally
window.openFeedbackEmail = openFeedbackEmail;
window.openSupportEmail = openSupportEmail;

/**
 * Initialize Feedback Handler
 * 
 * initFeedbackHandler()
 * 
 * Initializes the feedback handler by making the openFeedbackEmail and
 * openSupportEmail functions globally available.
 */
function initFeedbackHandler() {
    // Make functions globally available 
    window.openFeedbackEmail = openFeedbackEmail;
    window.openSupportEmail = openSupportEmail;
    
    console.log('Feedback handler initialized successfully');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initFeedbackHandler);

export { 
    openFeedbackEmail,
    openSupportEmail
};