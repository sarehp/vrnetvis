//////////
// GLOBALS
nodeList = []
nkp_filename   = null
elementsScale  = null
last_packet_id = null  // id of last packet in animation. Set when packets are loaded.
//////////

var VIEWS=["APPLICATION", "APPLICATION+TRANSPORT", "APPLICATION+TRANSPORT+NETWORK", "ALL"]
var VIEW="APPLICATION+TRANSPORT"  // VIEW must be one oF VIEWS
var PREVIOUS_VIEW=""


var TICK = 2000 // 10000
var DURATION = 1000 // 5000
var COLORS = {dns:"goldenrod",
	      http:"gold",
	      dataInfo:"white",
	      data:"white",
	      tcp:"steelblue",
	      udp:"olive",
	      icmp:"red",
	      ip:"lightgreen",
	      arp:"sandybrown",
	      ethernet:"khaki"}



function isEndToEndVIEW() {
    return (VIEW == "APPLICATION" || VIEW == "APPLICATION+TRANSPORT");
}



/* global AFRAME */
if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerComponent('selector', {
    init: function() {
        scene = this.el

        let inmersiveElement = document.createElement('a-entity');

        inmersiveElement.setAttribute('gltf-model', '#inmersive');
        inmersiveElement.setAttribute('position', '-7 7 30');
        inmersiveElement.setAttribute('scale', '10 10 10');
        scene.appendChild(inmersiveElement);
        inmersiveElement.addEventListener('click', function () {
            desktopText.parentNode.removeChild(desktopText);
            inmersiveText.parentNode.removeChild(inmersiveText);
            desktopElement.parentNode.removeChild(desktopElement);
            inmersiveElement.parentNode.removeChild(inmersiveElement);
            scene.setAttribute('inmersiveMode', '');

        });

        let inmersiveText = document.createElement('a-entity');
        inmersiveText.setAttribute('html', '#inmersive-mode');
        inmersiveText.setAttribute('position', { x: -7 , y: 16, z: 30 });
        inmersiveText.setAttribute('scale', '30 30 30');
        inmersiveText.setAttribute('look-at', "[camera]");
        scene.appendChild(inmersiveText);

        let desktopElement = document.createElement('a-entity');

        desktopElement.setAttribute('gltf-model', '#desktop');
        desktopElement.setAttribute('position', '7 6 30');
        desktopElement.setAttribute('rotation', '0 -90 0');
        scene.appendChild(desktopElement);
        desktopElement.addEventListener('click', function () {
            desktopText.parentNode.removeChild(desktopText);
            inmersiveText.parentNode.removeChild(inmersiveText);
            inmersiveElement.parentNode.removeChild(inmersiveElement);
            desktopElement.parentNode.removeChild(desktopElement);
            scene.setAttribute('network', {filename: 'netgui.nkp', elementsScale: 1, height: 1, connectionscolor: 'red'});
        });

        let desktopText = document.createElement('a-entity');
        desktopText.setAttribute('html', '#web-mode');
        desktopText.setAttribute('position', { x: 7 , y: 16, z: 30 });
        desktopText.setAttribute('scale', '30 30 30');
        desktopText.setAttribute('look-at', "[camera]");
        scene.appendChild(desktopText);

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

        scene.setAttribute('network', {filename: 'netgui.nkp', elementsScale: 4, height: 6, connectionscolor: 'blue'});
    }
});


AFRAME.registerComponent('network', {
    schema: {
        filename: {type: 'string', default: ''},
    },

    init: function() {
	finalConnectionsLinks=[]

	
        // nodeList = [];

	// // request netgui.nkp

        data = this.data
        scene = this.el
	
	// Store in globals
	nkp_filename = data.filename
	elementsScale=data.elementsScale
	
	createNetwork(nkp_filename, elementsScale)


	
	// Create player controls (startButton): start/play/pause/reload
        let startButton = document.createElement('a-sphere');
	
        startButton.setAttribute('position', {x: -20, y: 2, z: 10 });
        startButton.setAttribute('color', 'orange');
        startButton.setAttribute('scale', '2 2 2');
        startButton.setAttribute('id', 'startButton');
        startButton.setAttribute('sound', {on: 'click', src: '#playPause', volume: 5});
        scene.appendChild(startButton);
	
        let buttonText = document.createElement('a-entity');
        buttonText.setAttribute('html', '#start-button');
        buttonText.setAttribute('position', { x: -20 , y: 20, z: 10 });
        buttonText.setAttribute('scale', '30 30 30');
        buttonText.setAttribute('look-at', "[camera]");
        scene.appendChild(buttonText);
	
	
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

    info = '<p>Nivel DNS</p>'

    // It's a pure query
    if (packetParams.dns["dns.count.add_rr"] == 0 && packetParams.dns["dns.count.answers"] == 0){
	info += '<p>Queries:</p>'

	for (const [key, value] of Object.entries(packetParams.dns.Queries))
	    info += '<p>Query: ' + key + '</p>';
    }
    

    if (packetParams.dns["dns.count.answers"] != 0){
	info += '<p>Answers: </p>'	
	for (const [key, value] of Object.entries(packetParams.dns["Answers"]))
    	    info += '<p>' + key + '</p>';
    }

    if (packetParams.dns["dns.count.add_rr"] != 0){
	
	info += '<p>Authoritative nameservers: </p>'	
	for (const [key, value] of Object.entries(packetParams.dns["Authoritative nameservers"]))
    	    info += '<p>' + key + '</p>';
	
	info += '<p>Additional records: </p>'		
	for (const [key, value] of Object.entries(packetParams.dns["Additional records"]))
            info += '<p>' + key + '</p>';
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

    switch (protocol){
    case 'dns':
	infoText += dns_info(packetParams);
	break;
    case 'http':
	infoText += ''//'<p>Nivel HTTP:</p><p>Puerto origen: ' + packetParams.http['http.srcport'] + '</p><p>Puerto destino: ' + packetParams.http['http.dstport'] + '</p>'
	break;
    case 'dataInfo':
	infoText += '<p>DATOS:</p><p>Info datos: ' + hex_with_colons_to_ascii(packetParams.tcp['tcp.payload']) + '</p><p>Longitud de datos: ' + packetParams.tcp['tcp.len'] + '</p>'
	break;
    case 'data':
	
	if (packetParams.tcp != null)
	    infoText += '<p>DATOS:</p><p>Info datos: ' + hex_with_colons_to_ascii(packetParams.tcp['tcp.payload']) + '</p><p>Longitud de datos: ' + packetParams.tcp['tcp.len'] + '</p>'
	else if (packetParams.udp != null)
	    infoText += '<p>DATOS:</p><p>Info datos: ' + hex_with_colons_to_ascii(packetParams.data) + '</p><p>Longitud de datos: ' + packetParams.udp['udp.length'] + '</p>'

	break;
    case 'tcp':
	infoText += '<p>Nivel TCP:</p><p>Puerto origen: ' + packetParams.tcp['tcp.srcport'] + '</p><p>Puerto destino: ' + packetParams.tcp['tcp.dstport'] + '</p>'
	break;
    case 'udp':
	infoText += '<p>Nivel UDP:</p><p>Puerto origen: ' + packetParams.udp['udp.srcport'] + '</p><p>Puerto destino: ' + packetParams.udp['udp.dstport'] + '</p>'
	break;
    case 'icmp':
	infoText += '<p>Nivel ICMP:</p><p>Type: ' + packetParams.icmp['icmp.type'] + '</p><p>Code: ' + packetParams.icmp['icmp.code'] + '</p>'
	break;
    case 'ip':
	infoText += '<p>Nivel IP:</p><p>Origen: ' + packetParams.ip['ip.src'] + '</p><p>Destino: ' + packetParams.ip['ip.dst'] + '</p><p>Version: ' + packetParams.ip['ip.version'] + '</p><p>Ttl: ' + packetParams.ip['ip.ttl'] + '</p>'
	break;
    case 'arp': 
	infoText += '<p>Nivel ARP:</p><p>Origen: ' + packetParams.arp['arp.src.hw_mac'] + '</p><p>Destino: ' + packetParams.arp['arp.dst.hw_mac']  + '</p><p>Target: ' + packetParams.arp['arp.dst.proto_ipv4'] + '</p>'
	break;
    case 'ethernet':
	infoText += '<p>Nivel Ethernet:</p><p>Origen: ' + packetParams.eth['eth.src'] + '</p><p>Destino: ' + packetParams.eth['eth.dst'] + '</p><p>Tipo: ' + packetParams.eth['eth.type'] + '</p>'
	break;
    }
    
    
    newInfoText.setAttribute('visible', true);
    newInfoText.removeAttribute('html');
    var textTemplate = document.getElementById(packetParams.id + '-template');
    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: ' + getColor(protocol) + '">' + infoText + '</h1>'
    textTemplate.innerHTML = textTemplateContent;
    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
    newInfoText.setAttribute('visible', true);
    newBox.removeAttribute('sound');
    newBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});

}


AFRAME.registerComponent('packet', {
    schema: {
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
    init: function () {
        let packet = this.el
        let packetParams = this.data

	
        let global_seconds_counter = 0;
        function startAnimation() {
	    console.log("startAnimation() in state " + animationState )
	    
            if (animationState=="MOVING") {
                if (global_seconds_counter == Math.ceil(packetParams.start/1000)) {
		    
		    // Find in which node is now the packet based on the position of the packet
		    var nodeAnimation = nodeList[0]
		    packetXPosition = packetParams.xPosition * 15 * packetParams.elementsScale
		    packetZPosition = packetParams.zPosition * 15 * packetParams.elementsScale
   		    nodeXPosition = nodeList[0].position.split(',')[0]
   		    nodeZPosition = nodeList[0].position.split(',')[1]		    
		    var minDistance = eucDistance([packetXPosition, packetZPosition],[nodeXPosition, nodeZPosition])

		    for (var k=1; k < nodeList.length; k++) {
   			nodeXPosition = nodeList[k].position.split(',')[0]
   			nodeZPosition = nodeList[k].position.split(',')[1]		    
			var distance = eucDistance([packetXPosition, packetZPosition],[nodeXPosition, nodeZPosition])

			if (distance < minDistance) {
			    nodeAnimation=nodeList[k]
			    minDistance = distance
			}
		    }
		    
		    // Animation of a node when a packet arrives to it
                    var nodeFromAnimation = document.getElementById(nodeAnimation.name);

                    if(nodeAnimation.name.startsWith('pc') || nodeAnimation.name.startsWith('dns')){
                        nodeFromAnimation.setAttribute('animation', {property: 'scale', from: {x: 0.012/packetParams.elementsScale, y: 0.012/packetParams.elementsScale, z: 0.012/packetParams.elementsScale}, to: {x: 0.006/packetParams.elementsScale, y: 0.006/packetParams.elementsScale, z: 0.006/packetParams.elementsScale}, loop: '2', dur: '1000', easing: 'linear' })
                    }else if(nodeAnimation.name.startsWith('hub')){
                        nodeFromAnimation.setAttribute('animation', {property: 'scale', from: {x: 2/packetParams.elementsScale, y: 2/packetParams.elementsScale, z: 2/packetParams.elementsScale}, to: {x: 1/packetParams.elementsScale, y: 1/packetParams.elementsScale, z: 1/packetParams.elementsScale}, loop: '2', dur: '1000', easing: 'linear' })
                    }else if(nodeAnimation.name.startsWith('r')){
                        nodeFromAnimation.setAttribute('animation', {property: 'scale', from: {x: 0.016/packetParams.elementsScale, y: 0.016/packetParams.elementsScale, z: 0.016/packetParams.elementsScale}, to: {x: 0.008/packetParams.elementsScale, y: 0.008/packetParams.elementsScale, z: 0.008/packetParams.elementsScale}, loop: '2', dur: '1000', easing: 'linear' })
                    }
                    
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

                    var packet_move = document.getElementById(packetParams.id);

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
                        newEthBox.setAttribute('position', { x: 0, y:  2 + (index), z: 0 });
                        newEthBox.setAttribute('color', getColor("ethernet"));
                        newEthBox.setAttribute('visible', true); // pheras

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
                        newIpBox.setAttribute('visible', true); // pheras

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
                        newArpBox.setAttribute('visible', true); // pheras
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
                        newTcpBox.setAttribute('visible', true); // pheras
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
                        newUdpBox.setAttribute('visible', true); // pheras
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
                        newDnsBox.setAttribute('visible', true); // pheras
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
                        newHttpBox.setAttribute('visible', true); // pheras

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
                        newIcmpBox.setAttribute('visible', true); // pheras

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
                        newDataBox.setAttribute('visible', true); // pheras

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
                        newDataBox.setAttribute('visible', true); // pheras

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
		    

                    packet_move.setAttribute('animation', {
                        property: 'position',
                        to: packetParams.toXPosition + packetParams.toYPosition + packetParams.toZPosition,
                        dur: packetParams.duration,
                        easing: 'linear',
                        pauseEvents:'animation-pause', 
                        resumeEvents:'animation-resume'
                    });
		    
                    packet.addEventListener('animationcomplete', function () {
			console.log("packet.id: " + packet.id)
			console.log("last_packet_id: " + last_packet_id)			

			if (packet.id == last_packet_id){
			    console.log("Whole animation is finished")
			    animationState = "FINISHED"
			    PREVIOUS_VIEW=VIEW
			}
			else{
			    animationState = "ZOMBIE"
			    var startButton = document.querySelector('#startButton');
			    startButton.removeEventListener('click', event_listener_function)
			}

			clearInterval(interval_id)
			
			// Destroy packet element
                        longitud = packet.children.length
                        nodeFromAnimation.removeAttribute('animation');
                        for (var a=0; a < longitud; a++) {
                            packet.children[0].remove()
                        }
                        packet.parentNode.removeChild(packet);
			
                    });
                }
                global_seconds_counter++;
            }
       }







	packet.emit("animation-pause", null, false)
	
        var startButton = document.querySelector('#startButton');
	var animationState = "INIT" // INIT, PAUSED, MOVING
	var interval_id
	

	var event_listener_function = function() {
	    console.log("click")
	    

            switch(animationState) {
            case 'INIT':
		animationState = "MOVING"
                interval_id = setInterval(startAnimation, 1000);
                break
            case 'MOVING':
		console.log("click to pause on packet id " + packet.id)
		packet.emit("animation-pause", null, false)
		animationState = "PAUSED"
                break;
            case 'PAUSED':
		console.log("click to move on packet id " + packet.id)
		packet.emit("animation-resume", null, false)
		animationState = "MOVING"
                break
	    case 'FINISHED':
		// Borrar paquetes
		// ...
		//
		animationState = "ZOMBIE"
		startButton.removeEventListener('click', event_listener_function)
		
		if (PREVIOUS_VIEW == VIEW)
		    deleteNodes(nodeList)
		    createNetwork(nkp_filename, elementsScale)
		break;
            }
        }
	
	startButton.addEventListener('click', event_listener_function);
	
    }
});


function createNetwork(filename, elementScale){
    nodeList=[]
    connectionsLinks=[]



    
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
                }
            }

	    for (const [machineName, value] of Object.entries(responseParse.nodes_info)){
                node = nodeList.find(o => o.name === machineName)
		node.routing_table = value.routing_table
            }


	    
            // Process netgui.nkp though the variable in the closure. nodesInfo is a variable defined in createNodes() !!
            connections = nodesInfo[1].split('link')


            finalConnectionsLinks = setConnectionsLinks(connections, connectionsLinks, nodeList, data)
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
	    
	    loadAndAnimatePackets();
	}


    }
}
    
function loadAndAnimatePackets(){
    filePackets = 'new_file.json'
    requestPackets = new XMLHttpRequest();
    requestPackets.open('GET', filePackets);
    requestPackets.responseType = 'text';
    requestPackets.send();
    requestPackets.onload = function() {
        response = requestPackets.response;
        responseParse = JSON.parse(response);
	
        packets = readPackets(responseParse)
	
	
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
    text = "<p>Destination  Mask Gateway Iface</p>";
    
    for (var i = 0; i < routing_table.length; i++){
	text +=
	    "<p>"+routing_table[i][0] + " "+
	    routing_table[i][1] + " " +
	    routing_table[i][2] + " " +
	    routing_table[i][3] + 
	    "</p>"
    }

    return text;
}

function deleteNodes(nodeList){
    scene = document.querySelector('#escena');

    for (var i = 0; i < nodeList.length; i++){
	node_a_entity = nodeList[i].node_a_entity 


	if (! scene.contains(node_a_entity))
	    // Not all nodes are in the scene
	    continue
	
	// Destroy node
        longitud = node_a_entity.children.length
        node_a_entity.removeAttribute('animation');
        for (var a=0; a < longitud; a++) {
            node_a_entity.children[0].remove()
        }

        scene.removeChild(node_a_entity);
	
    }
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
	    routing_table:[],
	    routingTableText:"",
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
	

        var htmltemplates = document.getElementById("htmltemplates");
        var newSectionTemplate = document.createElement("section");
        templateText = '<h1 style="padding: 0rem 1rem; font-size: 3rem; font-weight: 700;">' + newNode.name + '</h1>'
        newSectionTemplate.innerHTML = templateText;
        newSectionTemplate.style = "display: inline-block; background: #CCCCCC; color: yellow; border-radius: 1em; padding: 1em; margin:0;"
        newSectionTemplate.id = newNode.name + '-template'
        htmltemplates.appendChild(newSectionTemplate);

        let newText = document.createElement('a-entity');
        newText.setAttribute('position', { x: ((newNode.position.split(',')[0] / 15) - 0.5)/elementsScale, y: (2.5)/elementsScale + data.height, z: (newNode.position.split(',')[1] / 15)/elementsScale });
        newText.setAttribute('html', '#' + newNode.name + '-template');
        newText.setAttribute('scale', {x: 10/elementsScale, y: 10/elementsScale, z: 10/elementsScale});
        newText.setAttribute('look-at', "[camera]");

        scene = document.querySelector('#escena');
        scene.appendChild(newText);



        
    }

}

function setConnectionsLinks(connections, connectionsLinks, nodeList, data){
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
    connectionsLinksStandard = []


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
	    mask: nodeList[k].mask
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

    SHIFT = 30 
    shift_x = SHIFT / (15 * elementsScale);
    shift_z = SHIFT / (15 * elementsScale);
    
    if (to.x > from.x && to.z > from.z){
	coordinates.x += shift_x;
	coordinates.z += shift_z;    
    }
    else if (to.x > from.x && to.z < from.z){
	coordinates.x += shift_x;
	coordinates.z -= shift_z;    
    }
    else if (to.x < from.x && to.z > from.z){
	coordinates.x -= shift_x;
	coordinates.z += shift_z;    
    }
    else if (to.x < from.x && to.z < from.z){
	coordinates.x -= shift_x;
	coordinates.z -= shift_z;    
    }


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


	    // Labels for IP addresses on the link
            nodeFrom = connectionsLinksStandard.find(o => o.from === connectionsLinksStandard[k].from)
	    if (nodeFrom.from.startsWith("hub"))
		continue;
	    
	    var label_id = connectionsLinksStandard[k].ipaddr[j] + "/" + connectionsLinksStandard[k].mask[j];
	    var id_text = connectionsLinksStandard[k].ipaddr[j].replace(/\./g, "_");
	    
            var htmltemplates = document.getElementById("htmltemplates");
            var newSectionTemplate = document.createElement("section");
            templateText = '<h1 style="padding: 0rem 1rem; font-size: 2rem; font-weight: 400;">' + label_id + '</h1>'
            newSectionTemplate.innerHTML = templateText;
            newSectionTemplate.style = "display: inline-block; background: black; color: orange; border-radius: 1em; padding: 1em; margin:0;"
            newSectionTemplate.id = id_text + "-template";
            htmltemplates.appendChild(newSectionTemplate);


	    coordinates = shiftCoords (
		{"x": (nodeFromPosition[0].split(',')[0] / 15)/data.elementsScale,  "z": (nodeFromPosition[0].split(',')[1] / 15)/data.elementsScale},
		{"x": (nodeToPosition[0].split(',')[0] / 15)/data.elementsScale,    "z": (nodeToPosition[0].split(',')[1] / 15)/data.elementsScale},
		data.elementsScale
	    )
	    
            let newText = document.createElement('a-entity');
            newText.setAttribute('position', {
		x: coordinates.x,
		y: data.height * 1.5,
		z: coordinates.z
	    });


	    console.log("id_text: " + id_text);
            newText.setAttribute('html', '#' + id_text + "-template");
            newText.setAttribute('scale', {x: 10/data.elementsScale, y: 10/data.elementsScale, z: 10/data.elementsScale});
            newText.setAttribute('look-at', "[camera]");
	    
            scene = document.querySelector('#escena');

            scene.appendChild(newText);

        }
    }

    return connectionsLinksStandard
}



function createRoutingTableInfo(id_text, coordinates, elementsScale, info){
    var htmltemplates = document.getElementById("htmltemplates");
    var newSectionTemplate = document.createElement("section");

    templateText = '<h1 style="padding: 0rem 1rem; font-size: 2rem; font-weight: 400;">' + info + '</h1>'
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
    
    packets = [];
    
    for (var j = 0; j < responseParse.length; j++) {
	protocols=[];

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
    finalPackets = []
    console.log("animateEndToEndPackets")

    for (var j = 0; j < packets.length; j++) {

	
        var from = connectionsLinks.find(o => o.hwaddr.includes(packets[j].src))

        to = connectionsLinks.find(o => o.ipaddr.includes(packets[j].ip["ip.dst"]))

        packetDelay = TICK * j
        finalPackets.push({
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
    finalPackets = []

    for (var j = 0; j < packets.length; j++) {
        var from = connectionsLinks.find(o => o.hwaddr.includes(packets[j].src))




        if (packets[j].dst != 'ff:ff:ff:ff:ff:ff') {
            to = connectionsLinks.find(o => o.hwaddr.includes(packets[j].dst))
            if (from.to.includes(to.from)){ // hwaddr destino del paquete es vecino del nodo que estamos considerando (from)
                packetDelay = TICK * j
                finalPackets.push({
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
	    
	    if (to.from.startsWith('hub')){
                packetDelay = TICK * j
                finalPackets.push({
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
    
    console.log(finalPackets)


    create_animations(finalPackets)
}

function create_animations(finalPackets){
    last_packet_id = finalPackets.length - 1
    
    // --------- Create animations ----------
    escena = document.querySelector('#escena');
    for (var currentPacket = 0; currentPacket < finalPackets.length; currentPacket++) {
        var newPacket = document.createElement('a-entity');
        newPacket.setAttribute('packet','xPosition', finalPackets[currentPacket].xPosition);
        newPacket.setAttribute('packet','yPosition', ' ' + data.height + ' ');
        newPacket.setAttribute('packet','zPosition', finalPackets[currentPacket].zPosition);
        newPacket.setAttribute('packet','duration', finalPackets[currentPacket].duration);
        newPacket.setAttribute('packet','toXPosition', finalPackets[currentPacket].toXPosition);
        newPacket.setAttribute('packet','toYPosition', ' ' + data.height + ' ');
        newPacket.setAttribute('packet','elementsScale', data.elementsScale);
        newPacket.setAttribute('packet','class', 'packetClass')
        newPacket.setAttribute('packet','toZPosition', finalPackets[currentPacket].toZPosition);
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
    }
}

