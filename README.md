
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
        
        var queryResult = Repository.SQLQuery(sqlQuery);
        
        // Procesar el resultado XML
        var xmlDoc = new COMObject("MSXML2.DOMDocument.4.0");
        xmlDoc.async = false;
        xmlDoc.loadXML(queryResult);
        
        if (xmlDoc.parseError.errorCode != 0) {
            Session.Output("Error al parsear XML: " + xmlDoc.parseError.reason);
            return;
        }
        
        var connectors = {};
        var rows = xmlDoc.selectNodes("//Row");
        
        // Organizar los datos por relación
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var connectorId = row.selectSingleNode("Connector_ID").text;
            
            if (!connectors[connectorId]) {
                connectors[connectorId] = {
                    name: row.selectSingleNode("RelationName").text,
                    type: row.selectSingleNode("Connector_Type").text,
                    elements: []
                };
            }
            
            connectors[connectorId].elements.push({
                id: row.selectSingleNode("Object_ID").text,
                left: row.selectSingleNode("RectLeft").text,
                right: row.selectSingleNode("RectRight").text,
                top: row.selectSingleNode("RectTop").text,
                bottom: row.selectSingleNode("RectBottom").text
            });
        }
        
        // Mostrar los resultados
        for (var connectorId in connectors) {
            if (connectors.hasOwnProperty(connectorId)) {
                var connector = connectors[connectorId];
                Session.Output("Relación ID: " + connectorId);
                Session.Output("Nombre: " + connector.name);
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



