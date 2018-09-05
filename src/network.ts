/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as PIXI from 'pixi.js';
import { Drawer } from './drawer';
import { Topo } from './topo';

class Network {
  private loader = PIXI.loader;
  private topo: Topo | null = null;
  private drawer: Drawer | null = null;

  constructor() {
    this.topo = new Topo(this.loader);
    this.drawer = new Drawer(this.topo);
  }

  public addImagesCache(key: string, image: string) {
    this.loader.add(key, image);
  }

  public createNode() {
    // TODO
  }

  public createGroup() {
    // TODO
  }

  public createEdge() {
    // TODO
  }

  public clear() {
    // TODO
  }

  public removeElements() {
    // TODO
  }

  private syncView() {
    // TODO
  }

}
