/* global AFRAME */
if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}


//////////
// GLOBALS
consoles=null

var SHIFT_Y = 2

var viewing_mode = ""

var nodeList = []
var finalConnectionsLinks=[]
var finalPackets = []
var next_packet = 0
var flying = []

var nkp_filename   = null
var elementsScale  = null
var last_packet_id = null  // id of last packet in animation. Set when packets are loaded.

var animationState = "INIT" // INIT, PAUSED, MOVING



var VIEWS=["APPLICATION", "APPLICATION+TRANSPORT", "APPLICATION+TRANSPORT+NETWORK", "ALL"]
var VIEW=""
var PREVIOUS_VIEW=""


// First element in array will be the bottommost option in the view selector
var VIEWS_MENU=""

var TICK = 3000 // 10000
var DURATION = 1500 // 5000
var COLORS = {dns:"goldenrod",
	      http:"gold",
	      dataInfo:"white",
	      data:"white",
	      tcp:"#A9CCE3",
	      udp:"orchid",
	      icmp:"red",
	      ip:"LightGreen", // verde
	      arp:"sandybrown",
	      eth:"khaki"}

//////////




function isEndToEndVIEW() {
    return (VIEW == "APPLICATION" || VIEW == "APPLICATION+TRANSPORT");
}


AFRAME.registerComponent('escena', {
    init: function() {
        // let scene = this.el

	// // Header text
	// let viewText = document.createElement('a-text');
	// viewText.setAttribute('value', "VRNetVis")
	// viewText.setAttribute('scale', '7 7 7');
	// viewText.setAttribute('position', {x: -4, y: 27, z: 21 });
	// viewText.setAttribute("color", "white")	
	// scene.appendChild(viewText)

        // let inmersiveText = document.createElement('a-entity');
        // inmersiveText.setAttribute('html', '#inmersive-mode');
        // inmersiveText.setAttribute('position', { x: -7 , y: 16, z: 30 });
        // inmersiveText.setAttribute('scale', '30 30 30');


        // inmersiveText.setAttribute('look-at', "[camera]");


        // scene.appendChild(inmersiveText);

        // let desktopText = document.createElement('a-entity');
        // desktopText.setAttribute('html', '#web-mode');
        // desktopText.setAttribute('position', { x: 7 , y: 16, z: 30 });
        // desktopText.setAttribute('scale', '30 30 30');
        // desktopText.setAttribute('look-at', "[camera]");
        // scene.appendChild(desktopText);

	
        // let inmersiveElement = document.createElement('a-entity');

        // inmersiveElement.setAttribute('gltf-model', '#inmersive');
        // inmersiveElement.setAttribute('position', '-7 7 30');
        // inmersiveElement.setAttribute('scale', '10 10 10');
        // scene.appendChild(inmersiveElement);
        // inmersiveElement.addEventListener('click', function () {
	//     viewing_mode = "vr"

	//     desktopText.parentNode.removeChild(desktopText);
        //     inmersiveText.parentNode.removeChild(inmersiveText);
        //     desktopElement.parentNode.removeChild(desktopElement);
        //     inmersiveElement.parentNode.removeChild(inmersiveElement);
        //     scene.setAttribute('inmersiveMode', '');

        // });

        // let desktopElement = document.createElement('a-entity');

        // desktopElement.setAttribute('gltf-model', '#desktop');
        // desktopElement.setAttribute('position', '7 6 30');
        // desktopElement.setAttribute('rotation', '0 -90 0');
        // scene.appendChild(desktopElement);
        // desktopElement.addEventListener('click', function () {
	//     viewing_mode = "desktop"

	//     desktopText.parentNode.removeChild(desktopText);
        //     inmersiveText.parentNode.removeChild(inmersiveText);
        //     inmersiveElement.parentNode.removeChild(inmersiveElement);
        //     desktopElement.parentNode.removeChild(desktopElement);

	//     // Remove AR movement-controls
	//     movementControls = document.querySelector('#movementControls')
	//     movementControls.parentNode.removeChild(movementControls)

	//     //Add camera
	//     let camera = document.createElement('a-camera')
	//     camera.setAttribute('position', {x: 25, y: 7, z: 45})
	//     scene.appendChild(camera)

	//     controller = document.querySelector("#controller")
	//     controller.setAttribute('visible', true)

	//     network = document.querySelector("#network")
	//     network.setAttribute('visible', true)

	    
        // });
    }
});


AFRAME.registerComponent('inmersiveMode', {
    init: function() {
        scene = this.el

        let inmersiveElement = document.createElement('a-entity');

        inmersiveElement.setAttribute('gltf-model', '#table');
        inmersiveElement.setAttribute('position', '6 0 3');
        inmersiveElement.setAttribute('scale', '15 10 15');
        inmersiveElement.setAttribute('rotation', '0 -90 0');
        scene.appendChild(inmersiveElement);

        let light = document.createElement('a-entity');

        light.setAttribute('light', {type: 'ambient', color: '#FFF'});
        scene.appendChild(light);

        let ambientLight = document.createElement('a-entity');

        ambientLight.setAttribute('light', {color: '#FFF', intensity: '1.5'});
        ambientLight.setAttribute('position', '0 30 0');
        scene.appendChild(ambientLight);

	
	//	scene.setAttribute('controller', {'look-at': '[camera]', position: {x: -10, y: 16, z: -10 }, scale: "5 5 5", id: "controller", sound: {on: 'click', src: '#playPause', volume: 5}})
	// 	scene.setAttribute('network', {id: 'network', filename: 'netgui.nkp', elementsScale: 4, height: 6, connectionscolor: 'blue'});
	// network = document.querySelector('#network')
	// network.components["network"].update()

    }
});



function showViews()
{
    for (var i=0; i<VIEWS_MENU.length; i++){
	VIEWS_MENU[i].box.setAttribute("visible", "true")
	VIEWS_MENU[i].text.setAttribute("visible", "true")		
    }

}

function hideViews()
{
    for (var i=0; i<VIEWS_MENU.length; i++){
	if (VIEW != VIEWS_MENU[i].view){
	    VIEWS_MENU[i].text.setAttribute("visible", "false")
	    VIEWS_MENU[i].box.setAttribute("visible", "false")
	}
    }
    
}


// Creates a box for each menu option in VIEWS_MENU
function createViewSelector(parent, position) {
    
    for (var i = 0; i < VIEWS_MENU.length; i++) {

        let viewSelectorApp = document.createElement('a-sphere');
	VIEWS_MENU[i].box = viewSelectorApp


	let pos = Object.assign({}, position);
	pos.y += 2*i
        viewSelectorApp.setAttribute('position', pos);	
        viewSelectorApp.setAttribute('color', "gray");
        viewSelectorApp.setAttribute('scale', '1.2 1.2 1.2');
        viewSelectorApp.setAttribute('id', 'viewSelectorApp'+i);
        viewSelectorApp.setAttribute('sound', {on: 'click', src: '#playPause', volume: 5});

        viewSelectorApp.addEventListener('mouseenter', function () {
	    if (animationState !== "INIT")
		return;
	    
	    viewSelectorApp.setAttribute('scale', {x: 1.5, y: 1.5, z: 1.5});
        });
        viewSelectorApp.addEventListener('mouseleave', function () {
	    if (animationState !== "INIT")
		return;
	    viewSelectorApp.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2})
	    viewSelectorApp.setAttribute('rotation', {x: 0, y: 0, z: 0 });
	    
        });


	function eventHandler(newView){
	    if (animationState != "INIT")
		return;
	    
	    PREVIOUS_VIEW=VIEW;
	    VIEW=newView.view;

	    for (var i=0; i<VIEWS_MENU.length; i++){
		VIEWS_MENU[i].box.setAttribute("color", "gray")
		VIEWS_MENU[i].text.setAttribute('color', "gray")
		VIEWS_MENU[i].text.setAttribute('scale', '4 4 4');		
	    }
	    
	    newView.box.setAttribute('color', newView.color);

	    newView.text.setAttribute('color', newView.color);	    
	    newView.text.setAttribute('scale', '5 5 5');


	    scene.removeAttribute("network")
	    // if (viewing_mode == "vr")
	    // 	scene.setAttribute('network', {id: 'network', filename: 'netgui.nkp', elementsScale: 4, height: 6, connectionscolor: 'red'})
	    // else // "desktop"
	    // 	scene.setAttribute('network', {id: 'network', filename: 'netgui.nkp', elementsScale: 1, height: 1, connectionscolor: 'blue'});
	    // network = document.querySelector('#network')
	    // network.components.update()
	    
	}


        viewSelectorApp.addEventListener('click', eventHandler.bind(null, VIEWS_MENU[i]));
	
        parent.appendChild(viewSelectorApp);

	// add text to menu
        let text = document.createElement('a-text');
        text.setAttribute('value', VIEWS_MENU[i].text)
        text.setAttribute('scale', '4 4 4');

	pos = Object.assign({}, position);
	pos.y += 2*i
	pos.x += 2

        text.setAttribute('position', pos)
	text.setAttribute("color", "gray")	
	VIEWS_MENU[i].text = text

	
	parent.appendChild(text)


	// Header text
	let viewText = document.createElement('a-text');
	viewText.setAttribute('value', "Layers")
	viewText.setAttribute('scale', '5 5 5');

	pos = Object.assign({}, position);
	pos.y += 0.2 + 2*VIEWS_MENU.length
	viewText.setAttribute('position', pos)
	viewText.setAttribute("color", "white")	
	parent.appendChild(viewText)
	
	
    }

    // Choose the latest as current view
    if (VIEW==""){
	VIEW = VIEWS_MENU[VIEWS_MENU.length-1].view
        VIEWS_MENU[VIEWS_MENU.length-1].box.setAttribute('color', VIEWS_MENU[VIEWS_MENU.length-1].color);
        VIEWS_MENU[VIEWS_MENU.length-1].text.setAttribute('color', VIEWS_MENU[VIEWS_MENU.length-1].color);
	VIEWS_MENU[VIEWS_MENU.length-1].text.setAttribute('scale', '5 5 5');	
    }

}

AFRAME.registerComponent('network', {
    schema: {
	height: {type: 'number'},
	position: {type: 'vec3'},
        topology: {type: 'string'},
	machineNames: {type: 'string'},
	connectionscolor: {type: 'string', default:'red'},
	elementsScale: {type: 'number', default: 1},
	SHIFT_Y: {type: 'number', default: 2}
    },

    update: function() {
	for (packet of flying)
	    packet.emit("animation-pause", null, false)
	
	for (var i=0; i<finalPackets.length; i++){
	    packet= finalPackets[i].newPacket
            longitud = packet.children.length
	    
            for (var a=0; a < longitud; a++) {
                packet.children[0].remove()
            }
	    if (packet.parentNode)
		packet.parentNode.removeChild(packet);
	}

	deleteNodes(nodeList)
	deleteLinks(finalConnectionsLinks)

	nodeList.length = 0
	finalConnectionsLinks.length = 0

	finalPackets.length = 0
	flying.length = 0

	createNetwork(this.data.topology, this.data.machineNames, this.data.elementsScale)	
    },
    
    init: function() {	
	nodeList.length = 0
	finalConnectionsLinks.length = 0

	finalPackets.length = 0
	flying.length = 0

	// request netgui.nkp
        data = this.data
        scene = this.el
	
	// Store in globals
	nkp_filename  = this.data.topology
	elementsScale = this.data.elementsScale
	machineNamesFile = this.data.machineNames

	createNetwork(this.data.topology, this.data.machineNames, this.data.elementsScale)
    }
});


function eucDistance(a, b) {
    return a
        .map((x, i) => Math.abs( x - b[i] ) ** 2) // square the difference
        .reduce((sum, now) => sum + now) // sum
    ** (1/2)
}

function hex_with_colons_to_ascii(str1)
{
    var hex  = str1.toString();
    var str = '';
    for (var n = 0; n < hex.length; n += 3) {
	str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
}


function dns_info (packetParams)
{
    color = getColor("dns")
    let h1 ='<h1 style="padding: 0rem ; font-size: 1.4rem; font-weight: 900; ' +
        'font-family: monospace; text-align: left; color: ' + color + '">'
    let h2 ='<h2 style="padding: 0rem ; font-size: 1.2rem; font-weight: 800; ' +
        'font-family: monospace; text-align: left; color: ' + color + '">'
    let h3 ='<h3 style="padding: 0rem ; font-size: 1rem; font-weight: 700; ' + 
        'font-family: monospace; text-align: left; color: ' + color+ '">'

    info = h1 +  'Nivel DNS' + ' </h1> <br>'

    // It's a pure query
    if (packetParams.dns["dns.count.add_rr"] == 0 && packetParams.dns["dns.count.answers"] == 0){
        query_type=""

        if (packetParams.dns["dns.flags_tree"]["dns.flags.recdesired"] == "0")
            query_type= "(iterative)"
        else
            query_type= "(recursive)"

	info += h2 + 'Queries ' +  query_type + ': </h2><br>'

	for (const [key, value] of Object.entries(packetParams.dns.Queries))
	    info += h3 + 'Query: ' + key + ' </h3> <br>';
    }
    

    if (packetParams.dns["dns.count.answers"] != 0){
	info += h2 + 'Answers: <h2> <br>'	
	for (const [key, value] of Object.entries(packetParams.dns["Answers"]))
    	    info += h3 + key + '</h3><br>';
    }

    if (packetParams.dns["dns.count.add_rr"] != 0){
	
	info += h2 + 'Authoritative nameservers: </h2><br>'	
	for (const [key, value] of Object.entries(packetParams.dns["Authoritative nameservers"]))
    	    info += h3 + key + ' </h3><br>';
	
	info += h2 + 'Additional records: </h2><br>'		
	for (const [key, value] of Object.entries(packetParams.dns["Additional records"]))
            info += h3 + key + '</h3>';
    }
    return info;
}




function getColor(protocol){
    return COLORS[protocol];
}


function showRoutingTable(newInfoText, newBox){
    newInfoText.removeAttribute('html');

    var textTemplate = document.getElementById(newBox.id + '-template');
    
    newInfoText.setAttribute('html', '#' + newBox.id +  "routing_table" + '-template');

    newInfoText.setAttribute('visible', true);

    newBox.removeAttribute('sound');
    newBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
}




function showARPCacheInfoText(newInfoText, arpCache){
    var infotext = formatARPCache(arpCache)


    newInfoText.removeAttribute('html');

    var textTemplate = document.getElementById(newInfoText.id + '-template');
    
    textTemplate.innerHTML = infotext

    textTemplate.style = "display: inline-block; background: #5f6a76; color: white; border-radius: 1em; padding: 1em; margin:0;"
    newInfoText.setAttribute('html', '#' + newInfoText.id + '-template');
    newInfoText.setAttribute('visible', true);
}




function showInfoText(protocol, packetParams, newInfoText, newBox, noEth=false){

    let infoText = ""
    color = getColor(protocol)
    let h1 ='<h1 style="padding: 0rem; font-size: 1.4rem; font-weight: 900; ' +
        'font-family: monospace; text-align: left; color: ' + color + '">'
    let h2 ='<h2 style="padding: 0rem; font-size: 1.2rem; font-weight: 800; ' + 
        'font-family: monospace; text-align: left; color: ' + color + '">'
    let h3 ='<h3 style="padding: 0rem; font-size: 1rem; font-weight: 700; ' +
        'font-family: monospace;  text-align: left; color: ' + color+ '">'

    switch (protocol){
    case 'dns':
	infoText += dns_info(packetParams);
	break;

    case 'http':
	infoText += h2 + ' Nivel HTTP:</h2>' 
	break;

    case 'dataInfo':
	infoText += h2 + 
            'DATOS:</h2><br>' + h3 + 
            'Info datos: '        + hex_with_colons_to_ascii(packetParams.tcp['tcp.payload']) + '<br>' +
            'Longitud de datos: ' + packetParams.tcp['tcp.len']                               + '</h3>'
	break;

    case 'data':
	if (packetParams.tcp != null)
	    infoText += h2 +
            'DATOS:</h2><br>' + h3 + 
            'Info datos: ' + hex_with_colons_to_ascii(packetParams.tcp['tcp.payload']) + '<br>' + 
            'Longitud de datos: ' + packetParams.tcp['tcp.len']                        + '<br></h3>'
	else if (packetParams.udp != null)
	    infoText += h2 + 
            'DATOS:</h2><br>' + h3 + 
            'Info datos: '        + hex_with_colons_to_ascii(packetParams.data) + '<br>' +  
            'Longitud de datos: ' + packetParams.udp['udp.length']              + '</h3>'
	break;

    case 'tcp':
	infoText +=  h2 + 
            'Nivel TCP:</h2><br>' + h3 + 
            'Puerto origen: '  + packetParams.tcp['tcp.srcport'] + '<br>' + 
            'Puerto destino: ' + packetParams.tcp['tcp.dstport'] + '<br>'

        let tcp_flags_str =""

        if (packetParams.tcp["tcp.flags_tree"]["tcp.flags.syn"] == "1")
            tcp_flags_str += "SYN "
        if (packetParams.tcp["tcp.flags_tree"]["tcp.flags.fin"] == "1")
            tcp_flags += "FIN "
        if (packetParams.tcp["tcp.flags_tree"]["tcp.flags.ack"] == "1")
            tcp_flags_str += "ACK "
        if (packetParams.tcp["tcp.flags_tree"]["tcp.flags.reset"] == "1")
            tcp_flags_str += "RST "
        if (packetParams.tcp["tcp.flags_tree"]["tcp.flags.push"] == "1")
            tcp_flags_str += "PSH "

        infoText += 'Flags: ' + tcp_flags_str + '<br>'
        infoText += 'Seq: ' +  packetParams.tcp['tcp.seq'] + '<br>' +
            'Ack: ' +  packetParams.tcp['tcp.ack'] + '<br>' +
            'Window Size: ' +  packetParams.tcp['tcp.window_size'] + '</h3>' 
	break;

    case 'udp':
	infoText += h2 + 
            'Nivel UDP:</h2>' + h3 + 
            'Puerto origen: '  + packetParams.udp['udp.srcport'] + '<br>' + 
            'Puerto destino: ' + packetParams.udp['udp.dstport'] + '</h3>'
	break;

    case 'icmp':
	infoText += h2 + 
            'Nivel ICMP:</h2>' + h3 + 
            'Type: ' + packetParams.icmp['icmp.type'] + '<br>' +  
            'Code: ' + packetParams.icmp['icmp.code'] + '</h3>'
	break;

    case 'ip':
	infoText += h2 + 
            'Nivel IP:</h2>' + h3 +
            'Origen: '  + packetParams.ip['ip.src']  + '<br>' + 
            'Destino: ' + packetParams.ip['ip.dst']  + '<br>' + 
            'TTL: '     + packetParams.ip['ip.ttl']  + '</h3>'
	break;

    case 'arp': 
        operation=""


        if (packetParams.arp['arp.opcode'] == "1")
            operation="Solicitud"
        else
            operation="Respuesta"

	infoText += h2 + 
            'Nivel ARP:</h2>' + h3 + 
            'Origen: '    + packetParams.arp['arp.src.hw_mac']     + '<br>' + 
            'Destino: '   + packetParams.arp['arp.dst.hw_mac']     + '<br>' +  
            'Operación: ' + operation                              + '<br>' +
            'Target: '    + packetParams.arp['arp.dst.proto_ipv4'] + '</h3>'
	break;

    case 'eth':
	if (noEth){
	    ethDst = ""
	}
	else
	    ethDst = packetParams.eth['eth.dst'] 
	infoText += h2 + 
            'Nivel Ethernet:</h2>' + h3 +
            'Origen: '  + packetParams.eth['eth.src']  + '<br>' +  
            'Destino: ' + ethDst + '<br>' +
            'Tipo: '    + packetParams.eth['eth.type'] + '</h3>'
	break;

    }
    
    
    newInfoText.setAttribute('visible', true);
    newInfoText.removeAttribute('html');
    var textTemplate = document.getElementById(packetParams.id + '-template');

    textTemplate.innerHTML = infoText

    textTemplate.style = "display: inline-block; background: #5f6a76; color: purple; border-radius: 0.5em; padding: 0.5em; margin:0;"
    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
    newInfoText.setAttribute('visible', true);
    newBox.removeAttribute('sound');
    newBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});

}


AFRAME.registerComponent('packet', {
    schema: {
        from: {default: null},
        to: {default: null},
        xPosition: {type: 'number', default: 0},
        yPosition: {type: 'number', default: 0},
	SHIFT_Y: {type: 'number', default: 2},
        zPosition: {type: 'number', default: 0},
        toXPosition: {type: 'string', default: ''},
        toYPosition: {type: 'string', default: ''},
        toZPosition: {type: 'string', default: ''},
        duration: {type: 'number', default: 0},
        elementsScale: {type: 'number', default: 0},
        id: {type: 'number', default: 0},
        class:{type: 'string'},
        start:{type: 'number', default: 0},
        ip:{default: null},
        eth:{default: null},
        arp:{default: null},
        dataInfo:{default: null},
        data:{default: null},	
        tcp:{default: null},
        udp:{default: null},
        dns:{default: null},
        icmp:{default: null},		
    },

    createAnimation: function () {
        let packet = this.el
        let packetParams = this.data

        packet.setAttribute('id', packetParams.id);
	
	// The sphere in the link representing a packet
	let sphere = document.createElement('a-sphere');
        sphere.setAttribute('id', 'sphere'+packet.id)
        sphere.setAttribute('geometry', {primitive: 'sphere',  radius: 0.1/packetParams.elementsScale });
        sphere.setAttribute('visible', false)
	packet.appendChild(sphere)

	
        let isClosedInfo = false


        var htmltemplates = document.getElementById("htmltemplates");
        var newSectionTemplate = document.createElement("section");
        newSectionTemplate.style = "display: inline-block; background: #EEEEEE; color: purple; border-radius: 1em; padding: 0em; margin:0;"
        newSectionTemplate.id = packetParams.id + '-template'
        htmltemplates.appendChild(newSectionTemplate);


	let newInfoText = document.createElement('a-entity');
        
	//        newInfoText.setAttribute('position', { x: 3.5 , y: packetParams.yPosition + packetParams.SHIFT_Y, z: 0 });
        newInfoText.setAttribute('position', { x: 3.5 , y: packetParams.yPosition + 0.5 * packetParams.SHIFT_Y, z: 0 });	
        newInfoText.setAttribute('look-at', "[camera]");
        newInfoText.setAttribute('visible', false);
        newInfoText.setAttribute('scale', {x: 20, y: 20, z: 20});
        newInfoText.setAttribute('isPoster', true); 

	newInfoText.setAttribute('id', "infotext" + packet.id)

        packet.appendChild(newInfoText)

	let actualInfoShown = ''
	protocols = ["eth", "ip", "arp", "icmp", "tcp", "udp", "http", "dns", "dataInfo", "data"]
        let levels = []

	level_index = 0
	for (const protocol of protocols){

	    if (!packetParams[protocol])
		continue

	    let level = {
                "protocol": protocol,
	    }

	    hop_by_hop_protocols = ["eth", "arp", "ip"]

	    if (hop_by_hop_protocols.includes(level.protocol) && isEndToEndVIEW())
		continue
	    
            let newBox = document.createElement('a-box');
	    newBox.setAttribute('animation__blink', {property: 'scale', from: {x: 0.5*packetParams.elementsScale, y: 0.5*packetParams.elementsScale, z: 0.5*packetParams.elementsScale}, to: {x: packetParams.elementsScale, y: packetParams.elementsScale, z: packetParams.elementsScale}, dur: '400', easing: 'easeInOutQuint', "loop": "4", startEvents: "blink", resumeEvents:'animation-resume', pauseEvents:'animation-pause', enabled: 'false'})

	    
	    newBox.setAttribute('animation__fadeout', {property:'material.opacity', to:0, dur:500, resumeEvents:'animation-resume', pauseEvents:'animation-pause', startEvents: "fadeout", enabled: 'false'})

	    newBox.setAttribute('animation__fadein', {property:'material.opacity', to:1, dur:500, resumeEvents:'animation-resume', pauseEvents:'animation-pause', startEvents: "fadein", enabled: 'false'})
	    
	    
	    newBox.setAttribute('id', level.protocol + "Box" + packetParams.id);

	    
	    newBox.setAttribute('position', { x: 0, y:  packetParams.SHIFT_Y + (level_index), z: 0 });
            newBox.setAttribute('color', getColor(level.protocol));
            newBox.setAttribute('visible', false); 


	    packet.appendChild(newBox)


            newBox.addEventListener('mouseenter', function () {
                newBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
            });
            newBox.addEventListener('mouseleave', function () {
                newBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                newBox.removeAttribute('animation');
                newBox.setAttribute('rotation', {x: 0, y: 0, z: 0 });
            });


	    newBox.addEventListener('click', function () {
                if(isClosedInfo == false && actualInfoShown == level.protocol){
		    isClosedInfo = true
                    actualInfoShown = ''
                    newInfoText.setAttribute('visible', false);
                    newBox.removeAttribute('sound');
                    newInfoText.removeAttribute('html');
                    newBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                }else{
                    isClosedInfo = false
		    actualInfoShown = level.protocol
		    showInfoText(level.protocol, packetParams, newInfoText, newBox);
                }
		
            });

	    level_index += 1
	    level["box"] = newBox
	    
	    levels.push(level)
	}

        packet = Object.assign(packet, {"levels": levels});
	

	let bottommost_protocol = levels[0]["protocol"]	
	let packetColor = getColor(bottommost_protocol);

        packet.setAttribute('material', 'color', packetColor);
        packet.setAttribute('position', { x: packetParams.xPosition, y: packetParams.yPosition, z: packetParams.zPosition });
        packet.setAttribute('class', packetParams.class);
        packet.setAttribute('sound', {src: '#packetIn', volume: 5, autoplay: "true"});

	packet.setAttribute('animation__fadeout', {property:'material.opacity', to:0, dur:1500, resumeEvents:'animation-resume', pauseEvents:'animation-pause', startEvents: "fadeout", enabled: 'false'})
	packet.setAttribute('animation__hide', {property:'material.opacity', to:0, dur:0, resumeEvents:'animation-resume', pauseEvents:'animation-pause', startEvents: "hide", enabled: 'false'})
	packet.setAttribute('animation__show', {property:'material.opacity', to:1, dur:0, resumeEvents:'animation-resume', pauseEvents:'animation-pause', startEvents: "show", enabled: 'false'})
	

        packet.setAttribute('animation__park', {
            property: 'position',
	    to: {x: packetParams.xPosition, y: packetParams.yPosition + 3.5*packetParams.SHIFT_Y, z: packetParams.zPosition},
            dur: packetParams.duration,
            pauseEvents:'animation-pause', 
            resumeEvents:'animation-resume',
	    startEvents: "park",
            easing: 'linear',
	    enabled: 'false' // if not false, when resumed it starts. A bug.	    	    
        });

        packet.setAttribute('animation__unpark', {
            property: 'position',
	    to: {x: packetParams.xPosition, y: packetParams.yPosition, z: packetParams.zPosition},
            dur: packetParams.duration,
            pauseEvents:'animation-pause', 
            resumeEvents:'animation-resume',
	    startEvents: "unpark",
            easing: 'linear',
	    enabled: 'false' // if not false, when resumed it starts. A bug.	    	    
        });
	
        packet.setAttribute('animation__out_of_node', {
            property: 'scale',
            from: {x: 0.5*packetParams.elementsScale, y: 0.5*packetParams.elementsScale, z: 0.5*packetParams.elementsScale},
	    to: "2 2 2",
            dur: 0,
            pauseEvents:'animation-pause', 
            resumeEvents:'animation-resume',
	    startEvents: "out_of_node",
            easing: 'linear',
	    enabled: 'false' // if not false, when resumed it starts. A bug.	    
        });

        packet.setAttribute('animation__out_of_node_immediate', {
            property: 'scale',
            from: {x: 0.5*packetParams.elementsScale, y: 0.5*packetParams.elementsScale, z: 0.5*packetParams.elementsScale},
	    to: "2 2 2",
            dur: 0,
            pauseEvents:'animation-pause', 
            resumeEvents:'animation-resume',
	    startEvents: "out_of_node_immediate",
            easing: 'linear',
	    enabled: 'false' // if not false, when resumed it starts. A bug.	    
        });

	

        packet.setAttribute('animation__link', {
            property: 'position',
	    to: {"x": packetParams.toXPosition, "y": packetParams.toYPosition, "z": packetParams.toZPosition},
            dur: packetParams.duration,
            easing: 'easeInOutCubic',
	    startEvents: "link",
            pauseEvents:'animation-pause', 
            resumeEvents:'animation-resume',
	    enabled: 'false' // if not false, when resumed it starts. A bug.
        });
	
        packet.setAttribute('animation__into_node', {
            property: 'position',
	    to: {"x": packetParams.toXPosition, "y": packetParams.toYPosition, "z": packetParams.toZPosition},
            dur: packetParams.duration,
            easing: 'linear',
	    startEvents: "into_node",
            pauseEvents:'animation-pause', 
            resumeEvents:'animation-resume',
	    enabled: 'false' // if not false, when resumed it starts. A bug.
        });
	
        packet.setAttribute('animation__route', {
            property: 'position',
	    to: pointInSegment (
		{"x": packetParams.xPosition,  "y": packetParams.yPosition,  "z": packetParams.zPosition},
		{"x": packetParams.toXPosition, "y": packetParams.toYPosition, "z": packetParams.toZPosition},
		data.elementsScale,
		0.1
	    ),
            dur: packetParams.duration,
            easing: 'easeInOutCubic',
	    startEvents: "route",
            pauseEvents:'animation-pause', 
            resumeEvents:'animation-resume',
	    enabled: 'false' // if not false, when resumed it starts. A bug.
        });
    },
    
    // returns promise
    animate_birth: function(packetParams, packet, noEth=false){
	let nodeName = packetParams.from
	node = nodeList.find(o => o.name === nodeName)

        var nodeFromAnimation = document.getElementById(nodeName);


	var promise = Promise.resolve()
	
	if (nodeName.startsWith("pc") && node.console)
	    promise = this.check_console("sending", node, packetParams)
	

	if (packetParams.from.startsWith('hub')){
	    packet.setAttribute('visible', true)
	    
	    for (var i = packet.levels.length-1; i >= 0; i--){
		let box = packet.levels[i]["box"]
		box.setAttribute('visible', true)
	    }
	    
	    packet.setAttribute("animation__out_of_node_immediate", {enabled: 'true'})
	    promise = promise
		.then(() => anime(packet, 'out_of_node_immediate'))
	}
	else{ // not hub
	    promise=promise
 		.then(() => packet.setAttribute("animation__out_of_node", {enabled: 'true'}))
		.then(() =>	anime(packet, 'out_of_node'))

	    
	    // Show level boxes from top to bottom
	    for (var i = packet.levels.length-1; i >= 0; i--){
		let box = packet.levels[i]["box"]
		
		box.setAttribute('visible', false)

		// if noEth => this is an IP datagram and the hwaddr of
		// net how is not known, so don't show eth bo
		if (noEth && packet.levels[i]["protocol"] == "eth")
		    box.setAttribute('opacity', 0.4)


		if (packetParams.ip
		    && ! node.ipaddr.includes(packetParams.ip["ip.src"])		
		    && ! node.ipaddr.includes(packetParams.ip["ip.dst"])
		    && packet.levels[i]["protocol"]!= "eth"
		    && packet.levels[i]["protocol"]!= "ip")
		{   // it's an ip datagram being routed => dont create
		    // levels above ip, just draw them. ip is blinked to
		    // signify TTL modified
	 	    box.setAttribute("visible", true)
		}
		else
		{
		    let protocol = packet.levels[i]["protocol"]

		    if (packetParams.ip && protocol == "eth"){
			var newNodeElement = document.querySelector("#" + node.name)
			promise = promise
			    .then(() => showRoutingTable(node.routingTableText, newNodeElement))
			    .then(() => packet.setAttribute("animation__route", {enabled: 'true'}))
			    .then(() => anime(packet, 'route'))
			    .then(() => wait(1000))
			    .then(() => node.routingTableText.setAttribute('visible', false))
			    .then(() => showARPCacheInfoText(node.ARPCacheInfoText, node.ARPCache))
			    .then(() => wait(3000))
			    .then(() => node.ARPCacheInfoText.setAttribute('visible', false))
		    }
		    
		    promise = promise
	 		.then(() => box.setAttribute("visible", true))
	 		.then(() => box.setAttribute("animation__blink", {enabled: 'true'}))
			.then(() => {
			    newInfoText = packet.querySelector("#infotext" + packet.id)
			    showInfoText(protocol, packetParams, newInfoText, box, noEth)
			})
	 		.then(() => anime(box, 'blink'))
			.then(() => wait(500))
		}

		
	    }
	}
	

	return promise
    },

    console: function(nodeName, packetParams, sending_or_receiving){
	var node = nodeList.find(o => o.name === nodeName)               
	
	
	text = ""
	for (e of node.console[sending_or_receiving])
	{
	    pass = true;
	    for (c of e["conditions"]){
		pass = (pass
			&& packetParams[c.protocol] 			
			&& packetParams[c.protocol][c.protocol+"."+c.field] == c.value)
	    }

	    if (! pass){
		console.log("!pass")
		continue
	    }
	    else{
		console.log("pass")
		for (var i = 0; i < e.actions.length ; i++){
		    protocol = e.actions[i]["protocol"]
		    field = e.actions[i]["field"]		    
		    if (protocol == "null"
			&& field == "null")
			text += e.actions[i]["value"] + "\n"
		    else
			text += packetParams[protocol][protocol+"."+field] + "\n"
		    
		}
	    }
	}
	
	
	return text
		
    },
    
    animate_packet_arrives: function (nodeAnimation, packetParams, packet){
	let nodeName = packetParams.to
	var node = nodeList.find(o => o.name === nodeName)
	
        console.log("packet arrived at node " + nodeName)


	let promise = Promise.resolve()
	
	let receivingARPResponse = function(packet){
	    // to be called when an arp response is received:
	    // add in the receiver's ARPCache the eth_src
	    let eth_dst = packet.eth["eth.dst"]
	    let eth_src = packet.eth["eth.src"]

	    if (packet["arp"]
		&& packet["arp"]["arp.opcode"] == "2") // ARP request
	    {		
		var connectionLink = finalConnectionsLinks.find(o => o.hwaddr.includes(eth_dst))
		var node = nodeList.find(o => o.name === connectionLink.from)               
		var i = connectionLink.hwaddr.findIndex(o => o == eth_dst)

		var ipaddr = packet["arp"]["arp.src.proto_ipv4"]
		
		node.ARPCache[ipaddr]={"iface": "eth"+i, "hwaddr": eth_src}

	    }
	}

	
	var node = nodeList.find(o => o.name === nodeName)
	
	let frameIsForMe = function(packetParams){
	    
	    // every bcast is for me
	    if (packetParams.eth["eth.dst"] == "ff:ff:ff:ff:ff:ff")
		return true

	    // unicast eth frames are for me only if its destination is
	    // one of my hwaddrs

	    if (node.hwaddr.includes(packetParams.eth["eth.dst"]))
		return true

	    return false
	}



	
	if((nodeName.startsWith('pc') || nodeName.startsWith('dns') || nodeName.startsWith('r'))
	   && VIEW=="ALL"){

	    if (! frameIsForMe(packetParams)){
		console.log(nodeName + " is not for me")

		let fadeoutChildren = function(packet){
		    var promises = []
		    for (const child of packet.children) {
			child.setAttribute('animation__fadeout', {enabled: 'true'})

			promises.push(anime(child, 'fadeout'))
		    }
		    return promises
		}
		
		// fadeout packet and children and then destroy packet
		packet.setAttribute('animation__fadeout', {enabled: 'true'})

		console.log("1 Promise.all " + nodeName)
		var promises = fadeoutChildren(packet)

		anime(packet, 'fadeout')
		    .then(() => {console.log("1 finish_packet" + nodeName)
				 finish_packet(packet, packetParams)
				})
		
		
		return	    
	    }
	    
	    
	    // Frame is for us => consume layers from bottom to top
	    promise = Promise.resolve()
	    promise = promise
		.then(() => wait(500))
	    
	    for (var i = 0; i < packet.levels.length; i++){
		let box = packet.levels[i]["box"]

		let protocol = packet.levels[i]["protocol"]

		if (packetParams.ip
		    && ! node.ipaddr.includes(packetParams.ip["ip.dst"])
		    && packet.levels[i]["protocol"]!="ip"
		    && packet.levels[i]["protocol"]!="eth"){
		    // It's an IP datagram being routed => don't blink
		    // layers above ip
		    break
		}


		promise = promise
		    .then(() => {
			newInfoText = packet.querySelector("#infotext" + packet.id)
			showInfoText(protocol, packetParams, newInfoText, box)
		    })
		    .then(() => box.removeAttribute('blink')) // must reinstall animation because we use it before
		    .then(() => box.setAttribute('animation__blink', {property: 'scale', from: {x: 0.5*packetParams.elementsScale, y: 0.5*packetParams.elementsScale, z: 0.5*packetParams.elementsScale}, to: {x: packetParams.elementsScale, y: packetParams.elementsScale, z: packetParams.elementsScale}, dur: '400', easing: 'easeInOutQuint', "loop": "4", startEvents: "blink", resumeEvents:'animation-resume', pauseEvents:'animation-pause', enabled: 'false'}))
		    .then(() => box.setAttribute("animation__blink", {enabled: 'true'}))
		    .then(() => anime(box, 'blink'))


		

		isIPDestination = packetParams.ip && node.ipaddr.includes(packetParams.ip["ip.dst"])
		switch(packet.levels[i]["protocol"]){
		case "eth":
		    promise = promise
			.then(() => box.setAttribute('visible', false))
		    break;
		case "ip":
		    if (isIPDestination){
			promise = promise
			    .then(() => box.setAttribute('visible', false))
		    }
		    else if (packetParams.ip["ip.ttl"] == 1){
			
			promise = promise
	 		    .then(() => box.setAttribute("animation__blink", {enabled: 'true'}))
			    .then(() => {
				newInfoText = packet.querySelector("#infotext" + packet.id)
				showInfoText(protocol, packetParams, newInfoText, box)
			    })
	 		    .then(() => anime(box, 'blink'))
			
			let fadeoutChildren = function(packet){
			    let promises = []
			    
			    for (const child of packet.children) {
				child.setAttribute('animation__fadeout', {enabled: 'true'})
				

				newInfoText = packet.querySelector("#infotext" + packet.id)
				newInfoText.setAttribute('visible', false)
				promises.push(anime(child, 'fadeout'))				
			    }
			    return promises
			}
			
			packet.setAttribute('animation__fadeout', {enabled: 'true'})
			promise=promise
			    .then(()=> Promise.all([anime(packet, 'fadeout'),
	 					     fadeoutChildren(packet)])
					.then(() => {console.log("2")
						     return this.check_console("receiving", node, packetParams)
						    })
	 				.then(() => { console.log("2")
						      finish_packet(packet, packetParams)
						    })
				 )
		    }
		    
		    
		    break;
		default:
		    if (isIPDestination)
			promise = promise
			.then(() => {
			    newInfoText = packet.querySelector("#infotext" + packet.id)
			    newInfoText.setAttribute('visible', false)
			    box.setAttribute('visible', false)
			})
		    break;
		}
		
		
	    }

	    
	    
	    receivingARPResponse(packetParams)
	    
	    
	    isNotIPDestination = packetParams.ip && ! node.ipaddr.includes(packetParams.ip["ip.dst"])
	    if (isNotIPDestination)
	    {
		// It's an IP datagram being routed => show the datagram on
		// next link before destroying the incoming datagram,
		// then move it towards destination 
		promise = promise
		    .then(() => wait(1000))
	    	    .then(() => next_packet_anim(packetParams))
		    .then(() => wait(1000))
		    .then(() => {console.log("3")
				 this.check_console("receiving", node, packetParams)
				})
		    .then(() => { console.log("3")
				  return finish_packet(packet, packetParams)
				})
	    }
	    else{ // it was the destination
		promise = promise
		    .then(() => wait(1000))
		    .then(() => {console.log("4 check_console")
				 return this.check_console("receiving", node, packetParams)
			    })
		    .then(() => { console.log("4 finish packet")
			finish_packet(packet, packetParams)
		    })
		    .then(() => wait(1000))
		    .then(() => next_packet_anim(packetParams))
	    }
	    
	    
	}else{ // hub
	    console.log("5")
	    finish_packet(packet, packetParams)
	    next_packet_anim(packetParams);
	}
	
	
	
	
    },
    
    check_console: function(sending_receiving, node, packetParams) {
	var nodeName = node.name
	console.log("check_console: " + nodeName)
	console.log(sending_receiving)	

	var nodeFromAnimation = document.getElementById(nodeName);

	let promise = Promise.resolve()
	
	// Process console if it exists
	let showConsole = function(consoleText, the_text){
	    if (node.consoleText)
		nodeFromAnimation.removeChild(node.consoleText)

	    node.consoleText = document.createElement('a-entity');	    
	    
	    node.consoleText.setAttribute("text", "value", the_text)
	    node.consoleText.setAttribute("text", "color", "white")
	    node.consoleText.setAttribute("text", "width", 370)	    
            node.consoleText.setAttribute('rotation', '0 88 0');
	    node.consoleText.setAttribute('position', "105.19 277.81 -50.52")
            node.consoleText.setAttribute('scale', "1 1 1")
            node.consoleText.setAttribute('text', 'wrapCount', 80)
	    node.consoleText.setAttribute('text', 'tabSize', 2)	    

	    nodeFromAnimation.appendChild(node.consoleText)
	}
	
	
	// Only some pcs have console
	if (nodeName.startsWith("pc") && node.console){
	    console_data = this.console(nodeName, packetParams, sending_receiving)

	    if (console_data != '')

		promise = promise
		.then(()=> {
		    console.log("aqui console_data: " + console_data)
		    wait(500)
		})
		.then(()=> {

	    	    flying.push(nodeFromAnimation)
		    nodeFromAnimation.removeAttribute("animation__grow")
	    	    nodeFromAnimation.setAttribute('animation__grow', {property: 'scale', from: {x: 0.006/packetParams.elementsScale, y: 0.006/packetParams.elementsScale, z: 0.006/packetParams.elementsScale}, to: {x: 0.06/packetParams.elementsScale, y: 0.06/packetParams.elementsScale, z: 0.06/packetParams.elementsScale},  dur: '2000', easing: 'linear', pauseEvents:'animation-pause',  resumeEvents:'animation-resume', 'enabled': false, startEvents: 'grow'})
		    nodeFromAnimation.setAttribute('animation__grow', {'enabled': true})
		    return anime(nodeFromAnimation, 'grow')
		})
		.then(() => {
		    console_data = this.console(nodeName, packetParams, sending_receiving)
		    node.console_log += console_data
		    console.log("new.console_log: " + node.console_log)
		    showConsole(node.consoleText, node.console_log)
		    return wait(2000)
		})
		.then(() => {
		    nodeFromAnimation.removeAttribute('animation__ungrow')
		    nodeFromAnimation.setAttribute('animation__ungrow', {property: 'scale', from: {x: 0.06/packetParams.elementsScale, y: 0.06/packetParams.elementsScale, z: 0.06/packetParams.elementsScale}, to: {x: 0.006/packetParams.elementsScale, y: 0.006/packetParams.elementsScale, z: 0.006/packetParams.elementsScale}, dur: '2000', easing: 'linear', pauseEvents:'animation-pause',  resumeEvents:'animation-resume', 'enabled': false, startEvents: 'ungrow' })
		    nodeFromAnimation.setAttribute('animation__ungrow', {'enabled': true})
		    return anime(nodeFromAnimation, 'ungrow')
		})
	}

	return promise

    },
    
    startAnimation: function (anim) {
        let packet = this.el
        let packetParams = this.data

	var nodeAnimationTo = document.getElementById(packetParams.to);
	var nodeAnimationFrom = document.getElementById(packetParams.from);	


	var ethBox = packet.querySelector("#ethBox" + packet.id)
	var sphere = packet.querySelector("#sphere" + packet.id)


	var node = nodeList.find(o => o.name === packetParams.from)
	
	switch (anim) {
	case "park":

	    let a_promise = wait(500)
		.then(() => this.animate_birth(packetParams, packet, true))
		.then(() => ethBox.setAttribute('opacity', 0.5))
	    	.then(() => packet.setAttribute("animation__park", {enabled: 'true'}))
	    	.then(() => anime(packet, 'park'))

	    
	    return a_promise;
	    break;

	case "unpark":
	    var node = nodeList.find(o => o.name === packetParams.from)
	    
	    Promise.resolve()
		.then(() => showARPCacheInfoText(node.ARPCacheInfoText, node.ARPCache))
		.then(() => wait(3000))
		.then(() => node.ARPCacheInfoText.setAttribute('visible', false))	    
		.then(() => {
		    newInfoText = packet.querySelector("#infotext" + packet.id)
		    showInfoText("eth", packetParams, newInfoText, ethBox)
		})
		.then(() => ethBox.setAttribute('visible', true))
		.then(() => ethBox.setAttribute('opacity', 0.5))
		.then(() => ethBox.removeAttribute('blink')) // must reinstall animation because we use it in unpark
		.then(() => ethBox.setAttribute('animation__blink', {property: 'scale', from: {x: 0.5*packetParams.elementsScale, y: 0.5*packetParams.elementsScale, z: 0.5*packetParams.elementsScale}, to: {x: packetParams.elementsScale, y: packetParams.elementsScale, z: packetParams.elementsScale}, dur: '400', easing: 'easeInOutQuint', "loop": "4", startEvents: "blink", resumeEvents:'animation-resume', pauseEvents:'animation-pause', enabled: 'false'}))
		.then(() => ethBox.setAttribute("animation__blink", {enabled: 'true'}))
		.then(() => anime(ethBox, 'blink'))
		.then(() => ethBox.setAttribute('animation__fadein', {enabled: 'true'}))
		.then(() => anime(ethBox,'fadein'))
		.then(() => ethBox.setAttribute('animation__blink', {enabled: 'true'}))
		.then(() => anime(ethBox, 'blink'))
		.then(() => packet.setAttribute("animation__unpark", {enabled: 'true'}))
		.then(() => anime(packet, 'unpark'))
		.then(() => sphere.setAttribute('visible', true))
		.then(() => packet.setAttribute("animation__link", {enabled: 'true'}))
		.then(() => anime(packet, 'link'))
		.then(() => sphere.setAttribute('visible', false))
		.then(() => this.animate_packet_arrives(nodeAnimationTo, packetParams, packet))
	    break;

	case "birth":
	    var promise = Promise.resolve()

	    promise = promise
		.then(() => this.animate_birth(packetParams, packet))

	    promise = promise
		.then(() => sphere.setAttribute('visible', true))
		.then(() => packet.setAttribute("animation__link", {enabled: 'true'}))
		.then(() => anime(packet, 'link'))
		.then(() => sphere.setAttribute('visible', true))
		.then(() => this.animate_packet_arrives(nodeAnimationTo, packetParams, packet))
	    

	    break;
	}
    },			 

    
    init: function () {
	let packet = this.el
	let packetParams = this.data
	
	// if (viewing_mode == "vr")
	//     scene.setAttribute('network', {id: 'network', filename: 'netgui.nkp', elementsScale: 4, height: 6, connectionscolor: 'red'})
	// else
	//     scene.setAttribute('network', {id: 'network', filename: 'netgui.nkp', elementsScale: 1, height: 1, connectionscolor: 'red'})		    
    }
});

function destroy(packet){
    // Destroy packet element
    longitud = packet.children.length

    for (var a=0; a < longitud; a++) {
	packet.children[0].remove()
    }
    packet.parentNode.removeChild(packet);
}


function next_packet_anim(packetParams) {

    // inform controller
    let playButton = document.querySelector("#playButton");

    playButton.emit("next", {start: packetParams.start}, false)
};



// Waits ms milliseconds and then:
//
// if animationState == 'PAUSED' it waits 100ms, and checks again
//     every 100ms until animationState != PAUSED
//
// Returns a promise so you can use in a then() chain
const wait = (ms) =>
      new Promise((resolve) =>
		  {
		      (function f(mms){
			  setTimeout(() => {
			      if (animationState == 'PAUSED') f(100)
			      else resolve()
			  }, mms)
		      })(ms);
		  });

const anime = (target, animation_name) => 
      new Promise((resolve) =>
		  {
		      target.addEventListener('animationcomplete__' + animation_name, resolve)		      
		      target.emit(animation_name, null, false);
		  });



function finish_packet(packet, packetParams){
    let promise1 = Promise.resolve()

    console.log("finish_packet")
    console.log("packet.id: " + packet.id)
    console.log("finalPackets.length - 1")
    console.log(finalPackets.length - 1)        
    
    if (packet.id == finalPackets.length - 1) {
	console.log("finish_packet: thie is the end")
	
	promise1 = promise1
	    .then (() =>  wait(12000)) // Give some time for final
				      // animations still alive
	    .then( ()=> {

		let finishPanel = document.createElement('a-text');
		finishPanel.setAttribute("value", 'FIN: pulse Reset para reiniciar')
		finishPanel.setAttribute('position', "0 10 20")
		finishPanel.setAttribute('width', "100")		
		scene.appendChild(finishPanel);
		
		scene.removeChild(finishPanel) 
		
		// Animation is finished, clean up
		animationState = "INIT";
		showViews()
		
		controller = document.querySelector('#controller')
		controller.components["controller"].update()
		
		network = document.querySelector('#network')
		network.components["network"].update()
	    })

		// // Animation is finished, clean up
		// animationState = "INIT";
		// showViews()
		
		// controller = document.querySelector('#controller')
		// controller.components["controller"].update()
		
		// network = document.querySelector('#network')
		// network.components["network"].update()

	
    }
    promise1.then (() => destroy(packet))
}





AFRAME.registerComponent('model-opacity', {
    schema: {default: 1.0},
    init: function () {
	this.el.addEventListener('model-loaded', this.update.bind(this));
    },
    update: function () {
	var mesh = this.el.getObject3D('mesh');
	var data = this.data;
	if (!mesh) { return; }
	mesh.traverse(function (node) {
	    if (node.isMesh) {
		node.material.opacity = data;
		node.material.transparent = data < 1.0;
		node.material.needsUpdate = true;
	    }
	});
    }
});








AFRAME.registerComponent('controller', {

    schema: {
	scale: {type: 'vec3'},
        PERIOD: {type: 'int', default: '500'},
	position: {type: 'vec3'}
    },

    update: function(event)
    {
	latest_start = -2
	CURRENT_TIME = 0
    },
    
    
    do_animate: function(event)
    {
	if (latest_start == event.detail.start)
	    return
	latest_start = event.detail.start


	let packets_ready = false

	let deleteARPCache = function(packet_index){
	    // To be called in the sender of an ARP request
	    let packet = finalPackets[packet_index]
	    let eth_dst = packet.eth["eth.dst"]
	    let eth_src = packet.eth["eth.src"]
	    
	    if (packet["arp"]
		&&packet["arp"]["arp.opcode"] == "1") // ARP request
	    {		
		var connectionLink = finalConnectionsLinks.find(o => o.hwaddr.includes(eth_src))
		var node = nodeList.find(o => o.name === connectionLink.from)               
		var i = connectionLink.hwaddr.findIndex(o => o == eth_src)
		var ipaddr = connectionLink.ipaddr[i]
		delete node.ARPCache[ipaddr]
	    }

	}
	
	let sendingARPResponse = function(packet_index){
	    // to be called when an arp response is sent:
	    // add in the sender's ARPCache the eth_dst
	    let packet = finalPackets[packet_index]
	    let eth_dst = packet.eth["eth.dst"]
	    let eth_src = packet.eth["eth.src"]

	    if (packet["arp"]
		&& packet["arp"]["arp.opcode"] == "2") // ARP response
	    {		
		var connectionLink = finalConnectionsLinks.find(o => o.hwaddr.includes(eth_src))
		var node = nodeList.find(o => o.name === connectionLink.from)               
		var i = connectionLink.hwaddr.findIndex(o => o == eth_src)

		var ipaddr = packet["arp"]["arp.dst.proto_ipv4"]

		node.ARPCache[ipaddr]={"iface": "eth"+i, "hwaddr": eth_dst}
	    }
	    
	}


	while (next_packet < finalPackets.length && !packets_ready){
	    CURRENT_TIME += 500

	    while (next_packet < finalPackets.length && finalPackets[next_packet].packetDelay <= CURRENT_TIME){

		// delete from the sender of the ARP request the
		// requested IP
		deleteARPCache(next_packet)
		// in case it's an ARP response update cache with what
		// we learnt from the sender of the previous ARP
		// request
		sendingARPResponse(next_packet)
		
		next_ip_position = finalPackets[next_packet].next_ip_position
		
		if (next_ip_position){
		    // This is an ARP request, so we must first show
		    // the IP datagram that caused it

		    // delete from the sender of the ARP request the
		    // requested IP
		    deleteARPCache(next_packet)
		    
		    
		    let promise = Promise.resolve()
		    let nextIPPacket = finalPackets[next_ip_position].newPacket.components.packet
		    finalPackets[next_ip_position].createdAnimation = true
		    nextIPPacket.createAnimation()
		    nextIPPacket.createdAnimation = true

		    promise = nextIPPacket.startAnimation("park")
		    flying.push(finalPackets[next_ip_position].newPacket)

		    promise = promise
			.then(() => {
			    
			    let newPacket = finalPackets[next_packet].newPacket.components.packet
			    finalPackets[next_packet].createdAnimation = true
			    newPacket.createAnimation()
			    
			    
			    newPacket.startAnimation("birth", true)
			    flying.push(finalPackets[next_packet].newPacket)
			    next_packet += 1
			    packets_ready = true
			    
			})
		    
		    return promise
		}
		else {
		    let newPacket = finalPackets[next_packet].newPacket.components.packet
		    if (! finalPackets[next_packet].createdAnimation){
			// Normal packet, first we must create its a-frame
			finalPackets[next_packet].createdAnimation = true
			newPacket.createAnimation()

			newPacket.startAnimation("birth")
		    }
		    else{
			let promise = Promise.resolve()

			// This is an IP datagram that was created
			// when the Request ARP appeared in the
			// capture, so only animate it, don't create
			// it
			newPacket.startAnimation("unpark")
		    }
		    flying.push(finalPackets[next_packet].newPacket)

		    next_packet += 1		    
		    packets_ready = true
		}
		console.log("--------------- do_animate")
	    }

	    
	}
    },
    
    
    init: function() {

	latest_start = -2
	CURRENT_TIME = 0
	
	let PERIOD=this.data.PERIOD
	let do_animate=this.do_animate
	
	function event_listener_function(event) {
            switch(animationState) {
            case 'INIT':
		hideViews()
		
		//		scene.removeAttribute("network")
		// if (viewing_mode == "vr")
		//     scene.setAttribute('network', {id: 'network', filename: 'netgui.nkp', elementsScale: 4, height: 6, connectionscolor: 'red'})
		// else // "desktop"
		//     scene.setAttribute('network', {id: 'network', filename: 'netgui.nkp', elementsScale: 1, height: 1, connectionscolor: 'red'})
		
		playButton.setAttribute('color', 'gray')
		
		next_packet = 0

		CURRENT_TIME = 0
		
		animationState = "MOVING"

		// inform controller
		playButton = document.querySelector("#playButton");
		setTimeout(()=>{playButton.emit("next", {start: -1}, false)}, 500)

		
		break

            case 'MOVING':
		animationState = "PAUSED"

		playButton.setAttribute('color', 'gray')

		
		// Send to packets flying an animation-pause
		for (const packet of flying){
		    // pause animations of the packet and animations of the children
		    packet.emit("animation-pause", null, false)
		    for (const child of packet.children) {
			child.emit("animation-pause", null, false)			
		    }
		}
		
		break;
		
            case 'PAUSED':
		animationState = "MOVING"

		playButton.setAttribute('color', 'gray')

		// Send to packets flying an animation-resume

		for (const packet of flying){
		    // resume animations of the packet and animations of the children
		    packet.emit("animation-resume", null, false)		
		    for (const child of packet.children) {
			child.emit("animation-resume", null, false)			
		    }
		}
		
		break
	    } // switch

	} // event_listener_function


	// play button
	playButton = document.createElement('a-entity');

	playButton.addEventListener('next', do_animate)
	
        playButton.setAttribute('gltf-model', '#play_button');
	playButton.setAttribute('rotation', {x: -30, y: 0, z: 0 });


	let position = {x: 0, y: 1.6, z: 5}	
        playButton.setAttribute('position', position);
        playButton.setAttribute('color', 'orange');
        playButton.setAttribute('scale', '1 1 1');
        playButton.setAttribute('id', 'playButton');
        playButton.setAttribute('sound', {on: 'click', src: '#playPause', volume: 5});

        playButton.addEventListener('mouseenter', function () {
	    playButton.setAttribute('scale', {x: 5, y: 5, z: 5});
	    playButton.setAttribute('rotation', {x: -10, y: 0, z: 0 });	    
        });
        playButton.addEventListener('mouseleave', function () {
	    playButton.setAttribute('scale', {x: 4.5, y: 4.5, z: 4.5})
	    playButton.removeAttribute('animation');
	    playButton.setAttribute('rotation', {x: -30, y: 0, z: 0 });	    	    
        });

	playButton.addEventListener('click', event_listener_function)
	let scene = document.querySelector("#escena")
	this.el.appendChild(playButton);


	// Play button also can be clicked with space key
	document.addEventListener('keydown', (event) => {
	    const keyName = event.key;
	    
	    if (keyName === 'Spacebar' || keyName === ' ') {
		playButton.emit('click', {}, false)
	    }
	}, false);


	
	// Header text for PlayPause button
	let viewText = document.createElement('a-text');
	viewText.setAttribute('value', "Play / Pause")
	viewText.setAttribute('scale', '5 5 5');
	position.y += 3
	position.x -= 3
	viewText.setAttribute('position', position);
	viewText.setAttribute("color", "white")	
	this.el.appendChild(viewText)



	// reset button
	resetButton = document.createElement('a-entity');
        resetButton.setAttribute('gltf-model', '#reset_button');
	resetButton.setAttribute('rotation', {x: 60, y: 0, z: 0 });
	position = Object.assign({}, this.data.position)
	position.x += 10
        resetButton.setAttribute('position', position);
        resetButton.setAttribute('color', 'orange');
        resetButton.setAttribute('scale', '3.5 3.5 3.5');
        resetButton.setAttribute('id', 'resetButton');
        resetButton.setAttribute('sound', {on: 'click', src: '#playPause', volume: 5});

        resetButton.addEventListener('mouseenter', function () {
	    resetButton.setAttribute('scale', {x: 4, y: 4, z: 4});
	    resetButton.setAttribute('rotation', {x: 80, y: 0, z: 0 });	    
        });
        resetButton.addEventListener('mouseleave', function () {
	    resetButton.setAttribute('scale', {x: 3.5, y: 3.5, z: 3.5})
	    resetButton.removeAttribute('animation');
	    resetButton.setAttribute('rotation', {x: 0, y: 0, z: 0 });
	    resetButton.setAttribute('rotation', {x: 60, y: 0, z: 0 });	    
        });

	scene.appendChild(resetButton);

	var el = this.el
	function reset(){
	    animationState="INIT"
	    showViews()

	    el.components["controller"].update()

	    network = document.querySelector('#network')
	    network.components["network"].update()
	}
	resetButton.addEventListener('click', reset)

	// Header text for Reset button
	viewText = document.createElement('a-text');
	viewText.setAttribute('value', "Reset")
	viewText.setAttribute('scale', '5 5 5');
	position.x -= 1.5
	position.y += 3
	viewText.setAttribute('position', position);
	viewText.setAttribute("color", "white")	
	scene.appendChild(viewText)


	
        // Request and process views menu file
        viewsMenuFile = 'viewsMenu.json'
        requestViewsMenuFile = new XMLHttpRequest();
        requestViewsMenuFile.open('GET', viewsMenuFile);
        requestViewsMenuFile.responseType = 'text';
        requestViewsMenuFile.send();

	position = Object.assign({}, this.data.position)
	position.x += 15
	position.y -= 1
	let f = createViewSelector.bind(null, this.el, position)
        requestViewsMenuFile.onload = function() {
            response = requestViewsMenuFile.response;
            VIEWS_MENU = JSON.parse(response);
	    f();
	}


        let infoPanel = document.createElement('a-entity');
        infoPanel.setAttribute('html', '#info-panel');
	position = Object.assign({}, this.data.position)
	position.x -= 25
	position.y -= 5
	position.z -= 20
        infoPanel.setAttribute('position', position);
        infoPanel.setAttribute('scale', '30 30 30');
        infoPanel.setAttribute('id', 'infoPanel');


	infoPanel.setAttribute('look-at', "[camera]");

	
        scene.appendChild(infoPanel);
	
	
    }
    
});



function createNetwork(filename, machineNamesFile, elementScale){
    console.log("create network")
    
    // initialize global variables
    nodeList.length = 0
    var nodes = null

    finalConnectionsLinks.length = 0
    // request netgui.nkp
    file = filename
    request = new XMLHttpRequest();
    request.open('GET', file);
    request.responseType = 'text';
    request.send();
    
    let promise1 =
	new Promise((resolve) =>
		    request.onload = function() {
			console.log("cargados netkit.nkp")
			nodeList.length=0 // need to reinitialize
					  // because this handler is
					  // called twice sometimes
					  // and if not you would end
					  // up with a corrupt
					  // nodeList
			
			response = request.response;
			response.split('<nodes>')
			nodes = response.split('position')

			createNodes(nodes, nodeList, elementsScale)
			
			resolve()
		    })


    
    // Request and process machineNames.json
    // Associate a name to each machine
    requestMachineNames = new XMLHttpRequest();
    requestMachineNames.open('GET', machineNamesFile);
    requestMachineNames.responseType = 'text';
    requestMachineNames.send();

    let promise2 = promise1
	.then(() => {return new Promise
		     ((resolve) =>
		      requestMachineNames.onload = function() {
			  console.log("cargados machineNames")

			  response = requestMachineNames.response;
			  responseParse = JSON.parse(response);
			  
			  for (const interface_index in responseParse.interfaces) {
			      for (const currentNode in responseParse.interfaces[interface_index]) {
				  node = nodeList.find(o => o.name === currentNode)
				  node.hwaddr.push(responseParse.interfaces[interface_index][currentNode]["hwaddr"])
				  node.ipaddr.push(responseParse.interfaces[interface_index][currentNode]["ipaddr"])
				  node.mask.push(responseParse.interfaces[interface_index][currentNode]["mask"])
				  node.iface.push("eth" + interface_index)
			      }
			  }
			  
			  for (const [machineName, value] of Object.entries(responseParse.nodes_info)){
			      node = nodeList.find(o => o.name === machineName)
			      node.routing_table = value.routing_table
			  }
			  // Process netgui.nkp though the variable in the closure. nodesInfo is a variable defined in createNodes() !!
			  connections = nodesInfo[1].split('link')
			  

			  
			  finalConnectionsLinks = setConnectionsLinks(connections, nodeList, data)
			  
			  resolve()	    
		      }
		     )})
    
    
    //
    // Request and process consoles.json
    requestConsoles = new XMLHttpRequest();
    requestConsoles.open('GET', 'consoles.json');
    requestConsoles.responseType = 'text';
    requestConsoles.send();
    let promise3 = promise2
	.then(() => {return new Promise
		     ((resolve) =>
		      requestConsoles.onload = function() {
			  response = requestConsoles.response;
			  consoles = JSON.parse(response);
			  console.log("consoles")
			  console.log(consoles)
			  resolve()	    
		      }
		     )})

    
    
    promise3
	.then(() =>{
	    // create panels for routing tables + ARPCaches + console
	    for (var k=0; k < nodeList.length; k++) {
		node = nodeList[k];
		
		if(!node.name.startsWith('hub')){
		    coords = { x: ((node.position.split(',')[0] / 15) -3.5)/data.elementsScale, y: data.SHIFT_Y, z: (node.position.split(',')[1] / 15)/data.elementsScale }
		    
		    
		    node.routingTableText =
			createRoutingTableInfo(node.name + "routing_table", coords, data.elementsScale, formatRoutingTable(node.routing_table))
		    
		    
		    // ARPCache contents
		    node.ARPCache = {}
		    // ARPCache panel
		    node.ARPCacheInfoText =
			createARPCacheInfoText("ARPCacheInfoText" + node.name, coords, data.elementsScale, formatARPCache(node.ARPCache))
		    
		    // console
		    if (consoles[node.name]){
			node.console = consoles[node.name]
			node.console_log = node.name + "$ "
		    }
		}
	    }
	    
	    loadAndAnimatePackets(finalConnectionsLinks);	    
	})
}


function loadAndAnimatePackets(finalConnectionsLinks){
    var filePackets = 'new_file.json'
    var requestPackets = new XMLHttpRequest();
    requestPackets.open('GET', filePackets);
    requestPackets.responseType = 'text';
    requestPackets.send();
    requestPackets.onload = function() {
        response = requestPackets.response;
        responseParse = JSON.parse(response);
	
        var packets = readPackets(responseParse)
	
	
	if (isEndToEndVIEW()){

	    
	    animateEndToEndPackets(packets, finalConnectionsLinks, data)

	}
	else{
	    animatePackets(packets, finalConnectionsLinks, data)

	}
    }
}


function formatARPCache(ARPCache){
    color = "white"
    let h1 ='<h1 style="padding: 0rem 1rem; font-size: 1.4rem; font-weight: 900; ' +
        'font-family: monospace; text-align: left; color: ' + color + '">'
    let h2 ='<h2 style="padding: 0rem 1rem; font-size: 1.2rem; font-weight: 800; ' + 
        'font-family: monospace; text-align: left; color: ' + color + '">'
    let h3 ='<h3 style="padding: 0rem 1rem 0rem 2rem; font-size: 1rem; font-weight: 700; ' +
        'font-family: monospace;  text-align: left; color: ' + color+ '">'


    
    text = h1+'ARP cache</h1>' + h2 +
	'<table style="border-spacing: 1rem; text-align: center">' +
        '<tr><th>IP address</th>' +
        '<th>hwaddr</th>' +
        '<th>Iface</th>' +
        '</tr>'
    

    for (const ip in ARPCache){
	text += "<tr>" +
            "<td>" + ip + "</td> " +
            "<td>" + ARPCache[ip]["hwaddr"] + "</td> " +
      	    "<td>" + ARPCache[ip]["iface"]  + "</td> " +
	    "</tr>"
    }

    text += "</h2>"
    text += "</table>"

    return text;
}

function formatRoutingTable(routing_table){
    let h1 ='<h1 style="padding: 0rem 1rem; font-size: 1.4rem; font-weight: 900; ' +
        'font-family: monospace; text-align: left;">'
    let h2 ='<h2 style="padding: 0rem 1rem; font-size: 1.2rem; font-weight: 800; ' +
        'font-family: monospace; text-align: left;">'
    let h3 ='<h3 style="padding: 0rem 1rem 0rem 2rem; font-size: 1rem; font-weight: 700; ' + 
        'font-family: monospace; text-align: left;">'

    text = h1 + 'Routing table</h1>' +
	h2 +
	'<table style="border-spacing: 1rem; text-align: center">' +
        '<tr><th>Destination</th>' +
        '<th>Mask</th>' +
        '<th> Gateway</th>' +
        '<th>Iface</th>' +
        '</tr>'
	+'</h2>'
    
    text += h2
    for (var i = 0; i < routing_table.length; i++){
	text += "<tr>" +
            "<td>" + routing_table[i][0] + "</td> " +
            "<td>" + routing_table[i][1] + "</td> " +
      	    "<td>" + routing_table[i][2] + "</td> " +
	    "<td>" + routing_table[i][3] + "</td> " +
	    "</tr>"
    }
    text += '</h2>'

    text += "</table>"

    return text;
}


function deleteLinks(finalConnectionsLinks){
    for (var i = 0; i < finalConnectionsLinks.length; i++){
	for (var j=0; j < finalConnectionsLinks[i].lines.length; j++)
	    scene.removeChild(finalConnectionsLinks[i].lines[j])

	for (var j=0; j < finalConnectionsLinks[i].ipaddrs.length; j++)
	    scene.removeChild(finalConnectionsLinks[i].ipaddrs[j])
	
    }

    finalConnectionsLinks.length=0

}


function deleteNodes(nodeList){
    scene = document.querySelector('#escena');

    
    for (var i = 0; i < nodeList.length; i++){
	
	node_a_entity = nodeList[i].node_a_entity 

	if (! scene.contains(node_a_entity))
	    // Not all nodes are in the scene
	    continue
	
	// Destroy node's text
	scene.removeChild(nodeList[i].text)

	// Destroy node's routingTableText and ARPCache
	if(!nodeList[i].name.startsWith('hub')){
            scene.removeChild(nodeList[i].routingTableText)
            scene.removeChild(nodeList[i].ARPCacheInfoText)
	}

	// Destroy node
        scene.removeChild(node_a_entity);
    }

    // reset nodeList
    nodeList.length=0
}


function createNodes(nodes, nodeList, elementsScale) {
    for (var i = 1; i < nodes.length; i++) {
        nodesInfo = nodes[i].split(');')
        nodesName = nodesInfo[1].split('"')
        newNode = {
            position: nodesInfo[0].slice(1),
            name: nodesName[1],
            hwaddr: [],
	    ipaddr:[],
	    mask:[],
	    iface:[],
	    routing_table:[],
	    routingTableText:"",
	    text:"",
	    node_a_entity:""
        }



	
        let newNodeElement = document.createElement('a-entity');
	newNode.node_a_entity = newNodeElement 
	nodeList.push(newNode)	    
	
	console.log("createNodes newNode")
	console.log(newNode)
	
        if(newNode.name.startsWith('pc') || newNode.name.startsWith('dns')){
            newNodeElement.setAttribute('gltf-model', '#computer');
            newNodeElement.setAttribute('position', { x: (newNode.position.split(',')[0] / 15)/elementsScale, y: data.SHIFT_Y, z: (newNode.position.split(',')[1] / 15)/elementsScale });
	    
            newNodeElement.setAttribute('id', newNode.name);
            newNodeElement.setAttribute('scale', {x: 0.006/elementsScale, y: 0.006/elementsScale, z: 0.006/elementsScale});
            newNodeElement.setAttribute('rotation', '0 -90 0');


	    
        }else if(newNode.name.startsWith('hub')){
            newNodeElement.setAttribute('gltf-model', '#hub');
            newNodeElement.setAttribute('position', { x: (newNode.position.split(',')[0] / 15)/elementsScale, y: data.SHIFT_Y, z: (newNode.position.split(',')[1] / 15)/elementsScale });
            newNodeElement.setAttribute('id', newNode.name);
            newNodeElement.setAttribute('scale', {x: 1/elementsScale, y: 1/elementsScale, z: 1/elementsScale});
        }else if(newNode.name.startsWith('r')){
            newNodeElement.setAttribute('gltf-model', '#router');
            newNodeElement.setAttribute('position', { x: ((newNode.position.split(',')[0] / 15) -1.5)/elementsScale, y: data.SHIFT_Y, z: (newNode.position.split(',')[1] / 15)/elementsScale });
            newNodeElement.setAttribute('id', newNode.name);
            newNodeElement.setAttribute('scale', {x: 0.008/elementsScale, y: 0.008/elementsScale, z: 0.008/elementsScale});
        }

	

	
	// Add routing table info
	isClosedRoutingTableInfo = true;
	
        newNodeElement.addEventListener('click', function () {
	    if  (isEndToEndVIEW()){
		return;
	    }

            node = nodeList.find(o => o.name === newNodeElement.id)

            if(isClosedRoutingTableInfo == false){
	    	isClosedRoutingTableInfo = true


                node.routingTableText.removeAttribute('html');
		node.routingTableText.setAttribute('visible', false);

		node.ARPCacheInfoText.removeAttribute('html')
		node.ARPCacheInfoText.setAttribute('visible', false);

		newNodeElement.removeAttribute('sound');


                newNodeElement.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
            }else{ 
                isClosedRoutingTableInfo = false
	    	showRoutingTable(node.routingTableText, newNodeElement);
		showARPCacheInfoText(node.ARPCacheInfoText, node.ARPCache)
            }
        });

	
	
	// In end-to-end views draw only hosts (pcs and dns servers)
	if  (isEndToEndVIEW())
	    if (! (newNode.name.startsWith('pc') || newNode.name.startsWith('dns'))) 
		continue;


	scene.appendChild(newNodeElement);
	
        // Machine names
        var htmltemplates = document.getElementById("htmltemplates");
        var newSectionTemplate = document.createElement("section");
        templateText = '<h1 style="padding: 0rem 1rem; margin:0; font-size: 3rem; font-weight: 700; font-family: monospace">' + newNode.name + '</h1>'
        newSectionTemplate.innerHTML = templateText;
        newSectionTemplate.style = "display: inline-block; background: LightSlateGray; color: gold; border-radius: 1em; padding: 1em; margin:0;"
        newSectionTemplate.id = newNode.name + '-template'
        htmltemplates.appendChild(newSectionTemplate);

        let newText = document.createElement('a-entity');
        newText.setAttribute('position', { x: ((newNode.position.split(',')[0] / 15) - 0.5)/elementsScale, y: 2.5 + data.SHIFT_Y, z: (newNode.position.split(',')[1] / 15)/elementsScale });
        newText.setAttribute('html', '#' + newNode.name + '-template');
        newText.setAttribute('scale', {x: 10/elementsScale, y: 10/elementsScale, z: 10/elementsScale});
        newText.setAttribute('look-at', "[camera]");

	newNode.text=newText
	
        scene = document.querySelector('#escena');
        scene.appendChild(newText);



        
    }

}

function setConnectionsLinks(connections, nodeList, data){
    var connectionsLinks = []
    
    for (var i = 1; i < connections.length; i++) {
        if (i % 2 == 1) {
            connectionLink = {
                from: connections[i].split('"')[1],
                to: connections[i].split('"')[3],
            }
            connectionsLinks.push(connectionLink)
	}
    }
    return setStandardConnectionsLinks(connectionsLinks, nodeList, data)
}


function setStandardConnectionsLinks(connectionsLinks, nodeList, data){
    var connectionsLinksStandard = []


    for (var k = 0; k < nodeList.length; k++) {
        actualNode = []
	for (var j = 0; j < connectionsLinks.length; j++){
	    if (nodeList[k].name == connectionsLinks[j].from)
		actualNode.push(connectionsLinks[j].to)		

	    if (nodeList[k].name == connectionsLinks[j].to)
		actualNode.push(connectionsLinks[j].from)		
	}
	
        connectionLink = {
            from: nodeList[k].name,
            to: actualNode,
            position: nodeList[k].position,
            hwaddr: nodeList[k].hwaddr,
	    ipaddr: nodeList[k].ipaddr,
	    mask: nodeList[k].mask,
	    iface: nodeList[k].iface,	    
	    lines: [],
	    ipaddrs: []
        }
        connectionsLinksStandard.push(connectionLink)
    }


    // Only draw links in non end-to-end views
    if  (! isEndToEndVIEW())
	writeConnections(connectionsLinksStandard, nodeList, data)

    return connectionsLinksStandard
}


// Returns a point in the segment from-to
//
// if shift > 0 return a point close to from, at a distance
// proportional to shift
//
// if shift < 0 return a point close to to, at a distance
// proportional to shift
function pointInSegment (from, to, elementsScale, shift = 0.2){

    
    coords = {};
    coords.y = from.y
    
    if (shift >= 0)
    {
	coords.x = from.x;
	coords.z = from.z;
    }
    else
    {
	coords.x = to.x;
	coords.z = to.z;
    }

    slope = Math.abs(to.z - from.z) / Math.abs(to.x - from.x)

    shift_x = shift * Math.abs(to.x-from.x)



    if (to.x >= from.x && to.z >= from.z){
	coords.x += shift_x;
    }
    else if (to.x >= from.x && to.z <= from.z){
	coords.x += shift_x;
    }
    else if (to.x <= from.x && to.z >= from.z){
	coords.x -= shift_x;
    }
    else if (to.x <= from.x && to.z <= from.z){
	coords.x -= shift_x;
    }

    shift_z = (coords.x - from.x) * (to.z - from.z) / (to.x - from.x)
    if (Math.abs(shift_x) < 0.1) {
	// Fix for vertical lines
	if (shift_z < 0)
	    shift_z = Math.min(-3, shift_z)
	else
	    shift_z = Math.max(3, shift_z)
    }
    coords.z = from.z + shift_z
    
    return coords;
}



function writeConnections(connectionsLinksStandard, nodeList, data) {
    for (var k = 0; k < connectionsLinksStandard.length; k++) {
        nodeFromPosition = connectionsLinksStandard[k].position.split('"')
        for (var j = 0; j < connectionsLinksStandard[k].to.length; j++) {
            nodeTo = connectionsLinksStandard.find(o => o.from === connectionsLinksStandard[k].to[j])
            nodeToPosition = nodeTo.position.split('"')

            let newLine = document.createElement('a-entity');

            newLine.setAttribute('line', 'start: ' + (nodeFromPosition[0].split(',')[0] / 15)/data.elementsScale + ' ' + data.SHIFT_Y + ' ' + (nodeFromPosition[0].split(',')[1] / 15)/data.elementsScale + '; end: ' + (nodeToPosition[0].split(',')[0] / 15)/data.elementsScale + ' ' + data.SHIFT_Y + ' ' + (nodeToPosition[0].split(',')[1] / 15)/data.elementsScale + '; color: ' + data.connectionscolor);
            scene.appendChild(newLine);

	    connectionsLinksStandard[k].lines.push(newLine)


	    // Labels for IP addresses on the link
            nodeFrom = connectionsLinksStandard.find(o => o.from === connectionsLinksStandard[k].from)
	    if (nodeFrom.from.startsWith("hub"))
		continue;
	    
	    label_id = connectionsLinksStandard[k].iface[j] + ": "
	    label_id += connectionsLinksStandard[k].ipaddr[j] + "/" + connectionsLinksStandard[k].mask[j] + "<br>";
	    label_id += "      " + connectionsLinksStandard[k].hwaddr[j] 

	    
	    console.log("writeConnections")
	    console.log("k: " + k)
	    console.log("j: " + j)
	    console.log(connectionsLinksStandard)
	    
	    var id_text = connectionsLinksStandard[k].ipaddr[j].replace(/\./g, "_");

	    
            var htmltemplates = document.getElementById("htmltemplates");
            var newSectionTemplate = document.createElement("section");
            templateText = '<h1 style="padding: 0rem 0rem 0rem 0rem; margin: 0; font-size: 2.5rem; font-family: monospace; font-weight: 400;">' + label_id + '</h1>'
            newSectionTemplate.innerHTML = templateText;
            newSectionTemplate.style = "display: inline-block; background: #34495e; color: #a9cce3; border-radius: 1em; padding: 1em; margin:0;"
            newSectionTemplate.id = id_text + "-template";
            htmltemplates.appendChild(newSectionTemplate);


	    coords = pointInSegment (
		{"x": (nodeFromPosition[0].split(',')[0] / 15)/data.elementsScale, "y": data.SHIFT_Y, "z": (nodeFromPosition[0].split(',')[1] / 15)/data.elementsScale},
		{"x": (nodeToPosition[0].split(',')[0] / 15)/data.elementsScale,  "y": data.SHIFT_Y,  "z": (nodeToPosition[0].split(',')[1] / 15)/data.elementsScale},
		data.elementsScale
	    )

            let newText = document.createElement('a-entity');

	    // if (viewing_mode == "vr")
	    // 	newText.setAttribute('position', {
	    // 	    x: coords.x,
	    // 	    y: data.height * 1.01,
	    // 	    z: coords.z
	    // 	});
	    // else // viewing_mode == "desktop"
	    // 	newText.setAttribute('position', {
	    // 	    x: coords.x,
	    // 	    y: data.height * 2.0 + 3,
	    // 	    z: coords.z
	    // 	});

	    newText.setAttribute('position', coords)

	    


	    
            newText.setAttribute('html', '#' + id_text + "-template");
            newText.setAttribute('scale', {x: 10/data.elementsScale, y: 10/data.elementsScale, z: 10/data.elementsScale});
            newText.setAttribute('look-at', "[camera]");
	    
            scene = document.querySelector('#escena');

            scene.appendChild(newText);
	    connectionsLinksStandard[k].ipaddrs.push(newText)	    

        }
    }

    return connectionsLinksStandard
}



function createARPCacheInfoText(id_text, coords, elementsScale, info){
    var htmltemplates = document.getElementById("htmltemplates");
    var newSectionTemplate = document.createElement("section");

    templateText = '<h1 style="padding: 0rem 1rem; font-size: 1.4rem; font-weight: 900; font-family: monospace">' + info + '</h1>'
    newSectionTemplate.innerHTML = templateText;
    
    
    newSectionTemplate.style = "display: inline-block; background: black; color: orange; border-radius: 1em; padding: 1em; margin:0;"
    newSectionTemplate.id = id_text + "-template";
    htmltemplates.appendChild(newSectionTemplate);


    let newText = document.createElement('a-entity');

    let c = Object.assign({}, coords)
    c.y = c.y + 4
    newText.setAttribute('position', c)
    
    newText.setAttribute('scale', {x: 25, y: 25, z: 25});
    
    newText.setAttribute('html', '#' + id_text + "-template");
    newText.setAttribute('look-at', "[camera]");
    newText.setAttribute('visible', false);

    newText.setAttribute('id', id_text);    
    
    scene = document.querySelector('#escena');

    scene.appendChild(newText);

    return newText;
}



function createRoutingTableInfo(id_text, coords, elementsScale, info){
    var htmltemplates = document.getElementById("htmltemplates");
    var newSectionTemplate = document.createElement("section");

    
    templateText = '<h1 style="padding: 0rem 1rem; font-size: 1.4rem; font-weight: 900; font-family: monospace">' + info + '</h1>'
    newSectionTemplate.innerHTML = templateText;
    
    
    newSectionTemplate.style = "display: inline-block; background: black; color: orange; border-radius: 1em; padding: 1em; margin:0;"
    newSectionTemplate.id = id_text + "-template";
    htmltemplates.appendChild(newSectionTemplate);


    let newText = document.createElement('a-entity');


    let c = Object.assign({}, coords)
    c.y = c.y + 10
    newText.setAttribute('position', c)
    newText.setAttribute('scale', {x: 20, y: 20, z: 20});
    
    newText.setAttribute('html', '#' + id_text + "-template");
//    newText.setAttribute('scale', {x: 10/elementsScale, y: 10/elementsScale, z: 10/elementsScale});
    newText.setAttribute('look-at', "[camera]");
    newText.setAttribute('visible', false);
    
    scene = document.querySelector('#escena');

    scene.appendChild(newText);

    return newText;
}


function  readPackets(responseParse) {
    var seen_packets = [];
    
    var packets = [];
    
    for (var j = 0; j < responseParse.length; j++) {
	var protocols = []

	newAnimation = {
            src: responseParse[j].src,
            dst: responseParse[j].dst,
            time: responseParse[j].time,
            id: j,
        }

	// tcp and raw data encapsulated
        if(responseParse[j].tcp.length !== 0){
	    protocols.push("APPLICATION+TRANSPORT")
            newAnimation.tcp = responseParse[j].tcp;
	    
	    if(responseParse[j].tcp["tcp.len"] !== "0"){ // TCP segment with data => add data layer
		protocols.push("APPLICATION");		
		newAnimation.data = responseParse[j].tcp["tcp.payload"];
	    }
	}

	// udp and raw data encapsulated
        if(responseParse[j].udp.length !== 0){
	    protocols.push("APPLICATION+TRANSPORT");

	    newAnimation.udp = responseParse[j].udp;

	    if(responseParse[j].data["data.len"] !== "0"){ // UDP segment with data => add data layer
		protocols.push("APPLICATION");
		newAnimation.data = responseParse[j].data["data.data"];
	    }	    
        }

        if(responseParse[j].icmp.length !== 0){
	    protocols.push("APPLICATION+TRANSPORT+NETWORK");

	    newAnimation.icmp = responseParse[j].icmp;
        }

        if(responseParse[j].dns.length !== 0){
	    protocols.push("APPLICATION");
            newAnimation.dns = responseParse[j].dns;
        }

        if(responseParse[j].http.length !== 0){
	    protocols.push("APPLICATION");
            newAnimation.http = responseParse[j].http;
        }
	
        if(responseParse[j].arp.length !== 0){
	    protocols.push("ALL");	    
            newAnimation.arp = responseParse[j].arp;
        }
        if(responseParse[j].ip.length !== 0){
	    protocols.push("APPLICATION+TRANSPORT+NETWORK");	    
            newAnimation.ip = responseParse[j].ip;
        }
        if(responseParse[j].eth.length !== 0){
	    protocols.push("ALL");
            newAnimation.eth = responseParse[j].eth;
        }



	// Filter packets depending on VIEW
	if (protocols.includes(VIEW)){
	    if  (isEndToEndVIEW()){
		packet = {
		    ip_src: responseParse[j].ip["ip.src"],
		    ip_id: responseParse[j].ip["ip.id"]
		}

		// keep only IP datagrams in the broadcast domain, discard others
		if (!seen_packets.some (e => e.ip_src === packet.ip_src && e.ip_id === packet.ip_id)){
		    packets.push(newAnimation);
		    seen_packets.push(packet);
		}
	    } else // "APPLICATION+TRANSPORT+NETWORK" || "ALL":
		packets.push(newAnimation)   
	}
	
	
    }// for

    return packets;
}



function animateEndToEndPackets(packets, connectionsLinks, data){
    for (var j = 0; j < packets.length; j++) {

	
        var from = connectionsLinks.find(o => o.hwaddr.includes(packets[j].src))
        to = connectionsLinks.find(o => o.ipaddr.includes(packets[j].ip["ip.dst"]))

        packetDelay = TICK * j
        finalPackets.push({
	    'from': from,
	    'to': to,
            'xPosition': (from.position.split(',')[0] / 15)/data.elementsScale,
            'zPosition': (from.position.split(',')[1] / 15)/data.elementsScale,
            'toXPosition': (to.position.split(',')[0] / 15)/data.elementsScale,
            'toZPosition': (to.position.split(',')[1] / 15)/data.elementsScale,
            'duration': TICK,
            'packetDelay': packetDelay,
            'id': packets[j].id,
            'ip': packets[j].ip,
            'eth': packets[j].eth,
            'arp': packets[j].arp,
            'dataInfo': packets[j].dataInfo,
            'data': packets[j].data,		    
            'tcp': packets[j].tcp,
	    'udp': packets[j].udp,
	    'icmp': packets[j].icmp,
	    'dns': packets[j].dns,
	    'http': packets[j].http
        })
	
	
    } // for
    
    create_animations(finalPackets)

}


function animatePackets(packets, connectionsLinks, data){
    let latest_arp_requests = {}

    for (var j = 0; j < packets.length; j++) {
        var from = connectionsLinks.find(o => o.hwaddr.includes(packets[j].src))

        if (packets[j].dst != 'ff:ff:ff:ff:ff:ff') {
            to = connectionsLinks.find(o => o.hwaddr.includes(packets[j].dst))


	    let eth_dst = packets[j]["eth"]["eth.dst"]
	    let eth_src = packets[j]["eth"]["eth.src"]

	    if ("arp" in packets[j]
		&& packets[j]["arp"]["arp.opcode"] == "2"  	    // ARP reply
		&& eth_dst in latest_arp_requests)
	    {
		// store the hwaddr of the sender of the ARP reply
		latest_arp_requests[eth_dst]["arp.dst.hw_mac"] = packets[j]["eth"]["eth.src"]

		
	    }


	    if ("ip" in packets[j]
		&& eth_src in latest_arp_requests
		&& eth_dst == latest_arp_requests[eth_src]["arp.dst.hw_mac"]
	       )
	    { // Store in the ARP request packet the position of the IP packet in finalPackets
		arpPacket = finalPackets[latest_arp_requests[eth_src]["next_ip_position"]]
		arpPacket["next_ip_position"] = finalPackets.length

		delete latest_arp_requests[eth_src] 
	    }
	    
	    
            if (from.to.includes(to.from)){
		// eth_dst is neighbor of the node we are considering (from)
                packetDelay = TICK * j

                finalPackets.push({
		    'from': from,
		    'to': to,
                    'xPosition': (from.position.split(',')[0] / 15)/data.elementsScale,
                    'zPosition': (from.position.split(',')[1] / 15)/data.elementsScale,
                    'toXPosition': (to.position.split(',')[0] / 15)/data.elementsScale,
                    'toZPosition': (to.position.split(',')[1] / 15)/data.elementsScale,
                    'duration': TICK,
                    'packetDelay': packetDelay,
                    'id': packets[j].id,
                    'ip': packets[j].ip,
                    'eth': packets[j].eth,
                    'arp': packets[j].arp,
                    'dataInfo': packets[j].dataInfo,
                    'data': packets[j].data,		    
                    'tcp': packets[j].tcp,
		    'udp': packets[j].udp,
		    'icmp': packets[j].icmp,
		    'dns': packets[j].dns,
		    'http': packets[j].http
                })
		
            } else {
		// eth_dst is NOT neighbor of the node we are considering
		// (from). i.e., there is a hub or a switch in between
		
		var i = from.hwaddr.findIndex(o => o == packets[j].src)
		nodeName = from.to[i]
		to = connectionsLinks.find(o => o.from == nodeName)
		
		
                packetDelay = TICK * j
                finalPackets.push({
		    'from': from,
		    'to': to,
                    'xPosition': (from.position.split(',')[0] / 15)/data.elementsScale, 
                    'zPosition': (from.position.split(',')[1] / 15)/data.elementsScale, 
                    'toXPosition': (to.position.split(',')[0] / 15)/data.elementsScale,
                    'toZPosition': (to.position.split(',')[1] / 15)/data.elementsScale,
                    'duration': DURATION,
                    'packetDelay': packetDelay,
                    'id': packets[j].id,
                    'ip': packets[j].ip,
                    'eth': packets[j].eth,
                    'arp': packets[j].arp,
                    'dataInfo': packets[j].dataInfo,
                    'data': packets[j].data,		    
                    'tcp': packets[j].tcp,
                    'udp': packets[j].udp,
                    'icmp': packets[j].icmp,
                    'dns': packets[j].dns,
                    'http': packets[j].http		    
                })
		
		
                for (var d = 0; d < to.to.length; d++) {
                    if (to.to[d] != from.from){
                        secondFrom = to
                        secondTo = connectionsLinks.find(o => o.from === to.to[d])
			
                        packetDelay = TICK * j + DURATION
			
			finalPackets.push({
			    'from': secondFrom,
			    'to': secondTo,
                            'xPosition': (secondFrom.position.split(',')[0] / 15)/data.elementsScale, 
                            'zPosition': (secondFrom.position.split(',')[1] / 15)/data.elementsScale, 
                            'toXPosition': (secondTo.position.split(',')[0] / 15)/data.elementsScale,
                            'toZPosition': (secondTo.position.split(',')[1] / 15)/data.elementsScale,
                            'duration': DURATION,
                            'packetDelay': packetDelay,
                            'id': packets[j].id,
                            'ip': packets[j].ip,
                            'eth': packets[j].eth,
                            'arp': packets[j].arp,
                            'dataInfo': packets[j].dataInfo,
                            'data': packets[j].data,			    
                            'tcp': packets[j].tcp,
			    'udp': packets[j].udp,
			    'icmp': packets[j].icmp,
			    'dns': packets[j].dns,
			    'http': packets[j].http		    
                        })
		    }
                }
	    }
        } else { // broadcast frame
	    
            var from = connectionsLinks.find(o => o.hwaddr.includes(packets[j].src))
	    
	    i = from.hwaddr.findIndex(o => o == packets[j].src)
	    nodeName = from.to[i]
	    
	    to = connectionsLinks.find(o => o.from == nodeName)

	    
	    if ("arp" in packets[j] && packets[j]["arp"]["arp.opcode"] == "1"){ // arp request
		eth_src = packets[j]["eth"]["eth.src"]
		latest_arp_requests[eth_src] = {"next_ip_position": finalPackets.length}
	    }
	    
	    
	    if (to.from.startsWith('hub')){
                packetDelay = TICK * j
                finalPackets.push({
		    'from': from,
		    'to': to,
		    'xPosition': (from.position.split(',')[0] / 15)/data.elementsScale, 
		    'zPosition': (from.position.split(',')[1] / 15)/data.elementsScale, 
		    'toXPosition': (to.position.split(',')[0] / 15)/data.elementsScale,
		    'toZPosition': (to.position.split(',')[1] / 15)/data.elementsScale,
		    'duration': DURATION,
		    'packetDelay': packetDelay,
		    'id': packets[j].id,
		    'ip': packets[j].ip,
		    'eth': packets[j].eth,
		    'arp': packets[j].arp,
		    'dataInfo': packets[j].dataInfo,
		    'data': packets[j].data,			
		    'tcp': packets[j].tcp,
		    'udp': packets[j].udp,
		    'icmp': packets[j].icmp,
		    'dns': packets[j].dns,
		    'http': packets[j].http		    
                })
		
                for (var d = 0; d < to.to.length; d++) {
		    if (to.to[d] != from.from){
			
                        secondFrom = to
                        secondTo = connectionsLinks.find(o => o.from === to.to[d])
			
                        packetDelay = TICK * j + DURATION
			
			finalPackets.push({
			    'from': secondFrom,
			    'to': secondTo,
			    'xPosition': (secondFrom.position.split(',')[0] / 15)/data.elementsScale, 
			    'zPosition': (secondFrom.position.split(',')[1] / 15)/data.elementsScale, 
			    'toXPosition': (secondTo.position.split(',')[0] / 15)/data.elementsScale,
			    'toZPosition': (secondTo.position.split(',')[1] / 15)/data.elementsScale,
			    'duration': DURATION,
			    'packetDelay': packetDelay,
			    'id': packets[j].id,
			    'ip': packets[j].ip,
			    'eth': packets[j].eth,
			    'arp': packets[j].arp,
			    'dataInfo': packets[j].dataInfo,
			    'data': packets[j].data,				
			    'tcp': packets[j].tcp,
			    'udp': packets[j].udp,
			    'icmp': packets[j].icmp,
			    'dns': packets[j].dns,
			    'http': packets[j].http		    
                        })

		    }
                }
	    } else {

		packetDelay = TICK * j
		finalPackets.push({
		    'from': from,
		    'to': to,
		    'xPosition': (from.position.split(',')[0] / 15)/data.elementsScale, 
		    'zPosition': (from.position.split(',')[1] / 15)/data.elementsScale,
		    'toXPosition': (to.position.split(',')[0] / 15)/data.elementsScale,
		    'toZPosition': (to.position.split(',')[1] / 15)/data.elementsScale,
		    'duration': TICK,
		    'packetDelay': packetDelay,
		    'id': packets[j].id,
		    'ip': packets[j].ip,
		    'eth': packets[j].eth,
		    'arp': packets[j].arp,
		    'dataInfo': packets[j].dataInfo,
		    'data': packets[j].data,			
		    'tcp': packets[j].tcp,
		    'udp': packets[j].udp,
		    'icmp': packets[j].icmp,
		    'dns': packets[j].dns,
		    'http': packets[j].http		    
		})
		
	    }
	    
        }
    }
    

    create_animations(finalPackets)
}

function create_animations(finalPackets){
    last_packet_id = finalPackets.length - 1
    
    // --------- Create animations ----------
    scene = document.querySelector('#escena');
    for (var currentPacket = 0; currentPacket < finalPackets.length; currentPacket++) {
        var newPacket = document.createElement('a-entity');
        newPacket.setAttribute('packet','from', finalPackets[currentPacket].from.from);
        newPacket.setAttribute('packet','to', finalPackets[currentPacket].to.from);	
        newPacket.setAttribute('packet','xPosition', finalPackets[currentPacket].xPosition);
        newPacket.setAttribute('packet','yPosition', ' ' + SHIFT_Y + ' ');
        newPacket.setAttribute('packet','zPosition', finalPackets[currentPacket].zPosition);
        newPacket.setAttribute('packet','duration', finalPackets[currentPacket].duration);
        newPacket.setAttribute('packet','toXPosition', finalPackets[currentPacket].toXPosition);
        newPacket.setAttribute('packet','toYPosition', ' ' + SHIFT_Y + ' ');
        newPacket.setAttribute('packet','toZPosition', finalPackets[currentPacket].toZPosition);
        newPacket.setAttribute('packet','elementsScale', data.elementsScale);
        newPacket.setAttribute('packet','class', 'packetClass')
        newPacket.setAttribute('packet','id', currentPacket);
        newPacket.setAttribute('packet','start', finalPackets[currentPacket].packetDelay);

        
        if (finalPackets[currentPacket].ip){
	    newPacket.setAttribute('packet','ip', finalPackets[currentPacket].ip);
        }
        if (finalPackets[currentPacket].eth){
	    newPacket.setAttribute('packet','eth', finalPackets[currentPacket].eth);
        }
        if (finalPackets[currentPacket].arp){
	    newPacket.setAttribute('packet','arp', finalPackets[currentPacket].arp);
        }
        if (finalPackets[currentPacket].dataInfo){
	    newPacket.setAttribute('packet','dataInfo', finalPackets[currentPacket].dataInfo);
        }
        if (finalPackets[currentPacket].data){
	    newPacket.setAttribute('packet','data', finalPackets[currentPacket].data);
        }
        if (finalPackets[currentPacket].tcp){
	    newPacket.setAttribute('packet','tcp', finalPackets[currentPacket].tcp);
        }
        if (finalPackets[currentPacket].udp){
	    newPacket.setAttribute('packet','udp', finalPackets[currentPacket].udp);
        }
        if (finalPackets[currentPacket].icmp){
	    newPacket.setAttribute('packet','icmp', finalPackets[currentPacket].icmp);
        }
        if (finalPackets[currentPacket].dns){
	    newPacket.setAttribute('packet','dns', finalPackets[currentPacket].dns);
        }
        if (finalPackets[currentPacket].http){
	    newPacket.setAttribute('packet','http', finalPackets[currentPacket].http);
        }
	
        scene.appendChild(newPacket);

	finalPackets[currentPacket].newPacket = newPacket
    }
}


