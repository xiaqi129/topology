/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { Edge } from './edge';
import { Group } from './group';
import { Node } from './node';

export interface ITopo {

  getElements(): PIXI.Container[];

  addElements(node: PIXI.Container): void;

  createNode(): Node;

  createGroup(): Group;

  createEdge(startNode: Node | Group, endNode: Node | Group): Edge;

  clear(): void;

}

export class Topo implements ITopo {

  private elements: PIXI.Container[] = [];

  public addElements(element: Node | Group) {
    this.elements.push(element);
  }

  public getElements() {
    return this.elements;
  }

  public createNode(): Node {
    return new Node();
  }

  public createGroup(): Group {
    return new Group();
  }

  public createEdge(startNode: Node | Group, endNode: Node | Group): Edge {
    return new Edge(startNode, endNode);
  }

  public clear() {
    _.each(this.elements, (element: PIXI.Container) => {
      element.destroy();
    });
    _.remove(this.elements, (el: PIXI.Container) => {
      return !el;
    });
  }

}
