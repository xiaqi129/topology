/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement } from './common-element';
import { Edge } from './edge';

const Point = PIXI.Point;

export class EdgeBundle extends CommonElement {
  private bundleID: string = '';

  constructor(edge: Edge) {
    super();
    this.bundleID = edge.edgeNodesSortUIDStr();
    this.addChild(edge);
  }

  public draw() {
    // this.setBundleEdgesPosition();
  }

  public addEdge(edge: Edge) {
    this.addEdges([edge]);
  }

  public addEdges(edges: Edge[]) {
    this.addChildren(edges);
    this.setBundleEdgesPosition();
  }

  public setBundleEdgesPosition() {
    const edges = this.children;
    const distance = 5;
    const degree = 20;
    const step = 8;
    const values: number[][] = [];
    for (let i = 0, len = edges.length; i < len;) {
      _.each([1, -1], (j) => {
        values.push([(distance + i * step) * j, (degree + i * step) * j]);
      });
      i += 1;
    }
    _.each(this.children, (edge, i) => {
      if (edge instanceof Edge) {
        edge.setStyle({
          bezierLineDistance: values[i][0],
          bezierLineDegree: values[i][1],
        });
      }
    });
  }

  public getBundleID() {
    return this.bundleID;
  }
}
