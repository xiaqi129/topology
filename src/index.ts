import * as _ from 'lodash';
import { Network } from './network/network';

const network = new Network('div#network');
const num = 50;
network.addResourceCache('switch', './pic/cisco-WS-C49.png');
network.addResourceCache('switchLayer3', './pic/cisco-WS-C68.png');
network.addResourceCache('router', './pic/cisco-18.png');

for (let i: number = 0, len: number = num; i < len;) {
  i += 1;
  const node = network.createNode('router');
  network.addElement(node);
  node.x = Math.random() * 1800;
  node.y = Math.random() * 900;

  const labelStyleOptions = {
    fontSize: 10,
    fontWeight: 'bold',
  };
  const label = network.createLabel(node.getUID(), labelStyleOptions);
  node.addChild(label);
  network.addTooltip(node);
}
const nodes = network.getElements();
for (let i: number = 0, len: number = num; i < len;) {
  const srcNode = nodes[i];
  const destNode = nodes[i + 1];
  for (let j = 0; j < 4;) {
    const edge = network.createEdge(srcNode, destNode);
    edge.setStyle({
      arrowColor: 0Xc71bd3,
      arrowLength: 15,
      arrowType: 0,
      arrowWidth: 1,
      fillArrow: true,
      lineColor: 0xC7254E,
      lineDistance: 5,
      lineType: 1,
      lineWidth: 1,
    });
    network.addTooltip(edge);
    network.addElement(edge);
    network.setBundle(edge);

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

// group.setExpaned(false);

network.syncView();
network.setDrag();
network.setClick();

const zoomIn = document.querySelector('button.btn_zoomIn');
const zoomOut = document.querySelector('button.btn_zoomOut');
const zoomOver = document.querySelector('button.btn_zoomOver');
const dragOrSelect = document.querySelector('button.btn_dragOrSelect');
const tooltipToggle = document.querySelector('button.btn_tooltipToggle');
const bundleLabelToggle = document.querySelector('button.btn_bundleToggle');
const nodeLabelToggle = document.querySelector('button.btn_nodeLabelToggle');
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
if (zoomOver) {
  let isZoom = true;
  zoomOver.addEventListener('click', () => {
    if (isZoom) {
      network.zoomOver();
    } else {
      network.zoomReset();
    }
    isZoom = !isZoom;
  });
}
if (dragOrSelect) {
  let isDrag = false;
  dragOrSelect.addEventListener('click', () => {
    if (isDrag) {
      network.setDrag();
    } else {
      network.setSelect();
    }
    isDrag = !isDrag;
  });
}
if (tooltipToggle) {
  let isDisplay = true;
  tooltipToggle.addEventListener('click', () => {
    isDisplay = !isDisplay;
    network.setTooltipDisplay(isDisplay);
  });
}
if (bundleLabelToggle) {
  bundleLabelToggle.addEventListener('click', () => {
    network.bundleLabelToggle();
  });
}

if (nodeLabelToggle) {
  nodeLabelToggle.addEventListener('click', () => {
    network.nodeLabelToggle();
  });
}
