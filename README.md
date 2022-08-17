# Virtual Reality Network Visualization

- Modificaciones al código del TFG de Ignacio Cruz de la Haza, tutelado
por Jesús M. González Barahona

- Ver CHANGES.md

## Authors

- Eva M. Castro Barbero-
- Pedro de las Heras Quirós

## Instrucciones

1. ```$ ln -f -s scenario_NAME/machineNames.json .```
2. ```$ ln -f -s scenario_NAME/netgui.nkp .```
3. ```$ ln -f -s scenario_NAME/caps.json .```
4. ```ln -f -s scenario_NAME/shared/*.json . ```
Enlazar todos los ficheros listados en caps.json.

Normalmente sólo usamos un fichero que hemos mezclado con mergecap.

5. ```python3 unifycaps.py ```
6. ```python -m SimpleHTTPServer 8888 . ```
7. Cargar en navegador ```localhost:8888```
