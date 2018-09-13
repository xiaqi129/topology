/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as PIXI from 'pixi.js';

export class CommonElement extends PIXI.Container {
  constructor() {
    super();
    this.defaultView();
  }

  public defaultView() {
    const graph = new PIXI.Graphics();
    graph.x = 0;
    graph.y = 0;
    graph.beginFill(0xfff012, 1);
    graph.drawCircle(0, 0, 30);
    this.addChild(graph);
  }

}
