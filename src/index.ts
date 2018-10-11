import { Network } from './network/network';
import * as _ from 'lodash';

const network = new Network('div#network');
let num = 50;

for (let i: number = 0, len: number = num; i < len;) {
  i += 1;
  const node = network.createNode();
  network.addElement(node);
  node.x = Math.random() * 1200;
  node.y = Math.random() * 900;
}
let nodes = network.getElements();
for (let i: number = 0, len: number = num; i < len;) {
  let srcNode = nodes[i];
  let destNode = nodes[i+1];
  let edge = network.createEdge(srcNode, destNode);
  i += 2;
  edge.setStyle({
    lineDistance: 5,
    arrowWidth: 1,
    arrowColor: 0Xc71bd3,
    arrowLength: 15,
    lineWidth: 0.8,
    lineColor: 0xC7254E,
    arrowType: 1,
    fillArrow: true,
  });
  network.addElement(edge);
}

const group = network.createGroup();
network.addElement(group);
let groupNodes = _.slice(_.shuffle(_.dropRight(nodes,(num/2) + 1)),0,num/10);
_.each(groupNodes,(node) => {
  group.setChildrenNodes(node);
});
group.setGroupPosition();
network.drawGroupLine(group);
network.syncView();
