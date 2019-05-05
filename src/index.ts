import * as _ from 'lodash';
import NP from 'number-precision';
// import { Labeler } from './network/lib/labeler';
import { Network } from './network/network';
import { data as topoData } from './simpleData';
const iconResource = {
  resources: { name: 'resources', url: './pic/imageDict.json' },
};
const keySort = (obj: any) => {
  const keys = Object.keys(obj).sort();
  const sortedObj: any = {};
  for (const i in keys) {
    if (keys.hasOwnProperty(i)) {

      sortedObj[keys[i]] = obj[keys[i]];
    }
  }
  return sortedObj;
};

const rgb2hex = (rgb: any) => {
  const hexR = (`0${parseInt(rgb[0], 10).toString(16)}`).slice(-2);
  const hexG = (`0${parseInt(rgb[1], 10).toString(16)}`).slice(-2);
  const hexB = (`0${parseInt(rgb[2], 10).toString(16)}`).slice(-2);

  return (rgb && rgb.length === 4) ? `0X${hexR}${hexG}${hexB}` : '';
};

const commonStyles = {
  backgroundColor: 'transparent;',
  color: 'black',
  padding: '5px 20px',
  fontSize: '12px',
  userSelect: 'none',
};

const nodeLabelStyle = {
  fontSize: 12,
};
const network = new Network('network');
(window as any).topo = network;
// const labeler = new Labeler();
network.initIconResource(iconResource);
// tslint:disable-next-line:only-arrow-functions
const noData = function () {
  const num = 4;
  for (let i: number = 0, len: number = num; i < len;) {
    i += 1;
    const node = network.createNode('cisco-ASR9');
    node.name = `node${i}`;
    // node.setNodeSize(25,25);
    network.addElement(node);
    node.x = Math.random() * 1800;
    node.y = Math.random() * 500;
  }
  const nodes = network.getNodes();
  for (let i: number = 0, len: number = num; i < len;) {
    const srcNode = nodes[i];
    const destNode = nodes[i + 1];
    for (let j = 0; j < 1;) {
      const edge = network.createEdge(srcNode, destNode);
      edge.initStyle({
        arrowColor: 0X006aad,
        arrowAngle: 20,
        arrowMiddleLength: 5,
        arrowLength: 8,
        arrowType: 3,
        fillArrow: true,
        lineColor: 0X0386d2,
        // lineDistance: 0,
        lineType: 1,
        lineFull: 0,
        lineWidth: 1,
      });
      network.addElement(edge);
      j += 1;
    }
    i += 2;
  }
  const edgeGroup = network.createEdgeGroup();
  network.addElement(edgeGroup);
  _.each(network.getEdgeObj(), (edge) => {
    edgeGroup.addChildEdges(edge);
  });
  // const simpleEdge: any = _.sample(network.getEdgeObj());
  // edgeGroup.addChildEdges(simpleEdge);
  edgeGroup.initStyle({
    fillColor: 0xf55d54,
    fillOpacity: 0,
    lineColor: 0xf55d54,
    margin: 8,
  });
  // const group = network.createGroup();
  // network.addElement(group);

  // const groupNodes = _.slice(_.shuffle(_.dropRight(nodes, (num / 2) + 1)), 0, 3);
  // _.each(groupNodes, (node) => {
  //   node.setStyle({ lineColor: 0xf55d54 });
  //   group.addChildNodes(node);
  //   group.setStyle({
  //     fillOpacity: 1,
  //   });
  // });
  network.syncView();
  network.setDrag();
  network.setZoom();
  network.moveCenter();
};

// tslint:disable-next-line: only-arrow-functions
const edgeGroupDemo = function () {
  const data = {
    devices: [
      {
        name: 'name-1',
        location: {
          x: 200,
          y: 200,
        },
      },
      {
        name: 'name-2',
        location: {
          x: 350,
          y: 250,
        },
      },
      {
        name: 'name-3',
        location: {
          x: 500,
          y: 320,
        },
      },
      {
        name: 'name-4',
        location: {
          x: 430,
          y: 450,
        },
      },
      {
        name: 'name-5',
        location: {
          x: 270,
          y: 500,
        },
      },
      {
        name: 'name-6',
        location: {
          x: 150,
          y: 400,
        },
      },
      {
        name: 'name-7',
        location: {
          x: 50,
          y: 300,
        },
      },
      {
        name: 'name-8',
        location: {
          x: 0,
          y: 500,
        },
      },

    ],
    links: [
      {
        name: '1',
        local_host: 'name-1',
        remote_host: 'name-2',
        style: {
          lineType: 0,
          lineFull: 0,
        },
      },
      {
        name: '2',
        local_host: 'name-2',
        remote_host: 'name-3',
        style: {
          lineType: 0,
          lineFull: 0,
        },
      },
      {
        name: '3',
        local_host: 'name-1',
        remote_host: 'name-4',
        style: {
          lineType: 1,
          lineFull: 0,
        },
      },
      {
        name: '4',
        local_host: 'name-1',
        remote_host: 'name-7',
        style: {
          lineType: 1,
          lineFull: 0,
        },
      },
      {
        name: '5',
        local_host: 'name-2',
        remote_host: 'name-4',
        style: {
          lineType: 0,
          lineFull: 0,
        },
      },
      {
        name: '6',
        local_host: 'name-3',
        remote_host: 'name-7',
        style: {
          lineType: 1,
          lineFull: 1,
        },
      },
      {
        name: '7',
        local_host: 'name-3',
        remote_host: 'name-6',
        style: {
          lineType: 1,
          lineFull: 1,
        },
      },
      {
        name: '8',
        local_host: 'name-3',
        remote_host: 'name-8',
        style: {
          lineType: 0,
          lineFull: 1,
        },
      },
      {
        name: '9',
        local_host: 'name-3',
        remote_host: 'name-4',
        style: {
          lineType: 0,
          lineFull: 1,
        },
      },
      {
        name: '10',
        local_host: 'name-6',
        remote_host: 'name-5',
        style: {
          lineType: 1,
          lineFull: 0,
        },
      },
      {
        name: '11',
        local_host: 'name-6',
        remote_host: 'name-7',
        style: {
          lineType: 0,
          lineFull: 0,
        },
      },
      {
        name: '12',
        local_host: 'name-6',
        remote_host: 'name-8',
        style: {
          lineType: 1,
          lineFull: 1,
        },
      },
      {
        name: '13',
        local_host: 'name-5',
        remote_host: 'name-8',
        style: {
          lineType: 0,
          lineFull: 0,
        },
      },
      {
        name: '14',
        local_host: 'name-7',
        remote_host: 'name-8',
        style: {
          lineType: 0,
          lineFull: 0,
        },
      },

    ],
    groups: [
      {
        name: 'group1',
        style: {
          fillColor: 0xf55d54,
          margin: 8,
        },
        children: ['1'],
      },
      {
        name: 'group2',
        style: {
          fillColor: 0Xa3d89f,
          margin: 8,
        },
        children: ['2'],
      },
      {
        name: 'group3',
        style: {
          fillColor: 0Xfcc242,
          margin: 8,
        },
        children: ['5'],
      },
      {
        name: 'group4',
        style: {
          fillColor: 0xf55d54,
          margin: 8,
          fillOpacity: 0,
          lineColor: 0xf55d54,
        },
        children: ['9'],
      },
      {
        name: 'group5',
        style: {
          fillColor: 0xf55d54,
          margin: 8,
          fillOpacity: 0,
          lineColor: 0Xa378b4,
          lineWidth: 2,
        },
        children: ['4'],
      },
      {
        name: 'group6',
        style: {
          fillColor: 0xf55d54,
          margin: 8,
          fillOpacity: 0,
          lineColor: 0Xfcc242,
          lineWidth: 2,
        },
        children: ['12', '13'],
      },
      {
        name: 'group7',
        style: {
          fillColor: 0X0984e3,
          margin: 8,
          fillOpacity: 0,
          lineColor: 0X0984e3,
          lineWidth: 2,
        },
        children: ['6'],
      },
    ],
  };
  const devices = data.devices;
  const links = data.links;
  const groups = data.groups;
  _.each(devices, (device: any) => {
    const node = network.createNode('cisco-ASR9');
    node.name = device.name;
    node.x = device.location.x;
    node.y = device.location.y;
    network.addElement(node);
  });
  const nodes = network.getNodeObj();
  _.each(links, (link: any) => {
    const srcNodeName = link.local_host;
    const destNodeName = link.remote_host;
    const srcNode = _.get(nodes, srcNodeName);
    const destNode = _.get(nodes, destNodeName);
    if (srcNode && destNode) {
      const edge = network.createEdge(srcNode, destNode);
      edge.name = link.name;
      edge.initStyle({
        arrowColor: 0X006aad,
        arrowAngle: 20,
        arrowMiddleLength: 5,
        arrowLength: 8,
        arrowType: 3,
        fillArrow: true,
        lineColor: 0X0386d2,
        lineType: link.style.lineType,
        lineFull: link.style.lineFull,
        lineWidth: 1,
      });
      network.addElement(edge);
    }
  });
  const edges = network.getEdgeObj();
  _.each(groups, (group) => {
    const edgeGroup = network.createEdgeGroup();
    network.addElement(edgeGroup);
    _.each(group.children, (child) => {
      const edge: any = _.find(edges, (e: any) => {
        return e.name === child;
      });
      edgeGroup.addChildEdges(edge);
    });
    edgeGroup.initStyle(group.style);
    edgeGroup.setLabel('1111111111');
  });
  network.syncView();
  network.setDrag();
  network.setZoom();
  network.setBundelExpanded(false);
  network.moveCenter();
};

// tslint:disable-next-line:only-arrow-functions
const simpleData = function () {
  const devices = topoData.devices;
  const links = topoData.links;
  const groups = topoData.groups;
  const groupsList = keySort(groups);
  const labelArray: any = [];
  const anchorArray: any = [];
  // create Node
  _.each(devices, (device: any) => {
    const client = device.clients.User_Mark;
    if (!(client === 'Hidden')) {
      const node = network.createNode('cisco-ASR9');
      const sprite: any = node.getChildByName('node_sprite');
      sprite.tint = 0x000000;
      node.setNodeSize(25, 25);
      node.name = device.name;
      node.clients = device.clients;
      const tooltipContent = `
          <table border = "1">
            <tr class="dog">
            <th>HostName</th>
            <th>Manufacture</th>
            <th>Platform</th>
            <th>Device IP</th>
            <th>From Source</th>
            <th>ICON</th>
            <th>Role</th>
            </tr>
            <tr>
            <td>${node.name}</td>
            <td>${device.clients.User_Manufacturer}</td>
            <td>${device.clients.platform}</td>
            <td>${device.clients.deviceIP}</td>
            <td>${device.clients.device_source}</td>
            <td>${device.image}</td>
            <td>${device.clients.User_Role}</td>
            </tr>
            <tr>
            <td>${node.name}</td>
            <td>${device.clients.User_Manufacturer}</td>
            <td>${device.clients.platform}</td>
            <td>${device.clients.deviceIP}</td>
            <td>${device.clients.device_source}</td>
            <td>${device.image}</td>
            <td>${device.clients.User_Role}</td>
            </tr>
            <tr>
            <td>${node.name}</td>
            <td>${device.clients.User_Manufacturer}</td>
            <td>${device.clients.platform}</td>
            <td>${device.clients.deviceIP}</td>
            <td>${device.clients.device_source}</td>
            <td>${device.image}</td>
            <td>${device.clients.User_Role}</td>
            </tr>
            <tr>
            <td>${node.name}</td>
            <td>${device.clients.User_Manufacturer}</td>
            <td>${device.clients.platform}</td>
            <td>${device.clients.deviceIP}</td>
            <td>${device.clients.device_source}</td>
            <td>${device.image}</td>
            <td>${device.clients.User_Role}</td>
            </tr>
            </table>`;
      network.addElement(node);
      node.x = device.location.x;
      node.y = device.location.y;
      const label = node.setLabel(device.name, nodeLabelStyle);
      // const sprite: any = node.getChildByName('node_sprite');
      // const radius = sprite.width > sprite.height ? sprite.width : sprite.height;
      // if (label && sprite) {
      //   labelArray.push({
      //     x: node.x + label.x,
      //     y: node.y + label.y,
      //     name: label.text,
      //     width: label.width,
      //     height: label.height,
      //   });
      //   anchorArray.push({
      //     x: node.x,
      //     y: node.y,
      //     r: radius,
      //   });
      // }
      node.setTooltip(tooltipContent, commonStyles);
      node.on('rightclick', (event: any) => {
        network.menu.setMenuItems([
          { label: 'Aggregated as a group', id: '0' },
          { label: 'Hide the Node', id: '1' },
          { label: 'Change Switch Icon', id: '2' },
          { label: 'Lock/Unlock Node', id: '3' },
          { label: 'Print Node', id: '4' },
          { label: 'Mark Node', id: '5' },
          { label: 'unMark Node', id: '6' },
          { label: 'Disaggregate selected group', id: '5' },
          { label: 'Extened a group', id: '6' },
          { label: 'Lock/Unlock Group', id: '7' },
          { label: 'Remove Group', id: '8' },
          { label: 'Debug', id: '9' },
        ]);
        network.menu.menuOnAction = (id) => {
          if (id === '0') {
            const selectedNodes = network.getSelectedNodes();
            const group = network.createGroup();
            network.addElement(group);
            group.setOutlineStyle(2);
            _.each(selectedNodes, (selectedNode) => {
              group.addChildNodes(selectedNode);
            });
            group.on('rightclick', (groupevent: any) => {
              network.menu.setMenuItems([
                // { label: 'Aggregated as a group', id: '0' },
                { label: 'Disaggregate selected group', id: '0' },
              ]);
              network.menu.menuOnAction = (groupid) => {
                if (groupid === '0') {
                  group.removeChildNodes();
                }
              };
              network.menu.setClass('popMenu');
              network.menu.showMenu(groupevent);
            });
            network.syncView();
          } else if (id === '1') {
            const groupList = network.getGroupObj();
            network.hideElement(node);
            _.each(groupList, (group: any) => {
              group.draw();
            });
          } else if (id === '2') {
            // node.iconWidth = 40;
            // node.iconHeight = 60;
            node.changeIcon('cisco-18');
          } else if (id === '3') {
            const selectNodes = network.getSelectedNodes();
            _.each(selectNodes, (selectNode) => {
              if (!selectNode.isLock) {
                network.lockElement(selectNode);
              } else {
                network.unlockElement(selectNode);
              }
            });
          } else if (id === '4') {
            // tslint:disable-next-line:no-console
            console.log(node);
          } else if (id === '5') {
            const a = node.addNodeMark('mapSVG', 'top');
          } else if (id === '6') {
            node.removeNodeMark('mapSVG');
          }
        };
        network.menu.setClass('popMenu');
        network.menu.showMenu(event);
      });
      // let dragging: boolean = false;
      // let data: any = null;
      // let parent: any = null;
      // let last: any = null;
      // let mark: PIXI.Sprite | undefined;
      // node.on('mousedown', (event: any) => {
      //   if (network.getSelectedNodes().length === 0) {
      //     mark = node.addNodeMark('map-greenSVG', 'bottom-left');
      //     mark.on('mousedown', (e: any) => {
      //       parent = node.parent.toLocal(e.data.global);
      //       node.off('mousemove');
      //       dragging = true;
      //       data = e.data;
      //       last = { parents: parent, x: e.data.global.x, y: e.data.global.y };
      //     });
      //     mark.on('mousemove', (e: any) => {
      //       if (dragging) {
      //         const newPosition = data.getLocalPosition(node.parent);
      //         const distX = e.data.global.x;
      //         const distY = e.data.global.y;
      //         network.createArrowLine(parent, newPosition);
      //         last = { parents: newPosition, x: distX, y: distY };
      //       }
      //     });
      //     document.addEventListener('mouseup', () => {
      //       dragging = false;
      //       data = null;
      //       last = null;
      //       node.on('mousemove', node.onDragMove);
      //     });
      //   }
      // });
    }
  });
  // const wrapper = document.getElementById('network');
  // console.log(labelArray);
  // labeler.label(labelArray);
  // labeler.anchor(anchorArray);
  // if (wrapper) {
  //   labeler.width(wrapper.clientWidth);
  //   labeler.height(wrapper.clientHeight);
  // }
  // labeler.start(1000);
  // console.log(labeler.start(1000));
  // create Links
  const nodes = network.getNodeObj();
  // const edgeLabel = {
  //   fill: [
  //     'red',
  //     '#be1432',
  //   ],
  //   fontFamily: 'Times New Roman',
  //   fontSize: 12,
  //   fontWeight: 'bold',
  //   letterSpacing: 1,
  //   lineJoin: 'bevel',
  //   stroke: '#800040',
  //   strokeThickness: 1,
  // };
  _.each(links, (link) => {
    const srcNodeName = link.local_host;
    const destNodeName = link.remote_host;
    const srcNode = _.get(nodes, srcNodeName);
    const destNode = _.get(nodes, destNodeName);
    const linkTooltipContent = `
    <table border = "1">
      <tr class="dog">
      <th>HostName</th>
      <th>Interface</th>
      <th>Interface</th>
      <th>Hostname</th>
      <th>Link Protocol</th>
      <th>Link State</th>
      </tr>
      <tr>
      <td>${link.local_host}</td>
      <td>${link.remote_host}</td>
      <td>${link.local_int}</td>
      <td>${link.remote_int}</td>
      <td>${link.link_state}</td>
      <td>${link.link_protocol}</td>
      </tr>
      </table>`;
    if (srcNode && destNode) {
      const edge = network.createEdge(srcNode, destNode);
      edge.initStyle({
        arrowColor: 0X006aad,
        arrowAngle: 20,
        arrowMiddleLength: 5,
        arrowLength: 8,
        arrowType: 3,
        fillArrow: true,
        lineColor: 0X0386d2,
        // lineDistance: 0,
        lineType: 0,
        lineFull: 0,
        lineWidth: 1,
      });
      edge.setTooltip(linkTooltipContent, commonStyles);
      edge.edge.on('rightclick', (event: any) => {
        network.menu.setMenuItems([
          { label: 'Select its neighbors', id: '0' },
          { label: 'Hide/Unhide this links', id: '1' },
          { label: 'Print line Info', id: '2' },
          { label: 'Remove Link', id: '3' },
        ]);
        network.menu.menuOnAction = (id) => {
          if (id === '0') {
            const node: any = network.getNodeObj();
            const startNode = node[edge.startNode.name];
            const endNode = node[edge.endNode.name];
            network.clearHighlight();
            network.setSelectNodes(startNode);
            network.setSelectNodes(endNode);
          } else if (id === '1') {
            network.removeElements(edge);
          } else if (id === '2') {
            // tslint:disable-next-line:no-console
            console.log(edge);
          } else if (id === '3') {
            // network.syncView();
            network.removeElements(edge);
          }
        };
        network.menu.setClass('popMenu');
        network.menu.showMenu(event);
      });
      edge.setLabel(link.local_int, link.remote_int, {
        fontSize: 12,
      });
      network.addElement(edge);
    }
  });
  _.each(groupsList, (group) => {
    const bgColor = group.style.bgColor;
    const newGroup = network.createGroup();
    const children = group.children;
    newGroup.name = group.id;
    newGroup.setOutlineStyle(2);
    newGroup.initStyle({
      fillOpacity: 0.5,
      fillColor: rgb2hex(bgColor),
      lineColor: 0Xb0bdbf,
    });
    _.each(children, (child) => {
      const node = _.get(nodes, child);
      if (node) {
        newGroup.addChildNodes(node);
      }
    });
    const nameArr = _.split(newGroup.name as string, '#@');
    newGroup.setLabel(`${nameArr[nameArr.length - 1]}`, 'Center');
    newGroup.setToggleExpanded(true);
    newGroup.on('rightclick', (event: any) => {
      network.menu.setMenuItems([
        { label: 'Disaggregate selected group', id: '0' },
        { label: 'Extened a group', id: '1' },
        { label: 'Lock/Unlock Group', id: '2' },
        { label: 'Remove Group', id: '3' },
        { label: 'Debug', id: '4' },
      ]);
      network.menu.menuOnAction = (id) => {
        if (id === '0') {
          newGroup.removeChildNodes();
        } else if (id === '1') {
          newGroup.setStyle({
            padding: 50,
          });
          newGroup.draw();
        } else if (id === '2') {
          if (!newGroup.isLock) {
            network.lockElement(newGroup);
          } else {
            network.unlockElement(newGroup);
          }
        } else if (id === '3') {
          network.removeElements(newGroup);
        } else if (id === '4') {
          // tslint:disable-next-line:no-console
          console.log(newGroup);
        }
      };
      network.menu.setClass('popMenu');
      network.menu.showMenu(event);
    });
    network.addElement(newGroup);
  });
  network.layerHide = true;
  network.syncView();
  network.setDrag();
  network.setZoom();
  network.setBundelExpanded(false);
  network.moveCenter();
};
network.callback = () => {
  // simpleData();
  // noData();
  edgeGroupDemo();
};
const body = document.getElementById('network');
const zoomIn = document.querySelector('button.btn_zoomIn');
const zoomOut = document.querySelector('button.btn_zoomOut');
const zoomOver = document.querySelector('button.btn_zoomOver');
const tooltipToggle = document.querySelector('button.btn_tooltipToggle');
const bundleToggle = document.querySelector('button.btn_bundleLabelToggle');
const nodeLabelToggle = document.querySelector('button.btn_nodeLabelToggle');
const groupLabelToggle = document.querySelector('button.btn_groupLabelToggle');
const linkLabelToggle = document.querySelector('button.btn_linkLabelToggle');
const searchNode = document.querySelector('button.btn_search_node');
if (zoomIn) {
  zoomIn.addEventListener('click', () => {
    const zoom = network.zoom;
    const networkSize = network.getNetworkSize();
    if (network.zoom < 4) {
      network.zoomNetworkElements(NP.plus(network.zoom, 0.1));
    }
    if (networkSize) {
      network.moveTopology(network.zoom / zoom, networkSize[0] / 2, networkSize[1] / 2);
    }
  });
}
if (zoomOut) {
  zoomOut.addEventListener('click', () => {
    const zoom = network.zoom;
    const networkSize = network.getNetworkSize();
    if (network.zoom > 0.4) {
      network.zoomNetworkElements(NP.minus(network.zoom, 0.1));
    }
    if (networkSize) {
      network.moveTopology(network.zoom / zoom, networkSize[0] / 2, networkSize[1] / 2);
    }
  });
}
if (zoomOver) {
  // let isZoom = true;
  zoomOver.addEventListener('click', () => {
    network.zoomOver();
    // const container = network.getContainer();
    // const wrapperContainr = network.getNetworkSize();
    // if (container && wrapperContainr) {
    //   const scaleX = container.width < wrapperContainr[0] ? container.width / wrapperContainr[0] : wrapperContainr[0] / container.width;
    //   const scaleY = container.height < wrapperContainr[1] ? container.height / wrapperContainr[1] : wrapperContainr[1] / container.height;
    //   const zoom = scaleX > scaleY ? scaleY : scaleX;
    //   network.zoomNetworkElements(zoom);
    //   network.moveTopology(network.zoom / zoom, wrapperContainr[0] / 2, wrapperContainr[1] / 2);
    // }
    // isZoom = !isZoom;
  });
}
if (tooltipToggle) {
  let isDisplay = true;
  tooltipToggle.addEventListener('click', () => {
    isDisplay = !isDisplay;
    network.setTooltipDisplay(isDisplay);
  });
}
let labelToggle = true;
if (nodeLabelToggle) {
  nodeLabelToggle.addEventListener('click', () => {
    labelToggle = !labelToggle;
    network.bundleLabelToggle(labelToggle);
  });
}
let bundleLabelToggle = true;
if (bundleToggle) {
  bundleToggle.addEventListener('click', () => {
    bundleLabelToggle = !bundleLabelToggle;
    network.setBundelExpanded(bundleLabelToggle);
  });
}
let edgeLabelToggle = true;
if (linkLabelToggle) {
  linkLabelToggle.addEventListener('click', () => {
    edgeLabelToggle = !edgeLabelToggle;
    network.edgeLabelToggle(edgeLabelToggle);
  });
}
if (searchNode) {
  searchNode.addEventListener('click', () => {
    const searchInput = document.querySelector('input.input_search_node') as HTMLInputElement;
    _.each(network.getNodes(), (node) => {
      if (node.getUID() === `element_${searchInput.value}`) {
        node.selectOn();
      }
    });
  });
}

// let grouptitleToggle = true;
const emptyObj = {
  type: 'square',
  location: { x: 100, y: 100 },
  size: 100,
  color: 0X00ff00,
  opacity: 0.5,
};
if (groupLabelToggle) {
  groupLabelToggle.addEventListener('click', () => {
    const emptyGroup = network.createGroup(emptyObj);
    emptyGroup.defaultStyle.fillColor = 0X00ff00;
    emptyGroup.defaultStyle.fillOpacity = 0.5;
    emptyGroup.draw();
    network.addElement(emptyGroup);
    emptyGroup.setLabel('text', 'Center');
    network.syncView();
    emptyGroup.on('rightclick', (event: any) => {
      network.menu.setMenuItems([
        { label: 'add child node', id: '0' },
        { label: 'change style', id: '1' },
      ]);
      network.menu.menuOnAction = (id) => {
        if (id === '0') {
          const node1 = _.get(network.getNodeObj(), '192.168.30.0/24');
          const node2 = _.get(network.getNodeObj(), '192.168.40.0/24');
          emptyGroup.addChildNodes(node1);
          emptyGroup.addChildNodes(node2);
        } else if (id === '1') {
          emptyGroup.defaultStyle.fillColor = 0Xff0000;
          emptyGroup.draw();
        }
      };
      network.menu.setClass('popMenu');
      network.menu.showMenu(event);
    });
    // grouptitleToggle = !grouptitleToggle;
    // const node = network.getNodeObj();
    // _.each(node, (n: any) => {
    //   if (grouptitleToggle) {
    //     n.setLabelText(n.name);
    //   } else {
    //     n.setLabelText(n.clients.User_Role);
    //   }
    // });
  });
}
if (body) {
  window.addEventListener('keydown', (e) => {
    if (e.keyCode === 17 && !network.isSelect) {
      network.setSelect(false);
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.keyCode === 17) {
      network.setDrag();
    }
  });
  let pressSpace = true;
  window.addEventListener('keydown', (e) => {
    if (e.keyCode === 32 && e.ctrlKey && pressSpace) {
      network.setSelect(true);
      pressSpace = false;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.keyCode === 32 && e.ctrlKey) {
      network.setDrag();
      pressSpace = true;
    }
  });
}
