/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import { CommonElement } from './common-element';

export class Group extends CommonElement {
  private childrenNodes: any[] = [];
  private isExpanded: boolean = false;
  constructor() {
    super();
  }

  public setExpaned(expanded: boolean) {
    this.isExpanded = expanded;
  }

}
