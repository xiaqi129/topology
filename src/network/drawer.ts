/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { Application } from './application';
import { DataFlow } from './data-flow';
import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { EdgeGroup } from './edge-group';
import { Group } from './group';
import { Node } from './node';
import { ITopo } from './topo';

export class Drawer {

  private topo: ITopo;
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
    this.whiteBoard.clearContainer();
    const elements = this.topo.getElements();
    const objOrder = [Group, EdgeGroup, Edge, EdgeBundle, DataFlow, Node];
    elements.sort((a: any, b: any) => {
      return _.indexOf(objOrder, a.constructor) - _.indexOf(objOrder, b.constructor);
    });
    this.whiteBoard.addElements(elements);
  }

}
