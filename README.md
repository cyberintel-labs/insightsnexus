# Investigating-Project
This local web application will allow the user to manipulate and connect nodes on their screen to streamline information.

# Prerequisites
Users must install sherlock before usage.
You can find it here: https://github.com/sherlock-project/sherlock

# Starting the application
To start the server open command prompt in the main directory and execute the following:
npx tsc
node dist/server.js

# Progress so far
Users should be able to create nodes to their desired locations.
Edit and delete nodes on screen.
Create connections up to 2 nodes at a time.
Save and load their current progress.
Implemented keyboard actions such as delete, undo, and redo.
Implemented sherlock for hunting down social media accounts.

# TODO
Implement a visual indicator that sherlock is running.
Better spread out the sherlock results.
Implement proper unit testing.
Allow the user to create edge labels.
Allow the user to create multiple connections at a time (more than 2).
Allow a way to delete connections.
Allow the user to select from different node and connection designs.
Save and present the users actions in a history tab.
Reorganize code for easier readability.
Redesign the visual aspects of the web application.