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
// import { CommonElement } from './common-element';

export class GroupEdge extends Edge {
  public startNode: any;
  public endNode: any;
  public arrow: PIXI.Graphics;
  public srcNodePos: any;
  public endNodePos: any;
  public edges: Edge[];

  constructor(startNode: Node | Group, endNode: Node | Group, edges: Edge[]) {
    super(startNode, endNode);
    this.edges = edges;
    this.arrow = new PIXI.Graphics();
  }

  public getLineNodePosition(node: Node | Group) {
    let x: number = 0;
    let y: number = 0;
    if (node instanceof Node) {
      x = node.x;
      y = node.y;
    }

    if (node instanceof Group) {
      const position = node.getGroupPosition();
      if (position) {
        x = position[0];
        y = position[1];
      } else {
        x = 0;
        y = 0;
      }
    }
    return { x, y };
  }

  public getNodeSize(node: Node | Group) {
    let width = 0;
    let height = 0;
    if (node instanceof Node) {
      width = node.width;
      height = node.height;
    }

    if (node instanceof Group) {
      width = node.getWidth();
      height = node.getHeight();
    }

    return { width, height };
  }

}
