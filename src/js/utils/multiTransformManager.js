/**
 * Multi-Transform Manager
 * 
 * This module manages concurrent transform execution with intelligent queuing and
 * multi-transform progress display. It replaces the singleton progress meter
 * with a system that can handle multiple simultaneous transforms.
 * 
 * Features:
 * - Concurrent limit system (2-3 transforms max)
 * - Smart queuing prioritizing quick transforms under 5 seconds
 * - Multi-transform status display showing all active operations
 * - Transform registry tracking active operations
 * - Resource competition prevention
 * - User-friendly queuing messages
 */

import { TRANSFORM_DURATIONS } from "./transformConstants.js";

class MultiTransformManager {
    constructor() {
        this.maxConcurrentTransforms = 3;
        this.activeTransforms = new Map(); // transformId -> transformInfo
        this.transformQueue = [];
        this.nextTransformId = 1;
        this.quickTransformThreshold = 5000; // 5 seconds
        
        // Initialize multi-progress display
        this.initializeMultiProgressDisplay();
    }

    /**
     * Initialize Multi-Progress Display
     * 
     * Creates the DOM structure for displaying multiple concurrent transforms.
     */
    initializeMultiProgressDisplay() {
        // Create the multi-progress container
        const multiProgressContainer = document.createElement('div');
        multiProgressContainer.id = 'multi-progress-container';
        multiProgressContainer.className = 'multi-progress-container';
        
        // Create the header
        const header = document.createElement('div');
        header.className = 'multi-progress-header';
        header.innerHTML = `
            <span class="multi-progress-title">Active Transforms</span>
            <span class="multi-progress-count">0</span>
        `;
        
        // Create the transforms list
        const transformsList = document.createElement('div');
        transformsList.className = 'multi-progress-transforms';
        transformsList.id = 'multi-progress-transforms';
        
        multiProgressContainer.appendChild(header);
        multiProgressContainer.appendChild(transformsList);
        
        // Insert after the existing progress meter
        const existingProgressMeter = document.getElementById('progress-meter');
        if (existingProgressMeter) {
            existingProgressMeter.parentNode.insertBefore(multiProgressContainer, existingProgressMeter.nextSibling);
        } else {
            document.body.appendChild(multiProgressContainer);
        }
    }

    /**
     * Request Transform Execution
     * 
     * requestTransform(transformName: string, transformFunction: Function, node: CytoscapeNode, ...args)
     * 
     * Requests execution of a transform with intelligent queuing and concurrency management.
     * 
     * @param {string} transformName - Name of the transform
     * @param {Function} transformFunction - The transform function to execute
     * @param {CytoscapeNode} node - The node to transform
     * @param {...any} args - Additional arguments for the transform
     * @returns {Promise<any>} Result of the transform function
     */
    async requestTransform(transformName, transformFunction, node, ...args) {
        const transformId = this.generateTransformId();
        const estimatedDuration = TRANSFORM_DURATIONS[transformName] || 10000;
        const isQuickTransform = estimatedDuration <= this.quickTransformThreshold;
        
        const transformInfo = {
            id: transformId,
            name: transformName,
            function: transformFunction,
            node: node,
            args: args,
            estimatedDuration: estimatedDuration,
            isQuickTransform: isQuickTransform,
            startTime: null,
            progress: 0,
            status: 'queued',
            element: null
        };

        // Check if we can execute immediately
        if (this.activeTransforms.size < this.maxConcurrentTransforms) {
            return this.executeTransform(transformInfo);
        } else {
            // Add to queue with smart prioritization
            this.addToQueue(transformInfo);
            return this.waitForExecution(transformInfo);
        }
    }

    /**
     * Get Current Transform ID
     * 
     * getCurrentTransformId()
     * 
     * Returns the ID of the currently executing transform (for progress updates).
     */
    getCurrentTransformId() {
        // Return the most recently started transform ID
        let latestTransform = null;
        let latestStartTime = 0;
        
        this.activeTransforms.forEach((transformInfo) => {
            if (transformInfo.startTime && transformInfo.startTime > latestStartTime) {
                latestStartTime = transformInfo.startTime;
                latestTransform = transformInfo;
            }
        });
        
        return latestTransform ? latestTransform.id : null;
    }

    /**
     * Add Transform to Queue
     * 
     * addToQueue(transformInfo: object)
     * 
     * Adds a transform to the queue with smart prioritization.
     * Quick transforms are prioritized over longer ones.
     */
    addToQueue(transformInfo) {
        // Smart queuing: quick transforms go to front
        if (transformInfo.isQuickTransform) {
            // Find position after other quick transforms
            let insertIndex = 0;
            for (let i = 0; i < this.transformQueue.length; i++) {
                if (!this.transformQueue[i].isQuickTransform) {
                    insertIndex = i;
                    break;
                }
                insertIndex = i + 1;
            }
            this.transformQueue.splice(insertIndex, 0, transformInfo);
        } else {
            // Long transforms go to end
            this.transformQueue.push(transformInfo);
        }

        this.createQueueDisplay(transformInfo);
        this.updateQueueStatus();
    }

    /**
     * Execute Transform
     * 
     * executeTransform(transformInfo: object)
     * 
     * Executes a transform and manages its lifecycle.
     */
    async executeTransform(transformInfo) {
        transformInfo.status = 'running';
        transformInfo.startTime = Date.now();
        
        // Add to active transforms
        this.activeTransforms.set(transformInfo.id, transformInfo);
        
        // Create progress display
        this.createProgressDisplay(transformInfo);
        this.updateMultiProgressDisplay();
        
        try {
            // Execute the transform function
            const result = await transformInfo.function(transformInfo.node, ...transformInfo.args);
            
            // Mark as completed
            this.completeTransform(transformInfo.id, true);
            
            // Resolve the promise if it exists
            if (transformInfo.resolve) {
                transformInfo.resolve(result);
            }
            
            return result;
        } catch (error) {
            // Mark as failed
            this.completeTransform(transformInfo.id, false, error.message);
            
            // Reject the promise if it exists
            if (transformInfo.reject) {
                transformInfo.reject(error);
            }
            
            throw error;
        }
    }

    /**
     * Complete Transform
     * 
     * completeTransform(transformId: string, success: boolean, message?: string)
     * 
     * Marks a transform as complete and cleans up resources.
     */
    completeTransform(transformId, success = true, message = null) {
        const transformInfo = this.activeTransforms.get(transformId);
        if (!transformInfo) return;

        transformInfo.status = success ? 'completed' : 'failed';
        transformInfo.progress = 100;
        
        // Update display
        this.updateTransformDisplay(transformInfo, success, message);
        
        // Remove from active transforms
        this.activeTransforms.delete(transformId);
        
        // Clean up display after delay
        setTimeout(() => {
            this.removeTransformDisplay(transformId);
            this.updateMultiProgressDisplay();
        }, 2000);
        
        // Process queue
        this.processQueue();
    }

    /**
     * Process Queue
     * 
     * processQueue()
     * 
     * Processes the transform queue when slots become available.
     */
    processQueue() {
        while (this.activeTransforms.size < this.maxConcurrentTransforms && this.transformQueue.length > 0) {
            const nextTransform = this.transformQueue.shift();
            this.removeQueueDisplay(nextTransform.id);
            this.executeTransform(nextTransform);
        }
        this.updateQueueStatus();
    }

    /**
     * Wait for Execution
     * 
     * waitForExecution(transformInfo: object)
     * 
     * Returns a promise that resolves when the transform is executed.
     */
    async waitForExecution(transformInfo) {
        return new Promise((resolve, reject) => {
            transformInfo.resolve = resolve;
            transformInfo.reject = reject;
        });
    }

    /**
     * Create Progress Display
     * 
     * createProgressDisplay(transformInfo: object)
     * 
     * Creates the DOM element for displaying transform progress.
     */
    createProgressDisplay(transformInfo) {
        const transformElement = document.createElement('div');
        transformElement.className = 'multi-transform-item';
        transformElement.id = `transform-${transformInfo.id}`;
        transformElement.innerHTML = `
            <div class="transform-header">
                <span class="transform-name">${transformInfo.name}</span>
                <span class="transform-status">Running</span>
            </div>
            <div class="transform-progress-bar">
                <div class="transform-progress-fill" style="width: 0%"></div>
            </div>
            <div class="transform-details">
                <span class="transform-label">Starting...</span>
                <span class="transform-percentage">0%</span>
            </div>
        `;
        
        transformInfo.element = transformElement;
        document.getElementById('multi-progress-transforms').appendChild(transformElement);
    }

    /**
     * Create Queue Display
     * 
     * createQueueDisplay(transformInfo: object)
     * 
     * Creates the DOM element for displaying queued transforms.
     */
    createQueueDisplay(transformInfo) {
        const queueElement = document.createElement('div');
        queueElement.className = 'multi-transform-queue-item';
        queueElement.id = `queue-${transformInfo.id}`;
        queueElement.innerHTML = `
            <div class="queue-header">
                <span class="queue-name">${transformInfo.name}</span>
                <span class="queue-status">Queued</span>
            </div>
            <div class="queue-details">
                <span class="queue-reason">${this.getQueueReason(transformInfo)}</span>
            </div>
        `;
        
        transformInfo.queueElement = queueElement;
        document.getElementById('multi-progress-transforms').appendChild(queueElement);
    }

    /**
     * Get Queue Reason
     * 
     * getQueueReason(transformInfo: object)
     * 
     * Returns a user-friendly reason for why the transform is queued.
     */
    getQueueReason(transformInfo) {
        const activeCount = this.activeTransforms.size;
        const queuePosition = this.transformQueue.indexOf(transformInfo) + 1;
        
        if (activeCount >= this.maxConcurrentTransforms) {
            return `Waiting for slot (${queuePosition} in queue)`;
        }
        
        return 'Preparing to execute...';
    }

    /**
     * Update Transform Display
     * 
     * updateTransformDisplay(transformInfo: object, success: boolean, message?: string)
     * 
     * Updates the display for a specific transform.
     */
    updateTransformDisplay(transformInfo, success, message) {
        if (!transformInfo.element) return;
        
        const statusElement = transformInfo.element.querySelector('.transform-status');
        const labelElement = transformInfo.element.querySelector('.transform-label');
        
        if (success) {
            statusElement.textContent = 'Completed';
            statusElement.className = 'transform-status completed';
            labelElement.textContent = message || 'Transform completed successfully';
        } else {
            statusElement.textContent = 'Failed';
            statusElement.className = 'transform-status failed';
            labelElement.textContent = message || 'Transform failed';
        }
    }

    /**
     * Update Multi-Progress Display
     * 
     * updateMultiProgressDisplay()
     * 
     * Updates the overall multi-progress display.
     */
    updateMultiProgressDisplay() {
        const countElement = document.querySelector('.multi-progress-count');
        const container = document.getElementById('multi-progress-container');
        
        if (countElement) {
            countElement.textContent = this.activeTransforms.size;
        }
        
        if (container) {
            if (this.activeTransforms.size > 0 || this.transformQueue.length > 0) {
                container.classList.add('active');
            } else {
                container.classList.remove('active');
            }
        }
    }

    /**
     * Update Queue Status
     * 
     * updateQueueStatus()
     * 
     * Updates the status of queued transforms.
     */
    updateQueueStatus() {
        this.transformQueue.forEach((transformInfo, index) => {
            if (transformInfo.queueElement) {
                const reasonElement = transformInfo.queueElement.querySelector('.queue-reason');
                if (reasonElement) {
                    reasonElement.textContent = this.getQueueReason(transformInfo);
                }
            }
        });
    }

    /**
     * Remove Transform Display
     * 
     * removeTransformDisplay(transformId: string)
     * 
     * Removes the display element for a transform.
     */
    removeTransformDisplay(transformId) {
        const element = document.getElementById(`transform-${transformId}`);
        if (element) {
            element.remove();
        }
    }

    /**
     * Remove Queue Display
     * 
     * removeQueueDisplay(transformId: string)
     * 
     * Removes the queue display element for a transform.
     */
    removeQueueDisplay(transformId) {
        const element = document.getElementById(`queue-${transformId}`);
        if (element) {
            element.remove();
        }
    }

    /**
     * Update Transform Progress
     * 
     * updateTransformProgress(transformId: string, progress: number, label?: string)
     * 
     * Updates the progress of a specific transform.
     */
    updateTransformProgress(transformId, progress, label) {
        const transformInfo = this.activeTransforms.get(transformId);
        if (!transformInfo || !transformInfo.element) return;

        transformInfo.progress = Math.min(100, Math.max(0, progress));
        
        const progressFill = transformInfo.element.querySelector('.transform-progress-fill');
        const percentageElement = transformInfo.element.querySelector('.transform-percentage');
        const labelElement = transformInfo.element.querySelector('.transform-label');
        
        if (progressFill) {
            progressFill.style.width = `${transformInfo.progress}%`;
        }
        
        if (percentageElement) {
            percentageElement.textContent = `${Math.round(transformInfo.progress)}%`;
        }
        
        if (labelElement && label) {
            labelElement.textContent = label;
        }
    }

    /**
     * Generate Transform ID
     * 
     * generateTransformId()
     * 
     * Generates a unique ID for a transform.
     */
    generateTransformId() {
        return `transform-${this.nextTransformId++}`;
    }

    /**
     * Get Active Transforms Count
     * 
     * getActiveTransformsCount()
     * 
     * Returns the number of currently active transforms.
     */
    getActiveTransformsCount() {
        return this.activeTransforms.size;
    }

    /**
     * Get Queue Length
     * 
     * getQueueLength()
     * 
     * Returns the number of transforms in the queue.
     */
    getQueueLength() {
        return this.transformQueue.length;
    }

    /**
     * Clear All Transforms
     * 
     * clearAllTransforms()
     * 
     * Clears all active transforms and queue (emergency stop).
     */
    clearAllTransforms() {
        // Clear active transforms
        this.activeTransforms.forEach((transformInfo) => {
            if (transformInfo.reject) {
                transformInfo.reject(new Error('Transform cancelled'));
            }
        });
        this.activeTransforms.clear();
        
        // Clear queue
        this.transformQueue.forEach((transformInfo) => {
            if (transformInfo.reject) {
                transformInfo.reject(new Error('Transform cancelled'));
            }
        });
        this.transformQueue = [];
        
        // Clear displays
        document.getElementById('multi-progress-transforms').innerHTML = '';
        this.updateMultiProgressDisplay();
    }
}

// Create singleton instance
export const multiTransformManager = new MultiTransformManager();
