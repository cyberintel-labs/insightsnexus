/**
 * Handles uploading and embedding files into a node.
 * Supports images (base64 data URLs) and text files.
 * Data is stored in node.data('images') and node.data('texts').
 */
export function uploadFiles(node, files){
    if(!node) return;

    // Case 1: If no files are passed (context menu), open file picker
    if(!files){
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*,.txt"; // allow images + txt
        input.multiple = true;
        input.onchange = (e) => uploadFiles(node, e.target.files);
        input.click();
        return;
    }

    // Case 2: files exist (properties menu or from picker)
    let images = node.data('images') || [];
    let texts = node.data('texts') || [];

    Array.from(files).forEach((file) => {
        if(file.type.startsWith("image/")){
            if(images.length >= 10){
                alert("Max 10 images per node.");
                return;
            }
            embedImageFile(file, (imageData) => {
                images.push(imageData);
                node.data('images', images);
                node.data('currentImageIndex', images.length - 1);
                node.trigger('filesUpdated'); 
                showCurrentImage(node); // update node’s background
            });
        }else if(file.type === "text/plain"){
            if(texts.length >= 10){
                alert("Max 10 text files per node.");
                return;
            }
            embedTextFile(file, (textData) => {
                texts.push({ name: file.name, content: textData });
                node.data('texts', texts);
                node.trigger('filesUpdated');
            });
        }else{
            alert(`Unsupported file type: ${file.type}`);
        }
    });
}

export function showCurrentImage(node){
    const images = node.data("images") || [];
    const index = node.data("currentImageIndex") ?? 0;

    if (images.length) {
        node.style({
            "background-image": `url(${images[index]})`,
            "background-fit": "cover",
            "background-opacity": 1,
            "width": 128,
            "height": 128,
            "text-valign": "top",
            "text-halign": "center",
            "font-size": 14
        });
    } else {
        node.style({
            "background-image": "none",
            "width": 30,
            "height": 30,
            "text-valign": "center",
            "text-halign": "center"
        });
    }
}

export function nextImage(node) {
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

export function prevImage(node) {
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

/**
 * Reads an image file and converts it to a base64 data URL.
 * Also resizes to a max 512x512px thumbnail for performance.
 */
function embedImageFile(file, callback) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement("canvas");
            const maxDim = 320;
            let { width, height } = img;

            if(width > height){
                if(width > maxDim){
                    height *= maxDim / width;
                    width = maxDim;
                }
            }else{
                if(height > maxDim){
                    width *= maxDim / height;
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            const resizedDataUrl = canvas.toDataURL("image/png");
            callback(resizedDataUrl);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Reads a text file and returns its content as string.
 */
function embedTextFile(file, callback) {
    const reader = new FileReader();
    reader.onload = function (event) {
        callback(event.target.result);
    };
    reader.readAsText(file);
}

/**
 * Removes an image at given index from a node.
 */
export function removeImageFromNode(node, index){
    let images = node.data('images') || [];
    if (index < 0 || index >= images.length) return;

    // Remove selected image
    images.splice(index, 1);

    // Update current index
    let newIndex = Math.max(0, (node.data('currentImageIndex') || 0) - 1);

    node.data('images', images);
    node.data('currentImageIndex', newIndex);

    // Refresh UI + node style
    node.trigger('filesUpdated');
    showCurrentImage(node);
}

/**
 * Removes a text file at given index from a node.
 */
export function removeTextFromNode(node, index) {
    let texts = node.data('texts') || [];
    if(index < 0 || index >= texts.length) return;

    // Remove text file
    texts.splice(index, 1);

    node.data('texts', texts);

    // Refresh UI
    node.trigger('filesUpdated');
}