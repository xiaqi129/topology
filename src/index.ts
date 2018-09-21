import { Network } from './network/network';

const network = new Network('div#network');

for (let i: number = 0, len: number = 50; i < len;) {
  i += 1;
  const node = network.createNode();
  network.addElement(node);
  node.x = Math.random() * 1200;
  node.y = Math.random() * 900;
}
let nodes = network.getElements();
for (let i: number = 0, len: number = 50; i < len;) {
  let srcNode = nodes[i];
  let destNode = nodes[i+1];
  let edge = network.createEdge(srcNode, destNode);
  i += 2;
  edge.setStyle({
    // lineDistance: 5,
    // arrowWidth: 1,
    // arrowColor: 0Xc71bd3,
    // arrowLength: 15,
    // lineWidth: 2,
    // lineColor: 0xC7254E,
    // arrowType: 3,
  });
  network.addElement(edge);
}
network.syncView();
