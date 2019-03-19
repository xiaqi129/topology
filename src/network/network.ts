/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import NP from 'number-precision';
import { Application } from './application';
import { IPoint } from './arrow-line';
import { CommonAction } from './common-action';
import { CommonElement } from './common-element';
import { Drawer } from './drawer';
import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { Group } from './group';
import { Node } from './node';
import { PopMenu } from './pop-menu';
import { Tooltip } from './tooltip';
import { Topo } from './topo';
NP.enableBoundaryChecking(false);

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
  private tooltip: Tooltip;
  private load: PIXI.loaders.Loader;
  private domRegex: string;

  constructor(domRegex: string) {
    PIXI.utils.skipHello();
    this.domRegex = domRegex;
    this.topo = new Topo();
    this.drawer = new Drawer(domRegex, this.topo);
    this.app = this.drawer.getWhiteBoard();
    this.tooltip = new Tooltip();
    this.action = new CommonAction(this.app, this.topo, this.tooltip);
    this.menu = new PopMenu(domRegex, this.app, this.action);
    this.load = new PIXI.loaders.Loader();
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

  public addIconResource(iconList: any) {
    _.each(iconList, (icon) => {
      this.load.add(icon.name, icon.url);
    });
    this.load.load();
  }

  public createNode(iconName?: string) {
    return this.topo.createNode(iconName);
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
    const edgeObj = this.getEdgeObj();
    // console.log(_.size(edgeObj));
    const groupObj = this.getGroupObj();
    _.each(nodesObj, (node: any) => {
      node.position.set(node.x + moveOriginX, node.y + moveOriginY);
      if (this.zoom < 0.75) {
        node.setStyle({
          width: 4,
        });
        node.drawGraph();
      } else {
        node.drawSprite(node.icon);
      }
    });
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
    _.each(edgeObj, (edge: any) => {
      edge.draw();
    });
    _.each(groupObj, (group: any) => {
      const groupEdge = group.filterEdge();
      group.draw();
      _.each(groupEdge, (edge) => {
        edge.draw();
      });
    });
  }

  public setZoom() {
    const wrapper = document.getElementById(this.domRegex);
    if (wrapper) {
      wrapper.addEventListener('wheel', (e) => {
        const zoom = this.zoom;
        this.clearHighlight();
        if (e.deltaY < 0) {
          if (zoom < 4) {
            this.zoomNetworkElements(zoom + 0.1);
          }
        } else {
          if (zoom > 0.4) {
            this.zoomNetworkElements(zoom - 0.1);
          }
        }
        const scale = NP.divide(this.zoom, zoom);
        this.moveTopology(scale, e.clientX, e.clientY);
      });

    }
  }

  public getNetworkSize() {
    const wrapper = document.getElementById(this.domRegex);
    if (wrapper) {
      return [wrapper.clientWidth, wrapper.clientHeight];
    }
  }

  public getContainer() {
    return this.app.getContainer();
  }

  public createGroup(emptyObj?: any) {
    return this.topo.createGroup(emptyObj);
  }

  public createEdge(startNode: Node | Group, endNode: Node | Group) {
    return this.topo.createEdge(startNode, endNode);
  }

  public createArrowLine(start: IPoint, end: IPoint) {
    return this.topo.createArrowLine(start, end);
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

  public getNodeObj() {
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

  public getEdgeObj() {
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

  public getGroupObj() {
    const groupObj = {};
    const elements = this.topo.getElements();
    _.each(elements, (element) => {
      if (element instanceof Group && element.name) {
        const name: string = element.name;
        _.extend(groupObj, {
          [name]: element,
        });
      }
    });
    return groupObj;
  }

  public addElement(element: Node | Group | Edge) {
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

  public setSelect() {
    this.isSelect = true;
    this.action.setSelect();
  }

  public zoomOver() {
    this.action.zoomOver();
    if (this.getZoom() < 3) {
      this.edgeLabelToggle(false);
    }
  }

  public getZoom() {
    return this.action.getZoom();
  }

  public zoomReset() {
    this.action.zoomReset();
    if (this.getZoom() < 3) {
      this.edgeLabelToggle(false);
    }
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

  public setTooltipDisplay(isDisplay: boolean) {
    this.tooltip.setTooltipDisplay(isDisplay);
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
      const nodeName = element.name;
      _.each(this.getEdgeObj(), (value: any, key: string) => {
        // if key contain nodeName, then set value's visible to false
        if (nodeName && key.indexOf(nodeName) !== -1) {
          value.visible = false;
        }
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
      const nodeName = element.name;
      _.each(this.getEdgeObj(), (value: any, key: string) => {
        if (nodeName && key.indexOf(nodeName) !== -1) {
          value.visible = true;
        }
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

  private disableContextMenu(domRegex: string) {
    const html = document.getElementById(domRegex);
    if (html) {
      html.addEventListener('contextmenu', (e: any) => {
        e.preventDefault();
      });
    }
  }
}
