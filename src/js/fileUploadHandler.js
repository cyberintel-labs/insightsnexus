import { ur } from "./changeDataHandler.js";

// Check if file is image
function isImageFile(file){
    return file.type.startsWith("image/");
}

// Read file as Data URL (for images) or text
function readFile(file){
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;

        if(isImageFile(file)){
            reader.readAsDataURL(file);
        }else{
            reader.readAsText(file);
        }
    });
}

/**
 * Embed multiple files into a node
 * - Adds images to node.data("images") array
 * - Updates currentImageIndex to display last added image
 */
async function embedFilesInNode(node, file) {
    try{
        if(!file.type.startsWith("image/")){
            alert("Only image files are supported at the moment.");
            return;
        }

        // Keep the original label untouched
        if(!node.data("baseLabel")){
            node.data("baseLabel", node.data("label"));
        }

        const oldBackground = node.style("background-image");
        const content = await readFile(file);

        const img = new Image();
        img.onload = () => {
            const maxSize = 512; // maximum dimension
            let { width, height } = img;

            let resizedDataUrl = content;
            if(width > maxSize || height > maxSize){
                const scale = Math.min(maxSize / width, maxSize / height);
                width *= scale;
                height *= scale;

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resizedDataUrl = canvas.toDataURL(file.type);
            }

            // Add image to node's images array
            const images = node.data("images") || [];
            images.push(resizedDataUrl);
            node.data("images", images);
            node.data("currentImageIndex", images.length - 1);

            // Update display without touching label
            showCurrentImage(node);

            // Undo/redo entry for background change
            ur.do("changeData", {
                id: node.id(),
                name: "background-image",
                oldValue: oldBackground,
                newValue: resizedDataUrl
            });
        };
        img.src = content;

    }catch(err){
        console.error("Failed to embed image into node:", err);
    }
}

/**
 * Display the current image in a node
 * - Updates label to show node name and current image index
 * - Moves text to top center when images exist
 */
function showCurrentImage(node) {
    const images = node.data("images") || [];
    const index = node.data("currentImageIndex") ?? 0;

    const currentName = node.data("label") || "Node";

    if(images.length){
        node.style({
            "background-image": `url(${images[index]})`,
            "background-fit": "contain",
            "background-opacity": 1,
            "width": 128,
            "height": 128,
            "text-valign": "top",
            "text-halign": "center",
            "font-size": 14,
            "label": `${currentName} (${index + 1}/${images.length})`
        });
    }else{
        node.style({
            "background-image": "none",
            "text-valign": "center",
            "text-halign": "center",
            "label": currentName 
        });
    }
}

function nextImage(node) {
    const images = node.data("images");
    if(!images || images.length < 2) return;

    const oldIndex = node.data("currentImageIndex");
    const newIndex = (oldIndex + 1) % images.length;

    ur.do("changeData", {
        id: node.id(),
        name: "currentImageIndex",
        oldValue: oldIndex,
        newValue: newIndex
    });

    showCurrentImage(node);
}

function prevImage(node) {
    const images = node.data("images");
    if(!images || images.length < 2) return;

    const oldIndex = node.data("currentImageIndex");
    const newIndex = (oldIndex - 1 + images.length) % images.length;

    ur.do("changeData", {
        id: node.id(),
        name: "currentImageIndex",
        oldValue: oldIndex,
        newValue: newIndex
    });

    showCurrentImage(node);
}

function deleteCurrentImage(node) {
    const images = [...(node.data("images") || [])];
    if(!images.length) return;

    const oldImages = [...images];
    const index = node.data("currentImageIndex") ?? 0;

    images.splice(index, 1);

    ur.do("changeData", {
        id: node.id(),
        name: "images",
        oldValue: oldImages,
        newValue: images
    });

    // Adjust currentImageIndex
    const newIndex = Math.min(index, images.length - 1);
    ur.do("changeData", {
        id: node.id(),
        name: "currentImageIndex",
        oldValue: index,
        newValue: newIndex
    });

    showCurrentImage(node);
}

/**
 * Context Menu Integration
 * Call these from main.js handleContextAction
 */
function uploadFiles(node) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = true;

    fileInput.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if(!files.length) return;

        const existingImages = node.data("images") || [];
        const remainingSlots = 10 - existingImages.length;
        if(remainingSlots <= 0){
            alert("This node already has 10 images.");
            return;
        }

        const filesToUpload = files.slice(0, remainingSlots);
        for(const file of filesToUpload){
            await embedFilesInNode(node, file);
        }

        if(files.length > remainingSlots){
            alert(`Only ${remainingSlots} images were uploaded. Maximum per node is 10.`);
        }
    };

    fileInput.click();
}

export {
    embedFilesInNode,
    uploadFiles,
    nextImage,
    prevImage,
    deleteCurrentImage,
    showCurrentImage
};
