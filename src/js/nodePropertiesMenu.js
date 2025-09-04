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

// Export functions for use in other modules
export { togglePropertiesMenu, openPropertiesMenu, closePropertiesMenu, showImageOverlay, closeImageOverlay };