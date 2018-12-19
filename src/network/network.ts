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

import { Topo } from './topo';

export class Network {
  public icons: any = {};
  public menu: PopMenu;
  public callback: any;
  private loader = PIXI.loader;
  private topo: Topo;
  private drawer: Drawer;
  private app: Application;
  private action: CommonAction;
  private tooltip: Tooltip;

  constructor(domRegex: string) {
    PIXI.utils.skipHello();
    this.topo = new Topo(this.loader);
    this.drawer = new Drawer(domRegex, this.topo);
    this.app = this.drawer.getWhiteBoard();
    this.tooltip = new Tooltip();
    this.action = new CommonAction(this.app, this.topo, this.tooltip);
    this.menu = new PopMenu(domRegex, this.app);
  }

  public addIconResource(iconList: any) {
    PIXI.loader.reset();
    PIXI.utils.clearTextureCache();
    _.each(iconList, (icon) => {
      PIXI.loader.add(icon.name, icon.url);
    });
    PIXI.loader
      .load((loader: any, resources: any) => {
        _.each(resources, (resource) => {
          this.icons[resource.name] = {
            texture: resource.texture,
            width: iconList[resource.name].width,
            height: iconList[resource.name].height,
          };
        });
        this.callback();
        this.callback = Function();
      });
  }

  public createNode(iconName?: string) {
    if (iconName) {
      return this.topo.createNode(this.icons[iconName]);
    }
    return this.topo.createNode();
  }

  public createGroup() {
    return this.topo.createGroup();
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
    this.topo.getSelectedNodes();
  }

  public removeElements(element: PIXI.Container) {
    const elements = this.topo.getElements();
    _.remove(elements, elem => element === elem);
    if (element instanceof Edge) {
      const edgesGroupByNodesUID = this.topo.getEdgesGroup();
      const uidStr = element.edgeNodesSortUIDStr();
      const edge = _.get(edgesGroupByNodesUID, uidStr);
      edge[0].removeBrotherEdge(element);
    }
    element.destroy();
  }

  public setDrag() {
    this.action.dragContainer();
  }

  public setSelect() {
    this.action.setSelect();
  }

  public setZoom(num: number) {
    this.action.setZoom(num);
  }

  public zoomOver() {
    this.action.zoomOver();
  }

  public getZoom() {
    this.action.getZoom();
  }

  public zoomReset() {
    this.action.zoomReset();
  }

  public syncView() {
    this.drawer.syncView();
  }

  public setClick(color?: any) {
    this.action.setClick(color);
  }

  public setTooltipDisplay(isDisplay: any) {
    this.tooltip.setTooltipDisplay(isDisplay);
  }

  public setBundle(edge: any) {
    this.action.setBundle(edge);
  }

  public bundleLabelToggle() {
    this.action.bundleLabelToggle();
  }

  public nodeLabelToggle() {
    this.action.nodeLabelToggle();
  }

  public searchNode(node: Node) {
    this.action.searchNode(node);
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
  }
}
