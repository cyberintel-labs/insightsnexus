import { uploadFiles, removeImageFromNode, removeTextFromNode, showCurrentImage } from "./fileUploadHandler.js";

let cy;
let selectedNode = null;

export function initNodePropertiesMenu(cytoscapeInstance){
    cy = cytoscapeInstance;

    const nameInput = document.getElementById("node-name");
    const typeSelect = document.getElementById("node-type-select");
    const imagesContainer = document.getElementById("node-images");
    const textsContainer = document.getElementById("node-texts");
    const uploadImageBtn = document.getElementById("upload-image-btn");
    const uploadTextBtn = document.getElementById("upload-text-btn");
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
        if(typeSelect) typeSelect.value = selectedNode.data("type") || "default";

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

                // This is to highlight selected thumbnail
                if(i === (selectedNode.data("currentImageIndex") || 0)){
                    img.classList.add("thumbnail-selected");
                }

                img.addEventListener("click", () => {
                    selectedNode.data("currentImageIndex", i)
                    showCurrentImage(selectedNode);
                    selectedNode.emit("filesUpdated");
                    updatePropertiesMenu(selectedNode);
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