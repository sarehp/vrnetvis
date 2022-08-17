var TICK = 2000 // 10000
var DURATION = 1000 // 5000

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
        nodeList = [];
        data = this.data
        file = data.filename
        request = new XMLHttpRequest();
        request.open('GET', file);
        request.responseType = 'text';
        request.send();
        scene = this.el
        request.onload = function() {
            response = request.response;
            response.split('<nodes>')
            nodes = response.split('position')

            // Establecemos los diferentes nodos de la escena
            setNodes(nodes, nodeList, data)
            
            // Asociamos a cada nodo su nombre de máquina
            machineNamesFile = 'machineNames.json'
            requestMachineNames = new XMLHttpRequest();
            requestMachineNames.open('GET', machineNamesFile);
            requestMachineNames.responseType = 'text';
            requestMachineNames.send();
            requestMachineNames.onload = function() {
                response = requestMachineNames.response;
                responseParse = JSON.parse(response);
		
                for (const interface in responseParse) {
                    for (const currentNode in responseParse[interface]) {
                        node = nodeList.find(o => o.name === currentNode)
			node.hwaddr.push(responseParse[interface][currentNode]["hwaddr"])
			node.ipaddr.push(responseParse[interface][currentNode]["ipaddr"])
			node.mask.push(responseParse[interface][currentNode]["mask"])						
                    }
                }
                
                connections = nodesInfo[1].split('link')
                connectionsLinks = []

                finalConnectionsLinks = setConnectionsLinks(connections, connectionsLinks, nodeList, data)

                filePackets = 'new_file.json'
                requestPackets = new XMLHttpRequest();
                requestPackets.open('GET', filePackets);
                requestPackets.responseType = 'text';
                requestPackets.send();
                requestPackets.onload = function() {
                    response = requestPackets.response;
                    responseParse = JSON.parse(response);
		    
                    packets = readPackets(responseParse)


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

                    animatePackets(packets, finalConnectionsLinks, data)
                }
            }
            

            
        }
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

        console.log(packetParams.yPosition)
        
	

        let i = 0;

        function startAnimation() {
            if (animationStatus == 'move-pause') {
                if (i == Math.ceil(packetParams.start/1000)) {
                    // let nodePositionFrom = ''
                    // if(Number.isInteger((packetParams.xPosition * 15)*packetParams.elementsScale)){
                    //     nodePositionFrom += parseFloat((packetParams.xPosition * 15)*packetParams.elementsScale).toFixed(1).toString()
                    // }else{
                    //     nodePositionFrom += ((packetParams.xPosition * 15)*packetParams.elementsScale).toString()
                    // }
                    // nodePositionFrom += ','
                    // if(Number.isInteger((packetParams.zPosition * 15)*packetParams.elementsScale)){
                    //     nodePositionFrom += parseFloat((packetParams.zPosition * 15)*packetParams.elementsScale).toFixed(1).toString()
                    // }else{
                    //     nodePositionFrom += ((packetParams.zPosition * 15)*packetParams.elementsScale).toString()
                    // }

		    // Find in which node is now the packet based on the position of the packet
		    var nodeAnimation = nodeList[0]
		    packetXPosition = packetParams.xPosition * 15 * packetParams.elementsScale
		    packetZPosition = packetParams.zPosition * 15 * packetParams.elementsScale
   		    nodeXPosition = nodeList[0].position.split(',')[0]
   		    nodeZPosition = nodeList[0].position.split(',')[1]		    
		    var minDistance = eucDistance([packetXPosition, packetZPosition],[nodeXPosition, nodeZPosition])
		    console.log("minDistance: " + minDistance)

		    for (var k=1; k < nodeList.length; k++) {
   			nodeXPosition = nodeList[k].position.split(',')[0]
   			nodeZPosition = nodeList[k].position.split(',')[1]		    
			var distance = eucDistance([packetXPosition, packetZPosition],[nodeXPosition, nodeZPosition])
			console.log("distance: " + distance + "     k: " + k)			
			if (distance < minDistance) {
			    nodeAnimation=nodeList[k]
			    minDistance = distance
			}
		    }
		    
                    var nodeFromAnimation = document.getElementById(nodeAnimation.name);
                    console.log(nodeAnimation.name)

                    if(nodeAnimation.name.startsWith('pc')){
                        nodeFromAnimation.setAttribute('animation', {property: 'scale', from: {x: 0.012/packetParams.elementsScale, y: 0.012/packetParams.elementsScale, z: 0.012/packetParams.elementsScale}, to: {x: 0.006/packetParams.elementsScale, y: 0.006/packetParams.elementsScale, z: 0.006/packetParams.elementsScale}, loop: '2', dur: '1000', easing: 'linear' })
                    }else if(nodeAnimation.name.startsWith('hub')){
                        nodeFromAnimation.setAttribute('animation', {property: 'scale', from: {x: 2/packetParams.elementsScale, y: 2/packetParams.elementsScale, z: 2/packetParams.elementsScale}, to: {x: 1/packetParams.elementsScale, y: 1/packetParams.elementsScale, z: 1/packetParams.elementsScale}, loop: '2', dur: '1000', easing: 'linear' })
                    }else if(nodeAnimation.name.startsWith('r')){
                        nodeFromAnimation.setAttribute('animation', {property: 'scale', from: {x: 0.016/packetParams.elementsScale, y: 0.016/packetParams.elementsScale, z: 0.016/packetParams.elementsScale}, to: {x: 0.008/packetParams.elementsScale, y: 0.008/packetParams.elementsScale, z: 0.008/packetParams.elementsScale}, loop: '2', dur: '1000', easing: 'linear' })
                    }
                    
                    packet.setAttribute('geometry', {primitive: 'cylinder', 'height': 0.4/packetParams.elementsScale, radius: 0.4/packetParams.elementsScale });
                    let packetColor = ''

		    if(packetParams.dns){
                        packetColor = 'goldenrod'
		    }else if(packetParams.http){
                        packetColor = 'gold'
		    }else if(packetParams.dataInfo){
                        packetColor = 'white'
		    }else if(packetParams.data){
                        packetColor = 'white'
		    }else if(packetParams.tcp){
                        packetColor = 'steelblue'
		    }else if(packetParams.udp){
                        packetColor = 'olive'	
		    }else if(packetParams.icmp){
                        packetColor = 'red'			
		    }else if(packetParams.ip){
                        packetColor = 'lightgreen'
		    }else if(packetParams.arp){
                        packetColor = 'sandybrown'
		    }else{ // ethernet
                        packetColor = 'khaki'
                    }
                    packet.setAttribute('material', 'color', packetColor);
                    packet.setAttribute('position', { x: packetParams.xPosition, y: packetParams.yPosition, z: packetParams.zPosition });
                    packet.setAttribute('class', packetParams.class);
                    packet.setAttribute('sound', {src: '#packetIn', volume: 5, autoplay: "true"});
                    packet.setAttribute('id', packetParams.id);

                    var packet_move = document.getElementById(packetParams.id);

                    let levels = {}
                    let closeInfo = true
                    let actualInfoShown = ''
                    notValid = false

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
                    if(packetParams.icmp){
                        const icmpInfo = {
                            icmp: packetParams.icmpInfo
                        }
                        levels = Object.assign(levels,icmpInfo);
                    }
                    if(packetParams.http){
                        const httpInfo = {
                            http: packetParams.httpInfo
                        }
                        levels = Object.assign(levels,httpInfo);
                    }
                    if(packetParams.dns){
                        const dnsInfo = {
                            ddns: packetParams.dnsInfo
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
                    
                    if(levels.hasOwnProperty('eth')){
                        index = Object.keys(levels).findIndex(item => item === 'eth')

                        let newEthBox = document.createElement('a-box');
                        newEthBox.setAttribute('position', { x: 0, y:  2 + (index), z: 0 });
                        newEthBox.setAttribute('color', 'khaki');
                        newEthBox.setAttribute('visible', true); // pheras
                        newEthBox.setAttribute('isVisible', true); // pheras			
                        packet.appendChild(newEthBox);

                        newEthBox.addEventListener('mouseenter', function () {
                            newEthBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
                        });
                        newEthBox.addEventListener('mouseleave', function () {
                            newEthBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                            newEthBox.removeAttribute('animation');
                            newEthBox.setAttribute('rotation', {x: 0, y: 0, z: 0 });
                        });
                        newEthBox.addEventListener('click', function () {
                            if(newEthBox.hasAttribute('isVisible')){
                                let infoText = '<p>Nivel Ethernet:</p><p>Origen: ' + packetParams.eth['eth.src'] + '</p><p>Destino: ' + packetParams.eth['eth.dst'] + '</p><p>Tipo: ' + packetParams.eth['eth.type'] + '</p>'
                                if(closeInfo == true){
                                    closeInfo = false
                                    actualInfoShown = 'eth'
                                    newInfoText.setAttribute('visible', true);
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: khaki">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newInfoText.setAttribute('visible', true);
                                    newEthBox.removeAttribute('sound');
                                    newEthBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown == 'eth'){
                                    actualInfoShown = ''
                                    newInfoText.setAttribute('visible', false);
                                    newEthBox.removeAttribute('sound');
                                    newInfoText.removeAttribute('html');
                                    newEthBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown != ''){
                                    closeInfo = false
                                    actualInfoShown = 'eth'
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: khaki"">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newEthBox.removeAttribute('sound');
                                    newEthBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }
                            } else {
                                notValid = true
                            }
                        });
                    }
                    if(levels.hasOwnProperty('ip')){
                        index = Object.keys(levels).findIndex(item => item === 'ip')
                        let newIpBox = document.createElement('a-box');
                        newIpBox.setAttribute('position', { x: 0, y: 2 + (index), z: 0 });
                        newIpBox.setAttribute('color', 'lightgreen');
                        newIpBox.setAttribute('visible', true); // pheras
                        newIpBox.setAttribute('isVisible', true); // pheras			
                        packet.appendChild(newIpBox);
                        newIpBox.addEventListener('mouseenter', function () {
                            newIpBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
                        });
                        newIpBox.addEventListener('mouseleave', function () {
                            newIpBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                            newIpBox.removeAttribute('animation');
                            newIpBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
                        });
                        newIpBox.addEventListener('click', function () {
                            if(newIpBox.hasAttribute('isVisible')){
                                let infoText = '<p>Nivel IP:</p><p>Origen: ' + packetParams.ip['ip.src'] + '</p><p>Destino: ' + packetParams.ip['ip.dst'] + '</p><p>Version: ' + packetParams.ip['ip.version'] + '</p><p>Ttl: ' + packetParams.ip['ip.ttl'] + '</p>'
                                if(closeInfo == true){
                                    closeInfo = false
                                    actualInfoShown = 'ip'
                                    newInfoText.setAttribute('visible', true);
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: lightgreen">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newIpBox.removeAttribute('sound');
                                    newIpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown == 'ip'){
                                    actualInfoShown = ''
                                    newInfoText.setAttribute('visible', false);
                                    newIpBox.removeAttribute('sound');
                                    newInfoText.removeAttribute('html');
                                    newIpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown != ''){
                                    closeInfo = false
                                    actualInfoShown = 'ip'
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: lightgreen">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newIpBox.removeAttribute('sound');
                                    newIpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }
                            }else{
                                notValid = true
                            }
                            
                        });
                    }
                    if(levels.hasOwnProperty('arp')){
                        index = Object.keys(levels).findIndex(item => item === 'arp')
                        let newArpBox = document.createElement('a-box');
                        newArpBox.setAttribute('position', { x: 0, y: 2 +(index), z: 0 });
                        newArpBox.setAttribute('color', 'sandybrown');
                        newArpBox.setAttribute('visible', true); // pheras
                        newArpBox.setAttribute('isVisible', true); // pheras			
                        packet.appendChild(newArpBox);
                        newArpBox.addEventListener('mouseenter', function () {
                            newArpBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
                        });
                        newArpBox.addEventListener('mouseleave', function () {
                            newArpBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                            newArpBox.removeAttribute('animation');
                            newArpBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
                        });
                        newArpBox.addEventListener('click', function () {
                            if(newArpBox.hasAttribute('isVisible')){
                                let infoText = '<p>Nivel ARP:</p><p>Origen: ' + packetParams.arp['arp.src.hw_mac'] + '</p><p>Destino: ' + packetParams.arp['arp.dst.hw_mac']  + '</p><p>Target: ' + packetParams.arp['arp.dst.proto_ipv4'] + '</p>'
                                if(closeInfo == true){
                                    closeInfo = false
                                    actualInfoShown = 'arp'
                                    newInfoText.setAttribute('visible', true);
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: sandybrown">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newArpBox.removeAttribute('sound');
                                    newArpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown == 'arp'){
                                    actualInfoShown = ''
                                    newInfoText.setAttribute('visible', false);
                                    newArpBox.removeAttribute('sound');
                                    newInfoText.removeAttribute('html');
                                    newArpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown != ''){
                                    closeInfo = false
                                    actualInfoShown = 'arp'
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: sandybrown">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newArpBox.removeAttribute('sound');
                                    newArpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }
                            }else{
                                notValid = true
                            }
                            
                        });
                    }
                    if(levels.hasOwnProperty('tcp')){
                        index = Object.keys(levels).findIndex(item => item === 'tcp')
                        let newTcpBox = document.createElement('a-box');
                        newTcpBox.setAttribute('position', { x: 0, y: 2 + (index), z: 0 });
                        newTcpBox.setAttribute('color', 'steelblue');
                        newTcpBox.setAttribute('visible', true); // pheras
                        newTcpBox.setAttribute('isVisible', true); // pheras			
                        packet.appendChild(newTcpBox);
                        newTcpBox.addEventListener('mouseenter', function () {
                            newTcpBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
                        });
                        newTcpBox.addEventListener('mouseleave', function () {
                            newTcpBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                            newTcpBox.removeAttribute('animation');
                            newTcpBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
                        });
                        newTcpBox.addEventListener('click', function () {
                            if(newTcpBox.hasAttribute('isVisible')){
                                let infoText = '<p>Nivel TCP:</p><p>Puerto origen: ' + packetParams.tcp['tcp.srcport'] + '</p><p>Puerto destino: ' + packetParams.tcp['tcp.dstport'] + '</p>'
                                if(closeInfo == true){
                                    closeInfo = false
                                    actualInfoShown = 'tcp'
                                    newInfoText.setAttribute('visible', true);
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: steelblue">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newTcpBox.removeAttribute('sound');
                                    newTcpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown == 'tcp'){
                                    actualInfoShown = ''
                                    newInfoText.setAttribute('visible', false);
                                    newTcpBox.removeAttribute('sound');
                                    newInfoText.removeAttribute('html');
                                    newTcpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown != ''){
                                    closeInfo = false
                                    actualInfoShown = 'tcp'
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: steelblue">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newTcpBox.removeAttribute('sound');
                                    newTcpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }
                            }else{
                                notValid = true
                            }
                            
                        });
                    }
                    if(levels.hasOwnProperty('udp')){
                        index = Object.keys(levels).findIndex(item => item === 'udp')
                        let newUdpBox = document.createElement('a-box');
                        newUdpBox.setAttribute('position', { x: 0, y: 2 + (index), z: 0 });
                        newUdpBox.setAttribute('color', 'olive');
                        newUdpBox.setAttribute('visible', true); // pheras
                        newUdpBox.setAttribute('isVisible', true); // pheras			
                        packet.appendChild(newUdpBox);
                        newUdpBox.addEventListener('mouseenter', function () {
                            newUdpBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
                        });
                        newUdpBox.addEventListener('mouseleave', function () {
                            newUdpBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                            newUdpBox.removeAttribute('animation');
                            newUdpBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
                        });
                        newUdpBox.addEventListener('click', function () {
                            if(newUdpBox.hasAttribute('isVisible')){
                                let infoText = '<p>Nivel UDP:</p><p>Puerto origen: ' + packetParams.udp['udp.srcport'] + '</p><p>Puerto destino: ' + packetParams.udp['udp.dstport'] + '</p>'
                                if(closeInfo == true){
                                    closeInfo = false
                                    actualInfoShown = 'udp'
                                    newInfoText.setAttribute('visible', true);
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: olive">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newUdpBox.removeAttribute('sound');
                                    newUdpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown == 'udp'){
                                    actualInfoShown = ''
                                    newInfoText.setAttribute('visible', false);
                                    newUdpBox.removeAttribute('sound');
                                    newInfoText.removeAttribute('html');
                                    newUdpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown != ''){
                                    closeInfo = false
                                    actualInfoShown = 'udp'
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: olive">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newUdpBox.removeAttribute('sound');
                                    newUdpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }
                            }else{
                                notValid = true
                            }
                            
                        });
                    }
                    if(levels.hasOwnProperty('dns')){
                        index = Object.keys(levels).findIndex(item => item === 'dns')
                        let newDnsBox = document.createElement('a-box');
                        newDnsBox.setAttribute('position', { x: 0, y: 2 + (index), z: 0 });
                        newDnsBox.setAttribute('color', 'goldenrot');
                        newDnsBox.setAttribute('visible', true); // pheras
                        newDnsBox.setAttribute('isVisible', true); // pheras			
                        packet.appendChild(newDnsBox);
                        newDnsBox.addEventListener('mouseenter', function () {
                            newDnsBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
                        });
                        newDnsBox.addEventListener('mouseleave', function () {
                            newDnsBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                            newDnsBox.removeAttribute('animation');
                            newDnsBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
                        });
                        newDnsBox.addEventListener('click', function () {
                            if(newDnsBox.hasAttribute('isVisible')){
                                let infoText = ''/'<p>Nivel DNS:</p><p>Puerto origen: ' + packetParams.dns['dns.srcport'] + '</p><p>Puerto destino: ' + packetParams.dns['dns.dstport'] + '</p>'
                                if(closeInfo == true){
                                    closeInfo = false
                                    actualInfoShown = 'dns'
                                    newInfoText.setAttribute('visible', true);
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: goldenrod">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newDnsBox.removeAttribute('sound');
                                    newDnsBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown == 'dns'){
                                    actualInfoShown = ''
                                    newInfoText.setAttribute('visible', false);
                                    newDnsBox.removeAttribute('sound');
                                    newInfoText.removeAttribute('html');
                                    newDnsBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown != ''){
                                    closeInfo = false
                                    actualInfoShown = 'dns'
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: goldenrod">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newDnsBox.removeAttribute('sound');
                                    newDnsBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }
                            }else{
                                notValid = true
                            }
                            
                        });
                    }
                    if(levels.hasOwnProperty('http')){
                        index = Object.keys(levels).findIndex(item => item === 'http')
                        let newHttpBox = document.createElement('a-box');
                        newHttpBox.setAttribute('position', { x: 0, y: 2 + (index), z: 0 });
                        newHttpBox.setAttribute('color', 'gold');
                        newHttpBox.setAttribute('visible', true); // pheras
                        newHttpBox.setAttribute('isVisible', true); // pheras			
                        packet.appendChild(newHttpBox);
                        newHttpBox.addEventListener('mouseenter', function () {
                            newHttpBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
                        });
                        newHttpBox.addEventListener('mouseleave', function () {
                            newHttpBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                            newHttpBox.removeAttribute('animation');
                            newHttpBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
                        });
                        newHttpBox.addEventListener('click', function () {
                            if(newHttpBox.hasAttribute('isVisible')){
                                let infoText = ''//'<p>Nivel HTTP:</p><p>Puerto origen: ' + packetParams.http['http.srcport'] + '</p><p>Puerto destino: ' + packetParams.http['http.dstport'] + '</p>'
                                if(closeInfo == true){
                                    closeInfo = false
                                    actualInfoShown = 'http'
                                    newInfoText.setAttribute('visible', true);
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: gold">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newHttpBox.removeAttribute('sound');
                                    newHttpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown == 'http'){
                                    actualInfoShown = ''
                                    newInfoText.setAttribute('visible', false);
                                    newHttpBox.removeAttribute('sound');
                                    newInfoText.removeAttribute('html');
                                    newHttpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown != ''){
                                    closeInfo = false
                                    actualInfoShown = 'http'
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: gold">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newHttpBox.removeAttribute('sound');
                                    newHttpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }
                            }else{
                                notValid = true
                            }
                            
                        });
                    }
                    if(levels.hasOwnProperty('icmp')){
                        index = Object.keys(levels).findIndex(item => item === 'icmp')
                        let newIcmpBox = document.createElement('a-box');
                        newIcmpBox.setAttribute('position', { x: 0, y: 2 + (index), z: 0 });
                        newIcmpBox.setAttribute('color', 'red');
                        newIcmpBox.setAttribute('visible', true); // pheras
                        newIcmpBox.setAttribute('isVisible', true); // pheras			
                        packet.appendChild(newIcmpBox);
                        newIcmpBox.addEventListener('mouseenter', function () {
                            newIcmpBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
                        });
                        newIcmpBox.addEventListener('mouseleave', function () {
                            newIcmpBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                            newIcmpBox.removeAttribute('animation');
                            newIcmpBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
                        });
                        newIcmpBox.addEventListener('click', function () {
                            if(newIcmpBox.hasAttribute('isVisible')){
                                let infoText = '<p>Nivel ICMP:</p><p>Type: ' + packetParams.icmp['icmp.type'] + '</p><p>Code: ' + packetParams.icmp['icmp.code'] + '</p>'
                                if(closeInfo == true){
                                    closeInfo = false
                                    actualInfoShown = 'icmp'
                                    newInfoText.setAttribute('visible', true);
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: red">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newIcmpBox.removeAttribute('sound');
                                    newIcmpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown == 'icmp'){
                                    actualInfoShown = ''
                                    newInfoText.setAttribute('visible', false);
                                    newIcmpBox.removeAttribute('sound');
                                    newInfoText.removeAttribute('html');
                                    newIcmpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown != ''){
                                    closeInfo = false
                                    actualInfoShown = 'icmp'
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: red">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newIcmpBox.removeAttribute('sound');
                                    newIcmpBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }
                            }else{
                                notValid = true
                            }
                            
                        });
                    }

		    // TCP data
                    if(levels.hasOwnProperty('dataInfo')){
                        index = Object.keys(levels).findIndex(item => item === 'dataInfo')
                        let newDataBox = document.createElement('a-box');
                        newDataBox.setAttribute('position', { x: 0, y: 2 +(index), z: 0 });
                        newDataBox.setAttribute('color', 'white');
                        newDataBox.setAttribute('visible', true); // pheras
                        newDataBox.setAttribute('isVisible', true); // pheras			
                        packet.appendChild(newDataBox);
                        newDataBox.addEventListener('mouseenter', function () {
                            newDataBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
                        });
                        newDataBox.addEventListener('mouseleave', function () {
                            newDataBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                            newDataBox.removeAttribute('animation');
                            newDataBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
                        });
                        newDataBox.addEventListener('click', function () {
                            if(newDataBox.hasAttribute('isVisible')){
                                let infoText = '<p>DATOS:</p><p>Info datos: ' + hex_with_colons_to_ascii(packetParams.tcp['tcp.payload']) + '</p><p>Longitud de datos: ' + packetParams.tcp['tcp.len'] + '</p>'
                                if(closeInfo == true){
                                    closeInfo = false
                                    actualInfoShown = 'dataInfo'
                                    newInfoText.setAttribute('visible', true);
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: black">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newDataBox.removeAttribute('sound');
                                    newDataBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown == 'dataInfo'){
                                    actualInfoShown = ''
                                    newInfoText.setAttribute('visible', false);
                                    newDataBox.removeAttribute('sound');
                                    newInfoText.removeAttribute('html');
                                    newDataBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown != ''){
                                    closeInfo = false
                                    actualInfoShown = 'dataInfo'
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: black">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newDataBox.removeAttribute('sound');
                                    newDataBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }
                            }else{
                                notValid = true
                            }
                        });
                    }

		    // TCP or UDP data
                    if(levels.hasOwnProperty('data')){
                        index = Object.keys(levels).findIndex(item => item === 'data')
                        let newDataBox = document.createElement('a-box');
                        newDataBox.setAttribute('position', { x: 0, y: 2 +(index), z: 0 });
                        newDataBox.setAttribute('color', 'white');
                        newDataBox.setAttribute('visible', true); // pheras
                        newDataBox.setAttribute('isVisible', true); // pheras			
                        packet.appendChild(newDataBox);
                        newDataBox.addEventListener('mouseenter', function () {
                            newDataBox.setAttribute('scale', {x: 1.2, y: 1.2, z: 1.2});
                        });
                        newDataBox.addEventListener('mouseleave', function () {
                            newDataBox.setAttribute('scale', {x: 1, y: 1, z: 1})
                            newDataBox.removeAttribute('animation');
                            newDataBox.setAttribute('rotation', {x: 0, y: 0, z: 0});
                        });
                        newDataBox.addEventListener('click', function () {
                            if(newDataBox.hasAttribute('isVisible')){

				if (levels.hasOwnProperty('udp'))
                                    infoText = '<p>DATOS:</p><p>Info datos: ' + hex_with_colons_to_ascii(packetParams.data) + '</p><p>Longitud de datos: ' + packetParams.udp['udp.length'] + '</p>'
				else if (levels.hasOwnProperty('tcp'))
                                    infoText = '<p>DATOS:</p><p>Info datos: ' + hex_with_colons_to_ascii(packetParams.tcp['tcp.payload']) + '</p><p>Longitud de datos: ' + packetParams.tcp['tcp.len'] + '</p>'
				
                                if(closeInfo == true){
                                    closeInfo = false
                                    actualInfoShown = 'data'
                                    newInfoText.setAttribute('visible', true);
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: black">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newDataBox.removeAttribute('sound');
                                    newDataBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown == 'data'){
                                    actualInfoShown = ''
                                    newInfoText.setAttribute('visible', false);
                                    newDataBox.removeAttribute('sound');
                                    newInfoText.removeAttribute('html');
                                    newDataBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }else if(closeInfo == false && actualInfoShown != ''){
                                    closeInfo = false
                                    actualInfoShown = 'data'
                                    newInfoText.removeAttribute('html');
                                    var textTemplate = document.getElementById(packetParams.id + '-template');
                                    textTemplateContent = '<h1 style="padding: 0rem 1rem; font-size: 1rem; font-weight: 700; text-align: center; color: black">' + infoText + '</h1>'
                                    textTemplate.innerHTML = textTemplateContent;
                                    newInfoText.setAttribute('html', '#' + packetParams.id + '-template');
                                    newDataBox.removeAttribute('sound');
                                    newDataBox.setAttribute('sound', {src: '#showLevels', volume: 5, autoplay: "true"});
                                }
                            }else{
                                notValid = true
                            }
                        });
                    }
		    

                    packet.addEventListener('click', function () {    
                        if(notValid){
                            notValid = false
                        } else{
                            if(closeInfo){
                                for (var a=0; a< packet.children.length; a++) {
                                    if(packet.children[a].hasAttribute('isVisible')){
                                        packet.children[a].setAttribute('visible', false);
                                        packet.children[a].removeAttribute('isVisible');
                                        packet.removeAttribute('sound');
                                        packet.setAttribute('sound', {src: '#showInfo', volume: 5, autoplay: "true"});
                                    }else{
                                        if(!packet.children[a].hasAttribute('isPoster')){
                                            packet.children[a].setAttribute('isVisible', null);
                                            packet.children[a].setAttribute('visible', true);
                                            packet.removeAttribute('sound');
                                            packet.setAttribute('sound', {src: '#showInfo', volume: 5, autoplay: "true"});
                                        }    
                                    }
                                }
                            }
                        }
                        
                        if(actualInfoShown == ''){
                            closeInfo = true
                        }
                        
                    });

                    packet_move.setAttribute('animation', {
                        property: 'position',
                        to: packetParams.toXPosition + packetParams.toYPosition + packetParams.toZPosition,
                        dur: packetParams.duration,
                        easing: 'linear',
                        pauseEvents:'move-pause', 
                        resumeEvents:'move-resume'
                    });       
                    packet.addEventListener('animationcomplete', function () {
                        longitud = packet.children.length
                        nodeFromAnimation.removeAttribute('animation');
                        for (var a=0; a < longitud; a++) {
                            packet.children[0].remove()
                        }
                        packet.parentNode.removeChild(packet);
                    });
                }
                i++;
            }
        }

        var startButton = document.querySelector('#startButton');
        var packets = document.getElementsByClassName('packetClass');

        var animationStatus = 'animation-starts'
        startButton.addEventListener('click', function () {
            
            for (var a=0; a< packets.length; a++) {
		packets[a].emit(animationStatus,null,false)
            }

            switch(animationStatus) {
            case 'animation-starts':
                setInterval(startAnimation, 1000);
                animationStatus = 'move-pause'
                break
            case 'move-resume':
                animationStatus = 'move-pause'
                console.log('click')
                break
            case 'move-pause':
                animationStatus = 'move-resume'
                console.log('click2')
                break
            }
        });
    }
});

function setNodes(nodes, nodeList, data) {
    for (var i = 1; i < nodes.length; i++) {
        nodesInfo = nodes[i].split(');')
        nodesName = nodesInfo[1].split('"')
        newNode = {
            position: nodesInfo[0].slice(1),
            name: nodesName[1],
            hwaddr: [],
	    ipaddr:[],
	    mask:[]
        }

        let newNodeElement = document.createElement('a-entity');

        if(newNode.name.startsWith('pc')){
            newNodeElement.setAttribute('gltf-model', '#computer');
            newNodeElement.setAttribute('position', { x: (newNode.position.split(',')[0] / 15)/data.elementsScale, y: data.height, z: (newNode.position.split(',')[1] / 15)/data.elementsScale });
            newNodeElement.setAttribute('id', newNode.name);
            newNodeElement.setAttribute('scale', {x: 0.006/data.elementsScale, y: 0.006/data.elementsScale, z: 0.006/data.elementsScale});
            newNodeElement.setAttribute('rotation', '0 -90 0');
        }else if(newNode.name.startsWith('hub')){
            newNodeElement.setAttribute('gltf-model', '#hub');
            newNodeElement.setAttribute('position', { x: (newNode.position.split(',')[0] / 15)/data.elementsScale, y: data.height, z: (newNode.position.split(',')[1] / 15)/data.elementsScale });
            newNodeElement.setAttribute('id', newNode.name);
            newNodeElement.setAttribute('scale', {x: 1/data.elementsScale, y: 1/data.elementsScale, z: 1/data.elementsScale});
        }else if(newNode.name.startsWith('r')){
            newNodeElement.setAttribute('gltf-model', '#router');
            newNodeElement.setAttribute('position', { x: ((newNode.position.split(',')[0] / 15) -1.5)/data.elementsScale, y: data.height, z: (newNode.position.split(',')[1] / 15)/data.elementsScale });
            newNodeElement.setAttribute('id', newNode.name);
            newNodeElement.setAttribute('scale', {x: 0.008/data.elementsScale, y: 0.008/data.elementsScale, z: 0.008/data.elementsScale});
        }
        
        scene.appendChild(newNodeElement);

        var htmltemplates = document.getElementById("htmltemplates");
        var newSectionTemplate = document.createElement("section");
        templateText = '<h1 style="padding: 0rem 1rem; font-size: 3rem; font-weight: 700;">' + newNode.name + '</h1>'
        newSectionTemplate.innerHTML = templateText;
        newSectionTemplate.style = "display: inline-block; background: #CCCCCC; color: yellow; border-radius: 1em; padding: 1em; margin:0;"
        newSectionTemplate.id = newNode.name + '-template'
        htmltemplates.appendChild(newSectionTemplate);

        let newText = document.createElement('a-entity');
        newText.setAttribute('position', { x: ((newNode.position.split(',')[0] / 15) - 0.5)/data.elementsScale, y: (4)/data.elementsScale + data.height, z: (newNode.position.split(',')[1] / 15)/data.elementsScale });
        newText.setAttribute('html', '#' + newNode.name + '-template');
        newText.setAttribute('scale', {x: 10/data.elementsScale, y: 10/data.elementsScale, z: 10/data.elementsScale});
        newText.setAttribute('look-at', "[camera]");

        scene = document.querySelector('#escena');
        scene.appendChild(newText);
        nodeList.push(newNode)
        
    }

    return nodeList
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
            hwaddr: nodeList[k].hwaddr
        }
        connectionsLinksStandard.push(connectionLink)
    }

    writeConnections(connectionsLinksStandard, nodeList, data)

    console.log("connectionsLinksStandard: ")
    console.log(connectionsLinksStandard)
    
    return connectionsLinksStandard
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
        }
    }

    return connectionsLinksStandard
}

function  readPackets(responseParse) {
    packets = []
    for (var j = 0; j < responseParse.length; j++) {
        newAnimation = {
            src: responseParse[j].src,
            dst: responseParse[j].dst,
            time: responseParse[j].time,
            id: j,
        }

	// tcp and raw data encapsulated
        if(responseParse[j].tcp.length !== 0){
            newAnimation.tcp = responseParse[j].tcp;
	    
	    if(responseParse[j].tcp["tcp.len"] !== 0){ // TCP segment with data => add data layer
		newAnimation.data = responseParse[j].tcp["tcp.payload"];
	    }
	}

	// udp and raw data encapsulated
        if(responseParse[j].udp.length !== 0){
            newAnimation.udp = responseParse[j].udp;

	    if(responseParse[j].data["data.len"] !== 0){ // UDP segment with data => add data layer
		newAnimation.data = responseParse[j].data["data.data"];
	    }	    
        }

        if(responseParse[j].icmp.length !== 0){
            newAnimation.icmp = responseParse[j].icmp;
        }

        if(responseParse[j].dns.length !== 0){
            newAnimation.dns = responseParse[j].dns;
        }

        if(responseParse[j].http.length !== 0){
            newAnimation.http = responseParse[j].http;
        }
	
        if(responseParse[j].arp.length !== 0){
            newAnimation.arp = responseParse[j].arp;
        }
        if(responseParse[j].ip.length !== 0){
            newAnimation.ip = responseParse[j].ip;
        }
        if(responseParse[j].eth.length !== 0){
            newAnimation.eth = responseParse[j].eth;
        }
        packets.push(newAnimation)
    }
    return packets
}

function animatePackets(packets, connectionsLinks, data){
    console.log(data.elementsScale)
    finalPackets = []
    for (var j = 0; j < packets.length; j++) {
        var from = connectionsLinks.find(o => o.hwaddr.includes(packets[j].src))

        if (packets[j].dst != 'ff:ff:ff:ff:ff:ff') {
	    console.log("en el if")
            escena = document.querySelector('#escena');
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
			console.log("dentro del for")
			
                        secondFrom = to
                        secondTo = connectionsLinks.find(o => o.from === to.to[d])
			
			console.log(secondFrom)
			console.log(secondTo)
			
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
			console.log("---")
		    }
                }
	    }
        } else { // paquete de broadcast
	    console.log("broadcast")
	    
	    escena = document.querySelector('#escena');
	    

	    i = from.hwaddr.findIndex(o => o == packets[j].src)
	    nodeName = from.to[i]
	    console.log("nodeName: " + nodeName)
	    
	    to = connectionsLinks.find(o => o.from == nodeName)
	    
	    console.log("to:")
	    console.log(to)
	    
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
		
		console.log("antes del for")
                for (var d = 0; d < to.to.length; d++) {
		    if (to.to[d] != from.from){
			console.log("dentro del for")
			
                        secondFrom = to
                        secondTo = connectionsLinks.find(o => o.from === to.to[d])
			
			console.log(secondFrom)
			console.log(secondTo)
			
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
			console.log("---")
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
    
    console.log("finalPackets:")
    console.log(finalPackets)
    
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
        console.log(finalPackets[currentPacket].xPosition)
        console.log(finalPackets[currentPacket].zPosition)
        
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

