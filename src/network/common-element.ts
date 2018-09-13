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
    graph.lineStyle(2, 0xFF00FF);
    graph.beginFill(0xfff012, 1);
    graph.drawCircle(0, 0, 10);
    graph.endFill();
    this.addChild(graph);
  }

}
