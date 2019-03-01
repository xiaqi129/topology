import * as _ from 'lodash';
import NP from 'number-precision';
import { Network } from './network/network';
import { data as topoData } from './simpleData';

const iconResource = {
  resources: { name: 'resources', url: './pic/imageDict.json' },
};
(window as any).np = NP;
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
  fontSize: 8,
  breakWords: true,
  wordWrap: true,
  wordWrapWidth: 73,
};
const network = new Network('network');
network.initIconResource(iconResource);

// tslint:disable-next-line:only-arrow-functions
const noData = function () {
  const num = 3000;
  for (let i: number = 0, len: number = num; i < len;) {
    i += 1;
    const node = network.createNode('routerSVG');
    network.addElement(node);
    node.x = Math.random() * 1800;
    node.y = Math.random() * 900;
  }
  const nodes = network.getNodes();
  for (let i: number = 0, len: number = num; i < len;) {
    const srcNode = nodes[i];
    const destNode = nodes[i + 1];
    for (let j = 0; j < 1;) {
      const edge = network.createEdge(srcNode, destNode);
      edge.setStyle({
        arrowColor: 0Xc71bd3,
        arrowLength: 15,
        arrowType: 3,
        arrowWidth: 1,
        fillArrow: true,
        lineColor: 0X0386d2,
        lineDistance: 5,
        lineType: 0,
        lineWidth: 1,
      });
      network.addElement(edge);

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
  network.syncView();
  network.setDrag();
};

// tslint:disable-next-line:only-arrow-functions
const simpleData = function () {
  (window as any).network = network;
  const devices = topoData.devices;
  const links = topoData.links;
  const groups = topoData.groups;
  const groupsList = keySort(groups);
  // create Node
  _.each(devices, (device: any) => {
    const client = device.clients.User_Mark;
    if (!(client === 'Hidden')) {
      const node = network.createNode('routerSVG');
      // node.iconWidth = 50;
      // node.iconHeight = 50;
      node.draw();
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
      node.setLabel(device.name, nodeLabelStyle);
      node.setTooltip(tooltipContent, commonStyles);
      node.on('rightclick', (event: any) => {
        network.menu.setMenuItems([
          { label: 'Aggregated as a group', id: '0' },
          { label: 'Hide the Node', id: '1' },
          { label: 'Change Switch Icon', id: '2' },
          { label: 'Lock/Unlock Node', id: '3' },
          { label: 'Print Node', id: '4' },
          { label: 'Remove Node', id: '5' },
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
            network.removeElements(node);
          }
        };
        network.menu.setClass('popMenu');
        network.menu.showMenu(event);
      });
    }
  });
  // create Links
  const nodes = network.getNodeObj();
  const edgeLabel = {
    fill: [
      'red',
      '#be1432',
    ],
    fontFamily: 'Times New Roman',
    // fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    lineJoin: 'bevel',
    stroke: '#800040',
    strokeThickness: 1,
  };
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
      edge.setStyle({
        arrowColor: 0X006aad,
        arrowLength: 13,
        arrowType: 3,
        arrowWidth: 0.01,
        fillArrow: true,
        lineColor: 0X0386d2,
        lineDistance: 0,
        lineType: 0,
        lineWidth: 0.5,
      });
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
            network.removeElements(edge);
          }
        };
        network.menu.setClass('popMenu');
        network.menu.showMenu(event);
      });
      edge.setTooltip(linkTooltipContent, commonStyles);
      network.addElement(edge);
      edge.setLabel(link.local_int, link.remote_int, {
        fontSize: 8,
      });
    }
  });
  _.each(groupsList, (group) => {
    const bgColor = group.style.bgColor;
    const newGroup = network.createGroup();
    const children = group.children;
    newGroup.name = group.id;
    network.addElement(newGroup);
    newGroup.setOutlineStyle(2);
    newGroup.setStyle({
      fillOpacity: 0.3,
      fillColor: rgb2hex(bgColor),
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
  });
  network.syncView();
  network.setDrag();
  network.clearZoom();
};
network.callback = () => {
  simpleData();
  // noData();
};
const body = document.getElementById('network');
const zoomIn = document.querySelector('button.btn_zoomIn');
const zoomOut = document.querySelector('button.btn_zoomOut');
const zoomOver = document.querySelector('button.btn_zoomOver');
const dragOrSelect = document.querySelector('button.btn_dragOrSelect');
const tooltipToggle = document.querySelector('button.btn_tooltipToggle');
const bundleToggle = document.querySelector('button.btn_bundleLabelToggle');
const nodeLabelToggle = document.querySelector('button.btn_nodeLabelToggle');
const groupLabelToggle = document.querySelector('button.btn_groupLabelToggle');
const linkLabelToggle = document.querySelector('button.btn_linkLabelToggle');
const searchNode = document.querySelector('button.btn_search_node');
if (zoomIn) {
  zoomIn.addEventListener('click', () => {
    network.setZoom(network.getZoom() + 0.1);
  });
}
if (zoomOut) {
  zoomOut.addEventListener('click', () => {
    if (network.getZoom() > 0.2) {
      network.setZoom(network.getZoom() - 0.1);
    }
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
let labelToggle = true;
if (nodeLabelToggle) {
  nodeLabelToggle.addEventListener('click', () => {
    labelToggle = !labelToggle;
    network.setBundleFlag(labelToggle);
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
if (searchNode) {
  searchNode.addEventListener('click', () => {
    const searchInput = document.querySelector('input.input_search_node') as HTMLInputElement;
    _.each(network.getNodes(), (node) => {
      if (node.getUID() === `element_${searchInput.value}`) {
        network.searchNode(node);
      }
    });
  });
}
const zoomNetworkElements = (zoomNum: number, e: any) => {
  const nodesObj = network.getNodeObj();
  const zoomScale = NP.divide(zoomNum, network.zoom);
  _.each(nodesObj, (node: any) => {
    node.position.set(NP.times(node.x, zoomScale), NP.times(node.y, zoomScale));
  });
  network.zoom = zoomNum;

};
const moveTopology = (zoom: number, originx: number, originy: number) => {
  const moveOriginX = NP.times(originx, NP.minus(1, zoom));
  const moveOriginY = NP.times(originy, NP.minus(1, zoom));
  const nodesObj = network.getNodeObj();
  _.each(nodesObj, (node: any) => {
    node.position.set(node.x + moveOriginX, node.y + moveOriginY);
    node.draw();
  });
};
if (body) {
  body.addEventListener('wheel', (event) => {
    const zoom = network.zoom;
    const nodeObj = network.getNodeObj();
    const edgeObj = network.getEdgeObj();
    const groupObj = network.getGroupObj();
    NP.enableBoundaryChecking(false);
    if (event.deltaY < 0) {
      if (zoom < 4) {
        zoomNetworkElements(zoom < 0.1 ? zoom + 0.03 : zoom + 0.05, event);
      }
    } else {
      if (zoom > 0.4) {
        zoomNetworkElements(zoom - 0.05 < 0.4 ? zoom : zoom - 0.05, event);
      }
    }
    const scale = NP.divide(network.zoom, zoom);
    moveTopology(scale, event.clientX, event.clientY);
    _.each(nodeObj, (node: any) => {
      if (network.zoom < 0.75) {
        node.drawGraph();
      } else {
        node.drawSprite(node.icon);
      }
    });
    if (labelToggle) {
      if (network.zoom < 1) {
        network.nodeLabelToggle(false);
      } else {
        network.nodeLabelToggle(true);
      }
    }
    if (edgeLabelToggle) {
      if (network.zoom < 2) {
        network.edgeLabelToggle(false);
      } else {
        network.edgeLabelToggle(true);
      }
    }
    _.each(edgeObj, (edge: any) => {
      edge.draw();
    });
    _.each(groupObj, (group: any) => {
      group.draw();
    });
  });
  window.addEventListener('keydown', (e) => {
    if (e.keyCode === 17) {
      network.setSelect();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.keyCode === 17) {
      network.setDrag();
    }
  });
}
