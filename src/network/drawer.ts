/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { Application } from './application';
import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
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

  public sortElements(elements: PIXI.DisplayObject[]) {
    _.sortBy(elements, (element) => {
      if (element instanceof Node) {
        return 1;
      }
      if (element instanceof Group) {
        return 0;
      }
      if (element instanceof Edge) {
        return 2;
      }
    });
  }

  public syncView() {
    this.whiteBoard.clearContainer();
    const elements = this.topo.getElements();
    const objOrder = [Group, Edge, EdgeBundle, Node];
    elements.sort((a: any, b: any) => {
      return _.indexOf(objOrder, a.constructor) - _.indexOf(objOrder, b.constructor);
    });
    this.whiteBoard.addElements(elements);
  }

}
