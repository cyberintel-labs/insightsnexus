# OSINT Investigation Graph Analysis Tool
This local web application allows users to manipulate and connect nodes on their screen to streamline OSINT investigations and information gathering.

# Prerequisites
* Users must install sherlock before usage.
You can find it here: https://github.com/sherlock-project/sherlock
* Users must install feroxbuster to search for endpoints (place exe in main directory.)
You can find it here: https://github.com/epi052/feroxbuster
* Users must install ffuf to search for subdomains (place exe in main directory.)
You can find it here: https://github.com/ffuf/ffuf
* Users must install nmap for port scanning.
You can find it here: https://nmap.org/

# Starting the application
To start the server open command prompt in the main directory and execute the following:
* node dist/server.js

# Testing the application
To start running test files, open command prompt in the main directory and execute either:
* npm test
* npm run test:ui

# Troubleshooting
If you run into access denied permission errors even when using sudo, run the following:
* rm -rf ./node_modules; npm i

# Progress so far
* NEW: Users can add files into nodes (right click -> Upload Files ~OR~ left click and use node menu on right)
* NEW: Implemented domain to ip (right click -> transform -> select Domain to ip)
* NEW: Implemented website to domain (right click -> transform -> select Website to Domain)
* NEW: Implemented domain to subdomain (right click -> transform -> select Domain to Subdomain)
* NEW: Implemented domain to endpoint (right click -> transform -> select Domain to Endpoint)
* Added the ability to change node types: just select the node(s) and change type with the left plus button
* Users should be able to create nodes to their desired locations.
* Edit and delete nodes on screen.
* Shift + left click to create box selection.
* Ctrl + left click to create manual selection.
* Create multiple connections with the c key.
* Ctrl + z = undo / Ctrl + y = redo.
* Allowed a way to delete connections.
* Save and load their current progress.
* Implemented keyboard actions such as delete, undo, and redo.
* Implemented sherlock for hunting down social media accounts.

## Development - How to Add New Transforms Now
Server.ts has been refactored into 4 separate files (externalTools.ts, api.ts, toolDetection.ts, and errorHandler.ts) to follow separation of duties and make the process of debugging easier. Server.ts now acts as an entry point and orchestrator for the entire backend system, bringing together all the modular components (middleware, routes, services) into a cohesive web server that can handle requests and serve the frontend interface.
Now, when creating new transforms - 

### Files to Consider:
1. **src/services/externalTools.ts** - Add new tool execution function following the existing pattern
2. **src/routes/api.ts** - Add new API endpoint with proper validation and error handling
3. **src/js/transforms/** - Create new transform file (e.g., newTransform.js) that calls the API endpoint
4. **src/js/main.js** - Import and register the new transform function
5. **src/index.html** - Add context menu option if needed for the new transform
6. **src/services/toolDetection.ts** - Add tool detection if using a new external command-line tool

### Setup Process for New Transform:
1. Create backend function in **src/services/externalTools.ts** with proper error handling and output parsing
2. Add API endpoint in **src/routes/api.ts** with input validation and consistent response formatting
3. Create frontend transform module in **src/js/transforms/** that makes API calls and handles graph updates
4. Import the transform in **src/js/main.js** and add it to the context menu handler
5. Add menu option in **src/index.html** context menu if the transform should be available via right-click
6. Update tool detection in **src/services/toolDetection.ts** if the transform requires a new external tool


# TODO
* Allow users to create and run their own transforms using python. 
* Integrate more transforms using APIs
* Add a help menu to guide users
* Better spread out the sherlock results.
* Allow the user to create edge labels.
* Allow the user to select from different node and connection designs.
* Save and present the users actions in a history tab.
