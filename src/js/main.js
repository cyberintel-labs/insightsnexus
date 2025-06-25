// Import shared logic
import { ur } from "./changeDataHandler.js";
import { cy } from "./cytoscapeConfig.js";
import { runSherlock } from "./transforms/sherlock.js";
import { saveGraph, loadGraph, confirmLoad } from "./dataManagement.js";

// Graph state
let idCounter = 0;
let currentMode = "none";
let selectedNodes = [];
let rightClickedNode = null;

// Mode setter (was created to showcase the current mode to the user, might remake soon)
function setMode(mode){
    currentMode = mode;
    selectedNodes = [];
    document.getElementById("status").innerText = `Mode: ${mode}`;
}

// Hide context menu on click (TODO: allow the user to click anywhere to close menu (you have to click the button again))
cy.on("tap", () => document.getElementById("context-menu").style.display = "none");
document.addEventListener("click", () => document.getElementById("context-menu").style.display = "none");

// On double tap create a node
cy.on("dbltap", (evt) => {
    if(evt.target === cy){
        const name = prompt("Enter node name:");
        if(!name) return;
        const newId = "n" + idCounter++;
        ur.do("add", {
            group: "nodes",
            data: {id: newId, label: name},
            position: evt.position
        });
    }
});

// If connect mode is selected, on single tap connect nodes
cy.on("tap", "node", (evt) => {
    const node = evt.target;
    if(currentMode === "connect"){
        selectedNodes.push(node);
        if(selectedNodes.length === 2){
            const [source, target] = selectedNodes.map(n => n.id());
            if(!cy.edges(`[source="${source}"][target="${target}"]`).length){
                ur.do("add", {
                    group: "edges",
                    data: {
                        id: `e-${source}-${target}-${Date.now()}`,
                        source, target
                    }
                });
            }else{
                alert("Edge already exists.");
            }
            selectedNodes = [];
            setMode("none");
        }
    }
});

// Context menu on right click
cy.on("cxttap", "node", (evt) => {
    rightClickedNode = evt.target;
    const menu = document.getElementById("context-menu");
    menu.style.left = evt.originalEvent.pageX + "px";
    menu.style.top = evt.originalEvent.pageY + "px";
    menu.style.display = "block";
});

// Allows to right click an edge to delete
cy.on("cxttap", "edge", (evt) => {
    console.log("Delete connection?")
    const edge = evt.target;
    if (confirm(`Delete connection from ${edge.source().data("label")} to ${edge.target().data("label")}?`)) {
        ur.do("remove", edge);
    }
    console.log("Connection Deleted")
});

// Handles the action calls
function handleContextAction(action){
    const node = rightClickedNode;
    if(!node) return;

    if(action === "edit"){
        console.log("Inside edit action")
        const newLabel = prompt("Enter new name:", node.data("label"));
        if(newLabel){
            ur.do("changeData", { 
                id: node.id(),
                name: "label",
                oldValue: node.data("label"),
                newValue: newLabel
            });
        }
    }else if(action === "delete"){
        console.log("Delete using menu")
        ur.do("remove", node);
    }else if(action === "sherlock"){
        console.log("Calling sherlock")
        runSherlock(node);
    }else if(action === "connect"){
        console.log("Currently connecting")
        setMode("connect");
    }

    document.getElementById("context-menu").style.display = "none";
}

// Dropdown toggles
function toggleDropdown(id){
    document.querySelectorAll(".dropdown, .sub-dropdown").forEach(el => {
        if(el.id !== id && !el.contains(document.getElementById(id))){
            el.style.display = "none";
        }
    });

    const el = document.getElementById(id);
    if(el){
        el.style.display = el.style.display === "block" ? "none" : "block";
        if(id === "load-dropdown") loadGraph();
    }
}

// Keyboard shortcuts for delete, undo, and redo
document.addEventListener("keydown", function(event){
    const selected = cy.$(":selected");

    if(event.key === "Delete" && selected.length){
        ur.do("remove", selected);
    }
    if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z"){
        event.preventDefault();
        ur.undo();
    }
    if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y"){
        event.preventDefault();
        ur.redo();
    }
});

export { ur, cy };
window.setMode = setMode;
window.saveGraph = saveGraph;
window.loadGraph = loadGraph;
window.confirmLoad = confirmLoad;
window.toggleDropdown = toggleDropdown;
window.handleContextAction = handleContextAction;