/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import { Application } from './application';
import { ITopo } from './topo';

export class Drawer {

  private topo: ITopo | null = null;
  private whiteBoard: PIXI.Application | null = null;

  constructor(container: string, topo: ITopo) {
    this.topo = topo;
    this.whiteBoard = new Application(container);
  }

  public getWhiteBoard() {
    return this.whiteBoard;
  }

  public getTopo() {
    return this.topo;
  }

  public syncView() {
    // TODO
  }

}