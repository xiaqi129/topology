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
import { MultipleColorLine } from './multiple-color-line';
import { Node } from './node';
import { PortChannel } from './port-channel';

export interface ITopo {

  getElements(): CommonElement[];

  addElement(element: CommonElement): void;

  addElements(elements: CommonElement[]): void;

  createNode(domRegex: string, texture: string): Node;

  createDataFlow(start: Node, end: Node): DataFlow;

  createMultipleColor(start: Node, end: Node, domRegex: string): MultipleColorLine;

  createGroup(): Group;

  createEdge(startNode: Node | Group, endNode: Node | Group, domRegex?: string): Edge;

  createLabel(text?: string, style?: PIXI.TextStyleOptions, canvas?: HTMLCanvasElement): Label;

  createPortChannel(lines: Edge[], ratio?: number): PortChannel;

  clear(): void;

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

  getGroups(): any;

}

export class Topo implements ITopo {

  public loader: PIXI.loaders.Loader | null = null;

  public domRegex: string;

  private selectedNodes: Node[] = [];

  private selectedEdge: Edge | undefined;

  private selectedGroup: any[] = [];

  private elements: any[] = [];

  constructor(domRegex: string) {
    this.domRegex = domRegex;
  }

  public addElement(element: CommonElement) {
    this.addElements([element]);
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
        element.readyLinkArray();
        element.defaultColor = element.defaultStyle.lineColor;
        let edgeBundle: EdgeBundle;
        const edges = element.brotherEdges;
        if (edges.length > 0) {
          edgeBundle = this.findEdgeBundleByID(element.edgeNodesSortUIDStr());
          if (edgeBundle) {
            edgeBundle.addEdge(element);
          } else {
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
          }
        } else {
          this.elements.push(element);
        }
      } else {
        if (element && this.elements.indexOf(element) < 0) {
          this.elements.push(element);
        }
      }
    });
  }

  public getSortNodesUID(edge: Edge) {
    const nodes = [edge.startNode, edge.endNode];
    return [nodes[0].getUID(), nodes[1].getUID()].sort().join();
  }

  public getElements() {
    return this.elements;
  }

  public createNode(domRegex: string, icon?: any): Node {
    return new Node(this.elements, domRegex, this.selectedNodes, icon);
  }

  public createGroup(emptyObj?: any): Group {
    return new Group(this.elements, this, emptyObj);
  }

  public createEdge(startNode: Node | Group, endNode: Node | Group, domRegex?: string): Edge {
    return new Edge(startNode, endNode, domRegex);
  }

  public createEdgeGroup() {
    return new EdgeGroup(this.elements, this);
  }

  public createDataFlow(start: Node, end: Node) {
    return new DataFlow(start, end);
  }

  public createMultipleColor(start: Node, end: Node, domRegex: string) {
    return new MultipleColorLine(start, end, domRegex);
  }

  public createLabel(text?: string, style?: PIXI.TextStyleOptions, canvas?: HTMLCanvasElement) {
    return new Label(text, style, canvas);
  }

  public createPortChannel(lines: Edge[], ratio?: number) {
    return new PortChannel(lines, ratio);
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

  public getGroups() {
    const elements: any = this.getElements();
    const groups = _.filter(elements, (element) => {
      return ((element instanceof Group && element.getChildNodes().length > 0) ||
        element instanceof EdgeGroup && element.childrenEdge.length > 0);
    });
    return groups;
  }
}
