import * as _ from 'lodash';
import { Network } from './network/network';

const network = new Network('div#network');
const num = 50;

for (let i: number = 0, len: number = num; i < len;) {
  i += 1;
  const node = network.createNode();
  network.addElement(node);
  node.x = Math.random() * 1200;
  node.y = Math.random() * 900;
}
const nodes = network.getElements();
for (let i: number = 0, len: number = num; i < len;) {
  const srcNode = nodes[i];
  const destNode = nodes[i + 1];
  const edge = network.createEdge(srcNode, destNode);
  i += 2;
  edge.setStyle({
    arrowColor: 0Xc71bd3,
    arrowLength: 15,
    arrowType: 1,
    arrowWidth: 1,
    fillArrow: true,
    lineColor: 0xC7254E,
    lineDistance: 5,
    lineWidth: 0.8,
  });
  network.addElement(edge);
}

const group = network.createGroup();
network.addElement(group);
const groupNodes = _.slice(_.shuffle(_.dropRight(nodes, (num / 2) + 1)), 0 , num / 10);
_.each(groupNodes,(node) => {
  group.setChildrenNodes(node);
});
group.setGroupPosition();
network.drawGroupLine(group);
network.syncView();
