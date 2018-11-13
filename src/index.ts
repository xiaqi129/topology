import * as _ from 'lodash';
import { Network } from './network/network';

const network = new Network('div#network');
const num = 50;
network.addResourceCache('switch', './pic/cisco-WS-C49.png');
network.addResourceCache('switchLayer3', './pic/cisco-WS-C68.png');
network.addResourceCache('router', './pic/cisco-18.png');

for (let i: number = 0, len: number = num; i < len;) {
  i += 1;
  const node = network.createNode();
  network.addElement(node);
  node.x = Math.random() * 1200;
  node.y = Math.random() * 500;

  const labelStyleOptions = {
    fontSize: 10,
    fontWeight: 'bold',
  };
  const label = network.createLabel(node.getUID(), labelStyleOptions);
  node.addChild(label);
}
const nodes = network.getElements();
for (let i: number = 0, len: number = num; i < len;) {
  const srcNode = nodes[i];
  const destNode = nodes[i + 1];
  for (let j = 0; j < 3;) {
    const edge = network.createEdge(srcNode, destNode);
    edge.setStyle({
      arrowColor: 0Xc71bd3,
      arrowLength: 15,
      arrowType: 0,
      arrowWidth: 1,
      fillArrow: true,
      lineColor: 0xC7254E,
      fillColor: 0xC7254E,
      lineDistance: 5,
      lineType: 1,
      lineWidth: 0.8,
    });
    edge.addEventListener('click', () => {
      alert('click!!');
    });
    network.addElement(edge);

    // edge.setBundleStyle(1);
    j += 1;
  }
  i += 2;

}

const group = network.createGroup();
network.addElement(group);

const groupNodes = _.slice(_.shuffle(_.dropRight(nodes, (num / 2) + 1)), 0, 3);
_.each(groupNodes, (node) => {
  node.setStyle({ lineColor: 0xf55d54 });
  group.addChildNodes(node);
  group.setStyle({
    fillOpacity: 1,
  });
});
group.addEventListener('click', (edges: any) => {
  alert(`${edges.length} link[s] referenced.`);
});
// group.setExpaned(false);

network.syncView();

const zoomIn = document.querySelector('button.btn_zoomIn');
const zoomOut = document.querySelector('button.btn_zoomOut');
const canvas = document.querySelector('div#network');
if (zoomIn) {
  zoomIn.addEventListener('click', () => {
    network.setZoom(0.3);
  });
}
if (zoomOut) {
  zoomOut.addEventListener('click', () => {
    network.setZoom(-0.3);
  });
}
if (canvas) {
  canvas.addEventListener('mousewheel', (e: any) => {
    const zoom = 0.2;
    network.setZoom(zoom, e);
  });
}
