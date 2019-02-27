/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { Application } from './application';
import { CommonAction } from './common-action';
import { Drawer } from './drawer';
import { Edge } from './edge';
import { Group } from './group';
import { Node } from './node';
import { PopMenu } from './pop-menu';
import { Tooltip } from './tooltip';

import { CommonElement } from './common-element';
import { EdgeBundle } from './edge-bundle';
import { Topo } from './topo';

export class Network {
  public menu: PopMenu;
  public callback: any;
  private loader = PIXI.loader;
  private topo: Topo;
  private drawer: Drawer;
  private app: Application;
  private action: CommonAction;
  private tooltip: Tooltip;
  private load: PIXI.loaders.Loader;

  constructor(domRegex: string) {
    PIXI.utils.skipHello();
    this.topo = new Topo();
    this.drawer = new Drawer(domRegex, this.topo);
    this.app = this.drawer.getWhiteBoard();
    this.tooltip = new Tooltip();
    this.action = new CommonAction(this.app, this.topo, this.tooltip);
    this.menu = new PopMenu(domRegex, this.app, this.action);
    this.load = new PIXI.loaders.Loader();
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

  public createGroup(emptyObj?: any) {
    return this.topo.createGroup(emptyObj);
  }

  public createEdge(startNode: Node | Group, endNode: Node | Group) {
    return this.topo.createEdge(startNode, endNode);
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
    const elements = this.topo.getElements();
    _.remove(elements, (elem: CommonElement) => {
      return element === elem;
    });
    if (element instanceof Node) {
      element.removeChildren(0, element.children.length);
      element.labelContent = '';
    } else if (element instanceof Edge) {
      this.topo.clearObject(this.topo.getEdgesGroup());
      element.destroy();
    } else if (element instanceof Group) {
      element.destroy();
    }
  }

  public setDrag() {
    this.action.dragContainer();
  }

  public setSelect() {
    this.action.setSelect();
  }

  public setZoom(num: number, center?: boolean) {
    this.action.setZoom(num, center);
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
    if (this.getZoom() < 3) {
      this.edgeLabelToggle(false);
    }
  }

  public setClick(color?: number) {
    this.action.setClick(color);
  }

  public setTooltipDisplay(isDisplay: boolean) {
    this.tooltip.setTooltipDisplay(isDisplay);
  }

  public setBundleFlag(flag: boolean) {
    _.each(this.getElements(), (element) => {
      if (element instanceof EdgeBundle && !element.isExpanded) {
        element.setBundleFlag(flag);
      }
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

  public bundleLabelToggle() {
    this.action.bundleLabelToggle();
  }

  public setBundelExpanded(flag: boolean) {
    _.each(this.getElements(), (element) => {
      if (element instanceof EdgeBundle && element.isExpanded !== flag) {
        element.setExpaned(flag);
      }
    });
  }

  public nodeLabelToggle(labelToggle: boolean) {
    this.action.nodeLabelToggle(labelToggle);
  }

  public searchNode(node: Node) {
    this.action.searchNode(node);
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
