import * as _ from 'lodash';
import NP from 'number-precision';
import { Network } from './network/network';
import { data as topoData } from './simpleData';
const iconResource = {
  resources: { name: 'resources', url: './pic/imageDict.json' },
};
const sourcesEdge: any[] = [];
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
  // userSelect: 'none',
};

const nodeLabelStyle = {
  fontSize: 12,
};
const network = new Network('network');
(window as any).topo = network;
// const labeler = new Labeler();
network.initIconResource(iconResource);
const getNodeGroups = () => {
  const obj = {};
  _.each(network.getElements(), (ele: any) => {
    if (ele.type === 'Node' || ele.type === 'Group') {
      const name: string = ele.name;
      _.extend(obj, {
        [name]: ele,
      });
    }
  });
  return obj;
};
// tslint:disable-next-line:only-arrow-functions
const noData = function () {
  const num = 2;
  for (let i: number = 0, len: number = num; i < len;) {
    i += 1;
    // const node = network.createNode('cisco-ASR9');
    const node = network.createNode();
    node.name = `node${i}`;
    // node.setNodeSize(25,25);
    network.addElement(node);
    node.x = Math.random() * 800;
    node.y = Math.random() * 500;
    // node.initStyle({
    //   width: 20,
    // });
    // node.addLabelMark('R');
  }
  const nodes = network.getNodes();
  for (let i: number = 0, len: number = num; i < len;) {
    const srcNode = nodes[i];
    const destNode = nodes[i + 1];
    for (let j = 0; j < 2;) {
      const edge = network.createEdge(srcNode, destNode);
      edge.on('rightclick', (event: any) => {
        network.menu.setMenuItems([
          { label: 'Print line Info', id: '2' },
          { label: 'Remove Link', id: '3' },
        ]);
        network.menu.menuOnAction = (id) => {
          if (id === '2') {
            // tslint:disable-next-line:no-console
            console.log(edge);
          } else if (id === '3') {
            network.removeElements(edge);
          }
        };
        network.menu.setClass('popMenu');
        network.menu.showMenu(event);
      });
      edge.initStyle({
        arrowColor: 0X006aad,
        arrowAngle: 20,
        arrowMiddleLength: 5,
        arrowLength: 8,
        arrowType: 0,
        fillArrow: true,
        lineColor: 0X0386d2,
        lineType: 0,
        lineFull: 0,
        lineWidth: 1,
        bundleStyle: 0,
      });
      network.addElement(edge);
      j += 1;
    }
    i += 2;
  }
  network.setBundleExpanded(false);
  // const group = network.createGroup();
  // _.each(nodes, (node) => {
  //   group.addChildNodes(node);
  // });
  // network.addElement(group);
  // group.name = '1';
  // group.initStyle({
  //   fillOpacity: 0.5,
  //   lineColor: 0Xb0bdbf,
  // });
  network.syncView();
  network.setDrag();
  network.setClick();
  network.setZoom();
  network.moveCenter(true);
};

// tslint:disable-next-line:only-arrow-functions
const removeTest = function () {
  const num = 2;
  const node1 = network.createNode();
  const node2 = network.createNode();
  const edgeCatch: any[] = [];
  node1.name = '1';
  node2.name = '2';
  // node.setNodeSize(25,25);
  network.addElement(node1);
  network.addElement(node2);
  node1.x = 200;
  node1.y = 200;
  node2.x = 500;
  node2.y = 500;

  const nodes = network.getNodes();
  for (let i: number = 0, len: number = num; i < len;) {
    const srcNode = nodes[i];
    const destNode = nodes[i + 1];
    for (let j = 0; j < 1;) {
      const edge = network.createEdge(srcNode, destNode);
      edge.on('rightclick', (event: any) => {
        network.menu.setMenuItems([
          { label: 'Print line Info', id: '2' },
          { label: 'Remove Link', id: '3' },
        ]);
        network.menu.menuOnAction = (id) => {
          if (id === '2') {
            // tslint:disable-next-line:no-console
            console.log(edge);
          } else if (id === '3') {
            network.removeElements(edge);
          }
        };
        network.menu.setClass('popMenu');
        network.menu.showMenu(event);
      });
      edge.initStyle({
        arrowColor: 0X006aad,
        arrowAngle: 20,
        arrowMiddleLength: 5,
        arrowLength: 8,
        fillArrow: true,
        lineColor: 0xfff8ec67,
        lineType: 0,
        lineFull: 0,
        lineWidth: 1,
        // bundleStyle: 0,
      });
      network.addElement(edge);
      edgeCatch.push(edge);
      j += 1;
    }
    i += 2;
  }

  node1.on('rightclick', (event: any) => {
    network.menu.setMenuItems([
      { label: 'Print line Info', id: '2' },
      { label: 'Add Link', id: '3' },
    ]);
    network.menu.menuOnAction = (id) => {
      if (id === '2') {
        // tslint:disable-next-line:no-console
        console.log(node1);
      } else if (id === '3') {
        network.addElements(edgeCatch);
        network.syncView();
      }
    };
    network.menu.setClass('popMenu');
    network.menu.showMenu(event);
  });
  network.syncView();
  network.setBundleExpanded(false);
  network.setDrag();
  network.setClick();
  network.setZoom();
  network.moveCenter(true);
};
// tslint:disable-next-line:only-arrow-functions
const dataFlowDemo = function () {
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
      // {
      //   name: 'name-3',
      //   location: {
      //     x: 500,
      //     y: 320,
      //   },
      // },
      // {
      //   name: 'name-4',
      //   location: {
      //     x: 430,
      //     y: 450,
      //   },
      // },
      // {
      //   name: 'name-5',
      //   location: {
      //     x: 270,
      //     y: 500,
      //   },
      // },
      // {
      //   name: 'name-6',
      //   location: {
      //     x: 150,
      //     y: 400,
      //   },
      // },
      // {
      //   name: 'name-7',
      //   location: {
      //     x: 50,
      //     y: 300,
      //   },
      // },
      // {
      //   name: 'name-8',
      //   location: {
      //     x: 0,
      //     y: 500,
      //   },
      // },

    ],
    links: [
      {
        name: '1',
        local_host: 'name-1',
        remote_host: 'name-2',
        style: {
          fillColor: 0xf55d54,
          lineWidth: 1,
        },
      },
      {
        name: '2',
        local_host: 'name-1',
        remote_host: 'name-2',
        style: {
          fillColor: 0Xa3d89f,
          lineWidth: 0.8,
        },
      },
      // {
      //   name: '3',
      //   local_host: 'name-3',
      //   remote_host: 'name-4',
      //   style: {
      //     fillColor: 0Xfcc242,
      //     lineWidth: 0.5,
      //   },
      // },
      // {
      //   name: '4',
      //   local_host: 'name-3',
      //   remote_host: 'name-4',
      //   style: {
      //     fillColor: 0xf55d54,
      //     lineWidth: 1,
      //   },
      // },
      // {
      //   name: '5',
      //   local_host: 'name-5',
      //   remote_host: 'name-6',
      //   style: {
      //     fillColor: 0Xa3d89f,
      //     lineWidth: 1,
      //   },
      // },
      // {
      //   name: '6',
      //   local_host: 'name-6',
      //   remote_host: 'name-5',
      //   style: {
      //     fillColor: 0Xfcc242,
      //     lineWidth: 1,
      //   },
      // },
      // {
      //   name: '7',
      //   local_host: 'name-7',
      //   remote_host: 'name-8',
      //   style: {
      //     fillColor: 0xf55d54,
      //     lineWidth: 2,
      //   },
      // },
      // {
      //   name: '8',
      //   local_host: 'name-8',
      //   remote_host: 'name-7',
      //   style: {
      //     fillColor: 0Xa3d89f,
      //     lineColor: 0xEEEEEE,
      //     lineWidth: 1.2,
      //   },
      // },
      // {
      //   name: '9',
      //   local_host: 'name-3',
      //   remote_host: 'name-4',
      //   style: {
      //     fillColor: 0Xfcc242,
      //     lineColor: 0xEEEEEE,
      //     lineWidth: 1,
      //   },
      // },
      // {
      //   name: '10',
      //   local_host: 'name-6',
      //   remote_host: 'name-5',
      //   style: {
      //     fillColor: 0xf55d54,
      //     lineColor: 0xEEEEEE,
      //     lineWidth: 1,
      //   },
      // },
      // {
      //   name: '11',
      //   local_host: 'name-6',
      //   remote_host: 'name-7',
      //   style: {
      //     fillColor: 0Xa3d89f,
      //     lineColor: 0xEEEEEE,
      //     lineWidth: 1,
      //   },
      // },
      // {
      //   name: '12',
      //   local_host: 'name-6',
      //   remote_host: 'name-8',
      //   style: {
      //     fillColor: 0Xfcc242,
      //     lineWidth: 1,
      //   },
      // },
      // {
      //   name: '13',
      //   local_host: 'name-5',
      //   remote_host: 'name-8',
      //   style: {
      //     fillColor: 0xf55d54,
      //     lineColor: 0xEEEEEE,
      //     lineWidth: 1,
      //   },
      // },
      // {
      //   name: '14',
      //   local_host: 'name-7',
      //   remote_host: 'name-8',
      //   style: {
      //     fillColor: 0Xa3d89f,
      //     lineColor: 0xEEEEEE,
      //     // lineWidth: 1,
      //   },
      // },
    ],
    // groups: [
    //   {
    //     name: 'nodeGroup',
    //     children: ['name-1', 'name-2', 'name-3'],
    //     style: {
    //       fillColor: 0X0984e3,
    //       lineColor: 0X0984e3,
    //       lineWidth: 1,
    //     },
    //   },
    // ],
  };
  const devices = data.devices;
  const links = data.links;
  // const groups = data.groups;
  _.each(devices, (device: any) => {
    const node = network.createNode('laptopSVG');
    node.name = device.name;
    node.x = device.location.x;
    node.y = device.location.y;
    node.initStyle({
      fillColor: 0Xff00000,
    });
    network.addElement(node);
    node.setNodeSize(40, 40);
  });
  const nodes = network.getNodeObj();
  _.each(links, (link: any) => {
    const srcNodeName = link.local_host;
    const destNodeName = link.remote_host;
    const srcNode = _.get(nodes, srcNodeName);
    const destNode = _.get(nodes, destNodeName);
    if (srcNode && destNode) {
      const dataFlow = network.createDataFlow(srcNode, destNode);
      dataFlow.name = link.name;
      dataFlow.initStyle({
        fillColor: link.style.fillColor,
        lineColor: link.style.lineColor,
        // lineWidth: link.style.lineWidth,
      });
      network.addElement(dataFlow);
    }
  });
  // _.each(groups, (g) => {
  //   const nodeGroup = network.createGroup();
  //   nodeGroup.name = g.name;
  //   network.addElement(nodeGroup);
  //   _.each(g.children, (child) => {
  //     const node: any = _.find(nodes, (n: any) => {
  //       return n.name === child;
  //     });
  //     nodeGroup.addChildNodes(node);
  //   });
  //   nodeGroup.initStyle(g.style);
  //   nodeGroup.setLabel(`${g.name}`);
  //   nodeGroup.on('rightclick', (event: any) => {
  //     network.menu.setMenuItems([
  //       { label: 'Remove Group', id: '0' },
  //       { label: 'Debug', id: '1' },
  //     ]);
  //     network.menu.menuOnAction = (id) => {
  //       if (id === '0') {
  //         network.removeElements(nodeGroup);
  //       } else if (id === '1') {
  //         // tslint:disable-next-line:no-console
  //         console.log(nodeGroup);
  //       }
  //     };
  //     network.menu.setClass('popMenu');
  //     network.menu.showMenu(event);
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
          lineType: 1,
          lineFull: 1,
        },
      },
      {
        name: '1_1',
        local_host: 'name-2',
        remote_host: 'name-1',
        style: {
          lineType: 1,
          lineFull: 1,
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
    edgeGroups: [
      {
        name: 'group6',
        style: {
          fillColor: 0xf55d54,
          margin: 8,
          fillOpacity: 0,
          lineColor: 0Xfcc242,
          lineWidth: 2,
        },
        children: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
        // children: ['12', '13'],
      },
      {
        name: 'group1',
        style: {
          fillColor: 0xf55d54,
          margin: 8,
        },
        children: ['1', '1_1'],
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
      {
        name: 'group8',
        style: {
          fillColor: 0xf55d54,
          margin: 8,
          fillOpacity: 0,
          lineColor: 0Xfcc242,
          lineWidth: 2,
        },
        children: ['1', '2', '3'],
      },
      {
        name: 'group9',
        style: {
          fillColor: 0xf55d54,
          margin: 8,
          fillOpacity: 0,
          lineColor: 0Xfcc242,
          lineWidth: 2,
        },
        children: ['1', '2', '3'],
      },
      {
        name: 'group10',
        style: {
          fillColor: 0xf55d54,
          margin: 8,
          fillOpacity: 0,
          lineColor: 0Xfcc242,
          lineWidth: 2,
        },
        children: ['8', '9', '10'],
      },
    ],
    groups: [
      {
        name: 'nodeGroup',
        children: ['name-1', 'name-2', 'name-3'],
        style: {
          fillColor: 0X0984e3,
          lineColor: 0X0984e3,
          lineWidth: 1,
        },
      },
    ],
  };
  const devices = data.devices;
  const links = data.links;
  const edgeGroups = data.edgeGroups;
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
      edge.on('rightclick', (event: any) => {
        network.menu.setMenuItems([
          { label: 'Hide Edge', id: '0' },
          { label: 'Remove Link', id: '1' },
          { label: 'Print line Info', id: '2' },
        ]);
        network.menu.menuOnAction = (id) => {
          if (id === '0') {
            edge.visible = false;
            _.each(edge.includeGroup, (edgeGroup: any) => {
              edgeGroup.draw();
            });
          } else if (id === '1') {
            network.removeElements(edge);
          } else if (id === '2') {
            // tslint:disable-next-line: no-console
            console.log(edge);
          }
        };
        network.menu.setClass('popMenu');
        network.menu.showMenu(event);
      });
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
  _.each(edgeGroups, (group) => {
    const edgeGroup = network.createEdgeGroup();
    network.addElement(edgeGroup);
    _.each(group.children, (child) => {
      const edge: any = _.find(edges, (e: any) => {
        return e.name === child;
      });
      edgeGroup.addChildEdges(edge);
    });
    edgeGroup.initStyle(group.style);
    edgeGroup.setLabel(`${group.name}`, 'Below');
    edgeGroup.on('rightclick', (event: any) => {
      network.menu.setMenuItems([
        { label: 'Remove Group', id: '0' },
        { label: 'Debug', id: '1' },
      ]);
      network.menu.menuOnAction = (id) => {
        if (id === '0') {
          network.removeElements(edgeGroup);
        } else if (id === '1') {
          // tslint:disable-next-line:no-console
          console.log(edgeGroup);
        }
      };
      network.menu.setClass('popMenu');
      network.menu.showMenu(event);
    });
  });
  _.each(groups, (g) => {
    const nodeGroup = network.createGroup();
    nodeGroup.name = g.name;
    network.addElement(nodeGroup);
    _.each(g.children, (child) => {
      const node: any = _.find(nodes, (n: any) => {
        return n.name === child;
      });
      nodeGroup.addChildNodes(node);
    });
    nodeGroup.initStyle(g.style);
    nodeGroup.setLabel(`${g.name}`);
    nodeGroup.on('rightclick', (event: any) => {
      network.menu.setMenuItems([
        { label: 'Remove Group', id: '0' },
        { label: 'Debug', id: '1' },
      ]);
      network.menu.menuOnAction = (id) => {
        if (id === '0') {
          network.removeElements(nodeGroup);
        } else if (id === '1') {
          // tslint:disable-next-line:no-console
          console.log(nodeGroup);
        }
      };
      network.menu.setClass('popMenu');
      network.menu.showMenu(event);
    });
  });
  network.syncView();
  network.setDrag();
  network.setZoom();
  network.setClick();
  network.setBundleExpanded(false);
  network.moveCenter();
};

// tslint:disable-next-line:only-arrow-functions
const simpleData = function () {
  const devices = topoData.devices;
  const links = topoData.links;
  const groups = topoData.groups;
  const groupsList = keySort(groups);
  // create Node
  _.each(devices, (device: any) => {
    const client = device.clients.User_Mark;
    if (!(client === 'Hidden')) {
      const node = network.createNode('ROUTER-CISCO');
      // const graph = node.drawGraph();
      // graph.clear();
      // graph.lineStyle(2, 0xFFFFFF, 1);
      // graph.beginFill(0xAA4F08);
      // graph.drawRect(-30, -20, 60, 40);
      // graph.endFill();
      // node.setNodeSize(35, 35);
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
      const label = node.setLabel(`${device.name}`, nodeLabelStyle);
      node.setTooltip(tooltipContent, commonStyles);
      node.on('rightclick', (event: any) => {
        network.menu.setMenuItems([
          { label: 'Aggregated as a group', id: '0' },
          { label: 'Hide the Node', id: '1' },
          { label: 'Change Switch Icon', id: '2' },
          { label: 'Print Node', id: '4' },
          { label: 'Mark Node', id: '5' },
          { label: 'unMark Node', id: '6' },
          { label: 'Remove Node', id: '7' },
          { label: 'Click Event', id: '8' },
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
          } else if (id === '4') {
            // tslint:disable-next-line:no-console
            console.log(node);
          } else if (id === '5') {
            const a = node.addNodeMark('mapSVG', 'top');
          } else if (id === '6') {
            node.removeNodeMark('mapSVG');
          } else if (id === '7') {
            network.removeElements(node);
          } else if (id === '8') {
            network.setClick();
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
      if (srcNode.name === 'mykul-cmp-west-r-cr02' && destNode.name === 'mykul-cmp-west-f-wlc2') {
        sourcesEdge.push(edge);
      }
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
        // bundleStyle: 0,
      });
      edge.setTooltip(linkTooltipContent, commonStyles);
      edge.on('rightclick', (event: any) => {
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
            // network.clearHighlight();
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
    newGroup.setToggleExpanded(true);
    _.each(children, (child) => {
      const node = _.get(nodes, child);
      if (node) {
        newGroup.addChildNodes(node);
      }
    });
    const nameArr = _.split(newGroup.name as string, '#@');
    newGroup.setLabel(`${nameArr[nameArr.length - 1]}`, 'Center', {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: '0x0386d2',
    });
    newGroup.on('rightclick', (event: any) => {
      network.menu.setMenuItems([
        { label: 'Disaggregate selected group', id: '0' },
        { label: 'Extened a group', id: '1' },
        { label: 'Remove Group', id: '3' },
        { label: 'Debug', id: '5' },
      ]);
      network.menu.menuOnAction = (id) => {
        if (id === '0') {
          newGroup.removeChildNodes();
        } else if (id === '1') {
          newGroup.setStyle({
            padding: 50,
          });
          newGroup.draw();
        } else if (id === '3') {
          network.removeElements(newGroup);
        } else if (id === '5') {
          // tslint:disable-next-line:no-console
          console.log(newGroup);
        }
      };
      network.menu.setClass('popMenu');
      network.menu.showMenu(event);
    });
    if (newGroup.getChildNodes().length > 0) {
      network.addElement(newGroup);
    }
  });
  const wrapper = document.getElementById('network');
  if (wrapper) {
    wrapper.addEventListener('wheel', (e) => {
      if (e.deltaY > 0) {
        if (network.zoom < 0.2) {
          network.clearZoom();
        }
      } else {
        if (network.zoom < 0.2) {
          network.setZoom();
        }
      }

    });
  }
  // network.setBundleExpanded(false);
  network.syncView();
  network.setDrag();
  network.setClick();
  network.moveCenter();
  network.setZoom();
  network.toggleLabel(1, 2);
  network.setBundleExpanded(false);

};

// tslint:disable-next-line: only-arrow-functions
const groupEdgeNode = function () {
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
          x: 500,
          y: 200,
        },
      },
      {
        name: 'name-3',
        location: {
          x: 500,
          y: 500,
        },
      },
      {
        name: 'name-4',
        location: {
          x: 200,
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
          lineFull: 1,
        },
      },
      {
        name: '2',
        local_host: 'name-1',
        remote_host: 'name-2',
        style: {
          lineType: 0,
          lineFull: 1,
        },
      },
      {
        name: '6',
        local_host: 'name-1',
        remote_host: 'name-2',
        style: {
          lineType: 0,
          lineFull: 1,
        },
      },
      {
        name: '7',
        local_host: 'name-1',
        remote_host: 'name-2',
        style: {
          lineType: 0,
          lineFull: 1,
        },
      },
      {
        name: '3',
        local_host: 'name-2',
        remote_host: 'name-3',
        style: {
          lineType: 0,
          lineFull: 0,
        },
      },
      {
        name: '4',
        local_host: 'name-3',
        remote_host: 'name-4',
        style: {
          lineType: 0,
          lineFull: 1,
        },
      },
      {
        name: '5',
        local_host: 'name-4',
        remote_host: 'name-1',
        style: {
          lineType: 0,
          lineFull: 0,
        },
      },
      // {
      //   name: '6',
      //   local_host: 'name-1',
      //   remote_host: 'name-3',
      //   style: {
      //     lineType: 0,
      //     lineFull: 1,
      //   },
      // },
    ],
    // groups: [
    //   {
    //     name: 'nodeGroup',
    //     children: ['name-1', 'name-2'],
    //     style: {
    //       // fillColor: 0X0984e3,
    //       // lineColor: 0X0984e3,
    //       lineWidth: 1,
    //     },
    //   },
    // ],
  };
  const devices = data.devices;
  const links = data.links;
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
    <td>local_hos}</td>
    <td>link.remote_host</td>
    <td>link.local_int</td>
    <td>link.remote_int</td>
    <td>link.link_state</td>
    <td>link.link_protocol</td>
    </tr>
    </table>`;
  // const groups = data.groups;
  _.each(devices, (device: any) => {
    const node = network.createNode('cisco-ASR9');
    node.name = device.name;
    node.x = device.location.x;
    node.y = device.location.y;
    network.addElement(node);
    if (node.name) {
      node.setLabel(node.name);
    }
  });
  const nodes = network.getNodeObj();
  // _.each(groups, (g) => {
  //   const group = network.createGroup();
  //   network.addElement(group);
  //   _.each(g.children, (child) => {
  //     const node: any = _.find(nodes, (e: any) => {
  //       return e.name === child;
  //     });
  //     group.addChildNodes(node);
  //   });
  //   group.name = g.name;
  //   group.initStyle(g.style);
  //   group.setLabel(`${g.name}`);
  //   group.setOutlineStyle(3);
  //   group.on('rightclick', (event: any) => {
  //     network.menu.setMenuItems([
  //       { label: 'Remove Group', id: '0' },
  //       { label: 'Debug', id: '1' },
  //     ]);
  //     network.menu.menuOnAction = (id) => {
  //       if (id === '0') {
  //         network.removeElements(group);
  //       } else if (id === '1') {
  //         // tslint:disable-next-line:no-console
  //         console.log(group);
  //       }
  //     };
  //     network.menu.setClass('popMenu');
  //     network.menu.showMenu(event);
  //   });
  // });
  const allNodeGroups = getNodeGroups();
  _.each(links, (link: any) => {
    const srcNodeName = link.local_host;
    const destNodeName = link.remote_host;
    const srcNode = _.get(allNodeGroups, srcNodeName);
    const destNode = _.get(allNodeGroups, destNodeName);
    if (srcNode && destNode) {
      // const edge = network.createEdge(srcNode, destNode);
      const edge = network.createMultipleLine(srcNode, destNode);
      // edge.name = link.name;
      // edge.on('rightclick', (event: any) => {
      //   network.menu.setMenuItems([
      //     { label: 'Hide Edge', id: '0' },
      //     { label: 'Remove Link', id: '1' },
      //     { label: 'Print line Info', id: '2' },
      //   ]);
      //   network.menu.menuOnAction = (id) => {
      //     if (id === '0') {
      //       edge.visible = false;
      //       _.each(edge.includeGroup, (edgeGroup: any) => {
      //         edgeGroup.draw();
      //       });
      //     } else if (id === '1') {
      //       network.removeElements(edge);
      //     } else if (id === '2') {
      //       // tslint:disable-next-line: no-console
      //       console.log(edge);
      //     }
      //   };
      //   network.menu.setClass('popMenu');
      //   network.menu.showMenu(event);
      // });
      edge.initStyle({
        arrowAngle: 30,
        multipleLineDegree: 80,
        // lineWidth: 0.4,
        // lineType: 1,
        // lineColor: 0X0386d2,
      });
      edge.createStartLine(0.7);
      edge.createEndLine(0.3);
      edge.setLabel('   test break word    ', 0.2, {
        fill: 0Xef5050,
      });
      edge.setLabel('test', 1, {
        fill: 0X20c1a1,
      });
      edge.setLabel('test', 1.3, {
        fill: 0Xef5050,
      });
      edge.setLabel('test', 1.7);
      edge.createEndArrow();
      edge.createStartArrow();
      // edge.setTooltip(linkTooltipContent, commonStyles);
      // edge.setLabel(link.local_host, link.remote_host);
      // const srcMark = {
      //   content: 'B',
      //   color: 0X0386d2,
      // };
      // const endMark = {
      //   content: 'F',
      //   color: 0Xdd0d3d,
      // };
      // edge.setMark(srcMark, endMark);
      network.addElement(edge);
    }
  });
  network.syncView();
  network.setDrag();
  network.setZoom();
  network.setClick();
  // network.setBundleExpanded(false);
  network.moveCenter();
};

// tslint:disable-next-line: only-arrow-functions
const portChannel = function () {
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
          x: 400,
          y: 50,
        },
      },
      {
        name: 'name-3',
        location: {
          x: 400,
          y: 350,
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
        name: '1_1',
        local_host: 'name-1',
        remote_host: 'name-2',
        style: {
          lineType: 0,
          lineFull: 0,
        },
      },
      {
        name: '1_2',
        local_host: 'name-2',
        remote_host: 'name-1',
        style: {
          lineType: 0,
          lineFull: 0,
        },
      },
      // {
      //   name: '1_3',
      //   local_host: 'name-1',
      //   remote_host: 'name-3',
      //   style: {
      //     lineType: 0,
      //     lineFull: 0,
      //   },
      // },
      // {
      //   name: '2',
      //   local_host: 'name-1',
      //   remote_host: 'name-3',
      //   style: {
      //     lineType: 0,
      //     lineFull: 0,
      //   },
      // },
    ],
  };
  const devices = data.devices;
  const links = data.links;
  _.each(devices, (device: any) => {
    const node = network.createNode('cisco-ASR9');
    node.name = device.name;
    node.x = device.location.x;
    node.y = device.location.y;
    network.addElement(node);
  });
  const nodes = network.getNodeObj();
  const edges: any[] = [];
  _.each(links, (link: any) => {
    const srcNodeName = link.local_host;
    const destNodeName = link.remote_host;
    const srcNode = _.get(nodes, srcNodeName);
    const destNode = _.get(nodes, destNodeName);
    if (srcNode && destNode) {
      const edge = network.createEdge(srcNode, destNode);
      edges.push(edge);
      edge.name = link.name;
      edge.on('rightclick', (event: any) => {
        network.menu.setMenuItems([
          { label: 'Hide Edge', id: '0' },
          { label: 'Remove Link', id: '1' },
          { label: 'Print line Info', id: '2' },
        ]);
        network.menu.menuOnAction = (id) => {
          if (id === '0') {
            edge.visible = false;
            _.each(edge.includeGroup, (edgeGroup: any) => {
              edgeGroup.draw();
            });
          } else if (id === '1') {
            network.removeElements(edge);
          } else if (id === '2') {
            // tslint:disable-next-line: no-console
            console.log(edge);
          }
        };
        network.menu.setClass('popMenu');
        network.menu.showMenu(event);
      });
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
        bundleStyle: 0,
      });
      network.addElement(edge);
    }
  });
  const channel = network.createPortChannel(edges, 0.5);
  channel.initStyle({
    lineColor: 0X0386d2,
    fillColor: 0XFFFFFF,
    // lineWidth: 2,
  });
  channel.setLabel('test');
  // channel.setLabel('test', 'bottom-left');
  network.addElement(channel);
  network.syncView();
  network.setDrag();
  network.setZoom();
  network.setClick();
  network.setBundleExpanded(true);
  // network.moveCenter();
};

// tslint:disable-next-line: only-arrow-functions
const vertexCoincide = function () {
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
          x: 200,
          y: 200,
        },
      },
      {
        name: 'name-3',
        location: {
          x: 200,
          y: 200,
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
      // {
      //   name: '1_1',
      //   local_host: 'name-1',
      //   remote_host: 'name-2',
      //   style: {
      //     lineType: 0,
      //     lineFull: 0,
      //   },
      // },
      // {
      //   name: '1_2',
      //   local_host: 'name-1',
      //   remote_host: 'name-2',
      //   style: {
      //     lineType: 0,
      //     lineFull: 0,
      //   },
      // },
      {
        name: '1_3',
        local_host: 'name-1',
        remote_host: 'name-3',
        style: {
          lineType: 0,
          lineFull: 0,
        },
      },
      {
        name: '2',
        local_host: 'name-1',
        remote_host: 'name-3',
        style: {
          lineType: 0,
          lineFull: 0,
        },
      },
    ],
    groups: [
      {
        name: 'nodeGroup',
        children: ['name-1', 'name-2', 'name-3'],
        style: {
          // fillColor: 0X0984e3,
          // lineColor: 0X0984e3,
          lineWidth: 1,
        },
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
  const edges: any[] = [];
  _.each(links, (link: any) => {
    const srcNodeName = link.local_host;
    const destNodeName = link.remote_host;
    const srcNode = _.get(nodes, srcNodeName);
    const destNode = _.get(nodes, destNodeName);
    if (srcNode && destNode) {
      const edge = network.createEdge(srcNode, destNode);
      edges.push(edge);
      edge.name = link.name;
      edge.on('rightclick', (event: any) => {
        network.menu.setMenuItems([
          { label: 'Hide Edge', id: '0' },
          { label: 'Remove Link', id: '1' },
          { label: 'Print line Info', id: '2' },
        ]);
        network.menu.menuOnAction = (id) => {
          if (id === '0') {
            edge.visible = false;
            _.each(edge.includeGroup, (edgeGroup: any) => {
              edgeGroup.draw();
            });
          } else if (id === '1') {
            network.removeElements(edge);
          } else if (id === '2') {
            // tslint:disable-next-line: no-console
            console.log(edge);
          }
        };
        network.menu.setClass('popMenu');
        network.menu.showMenu(event);
      });
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
        bundleStyle: 0,
      });
      network.addElement(edge);
    }
  });
  _.each(groups, (g) => {
    const group = network.createGroup();
    network.addElement(group);
    _.each(g.children, (child) => {
      const node: any = _.find(nodes, (e: any) => {
        return e.name === child;
      });
      group.addChildNodes(node);
    });
    group.name = g.name;
    group.initStyle(g.style);
    group.setLabel(`${g.name}`);
    group.setOutlineStyle(3);
    group.on('rightclick', (event: any) => {
      network.menu.setMenuItems([
        { label: 'Remove Group', id: '0' },
        { label: 'Debug', id: '1' },
      ]);
      network.menu.menuOnAction = (id) => {
        if (id === '0') {
          network.removeElements(group);
        } else if (id === '1') {
          // tslint:disable-next-line:no-console
          console.log(group);
        }
      };
      network.menu.setClass('popMenu');
      network.menu.showMenu(event);
    });
  });

  network.syncView();
  network.setDrag();
  network.setZoom();
  network.setClick();
};

network.callback = () => {
  simpleData();
  // noData();
  // removeTest();
  // edgeGroupDemo();
  // vertexCoincide();
  // groupEdgeNode();
  // dataFlowDemo();
  // portChannel();
  afterDrawTopo();
};
// tslint:disable-next-line: only-arrow-functions
const afterDrawTopo = function () {
  const body = document.getElementById('network');
  const zoomIn = document.querySelector('button.btn_zoomIn');
  const zoomOut = document.querySelector('button.btn_zoomOut');
  const zoomOver = document.querySelector('button.btn_zoomOver');
  const tooltipToggle = document.querySelector('button.btn_tooltipToggle');
  const bundleToggle = document.querySelector('button.btn_bundleLabelToggle');
  const nodeLabelToggle = document.querySelector('button.btn_nodeLabelToggle');
  const groupLabelToggle = document.querySelector('button.btn_groupLabelToggle');
  const linkLabelToggle = document.querySelector('button.btn_linkLabelToggle');
  const btnAaddEdge = document.querySelector('button.btn_addEdge');
  const searchNode = document.querySelector('button.btn_search_node');
  if (zoomIn) {
    zoomIn.addEventListener('click', () => {
      if (network.zoom < 4) {
        network.zoomNetworkElements(NP.plus(network.zoom, 0.1));
      }
    });
  }
  if (zoomOut) {
    zoomOut.addEventListener('click', () => {
      if (network.zoom > 0.4) {
        network.zoomNetworkElements(NP.minus(network.zoom, 0.1));
      }
    });
  }
  if (zoomOver) {
    // let isZoom = true;
    zoomOver.addEventListener('click', () => {
      network.zoomOver();
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
      network.nodeLabelToggle(labelToggle);
    });
  }
  let bundleLabelToggle = true;
  if (bundleToggle) {
    bundleToggle.addEventListener('click', () => {
      bundleLabelToggle = !bundleLabelToggle;
      const edgeBundles = network.getEdgeBundles();
      const edges = network.getAllEdges();
      if (bundleLabelToggle) {
        _.each(edgeBundles, (e: any) => {
          e.setStyle({
            bundleStyle: 0,
          });
        });
        _.each(edges, (e: any) => {
          e.setStyle({
            bundleStyle: 0,
          });
        });
        network.setBundleExpanded(true);
      }
    });
  }
  let edgeLabelToggle = true;
  if (linkLabelToggle) {
    linkLabelToggle.addEventListener('click', () => {
      edgeLabelToggle = !edgeLabelToggle;
      network.edgeLabelToggle(edgeLabelToggle);
    });
  }
  if (btnAaddEdge) {
    let midLine = false;
    btnAaddEdge.addEventListener('click', () => {
      const edges = network.getMultipleLines();
      midLine = !midLine;
      _.each(edges, (edge) => {
        edge.setMidline(midLine);
        edge.setStartLine(0.3, {
          color: 0X20c1a1,
          opacity: 1,
        });
        edge.setEndLine(0.7, {
          color: 0Xfcc242,
          opacity: 1,
        });
        edge.setEndArrow({
          // yellow
          color: 0Xfcc242,
          opacity: 1,
        });
        edge.setStartArrow({
          color: 0X20c1a1,
          opacity: 1,
        });
        const label2 = _.get(edge.labelObj, 'label_2').label;
        label2.setStyle({
          fill: 0Xfcc242,
        });
        label2.setText('test change text');
        edge.draw();
        // const leftArrow = edge.getStartToEndArrow();
        // edge.visibleElement(leftArrow, false);
      });
      // const nodes = network.getNodes();
      // const newEdge = network.createEdge(nodes[0], nodes[1]);
      // newEdge.initStyle({
      //   arrowColor: 0X006aad,
      //   arrowAngle: 20,
      //   arrowMiddleLength: 5,
      //   arrowLength: 8,
      //   arrowType: 3,
      //   fillArrow: true,
      //   lineColor: 0X0386d2,
      //   lineType: 0,
      //   lineFull: 0,
      //   lineWidth: 1,
      //   bundleStyle: 0,
      // });
      // network.addElement(newEdge);
      // newEdge.on('rightclick', (event: any) => {
      //   network.menu.setMenuItems([
      //     { label: 'Print line Info', id: '2' },
      //     { label: 'Remove Link', id: '3' },
      //   ]);
      //   network.menu.menuOnAction = (id) => {
      //     if (id === '2') {
      //       // tslint:disable-next-line:no-console
      //       console.log(newEdge);
      //     } else if (id === '3') {
      //       network.removeElements(newEdge);
      //     }
      //   };
      //   network.menu.setClass('popMenu');
      //   network.menu.showMenu(event);
      // });
      // network.syncView();
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
  };
  // let groupLabel = true;
  if (groupLabelToggle) {
    groupLabelToggle.addEventListener('click', () => {
      // groupLabel = !groupLabel;
      // network.groupLabelToggle(groupLabel);
      const emptyGroup = network.createGroup(emptyObj);
      emptyGroup.initStyle({
        fillColor: 0X00ff00,
        fillOpacity: 0.5,
      });
      emptyGroup.draw();
      network.addElement(emptyGroup);
      emptyGroup.setLabel('text', 'Center');
      network.syncView();
      emptyGroup.on('rightclick', (event: any) => {
        network.menu.setMenuItems([
          { label: 'add child node', id: '0' },
          { label: 'change style', id: '1' },
          { label: 'Debug', id: '2' },
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
          } else if (id === '2') {
            // tslint:disable-next-line: no-console
            console.log(emptyGroup);
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
    let pressSpace = true;
    let pressAlt = true;
    const condition = {
      isLock: false,
      isSelectGroup: false,
    };
    // body.addEventListener('wheel', () => {
    //   network.toggleLabel(1, 2);
    // });
    const groups = network.getAllGroups();
    window.addEventListener('keydown', (e) => {
      const keyCode = e.keyCode || e.which || e.charCode;
      if (e.ctrlKey && keyCode === 90 && pressSpace) {
        condition.isLock = true;
        condition.isSelectGroup = false;
        pressSpace = false;
        network.setSelect(condition);
        _.each(groups, (group) => {
          group.setSelect(condition);
        });
      } else if (e.altKey && e.ctrlKey && pressAlt) {
        pressAlt = false;
        condition.isLock = false;
        condition.isSelectGroup = true;
        network.setSelect(condition);
        _.each(groups, (group) => {
          group.setSelect(condition);
        });
      } else if (e.ctrlKey && !network.isSelect) {
        condition.isLock = false;
        condition.isSelectGroup = false;
        network.setSelect(condition);
        _.each(groups, (group) => {
          group.setSelect(condition);
        });
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.keyCode === 17) {
        network.setDrag();
        pressSpace = true;
        pressAlt = true;
        _.each(groups, (group) => {
          group.setDrag();
        });
      }
    });
  }
};
