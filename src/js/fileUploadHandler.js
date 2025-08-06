import { ur } from "./changeDataHandler.js";

// Helper: Check if file is image
function isImageFile(file) {
    return file.type.startsWith("image/");
}

// Helper: Read file as Data URL (for images) or text
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;

        if (isImageFile(file)) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    });
}

// Main embed function
async function embedContentInNode(node, file) {
    try {
        const oldLabel = node.data("label");
        const oldBackground = node.style("background-image");

        const content = await readFile(file);

        if (isImageFile(file)) {
            // Set label to filename, display image
            const newBackground = `url(${content})`;

            // Undoable background-image style change
            ur.do("changeData", {
                id: node.id(),
                name: "background-image",
                oldValue: oldBackground,
                newValue: newBackground
            });

            // Apply style immediately (Cytoscape style is separate from data)
            node.style({
                "background-image": newBackground,
                "background-fit": "contain",
                "background-opacity": 1,
                "width": 200,
                "height": 200
            });

        } else {
            // It's text — embed content into label
            const previewText = content.length > 200 ? content.slice(0, 200) + "..." : content;

            ur.do("changeData", {
                id: node.id(),
                name: "label",
                oldValue: oldLabel,
                newValue: previewText
            });
        }
    } catch (err) {
        console.error("Failed to embed content into node:", err);
    }
}

export { embedContentInNode };