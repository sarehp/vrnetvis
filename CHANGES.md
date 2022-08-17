### CHANGES

- Correcciones al código que anima nodo cuando llega/sale mensaje. Dependía de cálculos de posición imprecisos
- Añadido a fichero machineNames.json: hwaddr, ipaddr y máscara, estos dos últimos sin uso por ahora
- Corregido parsing de fichero de machineNames.json: hay que leer en cierto orden para que se pueda hacer matching de direcciones hwaddr a enlaces
- Añadidas constantes para tiempos de animación al principio
- Añadido soporte para ICMP, UDP, TCP, HTTP, DNS
- Corregido comportamiento de hubs: todos los paquetes se envían por todos los enlaces salvo por el de entrada
- Corregido comportamiento de routers: ahora sólo envían solicitud ARP por la interfaz correspondiente
- Modificado unifycaps.py (lo eliminaremos): ahora no elimina paquetes. No es necesario si se hace una captura en cada dominio de broadcast. Mezclamos con mergecap
- Corregida visualización de Datos de TCP (se perdían al pasar por router)
- Modificaciones la info mostrada para cada protocolo
- Se muestra siempre la pila de un paquete
- Cambiados los colores (ver leyenda en index.html)
- Añadidos 2 escenarios: scenario_basico, scenario_traceroute
- Generamos capturas en kathara. Pendiente: marcas de tiempo siguen siendo no globales

