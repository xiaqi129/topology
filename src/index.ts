import * as _ from 'lodash';
import { Network } from './network/network';
import { data as topoData } from './simpleData';

const iconResource = {
  switch: { name: 'switch', url: './pic/cisco-WS-C49.png', width: '10', height: '10' },
  switchLayer3: { name: 'switchLayer3', url: './pic/cisco-WS-C68.png', width: '40', height: '40' },
  router: { name: 'router', url: './pic/cisco-18.png', width: '10', height: '10' },
};
const addResource = {
  switch1: { name: 'switch1', url: './pic/cisco-WS-C49.png', width: '10', height: '10' },
  switchLayer33: { name: 'switchLayer33', url: './pic/cisco-WS-C68.png', width: '40', height: '40' },
  router2: { name: 'router2', url: './pic/cisco-18.png', width: '10', height: '10' },
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

const network = new Network('network');
network.initIconResource(iconResource);

const devices = topoData.devices;
const links = topoData.links;
const groups = topoData.groups;
const groupsList = keySort(groups);
// create Node
const labelStyle = {
  fontSize: '0.6em',
  fontWeight: 'bold',
};
_.each(devices, (device: any) => {
  const client = device.clients.User_Mark;
  if (!(client === 'Hidden')) {
    const node = network.createNode('router');
    node.name = device.name;
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
    const commonStyles = {
      backgroundColor: 'white',
      color: 'black',
      padding: '5px 20px',
      fontSize: '12px',
      userSelect: 'none',
    };
    network.addElement(node);
    node.x = device.location.x;
    node.y = device.location.y;
    // node.setLabel(node.name, labelStyle);
    node.setTooltip(tooltipContent, commonStyles);
    node.on('rightclick', (event: any) => {
      network.menu.setMenuItems([
        { label: 'Aggregated as a group', id: '0' },
        { label: 'Hide the Node', id: '1' },
        { label: 'Change Switch Icon', id: '2' },
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
          node.changeIcon('switch');
        }
      };
      network.menu.setClass('popMenu');
      network.menu.showMenu(event);
    });
  }
});

// create Links
const nodes = network.getNodeObj();
_.each(links, (link) => {
  const srcNodeName = link.local_host;
  const destNodeName = link.remote_host;
  const srcNode = _.get(nodes, srcNodeName);
  const destNode = _.get(nodes, destNodeName);
  if (srcNode && destNode) {
    const edge = network.createEdge(srcNode, destNode);
    edge.setStyle({
      arrowColor: 0X006aad,
      arrowLength: 13,
      arrowType: 3,
      arrowWidth: 0.01,
      fillArrow: true,
      lineColor: 0xC7254E,
      lineDistance: 0,
      lineType: 0,
      lineWidth: 0.3,
    });
    network.addElement(edge);
    edge.edge.on('rightclick', (event: any) => {
      network.menu.setMenuItems([
        { label: 'Select its neighbors', id: '0' },
        { label: 'Hide/Unhide this links', id: '1' },
        { label: 'Print line Info', id: '2' },
      ]);
      network.menu.menuOnAction = (id) => {
        // tslint:disable-next-line:no-console
        console.log(id);
      };
      network.menu.setClass('popMenu');
      network.menu.showMenu(event);
    });
    edge.setTooltip(`${edge.startNode.name} >>> ${edge.endNode.name}`);
    network.setBundle(edge);
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
  newGroup.setLabel(nameArr[nameArr.length - 1], 'Above');

  newGroup.on('rightclick', (event: any) => {
    network.menu.setMenuItems([
      // { label: 'Aggregated as a group', id: '0' },
      { label: 'Disaggregate selected group', id: '0' },
    ]);
    network.menu.menuOnAction = (id) => {
      if (id === '0') {
        newGroup.removeChildNodes();
      }
    };
    network.menu.setClass('popMenu');
    network.menu.showMenu(event);
  });
});
// network.addIconResource(addResource);
// const node1 = network.createNode('switch1');
// node1.x = 100;
// node1.y = 100;
// network.addElement(node1);
network.syncView();
network.setDrag();
// network.setClick();
network.setZoom(0.7);
// network.setZoom(0.6);
const zoomIn = document.querySelector('button.btn_zoomIn');
const zoomOut = document.querySelector('button.btn_zoomOut');
const zoomOver = document.querySelector('button.btn_zoomOver');
const dragOrSelect = document.querySelector('button.btn_dragOrSelect');
const tooltipToggle = document.querySelector('button.btn_tooltipToggle');
const nodeLabelToggle = document.querySelector('button.btn_nodeLabelToggle');
const searchNode = document.querySelector('button.btn_search_node');
if (zoomIn) {
  zoomIn.addEventListener('click', () => {
    network.setZoom(1.3);
  });
}
if (zoomOut) {
  zoomOut.addEventListener('click', () => {
    network.setZoom(0.7);
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
if (nodeLabelToggle) {
  nodeLabelToggle.addEventListener('click', () => {
    network.nodeLabelToggle();
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
