# Investigating-Project
This local web application will allow the user to manipulate and connect nodes on their screen to streamline information.

# Prerequisites
* Users must install sherlock before usage.
You can find it here: https://github.com/sherlock-project/sherlock
* Users must install feroxbuster to search for endpoints (place exe in main directory.)
You can find it here: https://github.com/epi052/feroxbuster

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
* NEW: Users can add files into nodes, just right click and upload files or use the right menu 
* NEW: Implemented domain to ip, just right click and select the option
* NEW: Implemented website to domain, just right click and select the option
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

# TODO
* Add a help menu to guide users
* Better spread out the sherlock results.
* Allow the user to create edge labels.
* Allow the user to select from different node and connection designs.
* Save and present the users actions in a history tab.
* Redesign the visual aspects of the web application.