


// Script para Enterprise Architect - Obtener relaciones con nombres y posiciones en diagrama
function main() {
    // Obtener el diagrama actualmente seleccionado
    var diagram = Repository.GetCurrentDiagram();
    
    if (diagram != null) {
        // Mostrar información del diagrama
        Session.Output("Diagrama: " + diagram.Name + " (ID: " + diagram.DiagramID + ")");
        Session.Output("=============================================");
        
        // Consultar las relaciones en el diagrama usando SQL
        var sqlQuery = 
            "SELECT c.Connector_ID, c.Name as RelationName, c.Connector_Type, " +
            "       d.Object_ID, d.RectLeft, d.RectRight, d.RectTop, d.RectBottom " +
            "FROM t_connector c " +
            "JOIN t_diagramlinks dl ON dl.ConnectorID = c.Connector_ID " +
            "JOIN t_diagramobjects d ON d.Diagram_ID = dl.DiagramID AND " +
            "                         (d.Object_ID = c.Start_Object_ID OR d.Object_ID = c.End_Object_ID) " +
            "WHERE dl.DiagramID = " + diagram.DiagramID + " " +
            "ORDER BY c.Connector_ID, d.Object_ID";
        
        // Ejecutar consulta SQL directamente
        var connectors = {};
        var result = Repository.SQLQuery(sqlQuery);
        
        // Procesar el resultado como texto (alternativa al XML)
        var lines = result.split("\n");
        var headers = [];
        var isData = false;
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            
            if (line.startsWith("<Row>")) {
                isData = true;
                var rowData = {};
                continue;
            }
            
            if (line.startsWith("</Row>")) {
                isData = false;
                
                // Procesar los datos de la fila
                var connectorId = rowData["Connector_ID"];
                
                if (!connectors[connectorId]) {
                    connectors[connectorId] = {
                        name: rowData["RelationName"],
                        type: rowData["Connector_Type"],
                        elements: []
                    };
                }
                
                connectors[connectorId].elements.push({
                    id: rowData["Object_ID"],
                    left: rowData["RectLeft"],
                    right: rowData["RectRight"],
                    top: rowData["RectTop"],
                    bottom: rowData["RectBottom"]
                });
                
                continue;
            }
            
            if (isData) {
                var tagStart = line.indexOf("<") + 1;
                var tagEnd = line.indexOf(">");
                var tagName = line.substring(tagStart, tagEnd);
                
                var valueStart = tagEnd + 1;
                var valueEnd = line.indexOf("</" + tagName + ">");
                var value = line.substring(valueStart, valueEnd);
                
                rowData[tagName] = value;
            }
        }
        
        // Mostrar los resultados
        for (var connectorId in connectors) {
            if (connectors.hasOwnProperty(connectorId)) {
                var connector = connectors[connectorId];
                Session.Output("Relación ID: " + connectorId);
                Session.Output("Nombre: " + (connector.name || "[sin nombre]"));
                Session.Output("Tipo: " + connector.type);
                
                // Mostrar información de posición de los elementos conectados
                for (var j = 0; j < connector.elements.length; j++) {
                    var element = connector.elements[j];
                    Session.Output("  Elemento ID: " + element.id + 
                                  " - Posición: (L:" + element.left + 
                                  ", T:" + element.top + 
                                  ", R:" + element.right + 
                                  ", B:" + element.bottom + ")");
                }
                
                Session.Output("---------------------------------------------");
            }
        }
    } else {
        Session.Output("Por favor, abre un diagrama primero.");
    }
}

main();


