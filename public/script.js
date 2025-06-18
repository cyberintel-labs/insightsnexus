// TODO: Reorganize contents of this file into different files
// Initialize Cytoscape
let cy = cytoscape({
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

let ur = cy.undoRedo();
let idCounter = 0;
let currentMode = "none";
let selectedNodes = [];
let rightClickedNode = null;

function setMode(mode){
    currentMode = mode;
    selectedNodes = [];
}

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

// Hide context menu on click (I"m not sure if I did this correctly)
cy.on("tap", () => document.getElementById("context-menu").style.display = "none");
document.addEventListener("click", () => document.getElementById("context-menu").style.display = "none");

// Handels the actions for edit, delete, sherlock (connect is in it"s own function for now)
function handleContextAction(action){
    const node = rightClickedNode;
    if(!node) return;

    if(action === "edit"){
        const newLabel = prompt("Enter new name:", node.data("label"));
        if(newLabel) ur.do("changeData", { element: node, name: "label", oldValue: node.data("label"), newValue: newLabel });
    }else if(action === "delete"){
        ur.do("remove", node);
    }else if(action === "sherlock"){
        const username = node.data("label");
        document.getElementById("status").innerText = `Sherlock: Searching "${username}"...`;
        fetch("/sherlock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        })
            .then(res => res.json())
            .then(data => {
                const parentId = node.id();
                let added = false;

                data.services.forEach(service => {
                    const newId = `${service}:${username}`;

                    if(!cy.getElementById(newId).length){
                        const newNode = {
                            group: "nodes",
                            data: {
                                id: newId,
                                label: `${service}: ${username}`
                            },
                            position: {
                                x: node.position("x") + Math.random() * 100 - 50,
                                y: node.position("y") + Math.random() * 100 - 50
                            }
                        };

                        const newEdge = {
                            group: "edges",
                            data: {
                                id: `e-${parentId}-${newId}`,
                                source: parentId,
                                target: newId
                            }
                        };

                        ur.do("add", newNode);
                        ur.do("add", newEdge);
                        added = true;
                    }
                });

                document.getElementById("status").innerText = added
                    ? `Sherlock complete for "${username}"`
                    : `Sherlock complete (no new nodes)`;
            })
            .catch(err => {
                console.error("Sherlock error:", err);
                document.getElementById("status").innerText = `Sherlock failed for "${username}"`;
            });
    }else if(action === "connect"){
        setMode("connect");
    }

    document.getElementById("context-menu").style.display = "none";
}

// Saves the current graph
function saveGraph(){
    const filename = prompt("Enter a filename:");
    if(!filename) return;
    const graphData = cy.json();
    fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, graphData })
    }).then(res => {
        document.getElementById("status").innerText =
            res.ok ? `Saved to "${filename}.json"` : `Failed to save "${filename}.json"`;
    });
}

// Loads the files for the dropdown menu
function loadGraph(){
    fetch("/saves")
        .then(res => res.json())
        .then(files => {
            const picker = document.getElementById("file-picker");
            picker.innerHTML = "";
            files.forEach(file => {
                const opt = document.createElement("option");
                opt.value = file;
                opt.text = file;
                picker.appendChild(opt);
            });
        });
}

// Loads the selected graph from the dropdown menu
function confirmLoad(){
    const file = document.getElementById("file-picker").value;
    if(!file) return;
    fetch(`/load/${file}`)
        .then(res => res.json())
        .then(data => {
            cy.json(data);
            document.getElementById("status").innerText = `Loaded: ${file}`;
        });
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