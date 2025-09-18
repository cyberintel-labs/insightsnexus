/**
 * Tutorial System for OSINT Investigation Tool
 * 
 * This module provides an interactive overlay tutorial system that guides users
 * through the key features of the OSINT investigation application.
 * 
 * Features:
 * - Step-by-step guided tutorial
 * - Overlay highlighting with spotlight effect
 * - Interactive elements that respond to user actions
 * - Skip functionality at any time
 * - Restart tutorial capability
 * - First-time user detection using localStorage
 */

class TutorialSystem {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.steps = this.defineTutorialSteps();
        this.overlay = null;
        this.spotlight = null;
        this.tutorialModal = null;
        this.highlightedElement = null;
        
        // Feature flag for tutorial resume functionality (debugging only)
        // Set to true to enable resume functionality - allows tutorial to resume from where user left off
        // when page is refreshed or application is restarted (excluding when user clicked Skip Tutorial)
        this.enableTutorialResume = false; // Set to true to enable resume functionality for testing purposes
        
        // Feature flag for step counter visibility
        // Set to true to show step counter in tutorial modal, false to hide it
        this.showStepCounter = false; // Set to false by default for production. Set this to true for debugging
        
        // Debug logging
        console.log(`Tutorial System: Resume functionality ${this.enableTutorialResume ? 'ENABLED' : 'DISABLED'}`);
        
        this.init();
    }

    /**
     * Initialize the tutorial system
     */
    init() {
        this.createTutorialElements();
        this.setupEventListeners();
        this.checkFirstTimeUser();
    }

    /**
     * Check if this is a first-time user and start tutorial if needed
     */
    checkFirstTimeUser() {
        const hasSeenTutorial = localStorage.getItem('insightNexus_tutorialCompleted');
        
        // If tutorial resume feature is disabled, use original behavior
        if (!this.enableTutorialResume) {
            if (!hasSeenTutorial) {
                // Wait for the application to be fully loaded
                setTimeout(() => {
                    this.startTutorial();
                }, 2000);
            }
            return;
        }
        
        // Feature flag enabled - use resume functionality
        const tutorialSkipped = localStorage.getItem('insightNexus_tutorialSkipped');
        const currentStep = localStorage.getItem('insightNexus_tutorialCurrentStep');
        
        // If tutorial was explicitly skipped, don't restart it
        if (tutorialSkipped === 'true') {
            return;
        }
        
        // If tutorial was completed, don't restart it
        if (hasSeenTutorial === 'true') {
            return;
        }
        
        // If there's a saved step, resume from there
        if (currentStep !== null && currentStep !== '') {
            const stepNumber = parseInt(currentStep);
            if (stepNumber >= 0 && stepNumber < this.steps.length) {
                // Wait for the application to be fully loaded
                setTimeout(() => {
                    this.resumeTutorial(stepNumber);
                }, 2000);
                return;
            }
        }
        
        // If no saved progress, start from beginning
        setTimeout(() => {
            this.startTutorial();
        }, 2000);
    }

    /**
     * Define all tutorial steps with their content and interactions
     */
    defineTutorialSteps() {
        return [
            {
                title: "Welcome to Insight Nexus!",
                content: "This is an OSINT (Open Source Intelligence) investigation tool that helps you create interactive graphs to visualize connections between entities, domains, IPs, and more. Let's get started!",
                target: null,
                action: null,
                position: "center"
            },
            {
                title: "Creating Your First Node",
                content: "Double-click anywhere on the canvas to create a new node. This is the foundation of your investigation graph. The overlay will temporarily fade to allow you to interact with the canvas, then show you the result.",
                target: "#cy",
                action: "dbltap",
                position: "center",
                highlight: "area"
            },
            {
                title: "Your First Node",
                content: "Perfect! You can see your newly created node on the canvas. Notice how it's automatically selected and the properties panel opened on the right. This is how you'll build your investigation graph.",
                target: "#cy",
                action: null,
                position: "center",
                highlight: "node"
            },
            {
                title: "Understanding the Properties Panel",
                content: "The properties panel on the right shows details about the selected node. Here you can edit the node name, change its type, upload files, and add notes to document your findings.",
                target: "#node-properties-menu",
                action: null,
                position: "center",
                highlight: "properties"
            },
            {
                title: "Creating a Second Node",
                content: "Let's create another node to demonstrate connections. Double-click on a different area of the canvas to create a second node. This will help us show how nodes can be connected.",
                target: "#cy",
                action: "dbltap",
                position: "center",
                highlight: "area"
            },
            {
                title: "Two Nodes Created",
                content: "Excellent! Now you have two nodes on your canvas. Notice how the second node is now selected and the properties panel has updated. You can click on any node to select it and view its properties.",
                target: "#cy",
                action: null,
                position: "center",
                highlight: "node"
            },
            {
                title: "Right-Click Context Menu",
                content: "Right-click on any node to see the context menu with powerful OSINT tools. This is where the magic happens - you can run username searches, domain analysis, IP geolocation, and more!",
                target: "#cy",
                action: "cxttap",
                position: "center",
                highlight: "nodes"
            },
            {
                title: "Creating Connections",
                content: "Now let's connect these nodes to show relationships. Right-click on the first node and select 'Create Connection', then click on the second node to establish the connection.",
                target: "#context-menu",
                action: "connect",
                position: "center",
                highlight: "contextmenu"
            },
            {
                title: "Connection Created",
                content: "Perfect! You've created a connection between the two nodes. This visual relationship helps you understand how different entities relate to each other in your investigation.",
                target: "#cy",
                action: null,
                position: "center",
                highlight: "node"
            },
            {
                title: "OSINT Tools Overview",
                content: "The context menu offers powerful OSINT tools organized by category: Domain Analysis (IP lookup, DNS records), Network Intelligence (port scanning, geolocation), OSINT Tools (username search), and Web Analysis (screenshots).",
                target: null,
                action: null,
                position: "center"
            },
            {
                title: "File Management",
                content: "Use the File menu in the toolbar to save your investigation or load a previous one. Your work is automatically saved, but you can create multiple investigation files for different cases.",
                target: "button[onclick=\"toggleDropdown('file-dropdown')\"]",
                action: null,
                position: "center",
                highlight: "filebutton"
            },
            {
                title: "Edit Controls",
                content: "The Edit button provides undo and redo functionality to help you manage your investigation. You can undo recent actions if you make a mistake, or redo actions you've undone. You can also use keyboard shortcuts: Ctrl+Z (or Cmd+Z on Mac) for undo and Ctrl+Y (or Cmd+Y on Mac) for redo. This is especially useful when experimenting with different investigation paths.",
                target: "button[onclick=\"toggleDropdown('edit-dropdown')\"]",
                action: null,
                position: "center",
                highlight: "editbutton"
            },
            {
                title: "Navigation Controls",
                content: "Use the zoom slider at the bottom right to zoom in/out, or use your mouse wheel. The 'Reset View' button centers your graph and resets the zoom to 100%. You can also pan by clicking and dragging on empty areas.",
                target: "#zoom-slider",
                action: null,
                position: "center",
                highlight: "navigation"
            },
            {
                title: "Dark Mode Toggle",
                content: "Toggle between light and dark themes using the moon/sun button in the bottom left corner. This helps reduce eye strain during long investigation sessions.",
                target: "#dark-mode-toggle",
                action: null,
                position: "center",
                highlight: "darkmode"
            },
            {
                title: "Tutorial Complete!",
                content: "You're ready to start your OSINT investigation! You've learned how to create nodes, connect them, use OSINT tools, and manage your investigations. You can restart this tutorial anytime from the Help menu. Happy investigating!",
                target: "button[onclick=\"toggleDropdown('help-dropdown')\"]",
                action: null,
                position: "center",
                highlight: "helpbutton"
            }
        ];
    }

    /**
     * Create the tutorial overlay and modal elements
     */
    createTutorialElements() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.className = 'tutorial-overlay';
        
        // Create spotlight
        this.spotlight = document.createElement('div');
        this.spotlight.id = 'tutorial-spotlight';
        this.spotlight.className = 'tutorial-spotlight';
        this.overlay.appendChild(this.spotlight);

        // Create tutorial modal
        this.tutorialModal = document.createElement('div');
        this.tutorialModal.id = 'tutorial-modal';
        this.tutorialModal.className = 'tutorial-modal';
        
        this.tutorialModal.innerHTML = `
            <div class="tutorial-content">
                <div class="tutorial-header">
                    <h2 class="tutorial-title"></h2>
                    <button class="tutorial-skip" onclick="tutorialSystem.skipTutorial()">Skip Tutorial</button>
                </div>
                <div class="tutorial-body">
                    <p class="tutorial-text"></p>
                </div>
                <div class="tutorial-footer">
                    <div class="tutorial-progress">
                        <span class="tutorial-step-counter"></span>
                    </div>
                    <div class="tutorial-buttons">
                        <button class="tutorial-btn tutorial-btn-secondary" onclick="tutorialSystem.previousStep()" id="prev-btn">Previous</button>
                        <button class="tutorial-btn tutorial-btn-primary" onclick="tutorialSystem.nextStep()" id="next-btn">Next</button>
                    </div>
                </div>
            </div>
        `;

        this.overlay.appendChild(this.tutorialModal);
        document.body.appendChild(this.overlay);
    }

    /**
     * Setup event listeners for tutorial interactions
     */
    setupEventListeners() {
        // Listen for specific actions that should advance the tutorial
        document.addEventListener('tutorial-action', (event) => {
            if (this.isActive && this.steps[this.currentStep].action === event.detail.action) {
                this.nextStep();
            }
        });

        // Wait for Cytoscape to be available
        this.waitForCytoscape();
    }

    /**
     * Wait for Cytoscape to be initialized and then setup event listeners
     */
    waitForCytoscape() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait time
        
        const checkCytoscape = () => {
            attempts++;
            
            if (window.cy && typeof window.cy.on === 'function') {
                // Cytoscape is ready, setup event listeners
                window.cy.on('add', 'node', () => {
                    if (this.isActive && this.steps[this.currentStep].action === 'dbltap') {
                        // Show the created node first, then advance after a delay
                        this.showCreatedNode();
                    }
                });

                window.cy.on('cxttap', 'node', () => {
                    if (this.isActive && this.steps[this.currentStep].action === 'cxttap') {
                        setTimeout(() => this.nextStep(), 500);
                    }
                });

                // Listen for connection creation
                window.cy.on('add', 'edge', () => {
                    if (this.isActive && this.steps[this.currentStep].action === 'connect') {
                        setTimeout(() => this.nextStep(), 1000);
                    }
                });

                console.log('Tutorial system: Cytoscape event listeners attached');
            } else if (attempts < maxAttempts) {
                // Cytoscape not ready yet, check again in 100ms
                setTimeout(checkCytoscape, 100);
            } else {
                console.warn('Tutorial system: Cytoscape not available after timeout, continuing without event listeners');
            }
        };

        checkCytoscape();
    }

    /**
     * Start the tutorial
     */
    startTutorial() {
        this.isActive = true;
        this.currentStep = 0;
        this.resetOverlayState();
        this.showTutorial();
        this.updateTutorialContent();
        this.saveCurrentStep();
    }

    /**
     * Resume the tutorial from a specific step
     */
    resumeTutorial(stepNumber) {
        this.isActive = true;
        this.currentStep = stepNumber;
        this.resetOverlayState();
        this.showTutorial();
        this.updateTutorialContent();
        
        // Show a message indicating tutorial was resumed
        if (window.setStatusMessage) {
            setStatusMessage(`Tutorial resumed from step ${stepNumber + 1}.`);
        }
    }

    /**
     * Reset overlay state to default
     */
    resetOverlayState() {
        // Ensure overlay is visible and interactive
        this.overlay.style.display = 'flex';
        this.overlay.style.background = 'rgba(0, 0, 0, 0.8)';
        this.overlay.style.pointerEvents = 'auto';
        
        // Restore backdrop blur unless we're on steps that highlight specific elements
        const currentStep = this.steps[this.currentStep];
        if (currentStep.highlight !== 'properties' && currentStep.highlight !== 'nodes' && currentStep.highlight !== 'contextmenu' && currentStep.highlight !== 'navigation' && currentStep.highlight !== 'darkmode' && currentStep.highlight !== 'filebutton' && currentStep.highlight !== 'editbutton' && currentStep.highlight !== 'helpbutton') {
            this.overlay.style.backdropFilter = 'blur(3px)';
            this.overlay.style.webkitBackdropFilter = 'blur(3px)';
        }
        
        // Reset modal styling and z-index
        const modal = this.tutorialModal;
        modal.style.border = '1px solid var(--glass-border)';
        modal.style.boxShadow = 'var(--shadow-heavy)';
        
        // Reset element z-index if not on highlighting steps
        if (currentStep.highlight !== 'properties' && currentStep.highlight !== 'nodes' && currentStep.highlight !== 'contextmenu' && currentStep.highlight !== 'navigation' && currentStep.highlight !== 'darkmode' && currentStep.highlight !== 'filebutton' && currentStep.highlight !== 'editbutton' && currentStep.highlight !== 'helpbutton') {
            const propertiesPanel = document.querySelector('#node-properties-menu');
            if (propertiesPanel) {
                propertiesPanel.style.zIndex = '';
            }
            const canvas = document.querySelector('#cy');
            if (canvas) {
                canvas.style.zIndex = '';
            }
            const contextMenu = document.querySelector('#context-menu');
            if (contextMenu) {
                contextMenu.style.zIndex = '';
            }
            const zoomSlider = document.querySelector('#zoom-slider');
            if (zoomSlider) {
                zoomSlider.style.zIndex = '';
            }
            const darkModeToggle = document.querySelector('#dark-mode-toggle');
            if (darkModeToggle) {
                darkModeToggle.style.zIndex = '';
            }
            const fileButton = document.querySelector('button[onclick="toggleDropdown(\'file-dropdown\')"]');
            if (fileButton) {
                fileButton.style.zIndex = '';
            }
            const editButton = document.querySelector('button[onclick="toggleDropdown(\'edit-dropdown\')"]');
            if (editButton) {
                editButton.style.zIndex = '';
            }
            const helpButton = document.querySelector('button[onclick="toggleDropdown(\'help-dropdown\')"]');
            if (helpButton) {
                helpButton.style.zIndex = '';
            }
            modal.style.zIndex = '20002'; // Default tutorial modal z-index
        }
        
        // Clear any pending timeouts
        if (this.interactionTimeout) {
            clearTimeout(this.interactionTimeout);
            this.interactionTimeout = null;
        }
        
        // Ensure body overflow is hidden to prevent scrolling
        document.body.style.overflow = 'hidden';
        
        // Force a reflow to ensure styles are applied
        this.overlay.offsetHeight;
    }

    /**
     * Show the tutorial overlay
     */
    showTutorial() {
        this.overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide the tutorial overlay
     */
    hideTutorial() {
        this.overlay.style.display = 'none';
        document.body.style.overflow = '';
        this.isActive = false;
        this.clearHighlight();
    }

    /**
     * Update tutorial content for current step
     */
    updateTutorialContent() {
        const step = this.steps[this.currentStep];
        
        console.log(`Tutorial: Updating to step ${this.currentStep + 1}: ${step.title}`);
        console.log(`Tutorial: Target: ${step.target}, Position: ${step.position}`);
        
        // Ensure overlay is visible and properly configured
        this.overlay.style.display = 'flex';
        this.overlay.style.background = 'rgba(0, 0, 0, 0.8)';
        this.overlay.style.pointerEvents = 'auto';
        
        // Ensure body overflow is hidden
        document.body.style.overflow = 'hidden';
        
        // Update content
        this.tutorialModal.querySelector('.tutorial-title').textContent = step.title;
        this.tutorialModal.querySelector('.tutorial-text').textContent = step.content;
        
        // Update step counter visibility based on feature flag
        const stepCounterElement = this.tutorialModal.querySelector('.tutorial-step-counter');
        if (this.showStepCounter) {
            stepCounterElement.textContent = `${this.currentStep + 1} of ${this.steps.length}`;
            stepCounterElement.style.display = 'block';
        } else {
            stepCounterElement.style.display = 'none';
        }

        // Update buttons
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        prevBtn.style.display = this.currentStep === 0 ? 'none' : 'block';
        nextBtn.textContent = this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next';

        // Reset modal styling
        const modal = this.tutorialModal;
        modal.style.border = '1px solid var(--glass-border)';
        modal.style.boxShadow = 'var(--shadow-heavy)';
        
        // Ensure modal content is crisp and clear
        modal.style.filter = 'none';
        modal.style.backdropFilter = 'none';
        modal.style.webkitBackdropFilter = 'none';
        modal.style.zIndex = '10001';
        
        // Ensure content div is clear
        const content = modal.querySelector('.tutorial-content');
        if (content) {
            content.style.filter = 'none';
            content.style.backdropFilter = 'none';
            content.style.webkitBackdropFilter = 'none';
        }

        // Position modal and highlight target
        this.positionTutorialModal(step);
        this.highlightTarget(step);
        
        // Ensure modal content is crisp and clear
        setTimeout(() => {
            this.ensureModalClarity();
        }, 100);
        
        // For highlighting steps, ensure both modal and highlighted elements are crisp
        if (step.highlight === 'properties' || step.highlight === 'nodes' || step.highlight === 'contextmenu' || step.highlight === 'navigation' || step.highlight === 'darkmode' || step.highlight === 'filebutton' || step.highlight === 'editbutton' || step.highlight === 'helpbutton') {
            this.ensurePropertiesStepClarity();
        }
        
        console.log(`Tutorial: Step ${this.currentStep + 1} content updated successfully`);
    }

    /**
     * Position the tutorial modal based on step configuration
     */
    positionTutorialModal(step) {
        const modal = this.tutorialModal;
        modal.className = `tutorial-modal tutorial-modal-${step.position}`;
        
        // Always use center positioning for consistency and reliability
        this.positionModalCenter(modal);
    }

    /**
     * Position modal in center of screen
     */
    positionModalCenter(modal) {
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.position = 'fixed';
        
        // For highlighting steps, ensure modal is above overlay
        const currentStep = this.steps[this.currentStep];
        if (currentStep.highlight === 'properties' || currentStep.highlight === 'nodes' || currentStep.highlight === 'contextmenu' || currentStep.highlight === 'navigation' || currentStep.highlight === 'darkmode' || currentStep.highlight === 'filebutton' || currentStep.highlight === 'editbutton' || currentStep.highlight === 'helpbutton') {
            modal.style.zIndex = '20004'; // Above overlay
        } else {
            modal.style.zIndex = '20002'; // Default tutorial modal z-index
        }
        
        // Ensure modal content is crisp and clear
        modal.style.filter = 'none';
        modal.style.backdropFilter = 'none';
        modal.style.webkitBackdropFilter = 'none';
        
        // Ensure content div is clear
        const content = modal.querySelector('.tutorial-content');
        if (content) {
            content.style.filter = 'none';
            content.style.backdropFilter = 'none';
            content.style.webkitBackdropFilter = 'none';
        }
        
        // Ensure text elements are crisp
        const textElements = modal.querySelectorAll('.tutorial-title, .tutorial-text, .tutorial-step-counter');
        textElements.forEach(element => {
            element.style.filter = 'none';
            element.style.textRendering = 'optimizeLegibility';
            element.style.webkitFontSmoothing = 'antialiased';
        });
    }

    /**
     * Highlight the target element for current step
     */
    highlightTarget(step) {
        this.clearHighlight();
        
        if (!step.target) return;

        const targetElement = document.querySelector(step.target);
        if (!targetElement) {
            console.warn(`Tutorial: Target element ${step.target} not found for highlighting`);
            return;
        }

        this.highlightedElement = targetElement;
        
        if (step.highlight === 'area') {
            // Highlight the entire canvas area
            this.highlightArea(targetElement);
        } else if (step.highlight === 'node') {
            // Highlight specific nodes
            this.highlightNodes();
        } else if (step.highlight === 'properties') {
            // Highlight the properties panel
            this.highlightPropertiesPanel(targetElement);
        } else if (step.highlight === 'nodes') {
            // Highlight nodes and make them visible above overlay
            this.highlightNodesVisible(targetElement);
        } else if (step.highlight === 'contextmenu') {
            // Highlight the context menu and make it visible above overlay
            this.highlightContextMenu(targetElement);
        } else if (step.highlight === 'navigation') {
            // Highlight the navigation controls
            this.highlightNavigationControls(targetElement);
        } else if (step.highlight === 'darkmode') {
            // Highlight the dark mode toggle
            this.highlightDarkModeToggle(targetElement);
        } else if (step.highlight === 'filebutton') {
            // Highlight the File button
            this.highlightFileButton(targetElement);
        } else if (step.highlight === 'editbutton') {
            // Highlight the Edit button
            this.highlightEditButton(targetElement);
        } else if (step.highlight === 'helpbutton') {
            // Highlight the Help button
            this.highlightHelpButton(targetElement);
        } else {
            // Highlight the specific element
            this.highlightElement(targetElement);
        }
    }

    /**
     * Highlight a specific element
     */
    highlightElement(element) {
        const rect = element.getBoundingClientRect();
        this.spotlight.style.display = 'block';
        this.spotlight.style.left = `${rect.left}px`;
        this.spotlight.style.top = `${rect.top}px`;
        this.spotlight.style.width = `${rect.width}px`;
        this.spotlight.style.height = `${rect.height}px`;
        this.spotlight.style.borderRadius = '8px';
    }

    /**
     * Highlight the canvas area
     */
    highlightArea(element) {
        const rect = element.getBoundingClientRect();
        this.spotlight.style.display = 'block';
        this.spotlight.style.left = `${rect.left}px`;
        this.spotlight.style.top = `${rect.top}px`;
        this.spotlight.style.width = `${rect.width}px`;
        this.spotlight.style.height = `${rect.height}px`;
        this.spotlight.style.borderRadius = '12px';
        
        // For interactive steps, temporarily hide the overlay to allow interactions
        if (this.steps[this.currentStep].action) {
            this.temporarilyHideOverlay();
        }
    }

    /**
     * Highlight nodes in the graph
     */
    highlightNodes() {
        // For node highlighting, we'll highlight the canvas area
        const canvas = document.querySelector('#cy');
        if (canvas) {
            this.highlightArea(canvas);
        }
    }

    /**
     * Highlight the properties panel
     */
    highlightPropertiesPanel(element) {
        const rect = element.getBoundingClientRect();
        this.spotlight.style.display = 'block';
        this.spotlight.style.left = `${rect.left}px`;
        this.spotlight.style.top = `${rect.top}px`;
        this.spotlight.style.width = `${rect.width}px`;
        this.spotlight.style.height = `${rect.height}px`;
        this.spotlight.style.borderRadius = '12px';
        
        // Remove backdrop blur from overlay to prevent blurring of highlighted elements
        this.overlay.style.backdropFilter = 'none';
        this.overlay.style.webkitBackdropFilter = 'none';
        
        // Ensure properties panel maintains its original styling
        element.style.filter = 'none';
        element.style.backdropFilter = 'none';
        element.style.webkitBackdropFilter = 'none';
        element.style.zIndex = '20003'; // Ensure it's above the overlay
        
        // Also ensure the tutorial modal is above the overlay
        this.tutorialModal.style.zIndex = '20004';
    }

    /**
     * Highlight nodes in the graph and make them visible above overlay
     */
    highlightNodesVisible(element) {
        const rect = element.getBoundingClientRect();
        this.spotlight.style.display = 'block';
        this.spotlight.style.left = `${rect.left}px`;
        this.spotlight.style.top = `${rect.top}px`;
        this.spotlight.style.width = `${rect.width}px`;
        this.spotlight.style.height = `${rect.height}px`;
        this.spotlight.style.borderRadius = '12px';
        
        // Remove backdrop blur from overlay to prevent blurring of highlighted elements
        this.overlay.style.backdropFilter = 'none';
        this.overlay.style.webkitBackdropFilter = 'none';
        
        // Ensure canvas maintains its original styling and is above overlay
        element.style.filter = 'none';
        element.style.backdropFilter = 'none';
        element.style.webkitBackdropFilter = 'none';
        element.style.zIndex = '20003'; // Ensure it's above the overlay
        
        // Also ensure the tutorial modal is above the overlay
        this.tutorialModal.style.zIndex = '20004';
    }

    /**
     * Highlight the context menu and make it visible above overlay
     */
    highlightContextMenu(element) {
        // Ensure context menu is visible for tutorial purposes
        if (element.style.display === 'none') {
            element.style.display = 'block';
            // Position it in a visible location for tutorial
            element.style.left = '50%';
            element.style.top = '50%';
            element.style.transform = 'translate(-50%, -50%)';
        }
        
        const rect = element.getBoundingClientRect();
        this.spotlight.style.display = 'block';
        this.spotlight.style.left = `${rect.left}px`;
        this.spotlight.style.top = `${rect.top}px`;
        this.spotlight.style.width = `${rect.width}px`;
        this.spotlight.style.height = `${rect.height}px`;
        this.spotlight.style.borderRadius = '12px';
        
        // Remove backdrop blur from overlay to prevent blurring of highlighted elements
        this.overlay.style.backdropFilter = 'none';
        this.overlay.style.webkitBackdropFilter = 'none';
        
        // Ensure context menu maintains its original styling and is above overlay
        element.style.filter = 'none';
        element.style.backdropFilter = 'none';
        element.style.webkitBackdropFilter = 'none';
        element.style.zIndex = '20003'; // Ensure it's above the overlay
        
        // Also ensure the tutorial modal is above the overlay
        this.tutorialModal.style.zIndex = '20004';
        
        // Set up listener for context menu close to switch highlighting to nodes
        this.setupContextMenuCloseListener();
    }

    /**
     * Set up listener for context menu close to switch highlighting to nodes
     */
    setupContextMenuCloseListener() {
        // Remove any existing listener
        if (this.contextMenuCloseListener) {
            document.removeEventListener('click', this.contextMenuCloseListener);
        }
        
        // Create new listener
        this.contextMenuCloseListener = (event) => {
            const contextMenu = document.querySelector('#context-menu');
            if (contextMenu && contextMenu.style.display === 'none') {
                // Context menu was closed, switch to highlighting nodes
                this.switchToNodesHighlighting();
                // Remove the listener after switching
                document.removeEventListener('click', this.contextMenuCloseListener);
                this.contextMenuCloseListener = null;
            }
        };
        
        // Add the listener
        document.addEventListener('click', this.contextMenuCloseListener);
    }

    /**
     * Switch highlighting from context menu to nodes
     */
    switchToNodesHighlighting() {
        // Clear current highlight
        this.clearHighlight();
        
        // Switch to highlighting nodes
        const canvas = document.querySelector('#cy');
        if (canvas) {
            this.highlightNodesVisible(canvas);
        }
    }

    /**
     * Highlight the navigation controls
     */
    highlightNavigationControls(element) {
        const rect = element.getBoundingClientRect();
        this.spotlight.style.display = 'block';
        this.spotlight.style.left = `${rect.left}px`;
        this.spotlight.style.top = `${rect.top}px`;
        this.spotlight.style.width = `${rect.width}px`;
        this.spotlight.style.height = `${rect.height}px`;
        this.spotlight.style.borderRadius = '12px';
        
        // Remove backdrop blur from overlay to prevent blurring of highlighted elements
        this.overlay.style.backdropFilter = 'none';
        this.overlay.style.webkitBackdropFilter = 'none';
        
        // Ensure navigation controls maintain their original styling
        element.style.filter = 'none';
        element.style.backdropFilter = 'none';
        element.style.webkitBackdropFilter = 'none';
        element.style.zIndex = '20003'; // Ensure it's above the overlay
        
        // Also ensure the tutorial modal is above the overlay
        this.tutorialModal.style.zIndex = '20004';
    }

    /**
     * Highlight the dark mode toggle
     */
    highlightDarkModeToggle(element) {
        const rect = element.getBoundingClientRect();
        this.spotlight.style.display = 'block';
        this.spotlight.style.left = `${rect.left}px`;
        this.spotlight.style.top = `${rect.top}px`;
        this.spotlight.style.width = `${rect.width}px`;
        this.spotlight.style.height = `${rect.height}px`;
        this.spotlight.style.borderRadius = '12px';
        
        // Remove backdrop blur from overlay to prevent blurring of highlighted elements
        this.overlay.style.backdropFilter = 'none';
        this.overlay.style.webkitBackdropFilter = 'none';
        
        // Ensure dark mode toggle maintains its original styling
        element.style.filter = 'none';
        element.style.backdropFilter = 'none';
        element.style.webkitBackdropFilter = 'none';
        element.style.zIndex = '20003'; // Ensure it's above the overlay
        
        // Also ensure the tutorial modal is above the overlay
        this.tutorialModal.style.zIndex = '20004';
    }

    /**
     * Highlight the File button
     */
    highlightFileButton(element) {
        const rect = element.getBoundingClientRect();
        
        // For File button, use a different approach - create a custom spotlight without the shadow mask
        this.spotlight.style.display = 'block';
        this.spotlight.style.left = `${rect.left}px`;
        this.spotlight.style.top = `${rect.top}px`;
        this.spotlight.style.width = `${rect.width}px`;
        this.spotlight.style.height = `${rect.height}px`;
        this.spotlight.style.borderRadius = '8px';
        this.spotlight.style.boxShadow = '0 0 20px var(--primary-color)'; // Only glow, no mask shadow
        this.spotlight.style.zIndex = '20000'; // Lower z-index to ensure button is above
        
        // Add "File" text to the spotlight
        this.spotlight.textContent = 'File';
        this.spotlight.style.display = 'flex';
        this.spotlight.style.alignItems = 'center';
        this.spotlight.style.justifyContent = 'center';
        this.spotlight.style.fontSize = '14px';
        this.spotlight.style.fontWeight = '600';
        this.spotlight.style.color = 'white';
        this.spotlight.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.9)';
        this.spotlight.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        this.spotlight.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        
        // Remove backdrop blur from overlay to prevent blurring of highlighted elements
        this.overlay.style.backdropFilter = 'none';
        this.overlay.style.webkitBackdropFilter = 'none';
        
        // Hide the original File button to avoid duplication
        element.style.display = 'none';
        
        // Also ensure the tutorial modal is above the overlay
        this.tutorialModal.style.zIndex = '20004';
    }

    /**
     * Highlight the Edit button
     */
    highlightEditButton(element) {
        const rect = element.getBoundingClientRect();
        
        // For Edit button, use a different approach - create a custom spotlight without the shadow mask
        this.spotlight.style.display = 'block';
        this.spotlight.style.left = `${rect.left}px`;
        this.spotlight.style.top = `${rect.top}px`;
        this.spotlight.style.width = `${rect.width}px`;
        this.spotlight.style.height = `${rect.height}px`;
        this.spotlight.style.borderRadius = '8px';
        this.spotlight.style.boxShadow = '0 0 20px var(--primary-color)'; // Only glow, no mask shadow
        this.spotlight.style.zIndex = '20000'; // Lower z-index to ensure button is above
        
        // Add "Edit" text to the spotlight
        this.spotlight.textContent = 'Edit';
        this.spotlight.style.display = 'flex';
        this.spotlight.style.alignItems = 'center';
        this.spotlight.style.justifyContent = 'center';
        this.spotlight.style.fontSize = '14px';
        this.spotlight.style.fontWeight = '600';
        this.spotlight.style.color = 'white';
        this.spotlight.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.9)';
        this.spotlight.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        this.spotlight.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        
        // Remove backdrop blur from overlay to prevent blurring of highlighted elements
        this.overlay.style.backdropFilter = 'none';
        this.overlay.style.webkitBackdropFilter = 'none';
        
        // Hide the original Edit button to avoid duplication
        element.style.display = 'none';
        
        // Also ensure the tutorial modal is above the overlay
        this.tutorialModal.style.zIndex = '20004';
    }

    /**
     * Highlight the Help button
     */
    highlightHelpButton(element) {
        const rect = element.getBoundingClientRect();
        
        // For Help button, use a different approach - create a custom spotlight without the shadow mask
        this.spotlight.style.display = 'block';
        this.spotlight.style.left = `${rect.left}px`;
        this.spotlight.style.top = `${rect.top}px`;
        this.spotlight.style.width = `${rect.width}px`;
        this.spotlight.style.height = `${rect.height}px`;
        this.spotlight.style.borderRadius = '8px';
        this.spotlight.style.boxShadow = '0 0 20px var(--primary-color)'; // Only glow, no mask shadow
        this.spotlight.style.zIndex = '20000'; // Lower z-index to ensure button is above
        
        // Add "Help" text to the spotlight
        this.spotlight.textContent = 'Help';
        this.spotlight.style.display = 'flex';
        this.spotlight.style.alignItems = 'center';
        this.spotlight.style.justifyContent = 'center';
        this.spotlight.style.fontSize = '14px';
        this.spotlight.style.fontWeight = '600';
        this.spotlight.style.color = 'white';
        this.spotlight.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.9)';
        this.spotlight.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        this.spotlight.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        
        // Remove backdrop blur from overlay to prevent blurring of highlighted elements
        this.overlay.style.backdropFilter = 'none';
        this.overlay.style.webkitBackdropFilter = 'none';
        
        // Hide the original Help button to avoid duplication
        element.style.display = 'none';
        
        // Also ensure the tutorial modal is above the overlay
        this.tutorialModal.style.zIndex = '20004';
    }

    /**
     * Temporarily hide overlay to allow interactions
     */
    temporarilyHideOverlay() {
        // Hide the overlay background but keep the modal visible
        this.overlay.style.background = 'transparent';
        this.overlay.style.pointerEvents = 'none';
        
        // Add a visual indicator that the user can interact
        const modal = this.tutorialModal;
        modal.style.border = '3px solid #4CAF50';
        modal.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.5)';
        
        // Store the timeout so we can clear it if user interacts
        this.interactionTimeout = setTimeout(() => {
            // Restore overlay state
            this.overlay.style.background = 'rgba(0, 0, 0, 0.8)';
            this.overlay.style.pointerEvents = 'auto';
            this.overlay.style.display = 'flex';
            
            // Restore modal styling
            modal.style.border = '1px solid var(--glass-border)';
            modal.style.boxShadow = 'var(--shadow-heavy)';
            
            // Ensure body overflow is hidden
            document.body.style.overflow = 'hidden';
        }, 10000); // 10 seconds to allow user interaction
    }

    /**
     * Show the created node before advancing to next step
     */
    showCreatedNode() {
        // Clear any pending interaction timeout
        if (this.interactionTimeout) {
            clearTimeout(this.interactionTimeout);
            this.interactionTimeout = null;
        }
        
        // Hide the overlay completely so user can see the created node and properties panel
        this.overlay.style.display = 'none';
        document.body.style.overflow = ''; // Allow scrolling
        
        // Advance to next step after a delay to let user see the created node and properties panel
        setTimeout(() => {
            // Restore overlay and advance to next step
            this.overlay.style.display = 'flex';
            this.overlay.style.background = 'rgba(0, 0, 0, 0.8)';
            this.overlay.style.pointerEvents = 'auto';
            document.body.style.overflow = 'hidden';
            
            const modal = this.tutorialModal;
            modal.style.border = '1px solid var(--glass-border)';
            modal.style.boxShadow = 'var(--shadow-heavy)';
            
            this.nextStep(); // Advance to the next step
        }, 3000); // 3 seconds to let user see the node and properties panel
    }

    /**
     * Clear current highlight
     */
    clearHighlight() {
        this.spotlight.style.display = 'none';
        // Restore original spotlight box-shadow and z-index
        this.spotlight.style.boxShadow = '0 0 0 9999px var(--overlay-bg), 0 0 20px var(--primary-color)';
        this.spotlight.style.zIndex = '20001'; // Restore original z-index
        // Clear any text content and restore original styling
        this.spotlight.textContent = '';
        this.spotlight.style.background = 'transparent';
        this.spotlight.style.color = '';
        this.spotlight.style.fontSize = '';
        this.spotlight.style.fontWeight = '';
        this.spotlight.style.textShadow = '';
        this.spotlight.style.fontFamily = '';
        this.spotlight.style.alignItems = '';
        this.spotlight.style.justifyContent = '';
        this.highlightedElement = null;
        
        // Clean up context menu close listener
        if (this.contextMenuCloseListener) {
            document.removeEventListener('click', this.contextMenuCloseListener);
            this.contextMenuCloseListener = null;
        }
        
        // Reset z-index values for all highlighted elements and tutorial modal
        const propertiesPanel = document.querySelector('#node-properties-menu');
        if (propertiesPanel) {
            propertiesPanel.style.zIndex = '';
        }
        const canvas = document.querySelector('#cy');
        if (canvas) {
            canvas.style.zIndex = '';
        }
        const contextMenu = document.querySelector('#context-menu');
        if (contextMenu) {
            contextMenu.style.zIndex = '';
            // Hide the context menu if it was shown for tutorial purposes
            if (contextMenu.style.transform === 'translate(-50%, -50%)') {
                contextMenu.style.display = 'none';
                contextMenu.style.left = '';
                contextMenu.style.top = '';
                contextMenu.style.transform = '';
            }
        }
        const zoomSlider = document.querySelector('#zoom-slider');
        if (zoomSlider) {
            zoomSlider.style.zIndex = '';
        }
        const darkModeToggle = document.querySelector('#dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.style.zIndex = '';
        }
        // Remove the file button background element if it exists
        const buttonBackground = document.getElementById('file-button-background');
        if (buttonBackground) {
            buttonBackground.remove();
        }
        
        const fileButton = document.querySelector('button[onclick="toggleDropdown(\'file-dropdown\')"]');
        if (fileButton) {
            fileButton.style.zIndex = '';
            fileButton.style.filter = '';
            fileButton.style.backdropFilter = '';
            fileButton.style.webkitBackdropFilter = '';
            fileButton.style.background = '';
            fileButton.style.color = '';
            fileButton.style.border = '';
            fileButton.style.textShadow = '';
            fileButton.style.fontWeight = '';
            fileButton.style.fontSize = '';
            fileButton.style.boxShadow = '';
            fileButton.style.position = '';
            fileButton.style.display = ''; // Restore File button visibility
        }
        const editButton = document.querySelector('button[onclick="toggleDropdown(\'edit-dropdown\')"]');
        if (editButton) {
            editButton.style.zIndex = '';
            editButton.style.filter = '';
            editButton.style.backdropFilter = '';
            editButton.style.webkitBackdropFilter = '';
            editButton.style.background = '';
            editButton.style.color = '';
            editButton.style.border = '';
            editButton.style.textShadow = '';
            editButton.style.fontWeight = '';
            editButton.style.fontSize = '';
            editButton.style.boxShadow = '';
            editButton.style.position = '';
            editButton.style.display = ''; // Restore Edit button visibility
        }
        const helpButton = document.querySelector('button[onclick="toggleDropdown(\'help-dropdown\')"]');
        if (helpButton) {
            helpButton.style.zIndex = '';
            helpButton.style.filter = '';
            helpButton.style.backdropFilter = '';
            helpButton.style.webkitBackdropFilter = '';
            helpButton.style.background = '';
            helpButton.style.color = '';
            helpButton.style.border = '';
            helpButton.style.textShadow = '';
            helpButton.style.fontWeight = '';
            helpButton.style.fontSize = '';
            helpButton.style.boxShadow = '';
            helpButton.style.position = '';
            helpButton.style.display = ''; // Restore Help button visibility
        }
        this.tutorialModal.style.zIndex = '20002'; // Reset to default tutorial modal z-index
    }

    /**
     * Save current step to localStorage (only if resume feature is enabled)
     */
    saveCurrentStep() {
        if (this.enableTutorialResume) {
            localStorage.setItem('insightNexus_tutorialCurrentStep', this.currentStep.toString());
        }
    }

    /**
     * Move to next tutorial step
     */
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.saveCurrentStep();
            this.resetOverlayState();
            this.updateTutorialContent();
        } else {
            this.completeTutorial();
        }
    }

    /**
     * Move to previous tutorial step
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.saveCurrentStep();
            this.resetOverlayState();
            this.updateTutorialContent();
        }
    }

    /**
     * Complete the tutorial
     */
    completeTutorial() {
        this.hideTutorial();
        localStorage.setItem('insightNexus_tutorialCompleted', 'true');
        
        // Only clear resume-related items if feature is enabled
        if (this.enableTutorialResume) {
            localStorage.removeItem('insightNexus_tutorialCurrentStep');
            localStorage.removeItem('insightNexus_tutorialSkipped');
        }
        
        // Show completion message
        if (window.setStatusMessage) {
            setStatusMessage('Tutorial completed! You\'re ready to start your OSINT investigation.');
        }
    }

    /**
     * Skip the tutorial
     */
    skipTutorial() {
        this.hideTutorial();
        localStorage.setItem('insightNexus_tutorialCompleted', 'true');
        
        // Only handle resume-related items if feature is enabled
        if (this.enableTutorialResume) {
            localStorage.setItem('insightNexus_tutorialSkipped', 'true');
            localStorage.removeItem('insightNexus_tutorialCurrentStep');
        }
        
        if (window.setStatusMessage) {
            setStatusMessage('Tutorial skipped. You can restart it anytime from the Help menu.');
        }
    }

    /**
     * Restart the tutorial (called from Help menu)
     */
    restartTutorial() {
        localStorage.removeItem('insightNexus_tutorialCompleted');
        
        // Only clear resume-related items if feature is enabled
        if (this.enableTutorialResume) {
            localStorage.removeItem('insightNexus_tutorialSkipped');
            localStorage.removeItem('insightNexus_tutorialCurrentStep');
        }
        
        this.startTutorial();
    }

    /**
     * Force advance to next step (safety method)
     */
    forceNextStep() {
        if (this.isActive) {
            // Clear any pending timeouts
            if (this.interactionTimeout) {
                clearTimeout(this.interactionTimeout);
                this.interactionTimeout = null;
            }
            
            // Ensure overlay is properly restored
            this.resetOverlayState();
            this.nextStep();
        }
    }

    /**
     * Toggle the tutorial resume feature flag (for debugging)
     */
    toggleResumeFeature() {
        this.enableTutorialResume = !this.enableTutorialResume;
        console.log(`Tutorial System: Resume functionality ${this.enableTutorialResume ? 'ENABLED' : 'DISABLED'}`);
        return this.enableTutorialResume;
    }

    /**
     * Ensure modal content is crisp and clear
     */
    ensureModalClarity() {
        const modal = this.tutorialModal;
        const content = modal.querySelector('.tutorial-content');
        
        // Remove any blur effects from modal but preserve original styling
        modal.style.filter = 'none';
        
        // For highlighting steps, ensure modal is above overlay
        const currentStep = this.steps[this.currentStep];
        if (currentStep.highlight === 'properties' || currentStep.highlight === 'nodes' || currentStep.highlight === 'contextmenu' || currentStep.highlight === 'navigation' || currentStep.highlight === 'darkmode' || currentStep.highlight === 'filebutton' || currentStep.highlight === 'editbutton' || currentStep.highlight === 'helpbutton') {
            modal.style.zIndex = '20004';
            // Preserve original glass effect styling
            modal.style.background = 'var(--glass-bg)';
            modal.style.border = '1px solid var(--glass-border)';
            modal.style.boxShadow = 'var(--shadow-heavy)';
            modal.style.backdropFilter = 'blur(20px)';
            modal.style.webkitBackdropFilter = 'blur(20px)';
        } else {
            modal.style.zIndex = '20002';
            modal.style.backdropFilter = 'none';
            modal.style.webkitBackdropFilter = 'none';
        }
        
        // Remove any blur effects from content
        if (content) {
            content.style.filter = 'none';
            content.style.backdropFilter = 'none';
            content.style.webkitBackdropFilter = 'none';
        }
        
        // Ensure text is crisp
        const textElements = modal.querySelectorAll('.tutorial-title, .tutorial-text, .tutorial-step-counter');
        textElements.forEach(element => {
            element.style.filter = 'none';
            element.style.textRendering = 'optimizeLegibility';
            element.style.webkitFontSmoothing = 'antialiased';
        });
    }

    /**
     * Ensure both tutorial modal and highlighted elements are crisp for highlighting steps
     */
    ensurePropertiesStepClarity() {
        // Ensure tutorial modal is crisp and maintains original styling
        this.ensureModalClarity();
        
        // Ensure tutorial modal has original background and styling
        this.tutorialModal.style.background = 'var(--glass-bg)';
        this.tutorialModal.style.border = '1px solid var(--glass-border)';
        this.tutorialModal.style.boxShadow = 'var(--shadow-heavy)';
        this.tutorialModal.style.backdropFilter = 'blur(20px)';
        this.tutorialModal.style.webkitBackdropFilter = 'blur(20px)';
        this.tutorialModal.style.zIndex = '20004'; // Above overlay
        
        // Ensure highlighted elements are crisp and above overlay
        const currentStep = this.steps[this.currentStep];
        
        if (currentStep.highlight === 'properties') {
            const propertiesPanel = document.querySelector('#node-properties-menu');
            if (propertiesPanel) {
                propertiesPanel.style.filter = 'none';
                propertiesPanel.style.backdropFilter = 'none';
                propertiesPanel.style.webkitBackdropFilter = 'none';
                propertiesPanel.style.zIndex = '20003'; // Above overlay
                
                // Ensure all child elements are also crisp
                const allElements = propertiesPanel.querySelectorAll('*');
                allElements.forEach(element => {
                    element.style.filter = 'none';
                    element.style.backdropFilter = 'none';
                    element.style.webkitBackdropFilter = 'none';
                });
            }
        } else if (currentStep.highlight === 'nodes') {
            const canvas = document.querySelector('#cy');
            if (canvas) {
                canvas.style.filter = 'none';
                canvas.style.backdropFilter = 'none';
                canvas.style.webkitBackdropFilter = 'none';
                canvas.style.zIndex = '20003'; // Above overlay
                
                // Ensure all child elements are also crisp
                const allElements = canvas.querySelectorAll('*');
                allElements.forEach(element => {
                    element.style.filter = 'none';
                    element.style.backdropFilter = 'none';
                    element.style.webkitBackdropFilter = 'none';
                });
            }
        } else if (currentStep.highlight === 'contextmenu') {
            const contextMenu = document.querySelector('#context-menu');
            if (contextMenu) {
                contextMenu.style.filter = 'none';
                contextMenu.style.backdropFilter = 'none';
                contextMenu.style.webkitBackdropFilter = 'none';
                contextMenu.style.zIndex = '20003'; // Above overlay
                
                // Ensure all child elements are also crisp
                const allElements = contextMenu.querySelectorAll('*');
                allElements.forEach(element => {
                    element.style.filter = 'none';
                    element.style.backdropFilter = 'none';
                    element.style.webkitBackdropFilter = 'none';
                });
            }
        } else if (currentStep.highlight === 'navigation') {
            const zoomSlider = document.querySelector('#zoom-slider');
            if (zoomSlider) {
                zoomSlider.style.filter = 'none';
                zoomSlider.style.backdropFilter = 'none';
                zoomSlider.style.webkitBackdropFilter = 'none';
                zoomSlider.style.zIndex = '20003'; // Above overlay
                
                // Ensure all child elements are also crisp
                const allElements = zoomSlider.querySelectorAll('*');
                allElements.forEach(element => {
                    element.style.filter = 'none';
                    element.style.backdropFilter = 'none';
                    element.style.webkitBackdropFilter = 'none';
                });
            }
        } else if (currentStep.highlight === 'darkmode') {
            const darkModeToggle = document.querySelector('#dark-mode-toggle');
            if (darkModeToggle) {
                darkModeToggle.style.filter = 'none';
                darkModeToggle.style.backdropFilter = 'none';
                darkModeToggle.style.webkitBackdropFilter = 'none';
                darkModeToggle.style.zIndex = '20003'; // Above overlay
                
                // Ensure all child elements are also crisp
                const allElements = darkModeToggle.querySelectorAll('*');
                allElements.forEach(element => {
                    element.style.filter = 'none';
                    element.style.backdropFilter = 'none';
                    element.style.webkitBackdropFilter = 'none';
                });
            }
        } else if (currentStep.highlight === 'filebutton') {
            const fileButton = document.querySelector('button[onclick="toggleDropdown(\'file-dropdown\')"]');
            if (fileButton) {
                // Hide the original File button to avoid duplication
                fileButton.style.display = 'none';
            }
            
            // Also update spotlight to not use shadow mask for File button and add text
            this.spotlight.style.boxShadow = '0 0 20px var(--primary-color)';
            this.spotlight.style.zIndex = '20000'; // Lower z-index to ensure button is above
            this.spotlight.textContent = 'File';
            this.spotlight.style.display = 'flex';
            this.spotlight.style.alignItems = 'center';
            this.spotlight.style.justifyContent = 'center';
            this.spotlight.style.fontSize = '14px';
            this.spotlight.style.fontWeight = '600';
            this.spotlight.style.color = 'white';
            this.spotlight.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.9)';
            this.spotlight.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            this.spotlight.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        } else if (currentStep.highlight === 'editbutton') {
            const editButton = document.querySelector('button[onclick="toggleDropdown(\'edit-dropdown\')"]');
            if (editButton) {
                // Hide the original Edit button to avoid duplication
                editButton.style.display = 'none';
            }
            
            // Also update spotlight to not use shadow mask for Edit button and add text
            this.spotlight.style.boxShadow = '0 0 20px var(--primary-color)';
            this.spotlight.style.zIndex = '20000'; // Lower z-index to ensure button is above
            this.spotlight.textContent = 'Edit';
            this.spotlight.style.display = 'flex';
            this.spotlight.style.alignItems = 'center';
            this.spotlight.style.justifyContent = 'center';
            this.spotlight.style.fontSize = '14px';
            this.spotlight.style.fontWeight = '600';
            this.spotlight.style.color = 'white';
            this.spotlight.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.9)';
            this.spotlight.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            this.spotlight.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        } else if (currentStep.highlight === 'helpbutton') {
            const helpButton = document.querySelector('button[onclick="toggleDropdown(\'help-dropdown\')"]');
            if (helpButton) {
                // Hide the original Help button to avoid duplication
                helpButton.style.display = 'none';
            }
            
            // Also update spotlight to not use shadow mask for Help button and add text
            this.spotlight.style.boxShadow = '0 0 20px var(--primary-color)';
            this.spotlight.style.zIndex = '20000'; // Lower z-index to ensure button is above
            this.spotlight.textContent = 'Help';
            this.spotlight.style.display = 'flex';
            this.spotlight.style.alignItems = 'center';
            this.spotlight.style.justifyContent = 'center';
            this.spotlight.style.fontSize = '14px';
            this.spotlight.style.fontWeight = '600';
            this.spotlight.style.color = 'white';
            this.spotlight.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.9)';
            this.spotlight.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            this.spotlight.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        }
        
        // Remove backdrop blur from overlay
        this.overlay.style.backdropFilter = 'none';
        this.overlay.style.webkitBackdropFilter = 'none';
    }
}

// Initialize tutorial system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tutorialSystem = new TutorialSystem();
    
    // Add manual trigger for testing (can be called from browser console)
    window.startTutorial = () => {
        if (window.tutorialSystem) {
            window.tutorialSystem.startTutorial();
        } else {
            console.error('Tutorial system not initialized');
        }
    };
    
    // Add force advance for debugging (can be called from browser console)
    window.forceTutorialNext = () => {
        if (window.tutorialSystem) {
            window.tutorialSystem.forceNextStep();
        } else {
            console.error('Tutorial system not initialized');
        }
    };
    
    // Add toggle for resume feature (can be called from browser console)
    window.toggleTutorialResume = () => {
        if (window.tutorialSystem) {
            const enabled = window.tutorialSystem.toggleResumeFeature();
            console.log(`Tutorial resume feature is now ${enabled ? 'ENABLED' : 'DISABLED'}`);
            return enabled;
        } else {
            console.error('Tutorial system not initialized');
            return false;
        }
    };
});

// Export for use in other modules
export { TutorialSystem };
