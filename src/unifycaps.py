# capsFile = 'caps.json'
# capsRequest = new XMLHttpRequest();
# capsRequest.open('GET', capsFile);
# capsRequest.responseType = 'text';
# capsRequest.send();
# capsRequest.onload = function() {
#     response = capsRequest.response;
#     responseParse = JSON.parse(response)[0];

#     for (const hola in responseParse) {
#         console.log(hola)
#     }
# }

import json

class Packet(object):
    src = ""
    dst = ""
    time = ""
    id = 0
    dns= []
    http= []
    icmp= []
    udp= []
    tcp = []
    data = []
    dataInfo = []    
    arp = []
    ip = []
    eth = []

packets = []

with open('caps.json', 'r') as file:
    # caps = json.load(file)[0]
    caps = json.load(file)
    for cap in caps:
        with open(cap, 'r') as capFile:
            capFileParsed = json.load(capFile)
            # print(capFileParsed)

            for packet in capFileParsed:
                dictionary = {
                    'src': packet['_source']['layers']['eth']['eth.src'],
                    'dst': packet['_source']['layers']['eth']['eth.dst'],
                    'time': packet['_source']['layers']['frame']['frame.time_relative'],
                    'id': packet['_source']['layers']['frame']['frame.time_epoch'].split('.')[0],
                    'date': packet['_source']['layers']['frame']['frame.time'],
                    'udp': [],
                    'dns': [],
                    'http': [],
                    'icmp': [],
                    'tcp': [],
                    'data': [],
                    'dataInfo': [],                    
                    'arp': [],
                    'ip': [],
                    'eth': []
                }
                

                for layer in packet['_source']['layers']:
                    if layer == 'frame':
                        None
                        # No se añade
                    elif layer == 'tcp':
                        dictionary['tcp'] = packet['_source']['layers']['tcp']
                    elif layer == 'udp':
                        dictionary['udp'] = packet['_source']['layers']['udp']
                    elif layer == 'icmp':
                        dictionary['icmp'] = packet['_source']['layers']['icmp']
                    elif layer == 'dns':
                        dictionary['dns'] = packet['_source']['layers']['dns']
                    elif layer == 'http':
                        dictionary['http'] = packet['_source']['layers']['http']
                    elif layer == 'data-text-lines':
                        dictionary['data-text-lines'] = packet['_source']['layers']['data-text-lines']
                    elif layer == 'data':
                        dictionary['data'] = packet['_source']['layers']['data']
                    elif layer == 'dataInfo':
                        dictionary['dataInfo'] = packet['_source']['layers']['dataInfo']
                    elif layer == 'arp':
                        dictionary['arp'] =  packet['_source']['layers']['arp']
                    elif layer == 'ip':
                        dictionary['ip'] = packet['_source']['layers']['ip']
                    elif layer == 'eth':
                        dictionary['eth'] = packet['_source']['layers']['eth']
                    else:
                        print('Nuevo valor ' + layer)
                    
                packets.append(dictionary)


    with open('new_file.json', 'w') as f:
        json_object = json.dumps(packets, indent = 2)
        f.write(json_object)
        print("The json file is created")
