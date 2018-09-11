/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import * as PIXI from 'pixi.js';
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

  public loader: PIXI.loaders.Loader | null = null;

  private elements: PIXI.Container[] = [];

  constructor(loader: PIXI.loaders.Loader) {
    this.loader = loader;
  }

  public addElements(element: Node | Group | Edge) {
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
