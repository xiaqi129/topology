/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement } from './common-element';
import { Edge } from './edge';
import { Label } from './label';
import { Node } from './node';

const Point = PIXI.Point;

export class EdgeBundle extends CommonElement {
  public isExpanded: boolean = true;
  public bundleEdge: any[] = [];
  private bundleID: string = '';
  private lastClickTime: number = 0;
  private bundleLabelFlag: boolean = true;
  private bundleData: any = {};
  private startNode: Node;
  private endNode: Node;
  private style: any;
  private labelContent: any;

  constructor(edge: Edge) {
    super();
    this.bundleID = edge.edgeNodesSortUIDStr();
    this.startNode = edge.startNode;
    this.endNode = edge.endNode;
    this.style = edge.defaultStyle;
    this.addChild(edge);
    this.bundleEdge = this.children;
    this.setBundle(edge);
  }

  public draw() {
    const bundleId = this.getBundleID();
    if (!this.isExpanded) {
      // collapse
      if (this.children.length > 1) {
        this.bundleData[bundleId] = [];
        _.each(this.children, (child) => {
          this.bundleData[bundleId].push(child);
        });
      }
      this.removeChildren(0, this.children.length);
      const afterBundle = new Edge(this.startNode, this.endNode);
      afterBundle.setStyle(this.style);
      if (this.bundleLabelFlag && this.bundleData[bundleId]) {
        const graph = new PIXI.Graphics();
        graph.name = 'label_background';
        graph.beginFill(0X0081cf, 1);
        graph.drawCircle(0, 0, 7);
        graph.endFill();
        afterBundle.addChild(graph);
        const label = new Label(`${this.bundleData[bundleId].length}`, {
          fill: 0Xffffff,
          fontFamily: 'Times New Roman',
          fontWeight: 'bold',
        });
        label.name = 'bundle_label';
        label.setPosition(4);
        afterBundle.addChild(label);
        afterBundle.setChildIndex(label, afterBundle.children.length - 1);
        afterBundle.setChildIndex(graph, afterBundle.children.length - 2);
      } else {
        this.removeChild(this.getChildByName('bundle_label'));
      }
      this.setBundle(afterBundle);
      // add to elements
      afterBundle.setStyle({
        lineType: 0,
      });
      this.addChild(afterBundle);
    } else {
      // expand
      this.removeChildren(0, this.children.length);
      const edges = this.bundleData[bundleId];
      _.each(edges, (bundleEdge) => {
        this.addChild(bundleEdge);
        bundleEdge.draw();
      });
    }
    this.clearTooltip();
  }

  public addEdge(edge: Edge) {
    this.addEdges([edge]);
  }

  public setExpaned(expanded: boolean) {
    this.isExpanded = expanded;
    this.draw();
  }

  public addEdges(edges: Edge[]) {
    this.addChildren(edges);
    this.bundleEdge = this.children;
    this.setBundleEdgesPosition();
    _.each(edges, (edge) => {
      this.setBundle(edge);
    });
  }

  public setBundleEdgesPosition() {
    const edges = this.children;
    const distance = 2;
    const degree = 15;
    const distanceStep = 1;
    const degreeStep = 8;
    const values: number[][] = [];
    const isSameDirection = _.every(edges, (edg: Edge) => {
      return edg.startNode === this.startNode;
    });
    _.each(edges, (edge: any, i: number) => {
      if (isSameDirection) {
        _.each([1, -1], (j) => {
          values.push([(distance + i * distanceStep) * j, (degree + i * degreeStep) * j]);
        });
      } else {
        values.push([(distance + i * distanceStep), (degree + i * degreeStep)]);
      }
    });
    _.each(this.children, (edge, i) => {
      if (edge instanceof Edge) {
        // const srcLabel = edge.getChildByName('edge_srclabel');
        // const endLabel = edge.getChildByName('edge_endlabel');
        // edge.removeChild(srcLabel);
        // edge.removeChild(endLabel);
        edge.setStyle({
          bezierLineDistance: values[i][0],
          bezierLineDegree: values[i][1],
          lineType: 1,
          arrowType: 3,
        });
      }
    });
  }

  public getBundleID() {
    return this.bundleID;
  }

  public setBundle(edge: any) {
    edge.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
      // event.stopPropagation();
      const currentTime = new Date().getTime();
      // double click
      if (currentTime - this.lastClickTime < 500) {
        this.isExpanded = !this.isExpanded;
        this.draw();
      } else {
        this.lastClickTime = currentTime;
      }
    });
  }

  public setBundleFlag(flag: boolean) {
    this.bundleLabelFlag = flag;
    this.draw();
  }

  public clearTooltip() {
    const network = document.getElementsByTagName('body')[0];
    const tooltip = document.getElementById('tooltip');
    if (network && tooltip) {
      network.removeChild(tooltip);
    }
  }
}
