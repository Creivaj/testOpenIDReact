function adjustConnectorsToAvoidOverlap() {
    // Get the current diagram
    var diagram as EA.Diagram;
    diagram = Repository.GetCurrentDiagram();
    
    if (diagram != null) {
        // Get all diagram connectors
        var diagramObjects as EA.Collection;
        diagramObjects = diagram.DiagramObjects;
        
        // Create arrays to store connector information
        var connectors = [];
        var connectorElements = [];
        
        // Collect all connector information
        for (var i = 0; i < diagramObjects.Count; i++) {
            var diagramObject as EA.DiagramObject;
            diagramObject = diagramObjects.GetAt(i);
            
            var element as EA.Element;
            element = Repository.GetElementByID(diagramObject.ElementID);
            
            if (element != null && element.Type == "Connector") {
                var connector as EA.Connector;
                connector = Repository.GetConnectorByID(diagramObject.ElementID);
                
                if (connector != null) {
                    connectors.push({
                        id: connector.ConnectorID,
                        diagramObject: diagramObject,
                        points: getConnectorPoints(diagramObject),
                        originalPoints: getConnectorPoints(diagramObject)
                    });
                    connectorElements.push(connector);
                }
            }
        }
        
        // Process connectors to avoid overlaps
        for (var i = 0; i < connectors.length; i++) {
            for (var j = i + 1; j < connectors.length; j++) {
                if (areConnectorsOverlapping(connectors[i], connectors[j])) {
                    adjustConnectorPath(connectors[i], connectors[j]);
                }
            }
        }
        
        // Apply changes to the diagram
        for (var i = 0; i < connectors.length; i++) {
            var diagramObject = connectors[i].diagramObject;
            var newPoints = connectors[i].points;
            
            // Update the connector geometry
            diagramObject.Geometry = updateGeometryPoints(diagramObject.Geometry, newPoints);
            diagramObject.Update();
        }
        
        Repository.ReloadDiagram(diagram.DiagramID);
        Session.Output("Connectors adjusted to avoid overlaps while allowing crossings");
    }
}

function getConnectorPoints(diagramObject) {
    var points = [];
    var geometry = diagramObject.Geometry;
    
    // Parse the geometry string to extract points
    // EA stores geometry in format: "LLX=...;LLY=...;URX=...;URY=...;"
    // and points as: "PLT=...;PLB=...;PRT=...;PRB=...;"
    // This is simplified - actual implementation needs proper parsing
    var parts = geometry.split(';');
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].startsWith("PLT") || parts[i].startsWith("PLB") || 
            parts[i].startsWith("PRT") || parts[i].startsWith("PRB")) {
            var coords = parts[i].substring(4).split(',');
            points.push({
                x: parseInt(coords[0]),
                y: parseInt(coords[1])
            });
        }
    }
    
    return points;
}

function areConnectorsOverlapping(conn1, conn2) {
    // Check if two connectors are overlapping (not just crossing)
    // This is a simplified implementation - you may need a more robust algorithm
    
    // Get bounding boxes for each segment of the connectors
    var segments1 = getConnectorSegments(conn1);
    var segments2 = getConnectorSegments(conn2);
    
    for (var i = 0; i < segments1.length; i++) {
        for (var j = 0; j < segments2.length; j++) {
            if (areSegmentsOverlapping(segments1[i], segments2[j])) {
                return true;
            }
        }
    }
    
    return false;
}

function getConnectorSegments(conn) {
    var segments = [];
    for (var i = 1; i < conn.points.length; i++) {
        segments.push({
            start: conn.points[i-1],
            end: conn.points[i]
        });
    }
    return segments;
}

function areSegmentsOverlapping(seg1, seg2) {
    // Check if two line segments are overlapping (not just intersecting)
    // This is a simplified implementation
    
    // Calculate distance between segments
    // If distance is less than threshold (3 units), consider them overlapping
    var minDistance = 3; // 3 positions of distance as requested
    
    // Calculate distance between two segments (simplified)
    // In a real implementation, you'd need proper geometry calculations
    var dist1 = Math.sqrt(Math.pow(seg1.start.x - seg2.start.x, 2) + Math.pow(seg1.start.y - seg2.start.y, 2));
    var dist2 = Math.sqrt(Math.pow(seg1.end.x - seg2.end.x, 2) + Math.pow(seg1.end.y - seg2.end.y, 2));
    
    return (dist1 < minDistance && dist2 < minDistance);
}

function adjustConnectorPath(conn1, conn2) {
    // Adjust the path of conn1 to avoid overlapping with conn2
    // while maintaining 3 units distance for parallel segments
    
    // This is a simplified approach - a real implementation would need:
    // 1. Detect overlapping segments
    // 2. Calculate new path with offset
    // 3. Ensure new path doesn't create new overlaps
    
    // For demo purposes, we'll just add an offset to some points
    for (var i = 0; i < conn1.points.length; i++) {
        conn1.points[i].x += 10;
        conn1.points[i].y += 10;
    }
}

function updateGeometryPoints(geometry, points) {
    // Update the geometry string with new points
    // This is simplified - actual implementation needs proper geometry string construction
    
    var newGeometry = "";
    var parts = geometry.split(';');
    
    // Rebuild geometry with updated points
    // Note: This is placeholder logic - EA's geometry string format is complex
    for (var i = 0; i < parts.length; i++) {
        if (parts[i] == "") continue;
        
        if (parts[i].startsWith("PLT") && points.length > 0) {
            newGeometry += "PLT=" + points[0].x + "," + points[0].y + ";";
        } else if (parts[i].startsWith("PLB") && points.length > 1) {
            newGeometry += "PLB=" + points[1].x + "," + points[1].y + ";";
        } else if (parts[i].startsWith("PRT") && points.length > 2) {
            newGeometry += "PRT=" + points[2].x + "," + points[2].y + ";";
        } else if (parts[i].startsWith("PRB") && points.length > 3) {
            newGeometry += "PRB=" + points[3].x + "," + points[3].y + ";";
        } else {
            newGeometry += parts[i] + ";";
        }
    }
    
    return newGeometry;
}

// Run the function
adjustConnectorsToAvoidOverlap();
