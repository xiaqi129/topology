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
  // public arrow: PIXI.Graphics;
  public srcNodePos: any;
  public endNodePos: any;
  public edges: Edge[];

  constructor(startNode: Node | Group, endNode: Node | Group, edges: Edge[]) {
    super(startNode, endNode);
    this.edges = edges;
  }
}
