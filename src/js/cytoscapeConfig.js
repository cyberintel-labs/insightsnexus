/**
 * Cytoscape Graph Configuration
 * 
 * This module configures the Cytoscape.js graph visualization library for the OSINT investigation tool.
 * It defines the visual styling, interaction behavior, and layout settings for nodes and edges.
 * 
 * Key Features:
 * - Custom node styling with labels and colors
 * - Edge styling with arrows and curves
 * - Selection highlighting
 * - Interactive behavior settings
 * - Responsive layout configuration
 */

/**
 * Cytoscape Instance Initialization
 * 
 * Creates and configures the main Cytoscape graph instance with:
 * - Container: HTML element that will hold the graph
 * - Elements: Initial graph data (empty array for new investigations)
 * - Style: Visual appearance rules for nodes and edges
 * - Behavior: Interaction settings for zoom, pan, and selection
 */
export const cy = cytoscape({
    container: document.getElementById("cy"),
    elements: [],
    
    /**
     * Graph Styling Configuration
     * 
     * Defines the visual appearance of graph elements using CSS-like selectors.
     * Each style rule applies to specific element types and states.
     */
    style: [
        {
            /**
             * Default Node Styling
             * 
             * Applies to all nodes in the graph:
             * - Blue background color (#0074D9) for consistency
             * - White text color for contrast
             * - Centered text alignment
             * - 14px font size for readability
             * - Text outline for better visibility
             */
            selector: "node",
            style: {
                "background-color": "#0074D9",
                "label": "data(label)",
                "text-valign": "center",
                "color": "#fff",
                "font-size": "14px",
                "text-outline-color": "#0074D9",
                "text-outline-width": 2,
                "shape": "ellipse"
            }
        },
        {
            /**
             * Selected Node Styling
             * 
             * Applies to nodes when they are selected by the user:
             * - Orange border to indicate selection
             * - Yellow background to stand out
             * - Matching text outline for consistency
             * - 4px border width for clear visibility
             */
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
            /**
             * Edge Styling
             * 
             * Applies to all edges (connections between nodes):
             * - 2px width for clear visibility
             * - Gray color (#ccc) for subtle appearance
             * - Arrow at target end to show direction
             * - Bezier curve style for smooth appearance
             */
            selector: "edge",
            style: {
                "width": 2,
                "line-color": "#ccc",
                "target-arrow-color": "#ccc",
                "target-arrow-shape": "triangle",
                "curve-style": "bezier"
            }
        },
        /**
         * Node type styles
         * 
         * Each node type will have a unique color and shape for accessibility purposes
         *  - The map will map the type, color, and shape of the node in that order
         */
        // (TRYING SOMETHING (DONESNT WORK))
        //  [
        //     ["default", "#0074D9", "ellipse"],
        //     ["person", "#1ABC9C", "round-rectangle"],
        //     ["event", "#9B59B6", "hexagon"],
        //     ["organization", "#E67E22", "rectangle"],
        //     ["username", "#2980B9", "ellipse"],
        //     ["custom", "#2ECC71", "triangle"],
        //     ["address", "#34495E", "diamond"],
        //     ["ip", "#E74C3C", "pentagon"],
        //     ["email", "#8E44AD", "vee"],
        //     ["geo", "#D35400", "octagon"],
        //     ["database", "#7F8C8D", "barrel"]
        // ].map(([type, color, shape]) => ({
        //     selector: `node[type="${type}"]`,
        //     style: {
        //         "background-color": color,
        //         "shape": shape,
        //         "text-outline-color": color,
        //     }
        // }))
        {
            selector: 'node[type="person"]',
            style:{
                "background-color": "#1ABC9C",
                "shape": "star"
            }
        },
        {
            selector: 'node[type="event"]',
            style:{
                "background-color": "#9B59B6",
                "shape": "hexagon"
            }
        },
        {
            selector: 'node[type="organization"]',
            style:{
                "background-color": "#E67E22",
                "shape": "rectangle"
            }
        },
        {
            selector: 'node[type="username"]',
            style:{
                "background-color": "#2980B9",
                "shape": "ellipse"
            }
        },
        {
            selector: 'node[type="custom"]',
            style:{
                "background-color": "#2ECC71",
                "shape": "triangle"
            }
        },
        {
            selector: 'node[type="address"]',
            style:{
                "background-color": "#34495E",
                "shape": "diamond"
            }
        },
        {
            selector: 'node[type="ip"]',
            style:{
                "background-color": "#E74C3C",
                "shape": "pentagon"
            }
        },
        {
            selector: 'node[type="email"]',
            style:{
                "background-color": "#8E44AD",
                "shape": "vee"
            }
        },
        {
            selector: 'node[type="geo"]',
            style:{
                "background-color": "#D35400",
                "shape": "octagon"
            }
        },
        {
            selector: 'node[type="database"]',
            style:{
                "background-color": "#7F8C8D",
                "shape": "barrel"
            }
        }
    ],
    
    /**
     * Interaction Behavior Settings
     * 
     * Controls how users can interact with the graph:
     * 
     * boxSelectionEnabled: false
     * 
     * Box selection is a powerful feature that allows users to select multiple nodes
     * by drawing a rectangular selection box around them. This is particularly valuable
     * in OSINT investigations for several reasons:
     * 
     * Use Cases in OSINT Investigations:
     * - Bulk Operations: Select multiple related entities (people, organizations, locations)
     *   to perform operations like connecting them all to a new central node
     * - Pattern Recognition: Quickly select nodes that form a cluster or pattern
     *   to analyze relationships within that group
     * - Data Export: Select a subset of nodes to export or save for focused analysis
     * - Comparative Analysis: Select nodes from different investigation branches
     *   to compare their properties or relationships
     * - Cleanup Operations: Select multiple nodes to delete or move together
     * 
     * Why Disabled by Default:
     * - Prevents accidental selections when users are trying to pan the graph
     * - Maintains precise control for single-node operations
     * - Reduces visual clutter from unintended selections
     * - Preserves the primary interaction mode for detailed node examination
     * 
     * When Enabled (Shift key):
     * - Users can hold Shift and drag to create a selection box
     * - All nodes within the box are selected simultaneously
     * - Enables bulk operations on multiple nodes at once
     * - Particularly useful for large investigation graphs with many entities
     * 
     * - userZoomingEnabled: if true - Allows zoom in/out with mouse wheel
     * - userPanningEnabled: if true - Allows dragging to pan around the graph
     */
    boxSelectionEnabled: false,
    userZoomingEnabled: false,
    userPanningEnabled: true
});