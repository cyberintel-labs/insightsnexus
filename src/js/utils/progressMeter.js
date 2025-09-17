/**
 * Progress Meter Manager
 * 
 * This module manages the progress meter UI for transforms, providing
 * accurate progress indication without being intrusive to the user experience.
 * 
 * Features:
 * - Non-intrusive progress display at bottom center of screen
 * - Smooth animations and transitions
 * - Accurate progress reporting for different transform types
 * - Automatic hiding when transforms complete
 * - Support for different progress strategies (time-based, step-based, etc.)
 */

class ProgressMeter {
    constructor() {
        this.element = document.getElementById('progress-meter');
        this.progressFill = this.element?.querySelector('.progress-fill');
        this.progressLabel = this.element?.querySelector('.progress-label');
        this.progressPercentage = this.element?.querySelector('.progress-percentage');
        this.isActive = false;
        this.currentProgress = 0;
        this.startTime = null;
        this.estimatedDuration = null;
        this.progressStrategy = null;
    }

    /**
     * Start Progress Tracking
     * 
     * startProgress(transformName: string, strategy: string, estimatedDuration?: number)
     * 
     * Initiates progress tracking for a transform operation.
     * 
     * @param {string} transformName - Name of the transform being executed
     * @param {string} strategy - Progress strategy ('time-based', 'step-based', 'hybrid')
     * @param {number} estimatedDuration - Estimated duration in milliseconds (optional)
     */
    startProgress(transformName, strategy = 'time-based', estimatedDuration = null) {
        if (!this.element) return;

        this.isActive = true;
        this.currentProgress = 0;
        this.startTime = Date.now();
        this.estimatedDuration = estimatedDuration;
        this.progressStrategy = strategy;

        // Update UI
        this.progressLabel.textContent = `${transformName} Progress`;
        this.progressPercentage.textContent = '0%';
        this.progressFill.style.width = '0%';
        this.element.classList.add('active');

        // Start progress tracking based on strategy
        this.startProgressTracking();
    }

    /**
     * Update Progress
     * 
     * updateProgress(progress: number, customLabel?: string)
     * 
     * Updates the progress meter with a specific progress value.
     * 
     * @param {number} progress - Progress value between 0 and 100
     * @param {string} customLabel - Optional custom label for this progress update
     */
    updateProgress(progress, customLabel = null) {
        if (!this.isActive || !this.element) return;

        this.currentProgress = Math.min(100, Math.max(0, progress));
        
        this.progressFill.style.width = `${this.currentProgress}%`;
        this.progressPercentage.textContent = `${Math.round(this.currentProgress)}%`;
        
        if (customLabel) {
            this.progressLabel.textContent = customLabel;
        }
    }

    /**
     * Complete Progress
     * 
     * completeProgress(success: boolean = true, message?: string)
     * 
     * Marks the progress as complete and hides the meter.
     * 
     * @param {boolean} success - Whether the transform completed successfully
     * @param {string} message - Optional completion message
     */
    completeProgress(success = true, message = null) {
        if (!this.isActive || !this.element) return;

        this.isActive = false;
        
        // Show completion state briefly
        this.updateProgress(100);
        if (message) {
            this.progressLabel.textContent = message;
        } else {
            this.progressLabel.textContent = success ? 'Transform Complete' : 'Transform Failed';
        }

        // Hide after a brief delay
        setTimeout(() => {
            this.element.classList.remove('active');
            this.currentProgress = 0;
            this.startTime = null;
            this.estimatedDuration = null;
            this.progressStrategy = null;
        }, 1500);
    }

    /**
     * Start Progress Tracking
     * 
     * startProgressTracking()
     * 
     * Initiates the appropriate progress tracking method based on the strategy.
     */
    startProgressTracking() {
        switch (this.progressStrategy) {
            case 'time-based':
                this.startTimeBasedProgress();
                break;
            case 'step-based':
                // Step-based progress is updated manually via updateProgress()
                break;
            case 'hybrid':
                this.startHybridProgress();
                break;
            default:
                this.startTimeBasedProgress();
        }
    }

    /**
     * Start Time-Based Progress
     * 
     * startTimeBasedProgress()
     * 
     * Updates progress based on elapsed time and estimated duration.
     */
    startTimeBasedProgress() {
        const updateInterval = setInterval(() => {
            if (!this.isActive) {
                clearInterval(updateInterval);
                return;
            }

            const elapsed = Date.now() - this.startTime;
            let progress = 0;

            if (this.estimatedDuration) {
                progress = Math.min(95, (elapsed / this.estimatedDuration) * 100);
            } else {
                // Default time-based progress for unknown durations
                // Slower progression to avoid showing 100% too early
                progress = Math.min(90, Math.pow(elapsed / 30000, 0.7) * 100);
            }

            this.updateProgress(progress);
        }, 200);

        // Store interval ID for cleanup
        this.progressInterval = updateInterval;
    }

    /**
     * Start Hybrid Progress
     * 
     * startHybridProgress()
     * 
     * Combines time-based progress with manual updates for better accuracy.
     */
    startHybridProgress() {
        const updateInterval = setInterval(() => {
            if (!this.isActive) {
                clearInterval(updateInterval);
                return;
            }

            const elapsed = Date.now() - this.startTime;
            let timeBasedProgress = 0;

            if (this.estimatedDuration) {
                timeBasedProgress = Math.min(95, (elapsed / this.estimatedDuration) * 100);
            } else {
                timeBasedProgress = Math.min(90, Math.pow(elapsed / 30000, 0.7) * 100);
            }

            // Use the higher of time-based or current progress
            const finalProgress = Math.max(this.currentProgress, timeBasedProgress);
            this.updateProgress(finalProgress);
        }, 200);

        this.progressInterval = updateInterval;
    }

    /**
     * Clean Up
     * 
     * cleanup()
     * 
     * Cleans up any running intervals and resets the progress meter.
     */
    cleanup() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        
        this.isActive = false;
        this.currentProgress = 0;
        this.startTime = null;
        this.estimatedDuration = null;
        this.progressStrategy = null;
        
        if (this.element) {
            this.element.classList.remove('active');
        }
    }
}

// Create singleton instance
export const progressMeter = new ProgressMeter();

/**
 * Transform Progress Strategies
 * 
 * Different strategies for tracking progress based on transform characteristics:
 * 
 * - 'time-based': Progress based on elapsed time (good for unknown durations)
 * - 'step-based': Progress updated manually at each step (most accurate)
 * - 'hybrid': Combines time-based with manual updates (balanced approach)
 */

/**
 * Estimated Durations for Common Transforms (in milliseconds)
 * 
 * These estimates help provide more accurate progress indication:
 */
export const TRANSFORM_DURATIONS = {
    'sherlock': 45000,        // 45 seconds - searches 350+ platforms
    'port-scan': 25000,       // 25 seconds - scans 1000 ports
    'whois': 5000,            // 5 seconds - domain lookup
    'domain-to-ip': 3000,     // 3 seconds - DNS resolution
    'domain-to-dns': 3000,    // 3 seconds - DNS lookup
    'domain-to-endpoint': 4000, // 4 seconds - endpoint discovery
    'domain-to-subdomain': 30000, // 30 seconds - subdomain discovery
    'website-to-domain': 2000, // 2 seconds - URL parsing
    'website-screenshot': 8000, // 8 seconds - screenshot capture
    'ip-to-netblock': 4000,   // 4 seconds - netblock lookup
    'ip-to-location': 3000,   // 3 seconds - geolocation
    'run-custom-transform': 15000 // 15 seconds - custom Python transform
};

/**
 * Progress Strategies for Different Transforms
 * 
 * Maps transform names to their optimal progress tracking strategy:
 */
export const TRANSFORM_STRATEGIES = {
    'sherlock': 'hybrid',           // Long-running, can be updated during execution
    'port-scan': 'hybrid',          // Long-running, can be updated during execution
    'whois': 'time-based',          // Short, predictable duration
    'domain-to-ip': 'time-based',   // Short, predictable duration
    'domain-to-dns': 'time-based',  // Short, predictable duration
    'domain-to-endpoint': 'time-based', // Short, predictable duration
    'domain-to-subdomain': 'hybrid', // Long-running, can be updated during execution
    'website-to-domain': 'time-based',  // Short, predictable duration
    'website-screenshot': 'time-based', // Medium duration, predictable
    'ip-to-netblock': 'time-based', // Short, predictable duration
    'ip-to-location': 'time-based', // Short, predictable duration
    'run-custom-transform': 'hybrid' // Variable duration, can be updated
};
