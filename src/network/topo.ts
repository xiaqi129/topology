/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import * as PIXI from 'pixi.js';
import { CommonElement } from './common-element';
import { Edge } from './edge';
import { Group } from './group';
import { Node } from './node';

export interface ITopo {

  getElements(): PIXI.Container[];

  addElement(node: Node | Group | Edge): void;

  addElements(node: Node[] | Group[] | Edge[]): void;

  createNode(): Node;

  createGroup(): Group;

  createEdge(startNode: Node | Group, endNode: Node | Group): Edge;

  clear(): void;

}

export class Topo implements ITopo {

  public loader: PIXI.loaders.Loader | null = null;

  private elements: any [] = [];

  private edgesGroupByNodes: {[key: string]: Edge[]} = {};

  constructor(loader: PIXI.loaders.Loader) {
    this.loader = loader;
  }

  public addElement(element: Node | Group | Edge) {
    this.addElements([element]);
  }

  public addBrotherEdge(edge: Edge) {
    const edgesFound: Edge[] = _.get(this.edgesGroupByNodes, edge.edgeNodesSortUIDStr());
    if (edgesFound) {
      const edgeFound: Edge | undefined = edgesFound.shift();
      if (edgeFound) {
        edgeFound.addEdgesToBundle(edge);
      }
      return true;
    }
    return false;
  }

  public addElements(elements: CommonElement[]) {
    _.each(elements, (element) => {
      if (element instanceof Edge) {
        if (!this.addBrotherEdge(element)) {
          this.elements.push(element);
        }
        this.refreshEdgesMaps();
      } else {
        this.elements.push(element);
      }
    });
  }

  public getSortNodesUID (edge: Edge) {
    const nodes = [edge.getSrcNode(), edge.getTargetNode()];
    return _.join([nodes[0].getUID(), nodes[1].getUID()].sort());
  }

  public refreshEdgesMaps() {
    const edges: Edge[] = _.filter(this.elements, element => element instanceof Edge);
    const edgesGroups = _.groupBy(edges, (edge) => {
      return this.getSortNodesUID(edge);
    });
    _.each(edgesGroups, (edgesList: Edge[]) => {
      const uid: string = this.getSortNodesUID(edgesList[0]);
      _.extend(this.edgesGroupByNodes, {
        [uid]: edgesList,
      });
    });
  }

  public getEdgesGroup() {
    return this.edgesGroupByNodes;
  }

  public getElements() {
    return this.elements;
  }

  public createNode(): Node {
    return new Node();
  }

  public createGroup(): Group {
    return new Group(this.elements);
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