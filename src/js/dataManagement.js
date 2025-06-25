import { cy } from './cytoscapeConfig.js';

// Saves the current graph
export function saveGraph(){
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
export function loadGraph(){
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
export function confirmLoad(){
    const file = document.getElementById("file-picker").value;
    if(!file) return;
    fetch(`/load/${file}`)
        .then(res => res.json())
        .then(data => {
            cy.json(data);
            document.getElementById("status").innerText = `Loaded: ${file}`;
        });
}