function main() {
    try {
        // Get current diagram
        var diagram = Repository.GetCurrentDiagram();
        if (!diagram) {
            Session.Output("Error: No diagram selected");
            return;
        }

        // Begin transaction
        Repository.BeginTransaction();
        
        // Process all connectors in the diagram
        var processedCount = optimizeConnectorRouting(diagram.DiagramID);
        
        // Commit changes
        Repository.EndTransaction();
        
        // Refresh diagram
        Repository.ReloadDiagram(diagram.DiagramID);
        
        Session.Output("Successfully processed " + processedCount + " connectors");
    } catch (e) {
        Repository.RollbackTransaction();
        Session.Output("Error: " + e.message);
    }
}

function optimizeConnectorRouting(diagramID) {
    // Get all connectors in the diagram with their waypoints
    var connectors = loadDiagramConnectors(diagramID);
    
    // Analyze and optimize routing
    var updatedConnectors = analyzeConnectorPaths(connectors);
    
    // Apply changes to the database
    return applyConnectorUpdates(updatedConnectors);
}

function loadDiagramConnectors(diagramID) {
    var connectors = [];
    
    // Get all connectors visible in this diagram
    var sql = `
        SELECT c.Connector_ID, c.Connector_Type, 
               c.Start_Object_ID, c.End_Object_ID
        FROM t_diagramlinks dl
        JOIN t_connector c ON dl.ConnectorID = c.Connector_ID
        WHERE dl.DiagramID = ${diagramID}
    `;
    
    var result = Repository.SQLQuery(sql);
    var xmlDoc = parseXmlResult(result);
    
    var nodes = xmlDoc.selectNodes("//Row");
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var connectorID = node.selectSingleNode("Connector_ID").text;
        
        connectors.push({
            id: connectorID,
            type: node.selectSingleNode("Connector_Type").text,
            startID: node.selectSingleNode("Start_Object_ID").text,
            endID: node.selectSingleNode("End_Object_ID").text,
            waypoints: loadConnectorWaypoints(connectorID)
        });
    }
    
    return connectors;
}

function loadConnectorWaypoints(connectorID) {
    var waypoints = [];
    
    var sql = `
        SELECT Sequence, XPosition, YPosition, Waypoint
        FROM t_connectorwaypoint
        WHERE ConnectorID = ${connectorID}
        ORDER BY Sequence
    `;
    
    var result = Repository.SQLQuery(sql);
    var xmlDoc = parseXmlResult(result);
    
    var nodes = xmlDoc.selectNodes("//Row");
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        waypoints.push({
            seq: parseInt(node.selectSingleNode("Sequence").text),
            x: parseInt(node.selectSingleNode("XPosition").text),
            y: parseInt(node.selectSingleNode("YPosition").text),
            type: node.selectSingleNode("Waypoint").text
        });
    }
    
    return waypoints;
}

function analyzeConnectorPaths(connectors) {
    // First pass: identify all straight segments
    var allSegments = [];
    
    connectors.forEach(function(connector) {
        connector.segments = [];
        
        for (var i = 1; i < connector.waypoints.length; i++) {
            var wp1 = connector.waypoints[i-1];
            var wp2 = connector.waypoints[i];
            
            if (wp1.x === wp2.x || wp1.y === wp2.y) {
                var segment = {
                    connectorID: connector.id,
                    index: i-1,
                    start: wp1,
                    end: wp2,
                    isHorizontal: (wp1.y === wp2.y)
                };
                
                connector.segments.push(segment);
                allSegments.push(segment);
            }
        }
    });
    
    // Second pass: detect and resolve overlaps
    var updatedConnectors = [];
    
    connectors.forEach(function(connector) {
        var modified = false;
        var newWaypoints = connector.waypoints.slice(); // Clone array
        
        // Process each segment of this connector
        for (var i = connector.segments.length - 1; i >= 0; i--) {
            var segment = connector.segments[i];
            var overlaps = findSegmentOverlaps(segment, allSegments);
            
            if (overlaps.length > 0) {
                // Create alternative path for this segment
                var alternative = createAlternativePath(segment, overlaps);
                
                // Replace the straight segment with the alternative path
                newWaypoints.splice(segment.index + 1, 0, alternative);
                modified = true;
            }
        }
        
        if (modified) {
            // Re-sequence waypoints
            newWaypoints.forEach(function(wp, idx) {
                wp.seq = idx;
            });
            
            updatedConnectors.push({
                id: connector.id,
                waypoints: newWaypoints
            });
        }
    });
    
    return updatedConnectors;
}

function findSegmentOverlaps(segment, allSegments) {
    var overlaps = [];
    var s1 = segment;
    
    allSegments.forEach(function(s2) {
        // Don't compare with self or same connector
        if (s1.connectorID === s2.connectorID) return;
        
        // Only compare parallel segments
        if (s1.isHorizontal !== s2.isHorizontal) return;
        
        if (s1.isHorizontal) {
            // Horizontal segments - check same Y and overlapping X
            if (s1.start.y === s2.start.y && 
                Math.max(s1.start.x, s1.end.x) >= Math.min(s2.start.x, s2.end.x) && 
                Math.min(s1.start.x, s1.end.x) <= Math.max(s2.start.x, s2.end.x)) {
                overlaps.push(s2);
            }
        } else {
            // Vertical segments - check same X and overlapping Y
            if (s1.start.x === s2.start.x && 
                Math.max(s1.start.y, s1.end.y) >= Math.min(s2.start.y, s2.end.y) && 
                Math.min(s1.start.y, s1.end.y) <= Math.max(s2.start.y, s2.end.y)) {
                overlaps.push(s2);
            }
        }
    });
    
    return overlaps;
}

function createAlternativePath(segment, overlaps) {
    var start = segment.start;
    var end = segment.end;
    
    if (segment.isHorizontal) {
        // For horizontal segments, create a vertical offset
        var midX = Math.round((start.x + end.x) / 2);
        var offset = calculateOptimalOffset(overlaps, true);
        
        return {
            x: midX,
            y: start.y + offset,
            seq: start.seq + 0.5,
            type: "L" // Line-to point
        };
    } else {
        // For vertical segments, create a horizontal offset
        var midY = Math.round((start.y + end.y) / 2);
        var offset = calculateOptimalOffset(overlaps, false);
        
        return {
            x: start.x + offset,
            y: midY,
            seq: start.seq + 0.5,
            type: "L" // Line-to point
        };
    }
}

function calculateOptimalOffset(overlaps, isHorizontal) {
    // Simple algorithm: find the smallest offset that doesn't conflict
    var baseOffset = 40; // Default offset in pixels
    var directions = [1, -1, 2, -2]; // Try different directions and magnitudes
    
    for (var i = 0; i < directions.length; i++) {
        var offset = baseOffset * directions[i];
        var valid = true;
        
        // Check if this offset would conflict with any overlaps
        for (var j = 0; j < overlaps.length; j++) {
            var overlap = overlaps[j];
            
            if (isHorizontal) {
                // For horizontal segments, check vertical positions
                if (Math.abs(offset) === Math.abs(overlap.start.y - overlap.end.y)) {
                    valid = false;
                    break;
                }
            } else {
                // For vertical segments, check horizontal positions
                if (Math.abs(offset) === Math.abs(overlap.start.x - overlap.end.x)) {
                    valid = false;
                    break;
                }
            }
        }
        
        if (valid) return offset;
    }
    
    // If no perfect match found, return default offset
    return baseOffset;
}

function applyConnectorUpdates(updatedConnectors) {
    var count = 0;
    
    updatedConnectors.forEach(function(connector) {
        // Delete existing waypoints
        Repository.Execute(`DELETE FROM t_connectorwaypoint WHERE ConnectorID = ${connector.id}`);
        
        // Insert new waypoints
        connector.waypoints.forEach(function(wp) {
            var sql = `
                INSERT INTO t_connectorwaypoint
                (ConnectorID, Sequence, XPosition, YPosition, Waypoint)
                VALUES (${connector.id}, ${wp.seq}, ${wp.x}, ${wp.y}, '${wp.type}')
            `;
            Repository.Execute(sql);
        });
        
        count++;
    });
    
    return count;
}

function parseXmlResult(xmlString) {
    var xmlDoc = new ActiveXObject("MSXML2.DOMDocument.6.0");
    xmlDoc.async = false;
    xmlDoc.loadXML(xmlString);
    return xmlDoc;
}

// Execute the script
main();
