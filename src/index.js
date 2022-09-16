/* global AFRAME */
if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}


//////////
// GLOBALS
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

//////////

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
	      tcp:"steelblue",
	      udp:"orchid",
	      icmp:"red",
	      ip:"LightGreen", // verde
	      arp:"sandybrown",
	      ethernet:"khaki"}



function isEndToEndVIEW() {
    return (VIEW == "APPLICATION" || VIEW == "APPLICATION+TRANSPORT");
}





AFRAME.registerComponent('selector', {
    init: function() {
        let scene = this.el

	// Header text
	let viewText = document.createElement('a-text');
	viewText.setAttribute('value', "VRNetVis")
	viewText.setAttribute('scale', '7 7 7');
	viewText.setAttribute('position', {x: -4, y: 27, z: 21 });
	viewText.setAttribute("color", "white")	
	scene.appendChild(viewText)

        let inmersiveText = document.createElement('a-entity');
        inmersiveText.setAttribute('html', '#inmersive-mode');
        inmersiveText.setAttribute('position', { x: -7 , y: 16, z: 30 });
        inmersiveText.setAttribute('scale', '30 30 30');
        inmersiveText.setAttribute('look-at', "[camera]");
        scene.appendChild(inmersiveText);

        let desktopText = document.createElement('a-entity');
        desktopText.setAttribute('html', '#web-mode');
        desktopText.setAttribute('position', { x: 7 , y: 16, z: 30 });
        desktopText.setAttribute('scale', '30 30 30');
        desktopText.setAttribute('look-at', "[camera]");
        scene.appendChild(desktopText);

	
        let inmersiveElement = document.createElement('a-entity');

        inmersiveElement.setAttribute('gltf-model', '#inmersive');
        inmersiveElement.setAttribute('position', '-7 7 30');
        inmersiveElement.setAttribute('scale', '10 10 10');
        scene.appendChild(inmersiveElement);
        inmersiveElement.addEventListener('click', function () {
	    viewing_mode = "vr"

	    desktopText.parentNode.removeChild(desktopText);
            inmersiveText.parentNode.removeChild(inmersiveText);
            desktopElement.parentNode.removeChild(desktopElement);
            inmersiveElement.parentNode.removeChild(inmersiveElement);
            scene.setAttribute('inmersiveMode', '');

        });

        let desktopElement = document.createElement('a-entity');

        desktopElement.setAttribute('gltf-model', '#desktop');
        desktopElement.setAttribute('position', '7 6 30');
        desktopElement.setAttribute('rotation', '0 -90 0');
        scene.appendChild(desktopElement);
        desktopElement.addEventListener('click', function () {
	    viewing_mode = "desktop"

	    desktopText.parentNode.removeChild(desktopText);
            inmersiveText.parentNode.removeChild(inmersiveText);
            inmersiveElement.parentNode.removeChild(inmersiveElement);
            desktopElement.parentNode.removeChild(desktopElement);

	    // Remove AR movement-controls
	    movementControls = document.querySelector('#movementControls')
	    movementControls.parentNode.removeChild(movementControls)

	    // Add camera
	    let camera = document.createElement('a-camera')
	    camera.setAttribute('position', {x: 0, y: 10, z: 45})
	    scene.appendChild(camera)

	    // Add controller
	    scene.setAttribute('controller', {'look-at': '[camera]', position: {x: 0, y: 16, z: 20 },  scale: "5 5 5", id: "controller", sound: {on: 'click', src: '#playPause', volume: 5}})

	    // Add network
            scene.setAttribute('network', {filename: 'netgui.nkp', elementsScale: 1, height: 1, connectionscolor: 'red'});

        });


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

	
	scene.setAttribute('controller', {'look-at': '[camera]', position: {x: -10, y: 16, z: -10 }, scale: "5 5 5", id: "controller", sound: {on: 'click', src: '#playPause', volume: 5}})
 	scene.setAttribute('network', {filename: 'netgui.nkp', elementsScale: 4, height: 6, connectionscolor: 'blue'});
	
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
function createViewSelector(position) {
    console.log("VIEWS_MENU: ")
    console.log(VIEWS_MENU)


    
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
	    if (viewing_mode == "vr")
		scene.setAttribute('network', {filename: 'netgui.nkp', elementsScale: 4, height: 6, connectionscolor: 'red'})
	    else // "desktop"
		scene.setAttribute('network', {filename: 'netgui.nkp', elementsScale: 1, height: 1, connectionscolor: 'blue'});



	    
	    
	    console.log ("new view: " + newView)
	}

	console.log("adding listener with " + VIEWS_MENU[i].view)
        viewSelectorApp.addEventListener('click', eventHandler.bind(null, VIEWS_MENU[i]));
	
        scene.appendChild(viewSelectorApp);

	// add text to menu
        let text = document.createElement('a-text');
        text.setAttribute('value', VIEWS_MENU[i].text)
        text.setAttribute('scale', '4 4 4');

	pos = Object.assign({}, position);
	pos.y += 2*i
	pos.x += 2
	//        text.setAttribute('position', {x: 22, y: 15 + 2*i, z: 20 });
        text.setAttribute('position', pos)
	text.setAttribute("color", "gray")	
	VIEWS_MENU[i].text = text

	
	scene.appendChild(text)


	// Header text
	let viewText = document.createElement('a-text');
	viewText.setAttribute('value', "Layers")
	viewText.setAttribute('scale', '5 5 5');

	pos = Object.assign({}, position);
	pos.y += 0.2 + 2*VIEWS_MENU.length
	viewText.setAttribute('position', pos)
	viewText.setAttribute("color", "white")	
	scene.appendChild(viewText)
	
	
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
        filename: {type: 'string', default: ''},
    },


    remove: function() {
//	clearInterval(interval_id)

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

	nodeList.length=0
	finalConnectionsLinks.length=0

	finalPackets.length=0
	flying.length=0
	

	console.log("network removed");
    },
    
    init: function() {
	console.log("init network")
	
	// // request netgui.nkp
        data = this.data
        scene = this.el
	
	// Store in globals
	nkp_filename = data.filename
	elementsScale=data.elementsScale
	
	createNetwork(nkp_filename, elementsScale)

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
    let h1 ='<h1 style="padding: 0rem 1rem; font-size: 1.4rem; font-weight: 900; ' +
        'font-family: monospace; text-align: left; color: ' + color + '">'
    let h2 ='<h2 style="padding: 0rem 1rem; font-size: 1.2rem; font-weight: 800; ' +
        'font-family: monospace; text-align: left; color: ' + color + '">'
    let h3 ='<h3 style="padding: 0rem 1rem 0rem 2rem; font-size: 1rem; font-weight: 700; ' + 
        'font-family: monospace; text-align: left; color: ' + color+ '">'

    info = '<p>' + h1 +  'Nivel DNS' + ' </h1> </p>'

    // It's a pure query
    if (packetParams.dns["dns.count.add_rr"] == 0 && packetParams.dns["dns.count.answers"] == 0){
        query_type=""

        if (packetParams.dns["dns.flags_tree"]["dns.flags.recdesired"] == "0")
            query_type= "(iterative)"
        else
            query_type= "(recursive)"

	info += '<p>' + h2 + 'Queries ' +  query_type + ': </h2></p>'

	for (const [key, value] of Object.entries(packetParams.dns.Queries))
	    info += '<p>' + h3 + 'Query: ' + key + ' </h3> </p>';
    }
    

    if (packetParams.dns["dns.count.answers"] != 0){
	info += '<p>' + h2 + 'Answers: <h2> </p>'	
	for (const [key, value] of Object.entries(packetParams.dns["Answers"]))
    	    info += '<p>' + h3 + key + '</h3></p>';
    }

    if (packetParams.dns["dns.count.add_rr"] != 0){
	
	info += '<p>' + h2 + 'Authoritative nameservers: </h2></p>'	
	for (const [key, value] of Object.entries(packetParams.dns["Authoritative nameservers"]))
    	    info += '<p>' + h3 + key + ' </h3></p>';
	
	info += '<p>' + h2 + 'Additional records: </h2></p>'		
	for (const [key, value] of Object.entries(packetParams.dns["Additional records"]))
            info += '<p>' + h3 + key + '</h3></p>';
    }

    
    return info;
}




function getColor(protocol){
    return COLORS[protocol];
}


function showRoutingTable(id, newInfoText, newBox){
    newInfoText.removeAttribute('html');

    var textTemplate = document.getElementById(id + '-template');
    
    newInfoText.setAttribute('html', '#' + id +  "routing_table" + '-template');

    
    newInfoText.setAttribute('visible', true);
    newBox.removeAttribute('sound');
    newBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
}


function showInfoText(protocol, packetParams, newInfoText, newBox){

    let infoText = ""
    color = getColor(protocol)
    let h1 ='<h1 style="padding: 0rem 1rem; font-size: 1.4rem; font-weight: 900; ' +
        'font-family: monospace; text-align: left; color: ' + color + '">'
    let h2 ='<h2 style="padding: 0rem 1rem; font-size: 1.2rem; font-weight: 800; ' + 
        'font-family: monospace; text-align: left; color: ' + color + '">'
    let h3 ='<h3 style="padding: 0rem 1rem 0rem 2rem; font-size: 1rem; font-weight: 700; ' +
        'font-family: monospace;  text-align: left; color: ' + color+ '">'

    switch (protocol){
    case 'dns':
	infoText += dns_info(packetParams);
	break;

    case 'http':
	infoText += '<p>' + h2 + ' Nivel HTTP:</h2></p>' 
	break;

    case 'dataInfo':
	infoText += '<p>' + h2 + 
            'DATOS:</h2></p>' + h3 + '<p>' + 
            'Info datos: '        + hex_with_colons_to_ascii(packetParams.tcp['tcp.payload']) + '</p><p>' +
            'Longitud de datos: ' + packetParams.tcp['tcp.len']                               + '</p></h3>'
	break;

    case 'data':
	if (packetParams.tcp != null)
	    infoText += '<p>' + h2 +
            'DATOS:</h2></p>' + h3 + '<p>' +
            'Info datos: ' + hex_with_colons_to_ascii(packetParams.tcp['tcp.payload']) + '</p><p>' + 
            'Longitud de datos: ' + packetParams.tcp['tcp.len']                        + '</p></h3>'
	else if (packetParams.udp != null)
	    infoText += '<p>' + h2 + 
            'DATOS:</h2></p>' + h3 + '<p>' +
            'Info datos: '        + hex_with_colons_to_ascii(packetParams.data) + '</p><p>' +  
            'Longitud de datos: ' + packetParams.udp['udp.length']              + '</p></h3>'
	break;

    case 'tcp':
	infoText += '<p>' + h2 + 
            'Nivel TCP:</h2></p>' + h3 + '<p>' +
            'Puerto origen: '  + packetParams.tcp['tcp.srcport'] + '</p><p>' + 
            'Puerto destino: ' + packetParams.tcp['tcp.dstport'] + '</p></h3>'
	break;

    case 'udp':
	infoText += '<p>' + h2 + 
            'Nivel UDP:</h2></p>' + h3 + '<p>' + 
            'Puerto origen: '  + packetParams.udp['udp.srcport'] + '</p><p>' + 
            'Puerto destino: ' + packetParams.udp['udp.dstport'] + '</p></h3>'
	break;

    case 'icmp':
	infoText += '<p>' + h2 + 
            'Nivel ICMP:</h2></p>' + h3 + '<p>' +
            'Type: ' + packetParams.icmp['icmp.type'] + '</p><p>' +  
            'Code: ' + packetParams.icmp['icmp.code'] + '</p></h3>'
	break;

    case 'ip':
	infoText += '<p>' + h2 + 
            'Nivel IP:</h2></p>' + h3 + '<p>' + 
            'Origen: '  + packetParams.ip['ip.src']  + '</p><p>' + 
            'Destino: ' + packetParams.ip['ip.dst']  + '</p><p>' + 
            'TTL: '     + packetParams.ip['ip.ttl']  + '</p></h3>'
	break;

    case 'arp': 
        operation=""


        if (packetParams.arp['arp.opcode'] == "1")
            operation="Solicitud"
        else
            operation="Respuesta"

	infoText += '<p>' + h2 + 
            'Nivel ARP:</h2></p>' + h3 + '<p>' + 
            'Origen: '    + packetParams.arp['arp.src.hw_mac']     + '</p><p>' + 
            'Destino: '   + packetParams.arp['arp.dst.hw_mac']     + '</p><p>' +  
            'Operación: ' + operation                              + '</p><p>' +
            'Target: '    + packetParams.arp['arp.dst.proto_ipv4'] + '</p></h3>'
	break;

    case 'ethernet':
	infoText += '<p>' + h2 + 
            'Nivel Ethernet:</h2></p>' + h3 + '<p>' + 
            'Origen: '  + packetParams.eth['eth.src']  + '</p><p>' +  
            'Destino: ' + packetParams.eth['eth.dst']  + '</p><p>' +  
            'Tipo: '    + packetParams.eth['eth.type'] + '</p></h3>'

	break;
    }
    
    
    newInfoText.setAttribute('visible', true);
    newInfoText.removeAttribute('html');
    var textTemplate = document.getElementById(packetParams.id + '-template');
    textTemplateContent = infoText 
    textTemplate.innerHTML = textTemplateContent;

    textTemplate.style = "display: inline-block; background: #5f6a76; color: purple; border-radius: 1em; padding: 1em; margin:0;"
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
        yPosition: {type: 'number', default: 1},
        zPosition: {type: 'number', default: 0},
        toXPosition: {type: 'string', default: ''},
        toYPosition: {type: 'string', default:  ' 1 '},
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

    startAnimation: function (park=false) {
        let packet = this.el
        let packetParams = this.data

        
        packet.setAttribute('geometry', {primitive: 'cylinder', 'height': 0.4/packetParams.elementsScale, radius: 0.4/packetParams.elementsScale });


	let topmost_protocol = "";
	if(packetParams.dns){
	    topmost_protocol = "dns"
	}else if(packetParams.http){
	    topmost_protocol = "http"
	}else if(packetParams.dataInfo){
	    topmost_protocol = "dataInfo"                        
	}else if(packetParams.data){
	    topmost_protocol = "data"                        
	}else if(packetParams.tcp){
	    topmost_protocol = "tcp"                        
	}else if(packetParams.udp){
	    topmost_protocol = "udp"                        
	}else if(packetParams.icmp){
	    topmost_protocol = "icmp"                        
	}else if(packetParams.ip){
	    topmost_protocol = "ip"                        
	}else if(packetParams.arp){
	    topmost_protocol = "arp"                        
	}else if(packetParams.eth){
	    topmost_protocol = "ethernet"                        
        }

	let packetColor = getColor(topmost_protocol);
	
        packet.setAttribute('material', 'color', packetColor);
        packet.setAttribute('position', { x: packetParams.xPosition, y: packetParams.yPosition, z: packetParams.zPosition });
        packet.setAttribute('class', packetParams.class);
        packet.setAttribute('sound', {src: '#packetIn', volume: 5, autoplay: "true"});
        packet.setAttribute('id', packetParams.id);



        let levels = {}
        let isClosedInfo = false
        let actualInfoShown = topmost_protocol;

        var htmltemplates = document.getElementById("htmltemplates");
        var newSectionTemplate = document.createElement("section");
        newSectionTemplate.style = "display: inline-block; background: #EEEEEE; color: purple; border-radius: 1em; padding: 1em; margin:0;"
        newSectionTemplate.id = packetParams.id + '-template'
        htmltemplates.appendChild(newSectionTemplate);

        let newInfoText = document.createElement('a-entity');
        
        newInfoText.setAttribute('position', { x: 5 , y: 3, z: 0 });
        newInfoText.setAttribute('look-at', "[camera]");
        newInfoText.setAttribute('visible', false);
        newInfoText.setAttribute('scale', {x: 20, y: 20, z: 20});
        newInfoText.setAttribute('isPoster', true); 

        packet.appendChild(newInfoText);


	
        if(packetParams.eth){
            const ethInfo = {
                eth: packetParams.eth
            }
            levels = Object.assign(levels,ethInfo);
        }
        if(packetParams.ip){
            const ipInfo = {
                ip: packetParams.ip
            }
            levels = Object.assign(levels,ipInfo);
        }
        if(packetParams.arp){
            const arpInfo = {
                arp: packetParams.arp
            }
            levels = Object.assign(levels,arpInfo);
        }
        if(packetParams.icmp){
            const icmpInfo = {
                icmp: packetParams.icmpInfo
            }
            levels = Object.assign(levels,icmpInfo);
        }
        if(packetParams.tcp){
            const tcpInfo = {
                tcp: packetParams.tcpInfo
            }
            levels = Object.assign(levels,tcpInfo);
        }
        if(packetParams.udp){
            const udpInfo = {
                udp: packetParams.udpInfo
            }
            levels = Object.assign(levels,udpInfo);
        }
        if(packetParams.http){
            const httpInfo = {
                http: packetParams.httpInfo
            }
            levels = Object.assign(levels,httpInfo);
        }
        if(packetParams.dns){
            const dnsInfo = {
                dns: packetParams.dns
            }
            levels = Object.assign(levels,dnsInfo);
        }
        if(packetParams.dataInfo){
            const dataInfo = {
                dataInfo: packetParams.dataInfo
            }
            levels = Object.assign(levels,dataInfo);
        }
        if(packetParams.data){
            const data = {
                data: packetParams.data
            }
            levels = Object.assign(levels,data);
        }
        
        if(levels.hasOwnProperty('eth') && 	!isEndToEndVIEW()){
            index = Object.keys(levels).findIndex(item => item === 'eth')

            let newEthBox = document.createElement('a-box');
	    newEthBox.setAttribute('animation__eth', {property: 'scale', from: {x: 0.5*packetParams.elementsScale, y: 0.5*packetParams.elementsScale, z: 0.5*packetParams.elementsScale}, to: {x: packetParams.elementsScale, y: packetParams.elementsScale, z: packetParams.elementsScale}, dur: '500', easing: 'linear', "loop": "5", startEvents: "eth"})

	    packet.ethBox = newEthBox
	    
	    
	    newEthBox.setAttribute('position', { x: 0, y:  2 + (index), z: 0 });
            newEthBox.setAttribute('color', getColor("ethernet"));
            newEthBox.setAttribute('visible', true); 

            packet.appendChild(newEthBox);

	    if (topmost_protocol == "ethernet")
		showInfoText("ethernet", packetParams, newInfoText, newEthBox)
	    

            newEthBox.addEventListener('mouseenter', function () {
                newEthBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
            });
            newEthBox.addEventListener('mouseleave', function () {
                newEthBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                newEthBox.removeAttribute('animation');
                newEthBox.setAttribute('rotation', {x: 0, y: 0, z: 0 });
            });
            newEthBox.addEventListener('click', function () {
                if(isClosedInfo == false && actualInfoShown == "ethernet"){
		    isClosedInfo = true
                    actualInfoShown = ''
                    newInfoText.setAttribute('visible', false);
                    newEthBox.removeAttribute('sound');
                    newInfoText.removeAttribute('html');
                    newEthBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                }else{
                    isClosedInfo = false
		    actualInfoShown = "ethernet"
		    showInfoText("ethernet", packetParams, newInfoText, newEthBox);
                }
		
            });
        }
        if(levels.hasOwnProperty('ip') && 	!isEndToEndVIEW()){
            index = Object.keys(levels).findIndex(item => item === 'ip')
	    let newIpBox = document.createElement('a-box');
            newIpBox.setAttribute('position', { x: 0, y: 2 + (index), z: 0 });
            newIpBox.setAttribute('color', getColor("ip"));
            newIpBox.setAttribute('visible', true); 

            packet.appendChild(newIpBox);

	    if (topmost_protocol == "ip")
		showInfoText("ip", packetParams, newInfoText, newIpBox)
	    
	    
            newIpBox.addEventListener('mouseenter', function () {
                newIpBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
            });
            newIpBox.addEventListener('mouseleave', function () {
                newIpBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                newIpBox.removeAttribute('animation');
                newIpBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
            });
            newIpBox.addEventListener('click', function () {


                if(isClosedInfo == false && actualInfoShown == 'ip'){
                    actualInfoShown = ''
                    newInfoText.setAttribute('visible', false);
                    newIpBox.removeAttribute('sound');
                    newInfoText.removeAttribute('html');
                    newIpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                }else{
                    isClosedInfo = false
		    actualInfoShown = "ip"
		    showInfoText("ip", packetParams, newInfoText, newIpBox);

                }
                
            });
        }
        if(levels.hasOwnProperty('arp') && 	!isEndToEndVIEW()){
            index = Object.keys(levels).findIndex(item => item === 'arp')
            let newArpBox = document.createElement('a-box');
            newArpBox.setAttribute('position', { x: 0, y: 2 +(index), z: 0 });
            newArpBox.setAttribute('color', getColor("arp"));
            newArpBox.setAttribute('visible', true);
            packet.appendChild(newArpBox);

	    if (topmost_protocol == "arp")
		showInfoText("arp", packetParams, newInfoText, newArpBox)

	    
            newArpBox.addEventListener('mouseenter', function () {
                newArpBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
            });
            newArpBox.addEventListener('mouseleave', function () {
                newArpBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                newArpBox.removeAttribute('animation');
                newArpBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
            });
            newArpBox.addEventListener('click', function () {


                if(isClosedInfo == true){
                    isClosedInfo = false
                    actualInfoShown = 'arp'
		    showInfoText("arp", packetParams, newInfoText, newArpBox);
                }else if(isClosedInfo == false && actualInfoShown == 'arp'){
		    isClosedInfo = true
                    actualInfoShown = ''
                    newInfoText.setAttribute('visible', false);
                    newArpBox.removeAttribute('sound');
                    newInfoText.removeAttribute('html');
                    newArpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                }else if(isClosedInfo == false){
		    actualInfoShown = "arp"
		    showInfoText("arp", packetParams, newInfoText, newArpBox);
                }

                
            });
        }
        if(levels.hasOwnProperty('tcp')){
            index = Object.keys(levels).findIndex(item => item === 'tcp')
            let newTcpBox = document.createElement('a-box');
            newTcpBox.setAttribute('position', { x: 0, y: 2 + (index), z: 0 });
            newTcpBox.setAttribute('color', getColor("tcp"));
            newTcpBox.setAttribute('visible', true); 
            packet.appendChild(newTcpBox);

	    if (topmost_protocol == "tcp")
		showInfoText("tcp", packetParams, newInfoText, newTcpBox)
	    
            newTcpBox.addEventListener('mouseenter', function () {
                newTcpBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
            });
            newTcpBox.addEventListener('mouseleave', function () {
                newTcpBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                newTcpBox.removeAttribute('animation');
                newTcpBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
            });
            newTcpBox.addEventListener('click', function () {

                if(isClosedInfo == false && actualInfoShown == 'tcp'){
                    actualInfoShown = ''
                    newInfoText.setAttribute('visible', false);
                    newTcpBox.removeAttribute('sound');
                    newInfoText.removeAttribute('html');
                    newTcpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                }else {
                    isClosedInfo = false
		    actualInfoShown = "tcp"
		    showInfoText("tcp", packetParams, newInfoText, newTcpBox);				    
		    
                }

                
            });
        }
        if(levels.hasOwnProperty('udp')){
            index = Object.keys(levels).findIndex(item => item === 'udp')
            let newUdpBox = document.createElement('a-box');
            newUdpBox.setAttribute('position', { x: 0, y: 2 + (index), z: 0 });
            newUdpBox.setAttribute('color', getColor("udp"));
            newUdpBox.setAttribute('visible', true);
            packet.appendChild(newUdpBox);

	    if (topmost_protocol == "udp")
		showInfoText("udp", packetParams, newInfoText, newUdpBox)

            newUdpBox.addEventListener('mouseenter', function () {
                newUdpBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
            });
            newUdpBox.addEventListener('mouseleave', function () {
                newUdpBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                newUdpBox.removeAttribute('animation');
                newUdpBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
            });
            newUdpBox.addEventListener('click', function () {


                if(isClosedInfo == false && actualInfoShown == 'udp'){
                    actualInfoShown = ''
                    newInfoText.setAttribute('visible', false);
                    newUdpBox.removeAttribute('sound');
                    newInfoText.removeAttribute('html');
                    newUdpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                }else{
                    isClosedInfo = false
                    actualInfoShown = 'udp'
		    showInfoText("udp", packetParams, newInfoText, newUdpBox);
                }
                
            });
        }
        if(levels.hasOwnProperty('dns')){
            index = Object.keys(levels).findIndex(item => item === 'dns')
            let newDnsBox = document.createElement('a-box');
            newDnsBox.setAttribute('position', { x: 0, y: 2 + (index), z: 0 });
            newDnsBox.setAttribute('color', getColor("dns"));
            newDnsBox.setAttribute('visible', true); 
            packet.appendChild(newDnsBox);

	    if (topmost_protocol == "dns")
		showInfoText("dns", packetParams, newInfoText, newDnsBox)
	    
            newDnsBox.addEventListener('mouseenter', function () {
                newDnsBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
            });
            newDnsBox.addEventListener('mouseleave', function () {
                newDnsBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                newDnsBox.removeAttribute('animation');
                newDnsBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
            });
            newDnsBox.addEventListener('click', function () {

                if(isClosedInfo == false && actualInfoShown == 'dns'){
                    actualInfoShown = ''
                    newInfoText.setAttribute('visible', false);
                    newDnsBox.removeAttribute('sound');
                    newInfoText.removeAttribute('html');
                    newDnsBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                }else {
                    isClosedInfo = false
                    actualInfoShown = 'dns';
		    showInfoText("dns", packetParams, newInfoText, newDnsBox);				    
                }

                
            });
        }
        if(levels.hasOwnProperty('http')){
            index = Object.keys(levels).findIndex(item => item === 'http')
            let newHttpBox = document.createElement('a-box');
            newHttpBox.setAttribute('position', { x: 0, y: 2 + (index), z: 0 });
            newHttpBox.setAttribute('color', getColor("http"));
            newHttpBox.setAttribute('visible', true); 

            packet.appendChild(newHttpBox);

	    if (topmost_protocol == "http")
		showInfoText("http", packetParams, newInfoText, newHttpBox)
	    
            newHttpBox.addEventListener('mouseenter', function () {
                newHttpBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
            });
            newHttpBox.addEventListener('mouseleave', function () {
                newHttpBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                newHttpBox.removeAttribute('animation');
                newHttpBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
            });
            newHttpBox.addEventListener('click', function () {


                if(isClosedInfo == false && actualInfoShown == 'http'){
                    actualInfoShown = ''
                    newInfoText.setAttribute('visible', false);
                    newHttpBox.removeAttribute('sound');
                    newInfoText.removeAttribute('html');
                    newHttpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                }else {
                    isClosedInfo = false
                    actualInfoShown = 'http';
		    showInfoText("http", packetParams, newInfoText, newHttpBox);				    				    
                }
                
            });
        }
        if(levels.hasOwnProperty('icmp')){
            index = Object.keys(levels).findIndex(item => item === 'icmp')
            let newIcmpBox = document.createElement('a-box');
            newIcmpBox.setAttribute('position', { x: 0, y: 2 + (index), z: 0 });
            newIcmpBox.setAttribute('color', getColor("icmp"));
            newIcmpBox.setAttribute('visible', true); 

            packet.appendChild(newIcmpBox);

	    if (topmost_protocol == "icmp")
		showInfoText("icmp", packetParams, newInfoText, newIcmpBox)
	    
            newIcmpBox.addEventListener('mouseenter', function () {
                newIcmpBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
            });
            newIcmpBox.addEventListener('mouseleave', function () {
                newIcmpBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                newIcmpBox.removeAttribute('animation');
                newIcmpBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
            });
            newIcmpBox.addEventListener('click', function () {
                if(isClosedInfo == false && actualInfoShown == 'icmp'){
                    actualInfoShown = ''
                    newInfoText.setAttribute('visible', false);
                    newIcmpBox.removeAttribute('sound');
                    newInfoText.removeAttribute('html');
                    newIcmpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                }else {
                    isClosedInfo = false
                    actualInfoShown = 'icmp'
		    showInfoText("icmp", packetParams, newInfoText, newIcmpBox);				    				    	                          }
                
            });
        }
	
	// TCP data
        if(levels.hasOwnProperty('dataInfo')){
            index = Object.keys(levels).findIndex(item => item === 'dataInfo')
            let newDataBox = document.createElement('a-box');
            newDataBox.setAttribute('position', { x: 0, y: 2 +(index), z: 0 });
            newDataBox.setAttribute('color', getColor("dataInfo"));
            newDataBox.setAttribute('visible', true); 

            packet.appendChild(newDataBox);

	    if (topmost_protocol == "dataInfo")
		showInfoText("dataInfo", packetParams, newInfoText, newDataBox)
	    
            newDataBox.addEventListener('mouseenter', function () {
                newDataBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
            });
            newDataBox.addEventListener('mouseleave', function () {
                newDataBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                newDataBox.removeAttribute('animation');
                newDataBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
            });
            newDataBox.addEventListener('click', function () {

		if(isClosedInfo == false && actualInfoShown == 'dataInfo'){
                    actualInfoShown = ''
                    newInfoText.setAttribute('visible', false);
                    newDataBox.removeAttribute('sound');
                    newInfoText.removeAttribute('html');
                    newDataBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                }else {
                    isClosedInfo = false;
                    actualInfoShown = 'dataInfo';
		    showInfoText("icmp", packetParams, newInfoText, newIcmpBox);				    				    	                              }
            });
        }

	// TCP or UDP data
        if(levels.hasOwnProperty('data')){
            index = Object.keys(levels).findIndex(item => item === 'data')
            let newDataBox = document.createElement('a-box');
            newDataBox.setAttribute('position', { x: 0, y: 2 +(index), z: 0 });
            newDataBox.setAttribute('color', getColor("data"));
            newDataBox.setAttribute('visible', true); 

            packet.appendChild(newDataBox);


	    if (topmost_protocol == "data")
		showInfoText("data", packetParams, newInfoText, newDataBox)

	    
            newDataBox.addEventListener('mouseenter', function () {
                newDataBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
            });
            newDataBox.addEventListener('mouseleave', function () {
                newDataBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                newDataBox.removeAttribute('animation');
                newDataBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
            });
            newDataBox.addEventListener('click', function () {
		if (levels.hasOwnProperty('udp'))
                    infoText = '<p>DATOS:</p><p>Info datos: ' + hex_with_colons_to_ascii(packetParams.data) + '</p><p>Longitud de datos: ' + packetParams.udp['udp.length'] + '</p>'
		else if (levels.hasOwnProperty('tcp'))
                    infoText = '<p>DATOS:</p><p>Info datos: ' + hex_with_colons_to_ascii(packetParams.tcp['tcp.payload']) + '</p><p>Longitud de datos: ' + packetParams.tcp['tcp.len'] + '</p>'
		

                if(isClosedInfo == false && actualInfoShown == 'data'){
                    actualInfoShown = ''
                    newInfoText.setAttribute('visible', false);
                    newDataBox.removeAttribute('sound');
                    newInfoText.removeAttribute('html');
                    newDataBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                }else{
                    isClosedInfo = false
                    actualInfoShown = 'data'
		    showInfoText("data", packetParams, newInfoText, newDataBox);				    
                }

            });
        }
	


	var nodeAnimationTo = document.getElementById(packetParams.to);
	var nodeAnimationFrom = document.getElementById(packetParams.from);	

	
        var packet_move = document.getElementById(packetParams.id);
	console.log("packet_move")
	console.log(packet_move)


        packet_move.setAttribute('animation__park', {
            property: 'position',
            to: {x: packetParams.xPosition, y: packetParams.yPosition, z: packetParams.zPosition},
            to: {x: packetParams.xPosition, y: packetParams.yPosition +5, z: packetParams.zPosition},
            dur: packetParams.duration,
            pauseEvents:'animation-pause', 
            resumeEvents:'animation-resume',
	    startEvents: "park",
            easing: 'linear',
	    enabled: 'false' // if not false, when resumed it starts. A bug.	    	    
        });
	
        packet_move.setAttribute('animation__out_of_node', {
            property: 'scale',
            from: "0 0 0",
	    to: "2 2 2",
            dur: packetParams.duration/2,
            pauseEvents:'animation-pause', 
            resumeEvents:'animation-resume',
	    startEvents: "out_of_node",
            easing: 'linear',
	    enabled: 'false' // if not false, when resumed it starts. A bug.	    
        });

        packet_move.setAttribute('animation__link', {
            property: 'position',
            to: packetParams.toXPosition + packetParams.toYPosition + packetParams.toZPosition,
            dur: packetParams.duration,
            easing: 'easeInOutQuart',
	    startEvents: "link",
            pauseEvents:'animation-pause', 
            resumeEvents:'animation-resume',
	    enabled: 'false' // if not false, when resumed it starts. A bug.
        });
	

        packet_move.setAttribute('animation__into_node_final', {
            property: 'scale',
            to: {x: 0, y: 0, z: 0},
            dur: packetParams.duration/2,
            easing: 'linear',
	    startEvents: 'into_node_final',
            pauseEvents:'animation-pause', 
            resumeEvents:'animation-resume',
	    enabled: 'false' // if not false, when resumed it starts. A bug.
        });

        packet_move.setAttribute('animation__into_node', {
            property: 'scale',
            to: {x: 0.5*packetParams.elementsScale, y: 0.5*packetParams.elementsScale, z: 0.5*packetParams.elementsScale},
            dur: packetParams.duration/2,
            easing: 'linear',
	    startEvents: 'into_node',
            pauseEvents:'animation-pause', 
            resumeEvents:'animation-resume',
	    enabled: 'false' // if not false, when resumed it starts. A bug.
        });

	

	
	if (park){
	    packet_move.setAttribute("animation__out_of_node", {enabled: 'true'})
	    let a_promise = anime(packet_move, 'out_of_node')
	    	.then(() => packet_move.setAttribute("animation__park", {enabled: 'true'}))
	    	.then(() => anime(packet_move, 'park'))
	    
	    return a_promise;
	}

	packet_move.setAttribute("animation__out_of_node", {enabled: 'true'})
	anime(packet_move, 'out_of_node')
	    .then(() => packet_move.setAttribute("animation__link", {enabled: 'true'}))
	    .then(() => anime(packet_move, 'link'))
	    .then(() => {
		packet_move.setAttribute("animation__into_node", {enabled: 'true'})
		packet_move.setAttribute("animation__into_node_final", {enabled: 'true'})
	    })
	    .then(() => animate_packet_arrives(nodeAnimationTo, packetParams, packet))



	
    },			 

    
    init: function () {
	let packet = this.el
	let packetParams = this.data
	
	// 	scene.removeAttribute("network")
	if (viewing_mode == "vr")
	    scene.setAttribute('network', {filename: 'netgui.nkp', elementsScale: 4, height: 6, connectionscolor: 'red'})
	else
	    scene.setAttribute('network', {filename: 'netgui.nkp', elementsScale: 1, height: 1, connectionscolor: 'red'})		    
    }
});

function destroy_packet_anim(packet){
    // Destroy packet element
    longitud = packet.children.length

    for (var a=0; a < longitud; a++) {
	packet.children[0].remove()
    }
    packet.parentNode.removeChild(packet);
}

function next_packet_anim(packetParams) {
    console.log ("next_packet_anim()")
    // inform controller
    let playButton = document.querySelector("#playButton");
    console.log("playButton.emit with start == " + packetParams.start)
    playButton.emit("next", {start: packetParams.start}, false)
};


const anime = (target, animation_name) =>
      new Promise((resolve) =>
		  {
		      target.addEventListener('animationcomplete__' + animation_name, resolve)		      
		      target.emit(animation_name, null, false);
		  });



function animate_packet_arrives (nodeAnimation, packetParams, packet){
    let nodeName = packetParams.to
        
    
    if((nodeName.startsWith('pc') || nodeName.startsWith('dns') || nodeName.startsWith('r'))
       && VIEWS=="ALL"){
	//	nodeAnimation.setAttribute("model-opacity", 0.1)
	
	
	anime(packet.ethBox, 'eth')
	    .then(() => packet.ethBox.setAttribute('visible', 'false'))
	    .then(() => {
		if (packet.id == finalPackets.length - 1) {
		    // Animation is finished, clean up
		    animationState = "INIT";
		    showViews()
		}

		next_packet_anim(packetParams)
		destroy_packet_anim(packet)
	    })

	
    }else 
	anime(packet, 'into_node_final')
	.then (() => {
	    if (packet.id == finalPackets.length - 1) {
		// Animation is finished, clean up
		animationState = "INIT";
		showViews()
	    }
	    
	    next_packet_anim(packetParams)
	    destroy_packet_anim(packet)
	})
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




CURRENT_TIME=0
latest_start = -2

AFRAME.registerComponent('controller', {

    schema: {
        PERIOD: {type: 'int', default: '500'},
	position: {type: 'vec3'}
    },

    do_animate: function(event)
    {
	console.log("do_animate()")
	console.log("latest_start: " + latest_start)
	console.log("event.detail.start: " + event.detail.start)

	
	// if (animationState == "PAUSED")
	//     return

	if (latest_start == event.detail.start)
	    return
	latest_start = event.detail.start
	
	console.log("do_animate: " + CURRENT_TIME)
	console.log("flying.length: " + flying.length)	

	let packets_ready = false



	while (next_packet < finalPackets.length && !packets_ready){
	    CURRENT_TIME += 500

	    while (next_packet < finalPackets.length && finalPackets[next_packet].packetDelay <= CURRENT_TIME){

		next_ip_position = finalPackets[next_packet].next_ip_position
		
		if (next_ip_position){
		    console.log("Before promise: " + next_packet)
		    let promise = Promise.resolve()
		    let nextIPPacket = finalPackets[next_ip_position].newPacket.components.packet
		    promise = nextIPPacket.startAnimation(true)
		    flying.push(finalPackets[next_ip_position].newPacket)		    

		    promise.then(() => {
			console.log("promise.then, next_packet: " + next_packet)

			let newPacket = finalPackets[next_packet].newPacket.components.packet
			newPacket.startAnimation()
			flying.push(finalPackets[next_packet].newPacket)
			next_packet += 1
			packets_ready = true

		    })

		    return

		}
		else {
		    console.log("next_packet: " + next_packet)
		    let newPacket = finalPackets[next_packet].newPacket.components.packet
		    newPacket.startAnimation()
		    flying.push(finalPackets[next_packet].newPacket)

		    next_packet += 1		    
		    packets_ready = true
		}
		
	    }
	}
	
    },
    
    
    init: function() {
	console.log("init controller")
    
	let PERIOD=this.data.PERIOD
	let do_animate=this.do_animate


	
	function event_listener_function(event) {
	    console.log("controller click")
	    
            switch(animationState) {
            case 'INIT':
		hideViews()
		
		scene.removeAttribute("network")
		if (viewing_mode == "vr")
		    scene.setAttribute('network', {filename: 'netgui.nkp', elementsScale: 4, height: 6, connectionscolor: 'red'})
		else // "desktop"
		    scene.setAttribute('network', {filename: 'netgui.nkp', elementsScale: 1, height: 1, connectionscolor: 'red'})
		
		playButton.setAttribute('color', 'gray')
		
		next_packet = 0

		CURRENT_TIME = 0
		
		animationState = "MOVING"

		// Initiate animation
		//setTimeout(do_animate(0), 500)

		// inform controller
		playButton = document.querySelector("#playButton");
		setTimeout(()=>{playButton.emit("next", {start: -1}, false)}, 500)

		
		break

            case 'MOVING':
		animationState = "PAUSED"

		playButton.setAttribute('color', 'gray')

		
		// Enviar a los paquetes en vuelo animation-pause
		console.log("PAUSED: Packets flying: ")
		for (const packet of flying){
		    packet.emit("animation-pause", null, false)
		}
		
		break;
		
            case 'PAUSED':
		animationState = "MOVING"

		playButton.setAttribute('color', 'gray')

		// Enviar a los paquetes en vuelo animation-resume
		console.log("RESUMED: Packets flying: ")
		for (const packet of flying){
		    packet.emit("animation-resume", null, false)		
		}
		
		break
	    } // switch

	}


	// play button
	playButton = document.createElement('a-entity');

	playButton.addEventListener('next', do_animate)
	
        playButton.setAttribute('gltf-model', '#play_button');
	playButton.setAttribute('rotation', {x: -30, y: 0, z: 0 });
	let position = Object.assign({}, this.data.position)
	position.x = position.x + 35
        playButton.setAttribute('position', position);
        playButton.setAttribute('color', 'orange');
        playButton.setAttribute('scale', '4.5 4.5 4.5');
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

	let scene = document.querySelector("#escena")
	scene.appendChild(playButton);

	playButton.addEventListener('click', event_listener_function)



	
	// Header text for PlayPause button
	let viewText = document.createElement('a-text');
	viewText.setAttribute('value', "Play / Pause")
	viewText.setAttribute('scale', '5 5 5');
	position.y += 3
	position.x -= 3
	viewText.setAttribute('position', position);
	viewText.setAttribute("color", "white")	
	scene.appendChild(viewText)



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

	function reset(){
	    animationState="INIT"
	    showViews()
     	    scene.removeAttribute("network")
	    if (viewing_mode == "vr")
		scene.setAttribute('network', {filename: 'netgui.nkp', elementsScale: 4, height: 6, connectionscolor: 'red'})
	    else
		scene.setAttribute('network', {filename: 'netgui.nkp', elementsScale: 1, height: 1, connectionscolor: 'red'});
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
	let f = createViewSelector.bind(null, position)
        requestViewsMenuFile.onload = function() {
            response = requestViewsMenuFile.response;
            VIEWS_MENU = JSON.parse(response);
	    f();
	}


        let infoPanel = document.createElement('a-entity');
        infoPanel.setAttribute('html', '#info-panel');
	position = Object.assign({}, this.data.position)
	position.x -= 20
        infoPanel.setAttribute('position', position);
        infoPanel.setAttribute('scale', '30 30 30');
        infoPanel.setAttribute('id', 'infoPanel');
        infoPanel.setAttribute('look-at', "[camera]");
        scene.appendChild(infoPanel);
	
	
    }
    
});
			 


function createNetwork(filename, elementScale){
    // initialize global variables
    nodeList.length = 0
    finalConnectionsLinks.length = 0



    
    // request netgui.nkp
    file = filename
    request = new XMLHttpRequest();
    request.open('GET', file);
    request.responseType = 'text';
    request.send();

    request.onload = function() {
        response = request.response;
        response.split('<nodes>')
        nodes = response.split('position')

        // Establecemos los diferentes nodos de la escena que quedan almacenados en nodeList
        createNodes(nodes, nodeList, elementScale)


	// Request and process machineNames.json
	
        // Asociamos a cada nodo su nombre de máquina
        machineNamesFile = 'machineNames.json'
        requestMachineNames = new XMLHttpRequest();
        requestMachineNames.open('GET', machineNamesFile);
        requestMachineNames.responseType = 'text';
        requestMachineNames.send();
        requestMachineNames.onload = function() {
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
	    console.log("finalConnectionsLinks en createNetwork:")
	    console.log(finalConnectionsLinks)		


	    // show routing tables
	    for (var k=0; k < nodeList.length; k++) {
		node = nodeList[k];
		
		if(!node.name.startsWith('hub')){
		    coordinates = { x: ((node.position.split(',')[0] / 15) -1.5)/data.elementsScale, y: data.height, z: (node.position.split(',')[1] / 15)/data.elementsScale }
		    node.routingTableText =
			createRoutingTableInfo(node.name + "routing_table", coordinates, data.elementsScale, formatRoutingTable(node.routing_table))

		}
	    }
	    
	    loadAndAnimatePackets(finalConnectionsLinks);
	}


    }
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
	    console.log("finalConnectionsLinks en loadAndAnimatePackets:")
	    console.log(finalConnectionsLinks)	    
	    
	    animateEndToEndPackets(packets, finalConnectionsLinks, data)
	    console.log("isEndToEndVIEW")
	}
	else{
	    animatePackets(packets, finalConnectionsLinks, data)
	    console.log("! isEndToEndVIEW")
	}
    }
}

function formatRoutingTable(routing_table){
    text = '<table style="border-spacing: 1rem; text-align: center">' +
        '<tr><th>Destination</th>' +
        '<th>Mask</th>' +
        '<th> Gateway</th>' +
        '<th>Iface</th>' +
        '</tr>'
    
    for (var i = 0; i < routing_table.length; i++){
	text += "<tr>" +
            "<td>" + routing_table[i][0] + "</td> " +
            "<td>" + routing_table[i][1] + "</td> " +
      	    "<td>" + routing_table[i][2] + "</td> " +
	    "<td>" + routing_table[i][3] + "</td> " +
	    "</tr>"
    }

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
	
	console.log("deleting node: " + nodeList[i].name)	

	// Destroy node's text
	scene.removeChild(nodeList[i].text)

	// Destroy node's routingTableText
	if(!nodeList[i].name.startsWith('hub')){
            scene.removeChild(nodeList[i].routingTableText)
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
	
	coordinates = { x: ((newNode.position.split(',')[0] / 15) -1.5)/elementsScale, y: data.height, z: (newNode.position.split(',')[1] / 15)/elementsScale }	
        if(newNode.name.startsWith('pc') || newNode.name.startsWith('dns')){
            newNodeElement.setAttribute('gltf-model', '#computer');
            newNodeElement.setAttribute('position', { x: (newNode.position.split(',')[0] / 15)/elementsScale, y: data.height, z: (newNode.position.split(',')[1] / 15)/elementsScale });
            newNodeElement.setAttribute('id', newNode.name);
            newNodeElement.setAttribute('scale', {x: 0.006/elementsScale, y: 0.006/elementsScale, z: 0.006/elementsScale});
            newNodeElement.setAttribute('rotation', '0 -90 0');
        }else if(newNode.name.startsWith('hub')){
            newNodeElement.setAttribute('gltf-model', '#hub');
            newNodeElement.setAttribute('position', { x: (newNode.position.split(',')[0] / 15)/elementsScale, y: data.height, z: (newNode.position.split(',')[1] / 15)/elementsScale });
            newNodeElement.setAttribute('id', newNode.name);
            newNodeElement.setAttribute('scale', {x: 1/elementsScale, y: 1/elementsScale, z: 1/elementsScale});
        }else if(newNode.name.startsWith('r')){
            newNodeElement.setAttribute('gltf-model', '#router');
            newNodeElement.setAttribute('position', { x: ((newNode.position.split(',')[0] / 15) -1.5)/elementsScale, y: data.height, z: (newNode.position.split(',')[1] / 15)/elementsScale });
            newNodeElement.setAttribute('id', newNode.name);
            newNodeElement.setAttribute('scale', {x: 0.008/elementsScale, y: 0.008/elementsScale, z: 0.008/elementsScale});
        }

	

	
	// Add routing table info
	isClosedRoutingTableInfo = true;
	
        newNodeElement.addEventListener('click', function () {
	    if  (isEndToEndVIEW()){
		console.log("No routing table available in end-to-end views")
		return;
	    }

            node = nodeList.find(o => o.name === newNodeElement.id)
            if(isClosedRoutingTableInfo == false){
	    	isClosedRoutingTableInfo = true


                node.routingTableText.removeAttribute('html');

		node.routingTableText.setAttribute('visible', false);
                newNodeElement.removeAttribute('sound');


                newNodeElement.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
            }else{ 
                isClosedRoutingTableInfo = false
	    	showRoutingTable(newNodeElement.id, node.routingTableText, newNodeElement);
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
        newText.setAttribute('position', { x: ((newNode.position.split(',')[0] / 15) - 0.5)/elementsScale, y: (2.5)/elementsScale + data.height, z: (newNode.position.split(',')[1] / 15)/elementsScale });
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



function shiftCoords (from, to, elementsScale){
    coordinates = {};
    coordinates.x = from.x;
    coordinates.z = from.z;

    slope = Math.abs(to.z - from.z) / Math.abs(to.x - from.x)

    

    
    shift_x = 0.2* Math.abs(to.x-from.x)


    if (to.x > from.x && to.z > from.z){
	coordinates.x += shift_x;
    }
    else if (to.x > from.x && to.z < from.z){
	coordinates.x += shift_x;
    }
    else if (to.x < from.x && to.z > from.z){
	coordinates.x -= shift_x;
    }
    else if (to.x < from.x && to.z < from.z){
	coordinates.x -= shift_x;
    }

    coordinates.z = from.z + (coordinates.x - from.x) * (to.z - from.z) / (to.x - from.x) 
    
    return coordinates;
}



function writeConnections(connectionsLinksStandard, nodeList, data) {
    for (var k = 0; k < connectionsLinksStandard.length; k++) {
        nodeFromPosition = connectionsLinksStandard[k].position.split('"')
        for (var j = 0; j < connectionsLinksStandard[k].to.length; j++) {
            nodeTo = connectionsLinksStandard.find(o => o.from === connectionsLinksStandard[k].to[j])
            nodeToPosition = nodeTo.position.split('"')

            let newLine = document.createElement('a-entity');
            newLine.setAttribute('line', 'start: ' + (nodeFromPosition[0].split(',')[0] / 15)/data.elementsScale + ' ' + data.height + ' ' + (nodeFromPosition[0].split(',')[1] / 15)/data.elementsScale + '; end: ' + (nodeToPosition[0].split(',')[0] / 15)/data.elementsScale + ' ' + data.height + ' ' + (nodeToPosition[0].split(',')[1] / 15)/data.elementsScale + '; color: ' + data.connectionscolor);
            scene.appendChild(newLine);

	    connectionsLinksStandard[k].lines.push(newLine)


	    // Labels for IP addresses on the link
            nodeFrom = connectionsLinksStandard.find(o => o.from === connectionsLinksStandard[k].from)
	    if (nodeFrom.from.startsWith("hub"))
		continue;
	    
	    label_id = "<p>" + connectionsLinksStandard[k].iface[j] + ": "
	    label_id += connectionsLinksStandard[k].ipaddr[j] + "/" + connectionsLinksStandard[k].mask[j] + "</p>";
	    label_id += "<p>" + "      " + connectionsLinksStandard[k].hwaddr[j] + "</p>"

	    

	    var id_text = connectionsLinksStandard[k].ipaddr[j].replace(/\./g, "_");

	    
            var htmltemplates = document.getElementById("htmltemplates");
            var newSectionTemplate = document.createElement("section");
            templateText = '<h1 style="padding: 0rem 0rem 0rem 0rem; margin: 0; font-size: 1.2rem; font-family: monospace; font-weight: 400;">' + label_id + '</h1>'
            newSectionTemplate.innerHTML = templateText;
            newSectionTemplate.style = "display: inline-block; background: #34495e; color: #a9cce3; border-radius: 1em; padding: 1em; margin:0;"
            newSectionTemplate.id = id_text + "-template";
            htmltemplates.appendChild(newSectionTemplate);


	    coordinates = shiftCoords (
		{"x": (nodeFromPosition[0].split(',')[0] / 15)/data.elementsScale,  "z": (nodeFromPosition[0].split(',')[1] / 15)/data.elementsScale},
		{"x": (nodeToPosition[0].split(',')[0] / 15)/data.elementsScale,    "z": (nodeToPosition[0].split(',')[1] / 15)/data.elementsScale},
		data.elementsScale
	    )

            let newText = document.createElement('a-entity');

	    if (viewing_mode == "vr")
		newText.setAttribute('position', {
		    x: coordinates.x,
		    y: data.height * 1.01,
		    z: coordinates.z
		});
	    else // viewing_mode == "desktop"
		newText.setAttribute('position', {
		    x: coordinates.x,
		    y: data.height * 0.5,
		    z: coordinates.z
		});
		


	    console.log("id_text: " + id_text);
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



function createRoutingTableInfo(id_text, coordinates, elementsScale, info){
    var htmltemplates = document.getElementById("htmltemplates");
    var newSectionTemplate = document.createElement("section");

    templateText = '<h1 style="padding: 0rem 1rem; font-size: 2rem; font-weight: 400; font-family: monospace">' + info + '</h1>'
    newSectionTemplate.innerHTML = templateText;
    
    
    newSectionTemplate.style = "display: inline-block; background: black; color: orange; border-radius: 1em; padding: 1em; margin:0;"
    newSectionTemplate.id = id_text + "-template";
    htmltemplates.appendChild(newSectionTemplate);


    let newText = document.createElement('a-entity');
    newText.setAttribute('position', {
	x: coordinates.x,
	y: (4.5)/elementsScale + coordinates.y,
	z: coordinates.z
    });
    

    newText.setAttribute('html', '#' + id_text + "-template");
    newText.setAttribute('scale', {x: 10/elementsScale, y: 10/elementsScale, z: 10/elementsScale});
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
    //    var finalPackets = []
    console.log("animateEndToEndPackets")

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
    //    var finalPackets = []


    console.log("animatePackets: ")
    console.log(packets)
    


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
		// store the hwaddr of the sender of the ARP reply
		latest_arp_requests[eth_dst]["arp.dst.hw_mac"] = packets[j]["eth"]["eth.src"]



	    if ("ip" in packets[j]
		&& eth_src in latest_arp_requests
		&& eth_dst == latest_arp_requests[eth_src]["arp.dst.hw_mac"]
	       )
	    { // Store in the ARP request packet the position of the IP packet in finalPackets
		arpPacket = finalPackets[latest_arp_requests[eth_src]["next_ip_position"]]
		arpPacket["next_ip_position"] = finalPackets.length
		console.log(latest_arp_requests[eth_src])
		console.log("storing in finalPackets[" + latest_arp_requests[eth_src]["next_ip_position"] + "]  next_ip_position = " + finalPackets.length)
		delete latest_arp_requests[eth_src] 
	    }
	    
	    
            if (from.to.includes(to.from)){ // hwaddr destino del paquete es vecino del nodo que estamos considerando (from)
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
		
            } else
	    { // hwaddr destino del paquete NO es vecina del
		// nodo que estamos considerando (from). Es
   		// decir, hay un hub o un switch intermedio
		
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
        } else { // paquete de broadcast
	    
            var from = connectionsLinks.find(o => o.hwaddr.includes(packets[j].src))
	    
	    i = from.hwaddr.findIndex(o => o == packets[j].src)
	    nodeName = from.to[i]
	    
	    to = connectionsLinks.find(o => o.from == nodeName)

	    
	    if ("arp" in packets[j] && packets[j]["arp"]["arp.opcode"] == "1"){ // arp request
		eth_src = packets[j]["eth"]["eth.src"]
		console.log(eth_src)

		latest_arp_requests[eth_src] = {"next_ip_position": finalPackets.length}

		console.log("latest_arp_requests: ")
		console.log(latest_arp_requests)
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
    escena = document.querySelector('#escena');
    for (var currentPacket = 0; currentPacket < finalPackets.length; currentPacket++) {
        var newPacket = document.createElement('a-entity');
        newPacket.setAttribute('packet','from', finalPackets[currentPacket].from.from);
        newPacket.setAttribute('packet','to', finalPackets[currentPacket].to.from);	
        newPacket.setAttribute('packet','xPosition', finalPackets[currentPacket].xPosition);
        newPacket.setAttribute('packet','yPosition', ' ' + data.height + ' ');
        newPacket.setAttribute('packet','zPosition', finalPackets[currentPacket].zPosition);
        newPacket.setAttribute('packet','duration', finalPackets[currentPacket].duration);
        newPacket.setAttribute('packet','toXPosition', finalPackets[currentPacket].toXPosition);
        newPacket.setAttribute('packet','toYPosition', ' ' + data.height + ' ');
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
	
        escena.appendChild(newPacket);

	finalPackets[currentPacket].newPacket = newPacket
    }
}


