# Virtual Reality Network Visualization

- Modificaciones al código del TFG de Ignacio Cruz de la Haza, tutelado
por Jesús M. González Barahona

- Ver CHANGES.md

## Authors

- Eva M. Castro Barbero-
- Pedro de las Heras Quirós

## Installed demos

[Demos for Oculus Quest](https://sarehp.github.io/sarehp/vrnetvis/demos)

TBD [Demos for Desktop]() 

## How to launch the code in src

1. ```$ ln -f -s scenario_NAME/machineNames.json .```
2. ```$ ln -f -s scenario_NAME/netgui.nkp .```
3. ```$ ln -f -s scenario_NAME/caps.json .```
4. ```ln -f -s scenario_NAME/shared/*.json . ```
Enlazar todos los ficheros listados en caps.json.

Normalmente sólo usamos un fichero que hemos mezclado con mergecap.

Ver sección Generación de capturas y mezcla

5. ```python3 unifycaps.py ```
6. ```python -m SimpleHTTPServer 8888 . / python3 -m http.server 8888 ```
7. Cargar en navegador ```localhost:8888```

## Generación de capturas y mezcla
1. Arrancamos en kathara el escenario
2. Capturamos en un máquina por dominio de broadcast, minimizando el número total de máquinas en las que capturamos. De este modo reducimos la posibilidad de paquetes desordenados.
3. mergecap de todas las capturas
4. generación de json de la captura fusionada 



