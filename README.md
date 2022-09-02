# Virtual Reality Network Visualization

- Based on the [code of Ignacio Cruz de la Haza](https://github.com/nachocru/TFG)

- See CHANGES.md

## Authors

- Eva M. Castro Barbero-
- Pedro de las Heras Quirós

## Installed demos

[Demos](https://sarehp.github.io/vrnetvis/demos)


## How to launch the code in src

1. ```$ ln -f -s scenario_NAME/machineNames.json .```
2. ```$ ln -f -s scenario_NAME/netgui.nkp .```
3. ```$ ln -f -s scenario_NAME/caps.json .```
4. ```ln -f -s scenario_NAME/shared/*.json . ```
Link all files in caps.json.

Usually we use only one capture file obtained by merging with mergecap.

See section Generation of captures and merge

5. ```python3 unifycaps.py ```
6. ```python -m SimpleHTTPServer 8888 . / python3 -m http.server 8888 ```
7. Cargar en navegador ```localhost:8888```

## Generation of captures and merge
1. Launch kathara scenario. Configure clock synchonization with:
```sudo docker run --rm --privileged kathara/quagga hwclock -s```
2. Capture in one interface per broadcast domain, minimizing total number of captures. 
3. mergecap all caps
4. generate json from wireshark



