// Initialize Cytoscape
export const cy = cytoscape({
    container: document.getElementById("cy"),
    elements: [],
    style: [
        {
            selector: "node",
            style: {
                "background-color": "#0074D9",
                "label": "data(label)",
                "text-valign": "center",
                "color": "#fff",
                "font-size": "14px",
                "text-outline-color": "#0074D9",
                "text-outline-width": 2
            }
        },
        {
            selector: "node:selected",
            style: {
                "border-width": 4,
                "border-color": "#FF851B",
                "background-color": "#FFDC00",
                "text-outline-color": "#FF851B",
                "text-outline-width": 2
            }
        },
        {
            selector: "edge",
            style: {
                "width": 2,
                "line-color": "#ccc",
                "target-arrow-color": "#ccc",
                "target-arrow-shape": "triangle",
                "curve-style": "bezier"
            }
        }
    ],
    boxSelectionEnabled: true,
    userZoomingEnabled: true,
    userPanningEnabled: true
});