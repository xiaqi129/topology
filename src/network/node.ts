/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import { CommonElement } from './common-element';
import { Group } from './group';

export class Node extends CommonElement {
  private parentNode: Group | null = null;
  constructor() {
    super();
  }

  public setParentNode(node: Group) {
    this.parentNode = node;
  }

  public getParentNode() {
    return this.parentNode;
  }

}
