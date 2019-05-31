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
  private topo: Topo;
  private drawer: Drawer;
  private app: Application;
  private action: CommonAction;
  private domRegex: string;
  private nodeLabel: number = 0;
  private edgeLabel: number = 0;
  private isLayer: boolean = false;

  constructor(domRegex: string) {
    PIXI.utils.skipHello();
    NP.enableBoundaryChecking(false);
    this.domRegex = domRegex;
    this.topo = new Topo();
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
  public setZoom() {
    const wrapper = document.getElementById(this.domRegex);
    if (wrapper) {
      wrapper.addEventListener('wheel', (e) => {
        const zoom = this.zoom;
        // this.clearHighlight();
        if (e.deltaY < 0) {
          if (zoom < 1 && zoom >= 0.1) {
            this.zoomElements(NP.plus(zoom, 0.1));
          } else if (zoom <= 4.8 && zoom >= 1) {
            this.zoomElements(NP.plus(zoom, 0.2));
          } else if (zoom < 0.1 && zoom >= 0) {
            this.zoomElements(NP.plus(zoom, 0.01));
          } else if (zoom > 4.8 && zoom <= 5) {
            this.zoomElements(NP.plus(zoom, 0.2));
          }
        } else {
          if (zoom <= 1 && zoom > 0.11) {
            this.zoomElements(NP.minus(zoom, 0.1));
          } else if (zoom <= 5 && zoom >= 1) {
            this.zoomElements(NP.minus(zoom, 0.2));
          } else if (zoom <= 0.11 && zoom >= 0.02) {
            this.zoomElements(NP.minus(zoom, 0.01));
          } else if (zoom > 5) {
            this.zoomElements(NP.minus(zoom, 0.2));
          }
        }
        const scale = NP.divide(this.zoom, zoom);
        this.moveTopology(scale, e.offsetX, e.offsetY);
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
      this.moveTopology(this.zoom / originZoom, networkSize[0] / 2, networkSize[1] / 2);
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

  // Get all groups object
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
    _.remove(elements, (elem: CommonElement) => {
      return element === elem;
    });
    if (element instanceof Edge) {
      this.topo.clearObject(this.topo.getEdgesGroup());
      if (element.parent instanceof EdgeBundle) {
        _.remove(element.parent.bundleEdge, (edge) => {
          return edge === element;
        });
        if (element.parent.bundleEdge.length === 1 && element.parent.bundleEdge[0]) {
          const edge = element.parent.bundleEdge[0];
          _.remove(elements, (elem: CommonElement) => {
            return element.parent === elem;
          });
          this.addElement(edge);
          edge.setStyle({
            lineType: 0,
          });
        }
      }
      element.setStyle({
        lineColor: element.defaultColor,
      });
      if (element.includeGroup) {
        _.each(element.includeGroup, (edgeGroup: EdgeGroup) => {
          edgeGroup.removeChildEdge(element);
        });
      }
    }
    this.syncView();
  }

  public getSelectedNodes() {
    const selectedNodes = this.topo.getSelectedNodes();
    return selectedNodes;
  }

  public zoomOver() {
    let center: number[] = [];
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
      center = [analyzeCenter.x, analyzeCenter.y];
    }
    this.moveToCenter(center);
    this.toggleLabel(this.nodeLabel, this.edgeLabel);
  }

  public getCenter() {
    return this.action.getCenter();
  }

  public setSelectNodes(node: Node) {
    this.topo.setSelectedNodes(node);
  }

  public setSelectEdge(edge: Edge) {
    this.topo.setSelectedEdge(edge);
  }

  public setSelectGroups(group: Group) {
    this.topo.setSelectedGroups(group);
  }

  public getSelectEdge() {
    const selectEdge = this.topo.getSelectedEdge();
    return selectEdge;
  }

  public getSelectGroups() {
    return this.topo.getSelectedGroups();
  }

  public clearHighlight() {
    this.action.removeHighLight();
  }

  public moveCenter() {
    const vertexPointsList = this.vertexPoints();
    const analyzeCenter = (new polygon(vertexPointsList)).center();
    const center = [analyzeCenter.x, analyzeCenter.y];
    this.moveToCenter(center);
  }

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

  public groupLabelToggle(labelToggle: boolean) {
    const groups = this.getGroupObj();
    _.each(groups, (group: Group) => {
      if (labelToggle) {
        group.setLabel(group.getLabelContent(), group.getLabelPosition(), group.getLabelStyle());
      } else {
        group.removeChild(group.getChildByName('group_label'));
      }
    });
  }

  public changeBackgroundColor(color: number) {
    this.app.renderer.backgroundColor = color;
  }

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

  public changeBundleLabelColor(color: number) {
    _.each(this.getElements(), (element) => {
      if (element instanceof EdgeBundle) {
        element.setStyle({
          fillColor: color,
        });
      }
    });
  }

  public setBundelExpanded(flag: boolean) {
    _.each(this.getElements(), (element) => {
      if (element instanceof EdgeBundle && element.isExpanded !== flag) {
        element.setExpaned(flag);
      }
    });
  }

  public nodeLabelToggle(labelToggle: boolean) {
    const nodes = this.getNodeObj();
    _.each(nodes, (node: Node) => {
      const nodeLabel = node.getChildByName('node_label');
      if (nodeLabel) {
        nodeLabel.visible = labelToggle;
      }
    });
  }

  public hideElement(element: any) {
    if (element instanceof Edge) {
      element.visible = false;
    }
    if (element instanceof Node) {
      element.visible = false;
      _.each(element.linksArray, (edge: Edge) => {
        edge.visible = false;
      });
      _.each(element.incluedGroups, (group: Group) => {
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
      _.each(element.incluedGroups, (group: Group) => {
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

  public reDraw() {
    const nodes = this.getNodeObj();
    const edgeObj: any = this.getEdgeObj();
    const groupObj = this.getGroupObj();
    const edgeBundles = this.getEdgeBundles();
    const edgeGroups = this.getEdgeGroup();
    const dataFlowList = this.getDataFlow();
    const inWrapperNodesList = this.analyzeInWrapperNodes();
    _.each(nodes, (node: Node) => {
      this.drawNode(node, inWrapperNodesList);
    });
    _.each(edgeBundles, (bundle: EdgeBundle) => {
      bundle.changeLabelSize(this.zoom);
    });
    _.each(edgeObj, (edge: Edge) => {
      this.drawEdge(edge);
    });
    _.each(groupObj, (group: Group) => {
      this.drawGroup(group);
      if (this.isLayer) {
        group.layerHideNodes(this.zoom);
      }
    });
    _.each(edgeGroups, (edgeGroup: EdgeGroup) => {
      this.drawEdgeGroup(edgeGroup);
    });
    _.each(dataFlowList, (dataFlow: DataFlow) => {
      let defaultWidth;
      if (dataFlow.invariableStyles && dataFlow.invariableStyles.lineWidth) {
        defaultWidth = dataFlow.invariableStyles.lineWidth;
      } else {
        defaultWidth = dataFlow.defaultStyle.lineWidth;
      }
      if (this.zoom <= 1) {
        dataFlow.setStyle({
          lineWidth: defaultWidth * this.zoom,
        });
      }
      dataFlow.draw();
    });
  }

  set layerHide(flag: boolean) {
    this.isLayer = flag;
    this.reDraw();
  }

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

  private getNetworkSize() {
    const wrapper = document.getElementById(this.domRegex);
    if (wrapper) {
      return [wrapper.offsetWidth, wrapper.offsetHeight];
    }
  }

  private moveTopology(zoom: number, originx: number, originy: number) {
    const moveOriginX = NP.times(originx, NP.minus(1, zoom));
    const moveOriginY = NP.times(originy, NP.minus(1, zoom));
    const nodesObj = this.getNodeObj();
    _.each(nodesObj, (node: any) => {
      node.position.set(node.x + moveOriginX, node.y + moveOriginY);
    });
    this.reDraw();
  }

  private zoomElements(zoomNum: number) {
    const nodesObj = this.getNodeObj();
    const zoomScale = NP.divide(zoomNum, this.zoom);
    _.each(nodesObj, (node: any) => {
      node.position.set(NP.times(node.x, zoomScale), NP.times(node.y, zoomScale));
    });
    this.zoom = zoomNum;
  }

  private analyzeInWrapperNodes() {
    const wrapper = document.getElementById(this.domRegex);
    const nodes = this.getNodeObj();
    const inWrapperNodesList: Node[] = [];
    if (wrapper) {
      const top = wrapper.offsetTop;
      const left = wrapper.offsetLeft;
      const bottom = wrapper.offsetTop + wrapper.offsetHeight;
      const right = wrapper.offsetLeft + wrapper.offsetWidth;
      _.each(nodes, (node: Node) => {
        if (node.visible) {
          const x = node.x + left;
          const y = node.y + top;
          if ((x < right && x > left) && (y < bottom && y > top)) {
            inWrapperNodesList.push(node);
          }
        }
      });
    }
    return inWrapperNodesList;
  }

  private drawNode(node: Node, inWrapperNodesList: Node[]) {
    if (node.icon) {
      if (this.zoom < 0.4 && inWrapperNodesList.length > 300) {
        _.extend(node.defaultStyle, ({
          width: 4,
          fillColor: 0X0386d2,
        }));
        node.drawGraph();
      } else {
        if (this.zoom <= 1.5 && this.zoom >= 0.3) {
          node.iconWidth = NP.times(node.defaultWidth, this.zoom);
          node.iconHeight = NP.times(node.defaultHeight, this.zoom);
        } else if (this.zoom < 0.3) {
          node.iconWidth = NP.times(node.defaultWidth, 0.3);
          node.iconHeight = NP.times(node.defaultHeight, 0.3);
        } else if (this.zoom > 1.5) {
          node.iconWidth = NP.times(node.defaultWidth, 1.5);
          node.iconHeight = NP.times(node.defaultHeight, 1.5);
        }
        node.drawSprite(node.icon);
      }
    }
    const border = node.getChildByName('node_border');
    if (border) {
      node.selectOn();
    }
  }

  private drawEdge(edge: Edge) {
    let width;
    if (edge.invariableStyles && edge.invariableStyles.lineWidth) {
      width = edge.invariableStyles.lineWidth;
    } else {
      width = 1;
    }
    if (this.zoom <= 1.2) {
      _.extend(edge.defaultStyle, ({
        lineWidth: width * this.zoom,
      }));
    } else {
      _.extend(edge.defaultStyle, ({
        lineWidth: width * 1.2,
      }));
    }
    edge.draw();
  }

  private drawGroup(group: Group) {
    let defaultLineWidth;
    if (group.invariableStyles && group.invariableStyles.lineWidth) {
      defaultLineWidth = group.invariableStyles.lineWidth;
    } else {
      defaultLineWidth = 1;
    }
    if (this.zoom > 1) {
      group.setStyle({
        lineWidth: defaultLineWidth,
      });
    } else if (this.zoom <= 1 && this.zoom > 0.5) {
      group.setStyle({
        lineWidth: defaultLineWidth / this.zoom,
      });
    } else {
      group.setStyle({
        lineWidth: defaultLineWidth / 0.5,
      });
    }
    if (group.isSelected) {
      group.selectOn();
    }
    group.draw();
  }

  private drawEdgeGroup(edgeGroup: EdgeGroup) {
    let defaultMargin;
    if (edgeGroup.invariableStyles && edgeGroup.invariableStyles.lineWidth) {
      defaultMargin = edgeGroup.invariableStyles.margin;
    } else {
      defaultMargin = 8;
    }
    if (this.zoom <= 1) {
      edgeGroup.setStyle({
        margin: defaultMargin * this.zoom,
      });
    }
    if (edgeGroup.isSelected) {
      edgeGroup.selectOn();
    }
    edgeGroup.draw();
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

  private moveToCenter(center: number[]) {
    const wrapperCenter = this.getCenter();
    const nodes = this.getNodeObj();
    const moveX = wrapperCenter.x - center[0];
    const moveY = wrapperCenter.y - center[1];
    _.each(nodes, (node: Node) => {
      node.x = node.x + moveX;
      node.y = node.y + moveY;
    });
    this.reDraw();
  }

  private getEdgeBundles() {
    const elements = this.getElements();
    const bundleEdge: any = [];
    _.each(elements, (element) => {
      if (element instanceof EdgeBundle) {
        bundleEdge.push(element);
      }
    });
    return bundleEdge;
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
