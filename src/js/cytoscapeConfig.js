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
             * Default Node Styling - Glass Morphism Design
             * 
             * Applies to all nodes in the graph with modern glass morphism design:
             * - Glass background with backdrop blur effect
             * - Enhanced shadows and borders for depth
             * - Improved typography and spacing
             * - Smooth transitions and hover effects
             * - Consistent with overall UI glass morphism theme
             */
            selector: "node",
            style: {
                "background-color": "#667eea",
                "label": "data(label)",
                "text-valign": "center",
                "text-halign": "center",
                "color": "#ffffff",
                "font-size": "12px",
                "font-weight": "600",
                "text-outline-color": "#2c3e50",
                "text-outline-width": 2,
                "width": 40,
                "height": 40,
                "shape": "ellipse",
                "border-width": 2,
                "border-color": "rgba(255, 255, 255, 0.3)",
                "shadow-blur": 10,
                "shadow-color": "rgba(0, 0, 0, 0.2)",
                "shadow-offset-x": 2,
                "shadow-offset-y": 4
            }
        },
        {
            /**
             * Selected Node Styling - Glass Morphism Design
             * 
             * Applies to nodes when they are selected by the user:
             * - Enhanced glass morphism effect with stronger backdrop blur
             * - Increased shadow for depth and emphasis
             * - Scale transform for visual feedback
             * - Improved text outline for readability
             * - Consistent with overall glass morphism theme
             */
            selector: "node:selected",
            style: {
                "border-width": 4,
                "border-color": "#667eea",
                "text-outline-width": 4,
                "text-outline-color": "#2c3e50",
                "shadow-blur": 20,
                "shadow-color": "rgba(102, 126, 234, 0.4)",
                "shadow-offset-x": 4,
                "shadow-offset-y": 8,
                "width": 45,
                "height": 45,
                "font-size": "13px",
                "font-weight": "700"
            }
        },
        {
            /**
             * Edge Styling - Modern Design
             * 
             * Applies to all edges (connections between nodes):
             * - Enhanced width and color for better visibility
             * - Modern arrow styling with gradient colors
             * - Smooth bezier curves with improved opacity
             * - Shadow effects for depth
             */
            selector: "edge",
            style: {
                "width": 3,
                "line-color": "#667eea",
                "line-opacity": 0.7,
                "target-arrow-color": "#764ba2",
                "target-arrow-shape": "triangle",
                "target-arrow-width": 8,
                "target-arrow-height": 8,
                "curve-style": "bezier",
                "control-point-step-size": 40,
                "edge-distances": "intersection",
                "loop-direction": "-45deg",
                "loop-sweep": "-90deg"
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
                "shape": "ellipse",
                "border-color": "rgba(255, 255, 255, 0.3)",
                "text-outline-color": "#1ABC9C"
            }
        },
        {
            selector: 'node[type="event"]',
            style:{
                "background-color": "#9B59B6",
                "shape": "ellipse",
                "border-color": "rgba(255, 255, 255, 0.3)",
                "text-outline-color": "#9B59B6"
            }
        },
        {
            selector: 'node[type="organization"]',
            style:{
                "background-color": "#E67E22",
                "shape": "ellipse",
                "border-color": "rgba(255, 255, 255, 0.3)",
                "text-outline-color": "#E67E22"
            }
        },
        {
            selector: 'node[type="username"]',
            style:{
                "background-color": "#2980B9",
                "shape": "ellipse",
                "border-color": "rgba(255, 255, 255, 0.3)",
                "text-outline-color": "#2980B9"
            }
        },
        {
            selector: 'node[type="custom"]',
            style:{
                "background-color": "#2ECC71",
                "shape": "ellipse",
                "border-color": "rgba(255, 255, 255, 0.3)",
                "text-outline-color": "#2ECC71"
            }
        },
        {
            selector: 'node[type="address"]',
            style:{
                "background-color": "#34495E",
                "shape": "ellipse",
                "border-color": "rgba(255, 255, 255, 0.3)",
                "text-outline-color": "#34495E"
            }
        },
        {
            selector: 'node[type="ip"]',
            style:{
                "background-color": "#E74C3C",
                "shape": "ellipse",
                "border-color": "rgba(255, 255, 255, 0.3)",
                "text-outline-color": "#E74C3C"
            }
        },
        {
            selector: 'node[type="email"]',
            style:{
                "background-color": "#8E44AD",
                "shape": "ellipse",
                "border-color": "rgba(255, 255, 255, 0.3)",
                "text-outline-color": "#8E44AD"
            }
        },
        {
            selector: 'node[type="geo"]',
            style:{
                "background-color": "#D35400",
                "shape": "ellipse",
                "border-color": "rgba(255, 255, 255, 0.3)",
                "text-outline-color": "#D35400"
            }
        },
        {
            selector: 'node[type="database"]',
            style:{
                "background-color": "#7F8C8D",
                "shape": "ellipse",
                "border-color": "rgba(255, 255, 255, 0.3)",
                "text-outline-color": "#7F8C8D"
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
    userZoomingEnabled: true,
    userPanningEnabled: true
});