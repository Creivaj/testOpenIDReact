# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```







/**
 * ALGORITMO PERSONALIZADO PARA LÍNEAS ORTOGONALES
 * 1. Identifica todos los conectores y sus puntos de anclaje
 * 2. Calcula rutas ortogonales evitando superposiciones
 * 3. Aplica las nuevas rutas a los conectores
 */
function customOrthogonalRouting() {
    var repo = Repository;
    var diag = repo.GetCurrentDiagram();
    
    if (!diag) {
        Session.Output("Error: Abre un diagrama primero");
        return;
    }

    // Obtener todos los elementos y conectores del diagrama
    var elements = {};
    var connectors = [];
    var diagObjs = diag.DiagramObjects;
    
    // Paso 1: Mapear elementos y sus posiciones
    for (var i = 0; i < diagObjs.Count; i++) {
        var dObj = diagObjs.GetAt(i);
        var elem = repo.GetElementByID(dObj.ElementID);
        
        if (elem && elem.Type !== "Connector") {
            elements[elem.ElementID] = {
                x: dObj.left + (dObj.right - dObj.left)/2,
                y: dObj.top + (dObj.bottom - dObj.top)/2,
                width: dObj.right - dObj.left,
                height: dObj.bottom - dObj.top
            };
        }
    }

    // Paso 2: Procesar conectores y calcular rutas
    for (var j = 0; j < diagObjs.Count; j++) {
        var dObj = diagObjs.GetAt(j);
        var elem = repo.GetElementByID(dObj.ElementID);
        
        if (elem && elem.Type === "Connector") {
            var conn = repo.GetConnectorByID(elem.ElementID);
            var source = elements[conn.ClientID];
            var target = elements[conn.SupplierID];
            
            if (source && target) {
                // Calcular ruta ortogonal personalizada
                var newPath = calculateOrthogonalPath(source, target, elements);
                
                // Aplicar nueva ruta al conector
                applyCustomPath(conn, newPath);
                connectors.push(conn.ID);
            }
        }
    }

    Session.Output("Proceso completado. Conectores modificados: " + connectors.length);
    repo.ReloadDiagram(diag.DiagramID);
}

/**
 * Calcula ruta ortogonal evitando superposiciones
 */
function calculateOrthogonalPath(source, target, elements) {
    // Algoritmo de ruta ortogonal en 2 pasos (L-shaped)
    var midX = source.x;
    var midY = target.y;
    
    // Evitar colisión con otros elementos
    var bboxPadding = 20;
    
    // Ajustar punto medio si hay colisión
    for (var id in elements) {
        var elem = elements[id];
        if (isBetween(midX, elem.x - elem.width/2 - bboxPadding, elem.x + elem.width/2 + bboxPadding) &&
            isBetween(midY, elem.y - elem.height/2 - bboxPadding, elem.y + elem.height/2 + bboxPadding)) {
            // Desplazar punto medio
            midX = elem.x + elem.width/2 + bboxPadding;
        }
    }
    
    return [
        { x: source.x, y: source.y },   // Punto origen
        { x: midX, y: source.y },       // Primer segmento horizontal
        { x: midX, y: target.y },       // Segmento vertical
        { x: target.x, y: target.y }    // Segmento final horizontal
    ];
}

/**
 * Aplica una ruta personalizada a un conector
 */
function applyCustomPath(connector, pathPoints) {
    var style = "LineStyle=3;RouteStyle=2;";  // Orthogonal
    
    // Construir cadena de puntos de ruta
    var pathData = "";
    for (var i = 0; i < pathPoints.length; i++) {
        pathData += "@" + pathPoints[i].x + "," + pathPoints[i].y + ";";
    }
    
    // Aplicar estilo y ruta
    connector.Style = "Mode=3;";  // Orthogonal
    connector.StyleEx = style + "ManualRoute=1;";
    connector.SetStyle("CustomPath", pathData);
    connector.Update();
}

function isBetween(value, min, max) {
    return value >= min && value <= max;
}

// Ejecutar el algoritmo
customOrthogonalRouting();

