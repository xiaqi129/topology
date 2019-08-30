/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import NP from 'number-precision';
import polygon from 'polygon';
import { Application } from './application';
import { CommonAction, ICondition } from './common-action';
import { CommonElement, IPosition } from './common-element';
import { DataFlow } from './data-flow';
import { Drawer } from './drawer';
import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { EdgeGroup } from './edge-group';
import { Group } from './group';
import { Node } from './node';
import { PopMenu } from './pop-menu';
import { Topo } from './topo';

export class Network {
  public menu: PopMenu;
  public callback: any;
  public zoom: number;
  public isSelect: boolean;
  public pointNum: number = 300;
  private topo: Topo;
  private drawer: Drawer;
  private app: Application;
  private action: CommonAction;
  private domRegex: string;
  private nodeLabel: number = 0;
  private edgeLabel: number = 0;

  constructor(domRegex: string) {
    PIXI.utils.skipHello();
    NP.enableBoundaryChecking(false);
    this.domRegex = domRegex;
    this.topo = new Topo(domRegex);
    this.drawer = new Drawer(domRegex, this.topo);
    this.app = this.drawer.getWhiteBoard();
    this.action = new CommonAction(this.app, this.topo, domRegex);
    this.menu = new PopMenu(domRegex, this.app, this.action);
    this.zoom = 1;
    this.isSelect = false;
    this.disableContextMenu(domRegex);
  }

  // Init icon resource from iconList
  public initIconResource(iconList: any) {
    PIXI.loader.reset();
    PIXI.utils.clearTextureCache();
    _.each(iconList, (icon: any) => {
      PIXI.loader.add(icon.name, icon.url);
    });
    PIXI.loader.load(() => {
      this.callback();
      this.callback = Function();
    });
  }

  // Create Node
  public createNode(iconName?: string) {
    return this.topo.createNode(this.domRegex, iconName);
  }

  /**
   * Create Group that includes nodes
   * @param emptyObj create an empty group set of required properties
   */
  public createGroup(emptyObj?: any) {
    return this.topo.createGroup(emptyObj);
  }

  /**
   * Create Edge use two nodes
   * @param startNode the node of original
   * @param endNode the node of destination
   */
  public createEdge(startNode: Node | Group, endNode: Node | Group) {
    return this.topo.createEdge(startNode, endNode, this.domRegex);
  }

  /**
   * Create a data flow with two nodes
   * @param start the node of destination
   * @param end the node of destination
   */
  public createDataFlow(start: Node, end: Node) {
    return this.topo.createDataFlow(start, end);
  }

  // Create a group includes with edges
  public createEdgeGroup() {
    return this.topo.createEdgeGroup();
  }
  // Get outside container
  public getContainer() {
    return this.app.getContainer();
  }

  // Add an element
  public addElement(element: CommonElement) {
    this.topo.addElement(element);
  }

  // Add more elemnts
  public addElements(elements: CommonElement[]) {
    this.topo.addElements(elements);
  }

  // Synchronize all add elements to the canvas
  public syncView() {
    this.drawer.syncView();
  }

  // Setup topology can drag
  public setDrag() {
    this.isSelect = false;
    this.action.dragContainer();
  }

  // Setup topology can select more nodes
  public setSelect(condition?: ICondition) {
    this.isSelect = true;
    this.action.setSelect(condition);
  }

  // Setup topology can zoom in and zoom out with mouse wheel
  public setZoom(isDraw?: boolean) {
    const wrapper = document.getElementById(this.domRegex);
    if (wrapper) {
      wrapper.addEventListener('wheel', (e) => {
        const zoom = this.zoom;
        // this.clearHighlight();
        if (e.deltaY < 0) {
          if (zoom <= 1 && zoom > 0.1) {
            this.zoomElements(NP.plus(zoom, 0.1));
          } else if (zoom <= 2 && zoom > 1) {
            this.zoomElements(NP.plus(zoom, 0.2));
          } else if (zoom > 2) {
            this.zoomElements(NP.plus(zoom, 1));
          } else if (zoom <= 0.1 && zoom > 0.01) {
            this.zoomElements(NP.plus(zoom, 0.01));
          } else if (zoom <= 0.01 && zoom > 0.001) {
            this.zoomElements(NP.plus(zoom, 0.001));
          } else if (zoom <= 0.001 && zoom >= 0.0001) {
            this.zoomElements(NP.plus(zoom, 0.0001));
          }
        } else {
          if (zoom > 2) {
            this.zoomElements(NP.minus(zoom, 1));
          } else if (zoom <= 2 && zoom > 1) {
            this.zoomElements(NP.minus(zoom, 0.2));
          } else if (zoom <= 1 && zoom > 0.11) {
            this.zoomElements(NP.minus(zoom, 0.1));
          } else if (zoom <= 0.11 && zoom > 0.011) {
            this.zoomElements(NP.minus(zoom, 0.01));
          } else if (zoom <= 0.011 && zoom > 0.0011) {
            this.zoomElements(NP.minus(zoom, 0.001));
          } else if (zoom <= 0.0011 && zoom > 0.0002) {
            this.zoomElements(NP.minus(zoom, 0.0001));
          } else if (zoom <= 0.0002 && zoom > 0) {
            this.zoomElements(0.0001);
          }
        }
        const scale = NP.divide(this.zoom, zoom);
        if (isDraw) {
          this.moveTopology(scale, e.offsetX, e.offsetY, isDraw);
        } else {
          this.moveTopology(scale, e.offsetX, e.offsetY, true);
        }
      });
    }
  }

  // Setup in the topology element click highlight effect
  public setClick() {
    this.action.setClick();
  }

  // Zoom topoloy with the size of the speciflc
  public zoomNetworkElements(zoomNum: number) {
    const nodesObj = this.getNodeObj();
    const zoomScale = NP.divide(zoomNum, this.zoom);
    const networkSize = this.getNetworkSize();
    const originZoom = _.cloneDeep(this.zoom);
    _.each(nodesObj, (node: any) => {
      node.position.set(NP.times(node.x, zoomScale), NP.times(node.y, zoomScale));
    });
    this.zoom = zoomNum;
    if (networkSize) {
      this.moveTopology(this.zoom / originZoom, networkSize[0] / 2, networkSize[1] / 2, true);
      this.toggleLabel(this.nodeLabel, this.edgeLabel);
    }
  }

  // Clear the entire topology
  public clear() {
    const elements = this.topo.getElements();
    _.each(elements, (element) => {
      element.destroy();
    });
    _.remove(elements, undefined);
  }

  // Get all elements in the topology
  public getElements() {
    return this.topo.getElements();
  }

  public getNodes() {
    const elements = this.topo.getElements();
    const nodes = _.filter(elements, (node) => {
      return node instanceof Node;
    });
    return nodes;
  }

  // Get all nodes object
  public getNodeObj(): { [key: string]: Node } {
    const nodeObj = {};
    const elements = this.topo.getElements();
    _.each(elements, (node) => {
      if (node instanceof Node && node.name) {
        const name: string = node.name;
        _.extend(nodeObj, {
          [name]: node,
        });
      }
    });
    return nodeObj;
  }

  // Get all edges object
  public getEdgeObj(): { [key: string]: Edge } {
    const edgeObj = {};
    const elements = this.topo.getElements();
    _.each(elements, (element) => {
      if (element instanceof EdgeBundle) {
        _.each(element.children, (edge, index) => {
          const name: string = `${(edge as Edge).startNode.name}=>${(edge as Edge).endNode.name}-${index + 1}ofBundle`;
          _.extend(edgeObj, {
            [name]: edge,
          });
        });
      }
      if (element instanceof Edge) {
        const name: string = `${element.startNode.name}=>${element.endNode.name}`;
        _.extend(edgeObj, {
          [name]: element,
        });
      }
    });
    return edgeObj;
  }

  // Get all edges
  public getAllEdges(): { [key: string]: Edge } {
    const edgeObj = {};
    const elements = this.topo.getElements();
    _.each(elements, (element) => {
      if (element instanceof EdgeBundle) {
        const data = !element.isExpanded ? element.bundleData : element.children;
        _.each(data, (edge, index) => {
          const name: string = `${(edge as Edge).startNode.name}=>${(edge as Edge).endNode.name}-${index + 1}ofBundle`;
          _.extend(edgeObj, {
            [name]: edge,
          });
        });
      }
      if (element instanceof Edge) {
        const name: string = `${element.startNode.name}=>${element.endNode.name}`;
        _.extend(edgeObj, {
          [name]: element,
        });
      }
    });
    return edgeObj;
  }

  // Get all node groups object
  public getGroupObj(): { [key: string]: Group } {
    const groupObj = {};
    const elements = this.topo.getElements();
    _.each(elements, (element, id) => {
      if (element instanceof Group && element.name) {
        const name: string = element.name;
        _.extend(groupObj, {
          [`${name}${id}`]: element,
        });
      }
    });
    return groupObj;
  }

  public getAllGroups() {
    const groups: any[] = [];
    const elements = this.topo.getElements();
    _.each(elements, (element) => {
      if (element instanceof Group || element instanceof EdgeGroup) {
        groups.push(element);
      }
    });
    return groups;
  }

  // Get all edge groups array
  public getEdgeGroup() {
    const elements = this.topo.getElements();
    const edgeGroup: EdgeGroup[] = _.filter(elements, (element) => {
      return element instanceof EdgeGroup;
    });
    return edgeGroup;
  }

  // Get all data flow array
  public getDataFlow() {
    const elements = this.topo.getElements();
    const edgeGroup: DataFlow[] = _.filter(elements, (element) => {
      return element instanceof DataFlow;
    });
    return edgeGroup;
  }

  // Delete specified elements in topology
  public removeElements(element: CommonElement) {
    const elements = this.getElements();
    if (element instanceof Edge) {
      _.remove(element.startNode.linksArray, (e: any) => {
        return e.id === element.id;
      });
      _.remove(element.endNode.linksArray, (e: any) => {
        return e.id === element.id;
      });
      if (element.bundleParent instanceof EdgeBundle) {
        const data = !element.bundleParent.isExpanded ? element.bundleParent.bundleData : element.bundleParent.children;
        // remove bundle data or bundle children
        _.remove(data, (edge) => {
          return edge === element;
        });
        if (data.length === 1 && data[0]) {
          const edge = data[0];
          // remove edge bundle on elements
          _.remove(elements, (elem: CommonElement) => {
            return element.bundleParent === elem;
          });
          element.bundleParent.removeBundleEdge();
          elements.push(edge);
          edge.startNode.linksArray.push(edge);
          edge.endNode.linksArray.push(edge);
          edge.setStyle({
            lineType: 0,
          });
        } else if (data.length > 1) {
          element.bundleParent.updateNum();
        }
      }
      element.setStyle({
        lineColor: element.defaultColor,
      });
      if (element.includeGroup.length > 0) {
        _.each(element.includeGroup, (edgeGroup: EdgeGroup) => {
          edgeGroup.removeChildEdge(element);
        });
      }
    } else if (element instanceof Node) {
      if (element.includedGroups.length > 0) {
        _.each(element.includedGroups, (group: Group) => {
          group.removeChildNode(element);
        });
      }
      const nodeLinks = this.getNodeLinks(element);
      _.each(nodeLinks, (edge: Edge) => {
        this.removeElements(edge);
      });
    }
    _.remove(elements, (elem: CommonElement) => {
      if (element) {
        return element.id === elem.id;
      }
    });
    this.syncView();
  }

  // Full screen the whole network topology
  public zoomOver() {
    let center: IPosition = { x: 0, y: 0 };
    const zoomRate = this.analyzeZoom();
    this.zoom = this.zoom * zoomRate;
    const nodes = this.getNodeObj();
    _.each(nodes, (node: Node) => {
      node.x = node.x * zoomRate;
      node.y = node.y * zoomRate;
    });
    this.reDraw();
    const isOutsideGroup = this.getIsOutsideGroup();
    if (isOutsideGroup) {
      center = isOutsideGroup.centerPoint;
    } else {
      const vertexPointsList = this.vertexPoints();
      const analyzeCenter = (new polygon(vertexPointsList)).center();
      center = analyzeCenter;
    }
    this.moveToCenter(center);
    this.toggleLabel(this.nodeLabel, this.edgeLabel);
  }

  // Get Container's center
  public getCenter() {
    return this.action.getCenter();
  }

  // Get all selected nodes
  public getSelectedNodes() {
    const selectedNodes = this.topo.getSelectedNodes();
    return selectedNodes;
  }

  // Set up some node to be selected
  public setSelectNodes(node: Node) {
    this.topo.setSelectedNodes(node);
  }

  // Set up an edge to be selected
  public setSelectEdge(edge: Edge) {
    this.topo.setSelectedEdge(edge);
  }

  // Set up some groups to be selected
  public setSelectGroups(group: Group) {
    this.topo.setSelectedGroups(group);
  }

  // Get the selected edge
  public getSelectEdge() {
    const selectEdge = this.topo.getSelectedEdge();
    return selectEdge;
  }

  // Get all selected groups
  public getSelectGroups() {
    return this.topo.getSelectedGroups();
  }

  // Clean all selected elements
  public clearHighlight() {
    this.action.removeHighLight();
  }

  // move topology to the center of screen
  public moveCenter(isDraw?: boolean) {
    const vertexPointsList = this.vertexPoints();
    const analyzeCenter = (new polygon(vertexPointsList)).center();
    this.moveToCenter(analyzeCenter);
    if (isDraw === true || isDraw === undefined) {
      this.reDraw();
    }
  }

  // Set up tooltip show or hide
  public setTooltipDisplay(isDisplay: boolean) {
    const nodes = this.getNodeObj();
    const edges = this.getEdgeObj();
    _.each(nodes, (node: Node) => {
      node.tooltip.setTooltipDisplay(isDisplay);
    });
    _.each(edges, (edge: Edge) => {
      edge.tooltip.setTooltipDisplay(isDisplay);
    });
  }

  // Set up show or hide group's label
  public groupLabelToggle(labelToggle: boolean) {
    const groups = this.getGroupObj();
    _.each(groups, (group: Group) => {
      const groupLabel = group.getChildByName('group_label');
      if (groupLabel) {
        groupLabel.visible = labelToggle;
      }
    });
  }

  // Set up show or hide edge group's label
  public edgeGroupLabelToggle(labelToggle: boolean) {
    const groups = this.getEdgeGroup();
    _.each(groups, (group: EdgeGroup) => {
      const groupLabel = group.getChildByName('group_label');
      if (groupLabel) {
        groupLabel.visible = labelToggle;
      }
    });
  }

  // Set up the background color of the canvas
  public changeBackgroundColor(color: number) {
    this.app.renderer.backgroundColor = color;
  }

  // Set up show or hide edge's label
  public edgeLabelToggle(labelToggle: boolean) {
    const edges = this.getEdgeObj();
    _.each(edges, (edge: Edge) => {
      const srcLabel = edge.getChildByName('edge_srclabel');
      const endLabel = edge.getChildByName('edge_endlabel');
      if (srcLabel && endLabel) {
        srcLabel.visible = labelToggle;
        endLabel.visible = labelToggle;
      }
    });
  }

  // Set up show or hide bundle edge label
  public bundleLabelToggle(flag: boolean) {
    _.each(this.getElements(), (element) => {
      if (element instanceof EdgeBundle && !element.isExpanded) {
        const edge: any = element.children[0];
        if (edge) {
          const background = edge.getChildByName('label_background');
          const label = edge.getChildByName('bundle_label');
          if (background && label) {
            background.visible = flag;
            label.visible = flag;
          }
        }
      }
    });
  }

  // Set up the color of the bundle edge label's background
  public changeBundleLabelColor(color: number) {
    _.each(this.getElements(), (element) => {
      if (element instanceof EdgeBundle) {
        element.setStyle({
          fillColor: color,
        });
      }
    });
  }

  // Set up bundle edge closed or expanded
  public setBundleExpanded(flag: boolean) {
    _.each(this.getElements(), (element) => {
      if (element instanceof EdgeBundle && element.isExpanded !== flag) {
        element.setExpaned(flag);
      }
    });
  }

  // Set up show or hide node's label
  public nodeLabelToggle(labelToggle: boolean) {
    const nodes = this.getNodeObj();
    _.each(nodes, (node: Node) => {
      const nodeLabel = node.getChildByName('node_label');
      if (nodeLabel) {
        nodeLabel.visible = labelToggle;
      }
    });
  }

  // hide element
  public hideElement(element: any) {
    if (element instanceof Edge) {
      element.visible = false;
    }
    if (element instanceof Node) {
      element.visible = false;
      _.each(element.linksArray, (edge: Edge) => {
        edge.visible = false;
      });
      _.each(element.includedGroups, (group: Group) => {
        group.draw();
      });
    }
    if (element instanceof Group) {
      element.visible = false;
      const intersectionGroup = element.intersection()[1];
      _.each(intersectionGroup, (group) => {
        group.visible = false;
      });
    }
  }

  // show element
  public showElement(element: any) {
    if (element instanceof Edge) {
      element.visible = true;
    }
    if (element instanceof Node) {
      element.visible = true;
      _.each(element.linksArray, (edge: Edge) => {
        if (edge.startNode.visible && edge.endNode.visible) {
          edge.visible = true;
        }
      });
      _.each(element.includedGroups, (group: Group) => {
        group.draw();
      });
    }
    if (element instanceof Group) {
      element.visible = true;
      const intersectionGroup = element.intersection()[1];
      _.each(intersectionGroup, (group) => {
        group.visible = true;
      });
    }
  }

  public getEdgeBundles() {
    const elements = this.getElements();
    const bundleEdge: any = [];
    _.each(elements, (element) => {
      if (element instanceof EdgeBundle) {
        bundleEdge.push(element);
      }
    });
    return bundleEdge;
  }

  // basic reDraw elements on canvas
  public reDraw() {
    let elements = this.getElements();
    elements = _.filter(elements, (element: CommonElement) => {
      return !(element instanceof Node);
    });
    const objOrder = [Node, Edge, EdgeBundle, Group, EdgeGroup, DataFlow];
    elements.sort((a: any, b: any) => {
      return _.indexOf(objOrder, a.constructor) - _.indexOf(objOrder, b.constructor);
    });
    _.each(elements, (element: CommonElement) => {
      element.draw();
    });
  }

  // Based on the zoom number to show or hide node's and edge's label
  public toggleLabel(nodeVisibleZoom: number, edgeVisibleZoom: number) {
    this.nodeLabel = nodeVisibleZoom;
    this.edgeLabel = edgeVisibleZoom;
    if (this.zoom < nodeVisibleZoom) {
      this.nodeLabelToggle(false);
    } else {
      this.nodeLabelToggle(true);
    }
    if (this.zoom < edgeVisibleZoom) {
      this.edgeLabelToggle(false);
    } else {
      this.edgeLabelToggle(true);
    }
  }

  public moveTopology(zoom: number, originx: number, originy: number, isDraw: boolean) {
    const moveOriginX = NP.times(originx, NP.minus(1, zoom));
    const moveOriginY = NP.times(originy, NP.minus(1, zoom));
    const nodesObj = this.getNodeObj();
    _.each(nodesObj, (node: any) => {
      node.position.set(node.x + moveOriginX, node.y + moveOriginY);
    });
    if (isDraw) {
      this.reDraw();
    }
  }

  public analyzeInWrapperNodes() {
    const wrapper = document.getElementById(this.domRegex);
    const nodes = this.getNodeObj();
    const inWrapperNodesList: Node[] = [];
    if (wrapper) {
      const top = wrapper.offsetTop;
      const left = wrapper.offsetLeft;
      const bottom = wrapper.offsetTop + wrapper.offsetHeight;
      const right = wrapper.offsetLeft + wrapper.offsetWidth;
      _.each(nodes, (node: Node) => {
        const x = node.x + left;
        const y = node.y + top;
        if ((x < right && x > left) && (y < bottom && y > top)) {
          inWrapperNodesList.push(node);
        }
      });
    }
    return inWrapperNodesList;
  }

  public moveToCenter(center: IPosition) {
    const wrapperCenter = this.getCenter();
    const nodes = this.getNodeObj();
    const moveX = wrapperCenter.x - center.x;
    const moveY = wrapperCenter.y - center.y;
    _.each(nodes, (node: Node) => {
      node.x = node.x + moveX;
      node.y = node.y + moveY;
    });
  }

  private getNodeLinks(node: Node) {
    const edgesArray = this.getAllEdges();
    const nodeLinks = _.filter(edgesArray, (edge: Edge) => {
      return edge.startNode.id === node.id || edge.endNode.id === node.id;
    });
    return nodeLinks;
  }

  private getNetworkSize() {
    const wrapper = document.getElementById(this.domRegex);
    if (wrapper) {
      return [wrapper.offsetWidth, wrapper.offsetHeight];
    }
  }

  private zoomElements(zoomNum: number) {
    const nodesObj = this.getNodeObj();
    const zoomScale = NP.divide(zoomNum, this.zoom);
    _.each(nodesObj, (node: any) => {
      node.position.set(NP.times(node.x, zoomScale), NP.times(node.y, zoomScale));
    });
    this.zoom = zoomNum;
  }

  private drawNode(node: Node) {
    const border = node.getChildByName('node_border');
    if (border) {
      node.selectOn();
    }
  }

  private analyzeZoom() {
    const wrapperContainr = this.app.getWrapperBoundings();
    const nodes = this.getNodeObj();
    const isOutsideGroup = this.getIsOutsideGroup();
    const center = this.getCenter();
    let rateX: number;
    let rateY: number;
    let scale: number;
    let zoomRate: number;
    if (isOutsideGroup) {
      rateX = Math.abs(isOutsideGroup.width / wrapperContainr[0]);
      rateY = Math.abs(isOutsideGroup.height / wrapperContainr[1]);
      scale = rateX > rateY ? rateX : rateY;
    } else {
      let maxX: number = center.x;
      let minX: number = center.x;
      let maxY: number = center.y;
      let minY: number = center.y;
      let width: number = 0;
      let height: number = 0;
      if (_.size(nodes) !== 0) {
        maxX = minX = this.getNodes()[0].x;
        maxY = minY = this.getNodes()[0].y;
      }
      _.each(nodes, (node: Node) => {
        if (node.visible) {
          const x = node.x;
          const y = node.y;
          const w = node.getWidth();
          const h = node.getHeight();
          maxX = maxX > x ? maxX : x;
          minX = minX < x ? minX : x;
          maxY = maxY > y ? maxY : y;
          minY = minY < y ? minY : y;
          width = width > w ? width : w;
          height = height > h ? height : h;
        }
      });
      const maxNum = width > height ? width : height;
      rateX = Math.abs((maxX - minX + maxNum) / wrapperContainr[0]);
      rateY = Math.abs((maxY - minY + maxNum) / wrapperContainr[1]);
      scale = rateX > rateY ? rateX : rateY;
    }
    zoomRate = 1 / scale;
    return zoomRate;
  }

  private getIsOutsideGroup() {
    const nodes = this.getNodeObj();
    const groups = this.getGroupObj();
    const isOutsideGroup: any = _.find(groups, (group: Group) => {
      return group.getChildNodes().length === _.size(nodes);
    });
    return isOutsideGroup;
  }

  private disableContextMenu(domRegex: string) {
    const html = document.getElementById(domRegex);
    if (html) {
      html.addEventListener('contextmenu', (e: any) => {
        e.preventDefault();
      });
    }
  }

  private vertexPoints() {
    const nodes = this.getNodeObj();
    const positionList: IPosition[] = [];
    _.each(nodes, (node: Node) => {
      positionList.push({
        x: node.x,
        y: node.y,
      });
    });
    const vertexPointsList = _.map(positionList, (pos: IPosition) => {
      return _.values(pos);
    });
    return vertexPointsList;
  }
}
