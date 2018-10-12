/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import { CommonElement } from './common-element';
import { Group } from './group';

export class Node extends CommonElement {
  private parentNode: Group | null = null;
  constructor() {
    super();
    this.defaultView();
  }

  public setParentNode(node: Group) {
    this.parentNode = node;
  }

  public getParentNode() {
    return this.parentNode;
  }

  public defaultView() {
    const graph = new PIXI.Graphics();
    graph.lineStyle(1, 0xEEEEEE);
    graph.beginFill(0xDDDDDD, 1);
    graph.drawCircle(0, 0, 5);
    graph.endFill();
    graph.interactive = true;
    graph.buttonMode = true;
    graph.on("click",(event: any) =>{
      console.log(this);
    });
    this.addChild(graph);
  }

  public createSprite() {
    const texture = PIXI.Texture.fromImage('/pic/point.png');
    const node = new PIXI.Sprite(texture);
    node.width = 25;
    node.height = 25;
    node.interactive = true;
    node.on("click",(event: any) => {
      alert("aaaaa");
    });
    this.addChild(node);
}

}
