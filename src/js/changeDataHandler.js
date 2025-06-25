import { cy } from "./cytoscapeConfig.js";

const ur = cy.undoRedo();

// Allows the change of data (kind of broken at the momment)
ur.action("changeData",
    // Do function
    function(arg) {
        console.log("Apply edit action");
        const ele = cy.getElementById(arg.id);
        if (ele) ele.data(arg.name, arg.newValue);
    },
    // Undo function
    function(arg) {
        console.log("Apply undo action");
        const ele = cy.getElementById(arg.id);
        if (ele) ele.data(arg.name, arg.oldValue);
    }
);

export { ur };