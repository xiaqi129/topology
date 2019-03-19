/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { ArrowLine, IPoint } from './arrow-line';
import { CommonElement } from './common-element';
import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { Group } from './group';
import { Label } from './label';
import { Node } from './node';

export interface ITopo {

  getElements(): PIXI.Container[];

  addElement(node: Node | Group | Edge): void;

  addElements(node: Node[] | Group[] | Edge[]): void;

  createNode(load: PIXI.loaders.Loader, texture: string): Node;

  createArrowLine(start: Node, end: IPoint): ArrowLine;

  createGroup(): Group;

  createEdge(startNode: Node | Group, endNode: Node | Group): Edge;

  createLabel(text?: string, style?: PIXI.TextStyleOptions, canvas?: HTMLCanvasElement): Label;

  clear(): void;

  getEdgesGroup(): { [key: string]: Edge[] };

  setSelectedNodes(element: CommonElement): void;

  getSelectedNodes(): any[];

  removeSelectedNodes(): void;

  setSelectedEdge(element: CommonElement): void;

  getSelectedEdge(): Edge | undefined;

  removeSelectedEdge(): void;

  removeEdgeBundleByName(name: string): void;

  removeElement(element: CommonElement): void;

  clearObject(obj: { [key: string]: any }): void;

}

export class Topo implements ITopo {

  public loader: PIXI.loaders.Loader | null = null;

  private selectedNodes: Node[] = [];

  private selectedEdge: Edge | undefined;

  private elements: any[] = [];

  private edgesGroupByNodes: { [key: string]: Edge[] } = {};

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

  public removeElement(element: CommonElement) {
    const elements = this.getElements();
    _.remove(elements, (elem: CommonElement) => {
      return element === elem;
    });
    if (element instanceof Node) {
      element.removeChildren(0, element.children.length);
      element.labelContent = '';
    } else if (element instanceof Edge) {
      this.clearObject(this.getEdgesGroup());
      if (element.parent instanceof EdgeBundle) {
        _.remove(element.parent.bundleEdge, (edge) => {
          return edge === element;
        });
        if (element.parent.bundleEdge.length < 2) {
          if (element.parent.bundleEdge[0]) {
            element.parent.bundleEdge[0].setStyle({
              lineType: 0,
            });
          }
        }
      }
      element.removeChildren(0, element.children.length);
    } else if (element instanceof Group) {
      element.destroy();
    }
  }

  // find brother edge not in edge bundle
  public findBrotherEdge(edge: Edge) {
    const edgesFound: Edge[] = _.get(this.edgesGroupByNodes, edge.edgeNodesSortUIDStr(), []);
    _.remove(edgesFound, (edgeFound: Edge) => {
      return edgeFound === edge;
    });
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

  public removeEdgeBundleByName(name: string) {
    const elements = this.getElements();
    return _.find(elements, (element) => {
      if (element instanceof EdgeBundle) {
        if (name === element.name) {
          this.getElements().splice(elements.indexOf(element), 1);
          return true;
        }
      }
      return false;
    });
  }

  public addElements(elements: CommonElement[]) {
    _.each(elements, (element, i) => {
      if (element instanceof Edge) {
        let edgeBundle: EdgeBundle;
        const edges = this.findBrotherEdge(element);
        element.brotherEdges = edges;
        if (edges.length > 0) {
          edgeBundle = new EdgeBundle(element);
          edgeBundle.addEdges(edges);
          _.remove(this.elements, (elem: CommonElement) => {
            return _.indexOf(edges, elem) > -1;
          });
          this.elements.push(edgeBundle);
        } else {
          edgeBundle = this.findEdgeBundleByID(element.edgeNodesSortUIDStr());
          if (edgeBundle) {
            edgeBundle.addEdge(element);
          }
        }
        if (!edgeBundle) {
          this.elements.push(element);
        }
      } else {
        this.elements.push(element);
      }
      this.refreshEdgesMaps();
    });
  }

  public getSortNodesUID(edge: Edge) {
    const nodes = [edge.getSrcNode(), edge.getTargetNode()];
    return [nodes[0].getUID(), nodes[1].getUID()].sort().join();
  }

  public clearObject(obj: { [key: string]: any }) {
    const keys = _.keys(obj);
    _.each(keys, (key: string) => {
      delete obj[key];
    });
  }

  public refreshEdgesMaps() {
    this.clearObject(this.edgesGroupByNodes);
    let edges: Edge[] = [];
    _.each(this.elements, (element) => {
      if (element instanceof Edge) {
        edges.push(element);
      }
      if (element instanceof EdgeBundle) {
        const childEges = element.children as Edge[];
        edges = edges.concat(childEges);
      }
    });
    const edgesGroups = _.groupBy(_.uniq(edges), (edge) => {
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

  public createNode(icon?: any): Node {
    return new Node(this.elements, this.selectedNodes, icon);
  }

  public createGroup(emptyObj?: any): Group {
    return new Group(this.elements, emptyObj);
  }

  public createEdge(startNode: Node | Group, endNode: Node | Group): Edge {
    return new Edge(startNode, endNode);
  }

  public createArrowLine(start: IPoint, end: IPoint) {
    return new ArrowLine(start, end);
  }

  public createLabel(text?: string, style?: PIXI.TextStyleOptions, canvas?: HTMLCanvasElement) {
    return new Label(text, style, canvas);
  }

  public clear() {
    _.each(this.elements, (element: PIXI.Container) => {
      element.destroy();
    });
    _.remove(this.elements, (el: PIXI.Container) => {
      return !el;
    });
  }

  public setSelectedNodes(element: Node) {
    const clickColor = element.defaultStyle.clickColor;
    const isinclude = _.includes(this.selectedNodes, element);
    if (!isinclude) {
      this.selectedNodes.push(element);
      element.selectOn(clickColor);
    }
  }

  public getSelectedNodes() {
    return this.selectedNodes;
  }

  public removeSelectedNodes() {
    return _.remove(this.selectedNodes);
  }

  public setSelectedEdge(element: Edge) {
    this.selectedEdge = element;
  }

  public getSelectedEdge() {
    return this.selectedEdge;
  }

  public removeSelectedEdge() {
    this.selectedEdge = undefined;
  }
}
