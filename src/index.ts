import * as _ from 'lodash';
import { Network } from './network/network';

const iconResource = {
  switch: { name: 'switch', url: './pic/cisco-WS-C49.png', width: '40', height: '40' },
  switchLayer3: { name: 'switchLayer3', url: './pic/cisco-WS-C68.png', width: '40', height: '40' },
  router: { name: 'router', url: './pic/cisco-18.png', width: '30', height: '30' },
};

const network = new Network('network');
network.addIconResource(iconResource);

network.callback = () => {

  const num = 20;
  for (let i: number = 0, len: number = num; i < len;) {
    i += 1;
    const node = network.createNode('router');
    network.addElement(node);
    node.x = Math.random() * 1000;
    node.y = Math.random() * 500;
  }
  const nodes = network.getNodes();
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
      network.addElement(edge);
      network.setBundle(edge);

      j += 1;
    }
    i += 2;
  }
  const group1 = network.createGroup();
  network.addElement(group1);

  const groupNodes1 = _.slice(_.shuffle(_.dropRight(nodes, (num / 2) + 1)), 0, 3);
  _.each(groupNodes1, (node) => {
    group1.addChildNodes(node);
  });
  group1.setStyle({
    fillOpacity: 1,
    fillColor: 0xcddc39,
  });
  group1.setOutlineStyle(2);

  // group.setExpaned(false);

  const group = network.createGroup();
  network.addElement(group);

  const groupNodes = _.slice(_.shuffle(_.dropRight(nodes, (num / 2) + 1)), 0, 3);
  _.each(groupNodes, (node) => {
    group.addChildNodes(node);
  });
  group.setStyle({
    fillOpacity: 1,
  });

  network.syncView();
  network.setDrag();
  network.setClick();

  const zoomIn = document.querySelector('button.btn_zoomIn');
  const zoomOut = document.querySelector('button.btn_zoomOut');
  const zoomOver = document.querySelector('button.btn_zoomOver');
  const dragOrSelect = document.querySelector('button.btn_dragOrSelect');
  const tooltipToggle = document.querySelector('button.btn_tooltipToggle');
  const bundleLabelToggle = document.querySelector('button.btn_bundleLabelToggle');
  const nodeLabelToggle = document.querySelector('button.btn_nodeLabelToggle');
  const searchNode = document.querySelector('button.btn_search_node');
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

  if (searchNode) {
    searchNode.addEventListener('click', () => {
      const searchInput = document.querySelector('input.input_search_node') as HTMLInputElement;
      network.searchNode(searchInput.value);
    });
  }
};
