/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as PIXI from 'pixi.js';

export class CommonElement extends PIXI.Container {

  public renderer: any;
  constructor() {
    super();
    this.defaultView();
  }

  public defaultView() {
    const graph = new PIXI.Graphics();
    graph.lineStyle(1, 0xEEEEEE);
    graph.beginFill(0xDDDDDD, 1);
    graph.drawCircle(0, 0, 5);
    graph.endFill();
    this.addChild(graph);
  }

}
