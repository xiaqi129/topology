/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import { CommonElement } from './common-element';
import { Group } from './group';
import { Node } from './node';

export class Edge extends CommonElement {
  private startNode: Node | Group | null = null;
  private endNode: Node | Group | null = null;
  private arrowType: number = 0;

  constructor(startNode: Node | Group, endNode: Node | Group) {
    super();
    this.startNode = startNode;
    this.endNode = endNode;
  }

  public setStartNode(node: Node | Group) {
    this.startNode = node;
  }

  public setEndNode(node: Node | Group) {
    this.endNode = node;
  }

  /**
   * set arrow type
   * @type
   * :0 from --- to
   * :1 from --> to
   * :2 from <-- to
   * :3 from <-> to
   */
  public setArrowStyle(type: number) {
    this.arrowType = type;
  }

}
