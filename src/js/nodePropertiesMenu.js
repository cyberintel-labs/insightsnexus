import { uploadFiles, removeImageFromNode, removeTextFromNode, showCurrentImage } from "./fileUploadHandler.js";
import { setStatusMessage } from "./setStatusMessageHandler.js";

let cy;
let selectedNode = null;

/**
 * Toggle Properties Menu Function
 * 
 * togglePropertiesMenu()
 * 
 * Toggles the visibility of the node properties menu.
 * Opens the menu if it's closed, closes it if it's open.
 */
function togglePropertiesMenu() {
    const menu = document.getElementById("node-properties-menu");
    const isOpen = menu.classList.contains("open");
    
    if (isOpen) {
        closePropertiesMenu();
    } else {
        openPropertiesMenu();
    }
}

/**
 * Open Properties Menu Function
 * 
 * openPropertiesMenu()
 * 
 * Opens the node properties menu by adding the 'open' class.
 */
function openPropertiesMenu() {
    const menu = document.getElementById("node-properties-menu");
    menu.classList.add("open");
    document.body.classList.add("properties-menu-open");
}

/**
 * Close Properties Menu Function
 * 
 * closePropertiesMenu()
 * 
 * Closes the node properties menu by removing the 'open' class.
 */
function closePropertiesMenu() {
    const menu = document.getElementById("node-properties-menu");
    menu.classList.remove("open");
    document.body.classList.remove("properties-menu-open");
}

// Immediately assign functions to global scope
if (typeof window !== 'undefined') {
    window.togglePropertiesMenu = togglePropertiesMenu;
    window.openPropertiesMenu = openPropertiesMenu;
    window.closePropertiesMenu = closePropertiesMenu;
    window.closeImageOverlay = closeImageOverlay;
    window.showImageOverlay = showImageOverlay;
}

export function initNodePropertiesMenu(cytoscapeInstance){
    cy = cytoscapeInstance;

    const nameInput = document.getElementById("node-name");
    const typeSelect = document.getElementById("node-type-select");
    const imagesContainer = document.getElementById("node-images");
    const textsContainer = document.getElementById("node-texts");
    const uploadImageBtn = document.getElementById("upload-image-btn");
    const uploadTextBtn = document.getElementById("upload-text-btn");
    const notesTextarea = document.getElementById("node-notes-textarea");
    const saveNotesBtn = document.getElementById("save-notes-btn");
    const clearNotesBtn = document.getElementById("clear-notes-btn");
    // const noNodeMessage = document.getElementById("no-node-message");
    // const nodeDetails = document.getElementById("node-details");

    // Initialize drag and drop functionality for properties sections
    const dragDropManager = initPropertiesSectionDragDrop();

    // Show node details when a node is selected
    cy.on("select", "node", (evt) => {
        selectedNode = evt.target;

        // create and store handler for this node
        const handler = () => updatePropertiesMenu(selectedNode);
        selectedNode.scratch("_filesHandler", handler);

        updatePropertiesMenu(selectedNode);
        selectedNode.on("filesUpdated", handler);
        
        // Auto-open the properties menu when a node is selected
        openPropertiesMenu();
    });

    // Hide details when deselected
    cy.on("unselect", "node", () => {
        if(selectedNode){
            const handler = selectedNode.scratch("_filesHandler");
            if(handler){
                selectedNode.removeListener("filesUpdated", handler);
                selectedNode.removeScratch("_filesHandler");
            }
        }
        selectedNode = null;
        updatePropertiesMenu(selectedNode);
        
        // Close properties menu if "Always Collapsed" setting is enabled
        if (window.settings && window.settings.nodePropertiesAlwaysCollapsed) {
            closePropertiesMenu();
        }
    });

    // Name input → updates node label
    nameInput.addEventListener("input", (e) => {
        if(selectedNode){
            selectedNode.data("label", e.target.value);
        }
    });

    // Type dropdown → updates node type
    typeSelect.addEventListener("change", (e) => {
        if(selectedNode){
            selectedNode.data("type", e.target.value);
        }
    });

    // Upload image button
    uploadImageBtn.addEventListener("click", () => {
        if(!selectedNode) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.multiple = true;
        input.onchange = (e) => uploadFiles(selectedNode, e.target.files);
        input.click();
    });

    // Upload text button
    uploadTextBtn.addEventListener("click", () => {
        if(!selectedNode) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".txt";
        input.multiple = true;
        input.onchange = (e) => uploadFiles(selectedNode, e.target.files);
        input.click();
    });

    // Save notes button
    saveNotesBtn.addEventListener("click", () => {
        if(!selectedNode) return;
        const notesText = notesTextarea.value.trim();
        selectedNode.data("notes", notesText);
        // Show a brief success message
        setStatusMessage("Notes saved successfully!");
    });

    // Clear notes button
    clearNotesBtn.addEventListener("click", () => {
        if(!selectedNode) return;
        notesTextarea.value = "";
        selectedNode.data("notes", "");
        setStatusMessage("Notes cleared!");
    });

    // Auto-save notes on input (optional - saves as user types)
    notesTextarea.addEventListener("input", () => {
        if(!selectedNode) return;
        // Debounce the auto-save to avoid too frequent updates
        clearTimeout(notesTextarea.autoSaveTimeout);
        notesTextarea.autoSaveTimeout = setTimeout(() => {
            selectedNode.data("notes", notesTextarea.value);
        }, 1000); // Save after 1 second of no typing
    });

    function updatePropertiesMenu(selectedNode) {
        const noNodeMessage = document.getElementById("no-node-message");
        const propertiesSections = document.querySelectorAll(".properties-section");

        if(!selectedNode){
            // No node is selected, so hide subsections
            if (noNodeMessage) noNodeMessage.style.display = "block";
            propertiesSections.forEach(sec => sec.style.display = "none");
            return;
        }

        // A node is selected, so hide message and show subsections
        if(noNodeMessage) noNodeMessage.style.display = "none";
        propertiesSections.forEach(sec => sec.style.display = "block");

        // Existing logic to populate fields...
        const nameInput = document.getElementById("node-name");
        const typeSelect = document.getElementById("node-type-select");

        if(nameInput) nameInput.value = selectedNode.data("label") || "";
        if(typeSelect) typeSelect.value = selectedNode.data("type") || "custom";
        
        // Populate notes field
        if(notesTextarea) {
            notesTextarea.value = selectedNode.data("notes") || "";
        }

        // Clear + rebuild images list
        if(imagesContainer){
            imagesContainer.innerHTML = "";
            const images = selectedNode.data("images") || [];

            // Label for filename
            images.forEach((src, i) => {
                const wrapper = document.createElement("div");
                wrapper.classList.add("file-item");

                const img = document.createElement("img");
                img.src = src;
                img.classList.add("thumbnail");
                img.title = "Click to select • Double-click to view fullscreen";

                // This is to highlight selected thumbnail
                if(i === (selectedNode.data("currentImageIndex") || 0)){
                    img.classList.add("thumbnail-selected");
                }

                img.addEventListener("click", (e) => {
                    // Prevent double-click from triggering single click
                    if (e.detail === 1) {
                        selectedNode.data("currentImageIndex", i)
                        showCurrentImage(selectedNode);
                        selectedNode.emit("filesUpdated");
                        updatePropertiesMenu(selectedNode);
                    }
                });

                // Add double-click event for image overlay
                img.addEventListener("dblclick", (e) => {
                    console.log("Double-click detected on image:", src);
                    e.preventDefault();
                    e.stopPropagation();
                    showImageOverlay(src);
                });

                const delBtn = document.createElement("button");
                delBtn.classList.add("delete-btn", "material-delete-btn");
                delBtn.innerHTML = '<span class="delete-icon">×</span>';
                delBtn.addEventListener("click", () => removeImageFromNode(selectedNode, i));

                wrapper.appendChild(img);
                wrapper.appendChild(delBtn);
                imagesContainer.appendChild(wrapper);
            });
        }

        // Clear + rebuild texts list
        if(textsContainer){
            textsContainer.innerHTML = "";
            const texts = selectedNode.data("texts") || [];

            texts.forEach((file, i) => {
                const wrapper = document.createElement("div");
                wrapper.classList.add("file-item");

                // Label for filename
                const textLabel = document.createElement("span");
                textLabel.textContent = file.name;
                textLabel.classList.add("text-file-label");

                // Expandable content box (hidden by default)
                const contentBox = document.createElement("div");
                contentBox.classList.add("text-file-content");
                contentBox.style.display = "none";
                contentBox.textContent = file.content;

                // Toggle open/close on click
                textLabel.addEventListener("click", () => {
                    if(contentBox.style.display === "none"){
                        contentBox.style.display = "block";
                    }else{
                        contentBox.style.display = "none";
                    }
                });

                // Delete button
                const delBtn = document.createElement("button");
                delBtn.classList.add("delete-btn", "material-delete-btn");
                delBtn.innerHTML = '<span class="delete-icon">×</span>';
                delBtn.addEventListener("click", () => removeTextFromNode(selectedNode, i));

                wrapper.appendChild(textLabel);
                wrapper.appendChild(delBtn);
                wrapper.appendChild(contentBox);
                textsContainer.appendChild(wrapper);
            });
        }
        
        // Re-add drag handles after DOM updates
        if (dragDropManager && dragDropManager.refreshDragHandles) {
            setTimeout(() => dragDropManager.refreshDragHandles(), 10);
        }
    }
}

/**
 * Show Image Overlay Function
 * 
 * showImageOverlay(imageSrc)
 * 
 * Displays an image in a full-screen overlay with a darkened background.
 * The image is centered and scaled to fit within the viewport.
 * 
 * @param {string} imageSrc - The source URL of the image to display
 */
function showImageOverlay(imageSrc) {
    console.log("showImageOverlay called with:", imageSrc);
    const overlay = document.getElementById("image-overlay");
    const overlayImage = document.getElementById("overlay-image");
    
    if (overlay && overlayImage) {
        overlayImage.src = imageSrc;
        overlay.classList.add("active");
        
        // Prevent body scroll when overlay is active
        document.body.style.overflow = "hidden";
        console.log("Image overlay activated");
    } else {
        console.error("Overlay elements not found:", { overlay, overlayImage });
    }
}

/**
 * Close Image Overlay Function
 * 
 * closeImageOverlay()
 * 
 * Closes the image overlay and restores normal view.
 * Removes the active class and restores body scroll.
 */
function closeImageOverlay() {
    const overlay = document.getElementById("image-overlay");
    
    if (overlay) {
        overlay.classList.remove("active");
        
        // Restore body scroll
        document.body.style.overflow = "";
    }
}

// Add click event listener to overlay background to close on outside click
document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("image-overlay");
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            // Close if clicking on the overlay background or the image container, but not the image itself
            if (e.target === overlay || e.target.classList.contains("image-overlay-content")) {
                closeImageOverlay();
            }
        });
    }
    
    // Add keyboard event listener for Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const overlay = document.getElementById("image-overlay");
            if (overlay && overlay.classList.contains("active")) {
                closeImageOverlay();
            }
        }
    });
});

/**
 * Drag and Drop Manager for Properties Sections
 * 
 * Manages drag and drop functionality for reordering properties sections
 * within the node properties panel. Follows best practices for DOM manipulation,
 * event handling, and memory management.
 */
class PropertiesSectionDragDropManager {
    constructor() {
        this.propertiesContent = document.getElementById("properties-content");
        this.draggedElement = null;
        this.draggedOverElement = null;
        this.sectionHeaders = [];
        this.eventListeners = new Map();
        
        if (!this.propertiesContent) {
            console.warn("Properties content container not found");
            return;
        }
        
        this.init();
    }

    /**
     * Initialize drag and drop functionality
     */
    init() {
        try {
            this.setupDragHandles();
            this.loadSavedOrder();
        } catch (error) {
            console.error("Failed to initialize drag and drop:", error);
        }
    }

    /**
     * Setup drag handles for all section headers
     */
    setupDragHandles() {
        this.sectionHeaders = Array.from(
            document.querySelectorAll(".properties-section .section-header")
        );
        
        this.sectionHeaders.forEach(header => {
            if (!header.querySelector(".drag-handle")) {
                this.createDragHandle(header);
            }
        });
    }

    /**
     * Create and attach drag handle to a section header
     * @param {HTMLElement} header - The section header element
     */
    createDragHandle(header) {
        try {
            const dragHandle = document.createElement("span");
            dragHandle.classList.add("drag-handle");
            dragHandle.innerHTML = "⋮⋮";
            dragHandle.title = "Drag to reorder sections";
            
            // Use CSS classes instead of inline styles
            dragHandle.classList.add("drag-handle-styled");

            header.insertBefore(dragHandle, header.firstChild);
            
            const section = header.closest(".properties-section");
            if (section) {
                this.makeSectionDraggable(section);
            }
        } catch (error) {
            console.error("Failed to create drag handle:", error);
        }
    }

    /**
     * Make a section draggable and attach event listeners
     * @param {HTMLElement} section - The properties section element
     */
    makeSectionDraggable(section) {
        section.draggable = true;
        section.classList.add("draggable-section");
        
        // Store event listeners for cleanup
        const listeners = {
            dragstart: (e) => this.handleDragStart(e),
            dragend: (e) => this.handleDragEnd(e),
            dragover: (e) => this.handleDragOver(e),
            dragenter: (e) => this.handleDragEnter(e),
            dragleave: (e) => this.handleDragLeave(e),
            drop: (e) => this.handleDrop(e)
        };
        
        // Attach listeners and store references
        Object.entries(listeners).forEach(([event, handler]) => {
            section.addEventListener(event, handler);
        });
        
        this.eventListeners.set(section, listeners);
    }

    /**
     * Handle drag start event
     * @param {DragEvent} e - The drag start event
     */
    handleDragStart(e) {
        try {
            this.draggedElement = e.target;
            this.draggedElement.classList.add("dragging");
            
            // Set drag data
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/html", this.draggedElement.outerHTML);
            
            // Add visual feedback using CSS classes
            this.draggedElement.style.opacity = "0.5";
            this.draggedElement.style.transform = "rotate(2deg)";
        } catch (error) {
            console.error("Drag start failed:", error);
        }
    }

    /**
     * Handle drag end event
     * @param {DragEvent} e - The drag end event
     */
    handleDragEnd(e) {
        try {
            if (this.draggedElement) {
                this.draggedElement.classList.remove("dragging");
                this.draggedElement.style.opacity = "";
                this.draggedElement.style.transform = "";
                this.draggedElement = null;
            }
            
            this.cleanupDragOverStates();
        } catch (error) {
            console.error("Drag end failed:", error);
        }
    }

    /**
     * Handle drag over event
     * @param {DragEvent} e - The drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }

    /**
     * Handle drag enter event
     * @param {DragEvent} e - The drag enter event
     */
    handleDragEnter(e) {
        e.preventDefault();
        const section = e.target.closest(".properties-section");
        if (section && section !== this.draggedElement) {
            this.draggedOverElement = section;
            section.classList.add("drag-over");
        }
    }

    /**
     * Handle drag leave event
     * @param {DragEvent} e - The drag leave event
     */
    handleDragLeave(e) {
        const section = e.target.closest(".properties-section");
        if (section && section !== this.draggedElement) {
            section.classList.remove("drag-over");
        }
    }

    /**
     * Handle drop event
     * @param {DragEvent} e - The drop event
     */
    handleDrop(e) {
        e.preventDefault();
        
        try {
            if (this.draggedElement && this.draggedOverElement && 
                this.draggedElement !== this.draggedOverElement) {
                
                this.reorderSections();
                this.saveSectionOrder();
                this.showSuccessMessage();
            }
            
            this.cleanupDropState();
        } catch (error) {
            console.error("Drop failed:", error);
        }
    }

    /**
     * Reorder sections based on drag and drop
     */
    reorderSections() {
        const container = this.propertiesContent;
        const draggedIndex = Array.from(container.children).indexOf(this.draggedElement);
        const targetIndex = Array.from(container.children).indexOf(this.draggedOverElement);
        
        if (draggedIndex < targetIndex) {
            container.insertBefore(this.draggedElement, this.draggedOverElement.nextSibling);
        } else {
            container.insertBefore(this.draggedElement, this.draggedOverElement);
        }
    }

    /**
     * Save section order to localStorage
     */
    saveSectionOrder() {
        try {
            const sections = Array.from(document.querySelectorAll(".properties-section"));
            const order = sections.map(section => {
                const header = section.querySelector(".section-header");
                return header ? header.textContent.trim() : "";
            }).filter(title => title);
            
            localStorage.setItem("propertiesSectionOrder", JSON.stringify(order));
        } catch (error) {
            console.error("Failed to save section order:", error);
        }
    }

    /**
     * Load saved section order from localStorage
     */
    loadSavedOrder() {
        try {
            const savedOrder = localStorage.getItem("propertiesSectionOrder");
            if (!savedOrder) return;
            
            const order = JSON.parse(savedOrder);
            const sections = Array.from(document.querySelectorAll(".properties-section"));
            const container = this.propertiesContent;
            
            // Create a map of section titles to elements
            const sectionMap = new Map();
            sections.forEach(section => {
                const header = section.querySelector(".section-header");
                if (header) {
                    const title = header.textContent.trim();
                    sectionMap.set(title, section);
                }
            });
            
            // Reorder sections based on saved order
            order.forEach(title => {
                const section = sectionMap.get(title);
                if (section) {
                    container.appendChild(section);
                }
            });
        } catch (error) {
            console.warn("Failed to load properties section order:", error);
        }
    }

    /**
     * Show success message after reordering
     */
    showSuccessMessage() {
        if (typeof setStatusMessage === 'function') {
            setStatusMessage("Properties sections reordered successfully!");
        }
    }

    /**
     * Clean up drag over states
     */
    cleanupDragOverStates() {
        document.querySelectorAll(".properties-section").forEach(section => {
            section.classList.remove("drag-over");
        });
    }

    /**
     * Clean up drop state
     */
    cleanupDropState() {
        this.draggedOverElement = null;
        this.cleanupDragOverStates();
    }

    /**
     * Refresh drag handles (called when DOM updates)
     */
    refreshDragHandles() {
        this.setupDragHandles();
    }

    /**
     * Cleanup method to remove event listeners
     */
    destroy() {
        this.eventListeners.forEach((listeners, section) => {
            Object.entries(listeners).forEach(([event, handler]) => {
                section.removeEventListener(event, handler);
            });
        });
        this.eventListeners.clear();
    }
}

/**
 * Initialize drag and drop functionality for properties sections
 * 
 * @returns {PropertiesSectionDragDropManager} The drag drop manager instance
 */
function initPropertiesSectionDragDrop() {
    return new PropertiesSectionDragDropManager();
}

// Export functions for use in other modules
export { togglePropertiesMenu, openPropertiesMenu, closePropertiesMenu, showImageOverlay, closeImageOverlay };