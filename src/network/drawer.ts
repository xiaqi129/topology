/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { Application } from './application';
import { Edge } from './edge';
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
    // this.sortElements(elements);
    elements.sort((a, b) => {
      if (a instanceof Node) {
        if (b instanceof Group) {
          return 1;
        }
        if (b instanceof Edge) {
          return 1;
        }
      }

      if (a instanceof Group) {
        if (b instanceof Node) {
          return -1;
        }
        if (b instanceof Edge) {
          return -1;
        }
      }

      if (a instanceof Edge) {
        if (b instanceof Node) {
          return -1;
        }
        if (b instanceof Group) {
          return 1;
        }
      }
      return 0;
    });
    this.whiteBoard.addElements(elements);
  }

}
