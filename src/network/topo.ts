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
import { EdgeBundle } from './edge-bundle';
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

  public findBrotherEdge(edge: Edge) {
    const edgesFound: Edge[] = _.get(this.edgesGroupByNodes, edge.edgeNodesSortUIDStr(), []);
    return edgesFound;
  }

  public findEdgeBundleByID(bundleID: string) {
    return _.find(this.elements, (element) => {
      if (element instanceof EdgeBundle) {
        if (bundleID === element.getBundleID()) {
          return true;
        }
      }
      return false;
    });
  }

  // public addElements(elements: CommonElement[]) {
  //   _.each(elements, (element) => {
  //     if (element instanceof Edge) {
  //       if (!this.addBrotherEdge(element)) {
  //         this.elements.push(element);
  //       }
  //       this.refreshEdgesMaps();
  //     } else {
  //       this.elements.push(element);
  //     }
  //   });
  // }

  public addElements(elements: CommonElement[]) {
    _.each(elements, (element, i) => {
      if (element instanceof Edge) {
        let edgeBundle: EdgeBundle;
        const edges = this.findBrotherEdge(element);
        if (edges.length > 0) {
          edgeBundle = new EdgeBundle(element);
          edgeBundle.addEdges(edges);
          const rmEdges = _.remove(this.elements, (elem) => {
            return _.indexOf(edges, elem) > -1;
          });
          this.elements.push(edgeBundle);
        } else {
          edgeBundle = this.findEdgeBundleByID(element.edgeNodesSortUIDStr());
          if (edgeBundle) {
            edgeBundle.addEdge(element);
          }
        }
        if (!(edgeBundle instanceof EdgeBundle)) {
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

  public clearObject(obj: {[key: string]: any}) {
    const keys = _.keys(obj);
    _.each(keys, (key: string) => {
      delete obj[key];
    });
    return obj;
  }

  public refreshEdgesMaps() {
    this.clearObject(this.edgesGroupByNodes);
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
