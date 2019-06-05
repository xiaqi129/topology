/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement } from './common-element';
import { DataFlow } from './data-flow';
import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { EdgeGroup } from './edge-group';
import { Group } from './group';
import { Label } from './label';
import { Node } from './node';

export interface ITopo {

  getElements(): PIXI.Container[];

  addElement(node: Node | Group | Edge): void;

  addElements(node: Node[] | Group[] | Edge[]): void;

  createNode(domRegex: string, texture: string): Node;

  createDataFlow(start: Node, end: Node): DataFlow;

  createGroup(): Group;

  createEdge(startNode: Node | Group, endNode: Node | Group, domRegex?: string): Edge;

  createLabel(text?: string, style?: PIXI.TextStyleOptions, canvas?: HTMLCanvasElement): Label;

  clear(): void;

  getEdgesGroup(): { [key: string]: Edge[] };

  setSelectedNodes(element: CommonElement): void;

  getSelectedNodes(): any[];

  removeSelectedNodes(): void;

  setSelectedEdge(element: CommonElement): void;

  getSelectedEdge(): Edge | undefined;

  removeSelectedEdge(): void;

  setSelectedGroups(group: Group | EdgeGroup): void;

  getSelectedGroups(): Group[] | EdgeGroup[];

  removeSelectedGroups(): void;

  removeEdgeBundleByName(name: string): void;

  clearObject(obj: { [key: string]: any }): void;

}

export class Topo implements ITopo {

  public loader: PIXI.loaders.Loader | null = null;

  private selectedNodes: Node[] = [];

  private selectedEdge: Edge | undefined;

  private selectedGroup: any[] = [];

  private elements: any[] = [];

  private edgesGroupByNodes: { [key: string]: Edge[] } = {};

  public addElement(element: CommonElement) {
    this.addElements([element]);
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
        element.defaultColor = element.defaultStyle.lineColor;
        let edgeBundle: EdgeBundle;
        const edges = this.findBrotherEdge(element);
        element.brotherEdges = edges;
        if (edges.length > 0) {
          edgeBundle = new EdgeBundle(element);
          edgeBundle.defaultStyle = element.defaultStyle;
          edgeBundle.setStyle({
            fillColor: 0X0081cf,
          });
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
    const nodes = [edge.startNode, edge.endNode];
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

  public createNode(domRegex: string, icon?: any): Node {
    return new Node(this.elements, domRegex, this.selectedNodes, icon);
  }

  public createGroup(emptyObj?: any): Group {
    return new Group(this.elements, emptyObj);
  }

  public createEdge(startNode: Node | Group, endNode: Node | Group, domRegex?: string): Edge {
    return new Edge(startNode, endNode, domRegex);
  }

  public createEdgeGroup() {
    return new EdgeGroup(this.elements);
  }

  public createDataFlow(start: Node, end: Node) {
    return new DataFlow(start, end);
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
    const isinclude = _.includes(this.selectedNodes, element);
    if (!isinclude) {
      this.selectedNodes.push(element);
      element.selectOn();
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

  public setSelectedGroups(group: any) {
    const isinclude = _.includes(this.selectedGroup, group);
    if (!isinclude) {
      this.selectedGroup.push(group);
      group.selectOn();
    }
  }

  public getSelectedGroups(): Group[] | EdgeGroup[] {
    return this.selectedGroup;
  }

  public removeSelectedGroups() {
    return this.selectedGroup = [];
    // return _.remove(this.selectedGroup);
  }
}
