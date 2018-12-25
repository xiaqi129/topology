import * as _ from 'lodash';
import { Network } from './network/network';
import { data as topoData } from './simpleData';

const iconResource = {
  switch: { name: 'switch', url: './pic/cisco-WS-C49.png', width: '10', height: '10' },
  switchLayer3: { name: 'switchLayer3', url: './pic/cisco-WS-C68.png', width: '40', height: '40' },
  router: { name: 'router', url: './pic/cisco-18.png', width: '10', height: '10' },
};

const network = new Network('network');
network.initIconResource(iconResource);

network.callback = () => {

  // const num = 20;
  // for (let i: number = 0, len: number = num; i < len;) {
  //   i += 1;
  //   const node = network.createNode('router');
  //   network.addElement(node);
  //   node.x = Math.random() * 1000;
  //   node.y = Math.random() * 500;
  // }
  // const nodes = network.getNodes();
  // for (let i: number = 0, len: number = num; i < len;) {
  //   const srcNode = nodes[i];
  //   const destNode = nodes[i + 1];
  //   for (let j = 0; j < 4;) {
  //     const edge = network.createEdge(srcNode, destNode);
  //     edge.setStyle({
  //       arrowColor: 0Xc71bd3,
  //       arrowLength: 15,
  //       arrowType: 0,
  //       arrowWidth: 1,
  //       fillArrow: true,
  //       lineColor: 0xC7254E,
  //       lineDistance: 5,
  //       lineType: 1,
  //       lineWidth: 1,
  //     });
  //     network.addElement(edge);
  //     network.setBundle(edge);

  //     j += 1;
  //   }
  //   i += 2;
  // }
  // const group1 = network.createGroup();
  // network.addElement(group1);

  // const groupNodes1 = _.slice(_.shuffle(_.dropRight(nodes, (num / 2) + 1)), 0, 3);
  // _.each(groupNodes1, (node) => {
  //   group1.addChildNodes(node);
  // });
  // group1.setStyle({
  //   fillOpacity: 1,
  //   fillColor: 0xcddc39,
  // });
  // group1.setOutlineStyle(2);

  // // group.setExpaned(false);

  // const group = network.createGroup();
  // network.addElement(group);

  // const groupNodes = _.slice(_.shuffle(_.dropRight(nodes, (num / 2) + 1)), 0, 3);
  // _.each(groupNodes, (node) => {
  //   group.addChildNodes(node);
  // });
  // group.setStyle({
  //   fillOpacity: 1,
  // });

  // network.syncView();
  // network.setDrag();
  // network.setClick();

  // const zoomIn = document.querySelector('button.btn_zoomIn');
  // const zoomOut = document.querySelector('button.btn_zoomOut');
  // const zoomOver = document.querySelector('button.btn_zoomOver');
  // const dragOrSelect = document.querySelector('button.btn_dragOrSelect');
  // const tooltipToggle = document.querySelector('button.btn_tooltipToggle');
  // const bundleLabelToggle = document.querySelector('button.btn_bundleLabelToggle');
  // const nodeLabelToggle = document.querySelector('button.btn_nodeLabelToggle');
  // const searchNode = document.querySelector('button.btn_search_node');
  // const canvas = document.querySelector('div#network');
  // if (zoomIn) {
  //   zoomIn.addEventListener('click', () => {
  //     network.setZoom(0.3);
  //   });
  // }
  // if (zoomOut) {
  //   zoomOut.addEventListener('click', () => {
  //     network.setZoom(-0.3);
  //   });
  // }
  // if (zoomOver) {
  //   let isZoom = true;
  //   zoomOver.addEventListener('click', () => {
  //     if (isZoom) {
  //       network.zoomOver();
  //     } else {
  //       network.zoomReset();
  //     }
  //     isZoom = !isZoom;
  //   });
  // }
  // if (dragOrSelect) {
  //   let isDrag = false;
  //   dragOrSelect.addEventListener('click', () => {
  //     if (isDrag) {
  //       network.setDrag();
  //     } else {
  //       network.setSelect();
  //     }
  //     isDrag = !isDrag;
  //   });
  // }
  // if (tooltipToggle) {
  //   let isDisplay = true;
  //   tooltipToggle.addEventListener('click', () => {
  //     isDisplay = !isDisplay;
  //     network.setTooltipDisplay(isDisplay);
  //   });
  // }
  // if (bundleLabelToggle) {
  //   bundleLabelToggle.addEventListener('click', () => {
  //     network.bundleLabelToggle();
  //   });
  // }

  // if (nodeLabelToggle) {
  //   nodeLabelToggle.addEventListener('click', () => {
  //     network.nodeLabelToggle();
  //   });
  // }

  // if (searchNode) {
  //   searchNode.addEventListener('click', () => {
  //     const searchInput = document.querySelector('input.input_search_node') as HTMLInputElement;
  //     _.each(network.getNodes(), (node) => {
  //       if (node.getUID() === `element_${searchInput.value}`) {
  //         network .searchNode(node);
  //       }
  //     });
  //   });
  // }

  const devices = topoData.devices;
  const links = topoData.links;
  const groups = topoData.groups;
  const groupsList = keySort(groups);
  // create Node
  const labelStyle = {
    fontSize: '0.6em',
    fontWeight: 'bold',
  };
  _.each(devices, (device) => {
    const client = device.clients.User_Mark;
    if (!(client === 'Hidden')) {
      const node = network.createNode('router');
      network.addElement(node);
      node.x = device.location.x;
      node.y = device.location.y;
      node.name = device.name;
      // node.setLabel(node.name, labelStyle);
      node.setTooltip(node.name);
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
            network.hideElement(node);
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
    }
  });
  const groupList: any[] = [];
  _.each(groupsList, (group) => {
    const bgColor = group.style.bgColor;
    const newGroup = network.createGroup();
    newGroup.cccc = group.children;
    newGroup.name = group.id;
    newGroup.setOutlineStyle(2);
    groupList.push(newGroup);
    newGroup.setStyle({
      fillOpacity: 0.3,
      fillColor: rgb2hex(bgColor),
    });
    const nameArr = _.split(newGroup.name as string, '#@');
    newGroup.setLabel(nameArr[nameArr.length - 1]);

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
  _.each(groupList, (g) => {
    _.remove(g.childrenNode);
    const children = g.cccc;
    _.each(children, (nodeName: any) => {
      const node = _.get(nodes, nodeName);
      g.addChildNodes(node);
    });
    network.addElement(g);
  });

  network.syncView();
  network.setDrag();
  network.setClick();

  const zoomIn = document.querySelector('button.btn_zoomIn');
  const zoomOut = document.querySelector('button.btn_zoomOut');
  const zoomOver = document.querySelector('button.btn_zoomOver');
  const dragOrSelect = document.querySelector('button.btn_dragOrSelect');
  const tooltipToggle = document.querySelector('button.btn_tooltipToggle');
  const nodeLabelToggle = document.querySelector('button.btn_nodeLabelToggle');
  const searchNode = document.querySelector('button.btn_search_node');
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
};

const rgb2hex = (rgb: any) => {
  const hexR = (`0${parseInt(rgb[0], 10).toString(16)}`).slice(-2);
  const hexG = (`0${parseInt(rgb[1], 10).toString(16)}`).slice(-2);
  const hexB = (`0${parseInt(rgb[2], 10).toString(16)}`).slice(-2);

  return (rgb && rgb.length === 4) ? `0X${hexR}${hexG}${hexB}` : '';
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
