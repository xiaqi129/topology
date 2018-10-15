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
  private whiteBoard: Application;

  constructor(container: string, topo: ITopo) {
    this.topo = topo;
    this.whiteBoard = new Application(container);
  }

  public getWhiteBoard(): Application {
    return this.whiteBoard;
  }

  public getTopo() {
    return this.topo;
  }

  public syncView() {
    // TODO
  }

}
