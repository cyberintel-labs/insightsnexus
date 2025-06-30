# Investigating-Project
This local web application will allow the user to manipulate and connect nodes on their screen to streamline information.

# Prerequisites
* Users must install sherlock before usage.
You can find it here: https://github.com/sherlock-project/sherlock

# Starting the application
To start the server open command prompt in the main directory and execute the following:
* npx tsc
* node dist/server.js

# Progress so far
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
* Implement proper unit testing.
* Implement a visual indicator that sherlock is running.
* Better spread out the sherlock results.
* Allow the user to create edge labels.
* Allow the user to select from different node and connection designs.
* Save and present the users actions in a history tab.
* Redesign the visual aspects of the web application.