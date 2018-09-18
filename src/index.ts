import { Network } from './network/network';

const network = new Network('div#network');

for (let i: number = 0, len: number = 10000; i < len;) {
  i += 1;
  const node = network.createNode();
  network.addElement(node);
  node.x = Math.random() * 1200;
  node.y = Math.random() * 900;
}
let nodes = network.getElements();
let srcNode = nodes[0];
let destNode = nodes[1];
let edge = network.createEdge(srcNode, destNode);
edge.setStyle({ 
  'arrow.fill': 'red',
  'arrow.stroke': 'red',
  'arrow.stroke.weight': 2,
  'arrow.distance': 25,
  'arow.length': 34,
  'line.style': 0xC7254E
});
network.addElement(edge);
network.syncView();
