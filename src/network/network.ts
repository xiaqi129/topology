/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import * as PIXI from 'pixi.js';
import { Application } from './application';
import { Drawer } from './drawer';
import { Edge } from './edge';
import { Group } from './group';
import { Node } from './node';

import { Topo } from './topo';

export class Network {
  private loader = PIXI.loader;
  private topo: Topo;
  private drawer: Drawer;
  private app: Application;

  constructor(domRegex: string) {
    this.topo = new Topo(this.loader);
    this.drawer = new Drawer(domRegex, this.topo);
    this.app = this.drawer.getWhiteBoard();
  }

  public addResourceCache(key: string, image: string) {
    this.loader.add(key, image);
    return this.loader;
  }

  public createNode() {
    return this.topo.createNode();
  }

  public createGroup() {
    return this.topo.createGroup();
  }

  public createEdge(startNode: Node | Group, endNode: Node | Group) {
    return this.topo.createEdge(startNode, endNode);
  }

  public createLabel(text?: string, style?: PIXI.TextStyleOptions, canvas?: HTMLCanvasElement) {
    return this.topo.createLabel(text, style, canvas);
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

  public addElement(element: Node | Group | Edge) {
    this.topo.addElement(element);
  }

  public addElements(elements: Node[] | Group[] | Edge []) {
    this.topo.addElements(elements);
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

  public setZoom(num: number, event?: any) {
    const appContainer = this.app.getContainer();
    const scale = appContainer.scale;
    if (event) {
      const zoom = (event.deltaY < 0 ? 1 : -1) * num;
      if (scale.x + zoom > 0.3 && scale.x + zoom < 3) {
        const scaleChange = scale.x + zoom - 1;
        const offsetX = -(event.clientX * scaleChange);
        const offsetY = -(event.clientY * scaleChange);
        appContainer.setTransform(offsetX, offsetY, scale.x + zoom, scale.y + zoom, 0, 0, 0, 0, 0);
      }
    } else {
      if (scale.x + num > 0.3 && scale.x + num < 3) {
        appContainer.setTransform(0, 0, scale.x + num, scale.y + num, 0, 0, 0, 0, 0);
      }
    }
  }

  public syncView() {
    this.drawer.syncView();
  }

}
