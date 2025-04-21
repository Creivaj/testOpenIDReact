

/**
 * ALGORITMO MEJORADO PARA LÍNEAS ORTOGONALES
 * Trabaja directamente con los conectores del diagrama
 */
function enforceOrthogonalLines() {
    var repo = Repository;
    var diag = repo.GetCurrentDiagram();
    
    if (!diag) {
        Session.Output("Error: Abre un diagrama primero");
        return;
    }

    // Obtener todos los elementos del diagrama y sus posiciones
    var elementPositions = {};
    var diagObjs = diag.DiagramObjects;
    
    for (var i = 0; i < diagObjs.Count; i++) {
        var dObj = diagObjs.GetAt(i);
        elementPositions[dObj.ElementID] = {
            x: dObj.left + (dObj.right - dObj.left)/2,
            y: dObj.top + (dObj.bottom - dObj.top)/2,
            width: dObj.right - dObj.left,
            height: dObj.bottom - dObj.top
        };
    }

    // Obtener todos los conectores del diagrama
    var connectors = diag.DiagramLinks;
    var modifiedCount = 0;
    
    for (var j = 0; j < connectors.Count; j++) {
        var connector = connectors.GetAt(j);
        var sourceID = connector.ClientID;
        var targetID = connector.SupplierID;
        
        if (elementPositions[sourceID] && elementPositions[targetID]) {
            var source = elementPositions[sourceID];
            var target = elementPositions[targetID];
            
            // Calcular ruta ortogonal optimizada
            var path = calculateOptimalOrthogonalPath(source, target, elementPositions);
            
            // Aplicar la ruta al conector
            applyOrthogonalPath(connector, path);
            modifiedCount++;
        }
    }

    Session.Output("Proceso completado. Conectores modificados: " + modifiedCount);
    repo.ReloadDiagram(diag.DiagramID);
}

/**
 * Calcula la mejor ruta ortogonal evitando elementos
 */
function calculateOptimalOrthogonalPath(source, target, elements) {
    var padding = 15;
    var midX, midY;
    
    // Primera opción: ruta en L (horizontal luego vertical)
    midX = source.x;
    midY = target.y;
    if (!pathCollides(midX, midY, elements, padding)) {
        return [
            { x: source.x, y: source.y },
            { x: midX, y: source.y },
            { x: midX, y: target.y },
            { x: target.x, y: target.y }
        ];
    }
    
    // Segunda opción: ruta en L invertida (vertical luego horizontal)
    midX = target.x;
    midY = source.y;
    if (!pathCollides(midX, midY, elements, padding)) {
        return [
            { x: source.x, y: source.y },
            { x: source.x, y: midY },
            { x: target.x, y: midY },
            { x: target.x, y: target.y }
        ];
    }
    
    // Tercera opción: ruta en Z con punto de giro alternativo
    midX = source.x + (target.x - source.x)/2;
    midY = source.y + (target.y - source.y)/2;
    return [
        { x: source.x, y: source.y },
        { x: midX, y: source.y },
        { x: midX, y: target.y },
        { x: target.x, y: target.y }
    ];
}

/**
 * Verifica si la ruta colisiona con algún elemento
 */
function pathCollides(midX, midY, elements, padding) {
    for (var id in elements) {
        var elem = elements[id];
        if ((isBetween(midX, elem.x - elem.width/2 - padding, elem.x + elem.width/2 + padding) &&
            (isBetween(midY, elem.y - elem.height/2 - padding, elem.y + elem.height/2 + padding))) {
            return true;
        }
    }
    return false;
}

/**
 * Aplica una ruta ortogonal a un conector
 */
function applyOrthogonalPath(connector, path) {
    var style = "LineStyle=3;RouteStyle=2;AvoidSelf=1;";
    var pathData = "";
    
    for (var i = 0; i < path.length; i++) {
        pathData += "@" + Math.round(path[i].x) + "," + Math.round(path[i].y) + ";";
    }
    
    // Aplicar estilo ortogonal con ruta manual
    connector.Style = "Mode=3;";
    connector.StyleEx = style + "ManualRoute=1;";
    connector.SetStyle("CustomPath", pathData);
    connector.Update();
}

function isBetween(value, min, max) {
    return value >= min && value <= max;
}

// Ejecutar el script
enforceOrthogonalLines();


