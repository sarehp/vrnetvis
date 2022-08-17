### Virtual Reality Network Visualization

- Modificaciones al código del TFG de Ignacio Cruz de la Haza, tutelado
por Jesús M. González Barahona

- Authors: Eva M. Castro Barbero, Pedro de las Heras Quirós

- Ver CHANGES.md

## Instrucciones

1. '''$ ln -s scenario_NAME/machineNames.json .'''
2. '''$ ln -s scenario_NAME/netkit.nkp .'''
3. '''$ ln -s scenario_NAME/caps.json .'''
4. '''ln -s scenario_NAME/shared/*.json '''
	''' Normalmente sólo usamos un fichero que hemos mezclado con mergecap '''
5. '''python3 unifycaps.py'''
6. '''python -m SimpleHTTPServer 9775 .'''
