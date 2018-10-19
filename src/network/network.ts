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
    this.topo.addElements(element);
  }

  public removeElements(element: PIXI.Container) {
    element.destroy();
    const elements = this.topo.getElements();
    _.remove(elements, (elem) => {
      return element === elem;
    });
  }

  public syncView() {
    this.app.clearContainer();
    const elements = this.topo.getElements();
    this.app.addElements(elements);
  }

  // public drawGroupLine(group: any) {
  //   const elements = this.topo.getElements();
  //   _.each(elements, (edge: any) => {
  //     if (edge instanceof Edge) {
  //       _.each(group.getChildrenNodes(), (childrenNodes) => {
  //         if (edge.startNode.position === childrenNodes.position) {
  //           group.setEdgeList(edge);
  //           edge.alpha = 0;
  //           const edgeGroup = this.createEdge(group, edge.endNode);
  //           this.topo.addElements(edgeGroup);
  //           edgeGroup.setStyle(edge.styles);
  //           group.setGroupEdgeList(edgeGroup);
  //         }
  //         if (edge.endNode.position === childrenNodes.position) {
  //           group.setEdgeList(edge);
  //           edge.alpha = 0;
  //           const edgeGroup = this.createEdge(edge.startNode, group);
  //           this.topo.addElements(edgeGroup);
  //           edgeGroup.setStyle(edge.styles);
  //           group.setGroupEdgeList(edgeGroup);
  //         }
  //       });
  //     }
  //   });
  // }
}
