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
import { CommonAction } from './common-action';
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
  private loader = PIXI.loader;
  private topo: Topo;
  private drawer: Drawer;
  private app: Application;
  private action: CommonAction;
  private domRegex: string;
  private isLayer: boolean = false;

  constructor(domRegex: string) {
    PIXI.utils.skipHello();
    NP.enableBoundaryChecking(false);
    this.domRegex = domRegex;
    this.topo = new Topo();
    this.drawer = new Drawer(domRegex, this.topo);
    this.app = this.drawer.getWhiteBoard();
    this.action = new CommonAction(this.app, this.topo);
    this.menu = new PopMenu(domRegex, this.app, this.action);
    this.zoom = 1;
    this.isSelect = false;
    this.disableContextMenu(domRegex);
  }

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

  public createNode(iconName?: string) {
    return this.topo.createNode(this.domRegex, iconName);
  }

  public zoomNetworkElements(zoomNum: number) {
    const nodesObj = this.getNodeObj();
    const zoomScale = NP.divide(zoomNum, this.zoom);
    _.each(nodesObj, (node: any) => {
      node.position.set(NP.times(node.x, zoomScale), NP.times(node.y, zoomScale));
    });
    this.zoom = zoomNum;
  }

  public moveTopology(zoom: number, originx: number, originy: number) {
    const moveOriginX = NP.times(originx, NP.minus(1, zoom));
    const moveOriginY = NP.times(originy, NP.minus(1, zoom));
    const nodesObj = this.getNodeObj();
    _.each(nodesObj, (node: any) => {
      node.position.set(node.x + moveOriginX, node.y + moveOriginY);
    });
    this.reDraw();
  }

  public setZoom() {
    const wrapper = document.getElementById(this.domRegex);
    if (wrapper) {
      wrapper.addEventListener('wheel', (e) => {
        const zoom = this.zoom;
        this.clearHighlight();
        if (e.deltaY < 0) {
          if (zoom < 1 && zoom >= 0.1) {
            this.zoomNetworkElements(NP.plus(zoom, 0.1));
          } else if (zoom <= 4.8 && zoom >= 1) {
            this.zoomNetworkElements(NP.plus(zoom, 0.2));
          } else if (zoom < 0.1 && zoom >= 0.01) {
            this.zoomNetworkElements(NP.plus(zoom, 0.01));
          } else if (zoom > 4.8 && zoom <= 5) {
            this.zoomNetworkElements(NP.plus(zoom, 0.2));
          }
        } else {
          if (zoom <= 1 && zoom > 0.11) {
            this.zoomNetworkElements(NP.minus(zoom, 0.1));
          } else if (zoom <= 5 && zoom >= 1) {
            this.zoomNetworkElements(NP.minus(zoom, 0.2));
          } else if (zoom <= 0.11 && zoom >= 0.02) {
            this.zoomNetworkElements(NP.minus(zoom, 0.01));
          } else if (zoom > 5) {
            this.zoomNetworkElements(NP.minus(zoom, 0.2));
          }
        }
        const scale = NP.divide(this.zoom, zoom);
        this.moveTopology(scale, e.offsetX, e.offsetY);
      });

    }
  }

  public getNetworkSize() {
    const wrapper = document.getElementById(this.domRegex);
    if (wrapper) {
      return [wrapper.offsetWidth, wrapper.offsetHeight];
    }
  }

  public getContainer() {
    return this.app.getContainer();
  }

  public createGroup(emptyObj?: any) {
    return this.topo.createGroup(emptyObj);
  }

  public createEdge(startNode: Node | Group, endNode: Node | Group) {
    return this.topo.createEdge(startNode, endNode, this.domRegex);
  }

  public createDataFlow(start: Node, end: Node) {
    return this.topo.createDataFlow(start, end);
  }

  public createEdgeGroup() {
    return this.topo.createEdgeGroup();
  }

  public clear() {
    const elements = this.topo.getElements();
    _.each(elements, (element) => {
      element.destroy();
    });
    _.remove(elements, undefined);
  }

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

  public getEdgeGroup() {
    const elements = this.topo.getElements();
    const edgeGroup: EdgeGroup[] = _.filter(elements, (element) => {
      return element instanceof EdgeGroup;
    });
    return edgeGroup;
  }

  public getDataFlow() {
    const elements = this.topo.getElements();
    const edgeGroup: DataFlow[] = _.filter(elements, (element) => {
      return element instanceof DataFlow;
    });
    return edgeGroup;
  }

  public addElement(element: CommonElement) {
    this.topo.addElement(element);
  }

  public addElements(elements: Node[] | Group[] | Edge[]) {
    this.topo.addElements(elements);
  }

  public getSelectedNodes() {
    const selectedNodes = this.topo.getSelectedNodes();
    return selectedNodes;
  }

  public removeElements(element: CommonElement) {
    this.topo.removeElement(element);
  }

  public setDrag() {
    this.isSelect = false;
    this.action.dragContainer();
  }

  public setSelect(isLock: boolean) {
    this.isSelect = true;
    this.action.setSelect(isLock);
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

  public getSelectEdge() {
    const selectEdge = this.topo.getSelectedEdge();
    return selectEdge;
  }

  public clearHighlight() {
    this.action.cleanEdge();
    this.action.cleanNode();
    this.topo.removeSelectedNodes();
  }

  public syncView() {
    this.drawer.syncView();
    this.action.setClick();
    if (this.zoom < 3) {
      this.edgeLabelToggle(false);
    }
  }

  public setClick(color?: number) {
    this.action.setClick(color);
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

  public lockElement(element: CommonElement) {
    this.action.lockElement(element);
  }

  public unlockElement(element: CommonElement) {
    this.action.unLockElement(element);
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
        this.layerGroup(group);
      }
    });
    _.each(edgeGroups, (edgeGroup: EdgeGroup) => {
      this.drawEdgeGroup(edgeGroup);
    });
    _.each(dataFlowList, (dataFlow: DataFlow) => {
      dataFlow.draw();
    });
    this.toggleLabel();
  }

  set layerHide(flag: boolean) {
    this.isLayer = flag;
    this.reDraw();
  }

  private layerGroup(group: Group) {
    if (this.zoom <= 0.6) {
      if (group.substratumInfo.length === 0 && group.childNodesList.length > 1) {
        const showNodesList = _.drop(group.childNodesList);
        let showEdgeList: Edge[] = [];
        let groups: Group[] = [];
        if (showNodesList) {
          const showNodes: any = _.flattenDeep(showNodesList);
          _.each(showNodes, (node: Node) => {
            node.visible = true;
            showEdgeList = _.concat(showEdgeList, node.linksArray);
            groups = _.concat(groups, node.incluedGroups);
          });
          _.each(showEdgeList, (edge: Edge) => {
            edge.visible = true;
          });
          groups = _.uniq(groups);
          const index = showNodesList.length;
          let hideNodeList: any[] = [];
          let hideEdge: Edge[] = [];
          if (this.zoom <= 0.5 && index > 0 && this.zoom > 0.3) {
            hideNodeList = _.flattenDeep(_.takeRight(showNodesList));
          } else if (this.zoom <= 0.3 && index - 1 > 0 && this.zoom > 0.2) {
            hideNodeList = _.flattenDeep(_.takeRight(showNodesList, 2));
          } else if (this.zoom <= 0.2 && index - 2 > 0 && this.zoom > 0.1) {
            hideNodeList = _.flattenDeep(_.takeRight(showNodesList, 3));
          } else if (this.zoom <= 0.1) {
            hideNodeList = _.flattenDeep(showNodesList);
          }
          if (hideNodeList.length === 0 && this.zoom < 0.5) {
            hideNodeList = _.flattenDeep(showNodesList);
          }
          _.each(hideNodeList, (node: Node) => {
            node.visible = false;
            hideEdge = _.concat(hideEdge, node.linksArray);

          });
          _.each(hideEdge, (edge: Edge) => {
            edge.visible = false;
          });
        }
        _.each(groups, (g: Group) => {
          g.draw();
        });
      }
    }
  }

  private toggleLabel() {
    if (this.zoom < 1) {
      this.nodeLabelToggle(false);
    } else {
      this.nodeLabelToggle(true);
    }
    if (this.zoom < 2) {
      this.edgeLabelToggle(false);
    } else {
      this.edgeLabelToggle(true);
    }
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
        if (this.zoom <= 1.5) {
          node.iconWidth = NP.times(node.defaultWidth, this.zoom);
          node.iconHeight = NP.times(node.defaultHeight, this.zoom);
        }
        node.drawSprite(node.icon);
      }
    }
  }

  private drawEdge(edge: Edge) {
    const width = edge.invariableStyles.lineWidth;
    if (this.zoom < 1) {
      _.extend(edge.defaultStyle, ({
        lineWidth: width * this.zoom,
      }));
    }
    edge.draw();
  }

  private drawGroup(group: Group) {
    const defaultOpacity = group.invariableStyles.fillOpacity;
    const defaultLineWidth = group.invariableStyles.lineWidth;
    if (this.zoom > 1) {
      group.setStyle({
        fillOpacity: defaultOpacity,
        lineWidth: defaultLineWidth,
      });
    } else if (this.zoom <= 1 && this.zoom > 0.5) {
      group.setStyle({
        fillOpacity: defaultOpacity * this.zoom,
        lineWidth: defaultLineWidth / this.zoom,
      });

    } else {
      group.setStyle({
        fillOpacity: defaultOpacity * 0.5,
        lineWidth: defaultLineWidth / 0.5,
      });
    }
    group.draw();
  }

  private drawEdgeGroup(edgeGroup: EdgeGroup) {
    const defaultMargin = edgeGroup.invariableStyles.margin;
    if (this.zoom <= 1) {
      edgeGroup.setStyle({
        margin: defaultMargin * this.zoom,
      });
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
      if (_.size(nodes) !== 0) {
        maxX = minX = this.getNodes()[0].x;
        maxY = minY = this.getNodes()[0].y;
      }
      _.each(nodes, (node: Node) => {
        if (node.visible) {
          const x = node.x;
          const y = node.y;
          maxX = maxX > x ? maxX : x;
          minX = minX < x ? minX : x;
          maxY = maxY > y ? maxY : y;
          minY = minY < y ? minY : y;
        }
      });
      rateX = Math.abs((maxX - minX) / wrapperContainr[0]);
      rateY = Math.abs((maxY - minY) / wrapperContainr[1]);
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
