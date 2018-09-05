/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import { ITopo } from './topo';

export class Drawer {

  private topo: ITopo | null = null;

  constructor(topo: ITopo) {
    this.topo = topo;
  }

  public syncView() {
    
  }

}