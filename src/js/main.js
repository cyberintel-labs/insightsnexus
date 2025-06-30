// Import shared logic
import { ur } from "./changeDataHandler.js";
import { cy } from "./cytoscapeConfig.js";
import { runSherlock } from "./transforms/sherlock.js";
import { saveGraph, loadGraph, confirmLoad } from "./dataManagement.js";

// Graph state
let idCounter = 0;
let currentMode = "none";
let selectedNodes = [];
let orderedSelection = [];
let rightClickedNode = null;
let shiftDown = false;

// Mode setter (was created to showcase the current mode, will remove mode status to the user the further we get into the project)
function setMode(mode){
    currentMode = mode;
    selectedNodes.forEach(n => n.unselect());
    selectedNodes = [];
    document.getElementById("status").innerText = `Mode: ${mode}`;
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

// Should connect the selected nodes based on the order of the list
function connectSelectedInOrder(){
    if(orderedSelection.length < 2) return;

    for(let i = 0; i < orderedSelection.length - 1; i++){
        const source = orderedSelection[i].id();
        const target = orderedSelection[i + 1].id();

        if(cy.edges(`[source="${source}"][target="${target}"]`).length === 0){
            ur.do("add", {
                group: "edges",
                data: {
                    id: `e-${source}-${target}-${Date.now()}`,
                    source,
                    target
                }
            });
        }
    }

    // Optionally reset
    cy.nodes().unselect();
    orderedSelection = [];
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
cy.on("tap", "node", function(evt){
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
cy.on("cxttap", "node", function(evt){
    rightClickedNode = evt.target;
    const menu = document.getElementById("context-menu");
    menu.style.left = evt.originalEvent.pageX + "px";
    menu.style.top = evt.originalEvent.pageY + "px";
    menu.style.display = "block";
});

// Allows to right click an edge to delete
cy.on("cxttap", "edge", function(evt){
    console.log("Delete connection?")
    const edge = evt.target;
    // console.log()
    if(confirm(`Delete connection from ${edge.source().data("label")} to ${edge.target().data("label")}?`)){
        ur.do("remove", edge);
    }
    console.log("Connection Deleted")
});

// Should add selected nodes into the order select list
cy.on("select", "node", function(evt){
    const node = evt.target;
    if(!orderedSelection.includes(node)){
        console.log(`Selected node: ${node}`);
        orderedSelection.push(node);
    }
});

// Should remove selected nodes from the order select list
cy.on("unselect", "node", function(evt){
    const node = evt.target;
    console.log(`Unselected node: ${node}`);
    orderedSelection = orderedSelection.filter(n => n.id() !== node.id());
});

// Should automatically close open dropdown menus when clicking off like modern applications
document.addEventListener("click", function(evt){
    const isDropdown = evt.target.closest(".dropdown, .menu, .sub-dropdown");

    if(!isDropdown){
        document.querySelectorAll(".dropdown, .sub-dropdown").forEach(el => el.style.display = "none");
    }
});

// Should listen to del=delete nodes, ctrl+z=undo, ctrl+y=redo, shift=allow for box selection, c=connect selected nodes
document.addEventListener("keydown", function(evt){
    // if(evt.key === "Escape"){
    //     cy.nodes().unselect();
    //     document.getElementById("context-menu").style.display = "none";
    // }

    const selected = cy.$(":selected");

    if(evt.key === "Delete" && selected.length){
        ur.do("remove", selected);
    }
    if((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === "z"){
        evt.preventDefault();
        ur.undo();
    }
    if((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === "y"){
        evt.preventDefault();
        ur.redo();
    }

    if(evt.key === "Shift" && !shiftDown){
        shiftDown = true;
        cy.boxSelectionEnabled(true);
        cy.userPanningEnabled(false);
        cy.container().style.cursor = "crosshair";
    }

    if(evt.key.toLowerCase() === "c" && orderedSelection.length >= 2){
        connectSelectedInOrder();
    }
});

// Should listen to when the shift key is no longer being held
document.addEventListener("keyup", (evt) => {
    if(evt.key === "Shift"){
        shiftDown = false;
        cy.boxSelectionEnabled(false);
        cy.userPanningEnabled(true);
        cy.container().style.cursor = "default";
    }
});

// Zoom control
document.getElementById("zoom-control").addEventListener("input", function(){
    const zoomLevel = parseFloat(this.value);
    cy.zoom({ level: zoomLevel, renderedPosition: { x: cy.width()/2, y: cy.height()/2 } })

    const percent = Math.round(zoomLevel * 100);
    document.getElementById("zoom-label").innerText = `${percent}%`;
});

export { ur, cy };
window.ur = ur;
window.setMode = setMode;
window.saveGraph = saveGraph;
window.loadGraph = loadGraph;
window.confirmLoad = confirmLoad;
window.toggleDropdown = toggleDropdown;
window.handleContextAction = handleContextAction;