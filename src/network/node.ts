/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement, IStyles } from './common-element';
import { Group } from './group';

export class Node extends CommonElement {
  private parentNode: Group | null = null;

  constructor() {
    super();
    this.draw();
  }

  public setParentNode(node: Group) {
    this.parentNode = node;
  }

  public getParentNode() {
    return this.parentNode;
  }

  public draw() {
    this.clearDisplayObjects();
    const style = this.defaultStyle;
    const graph = new PIXI.Graphics();
    graph.lineStyle(style.lineWidth, style.lineColor);
    graph.beginFill(style.fillColor, style.fillOpacity);
    graph.drawCircle(0, 0, 5);
    graph.endFill();
    graph.interactive = true;
    graph.buttonMode = true;
    graph.on('click', (event: any) => {
      // console.log(this);
    });
    this.addChild(graph);
  }

  public createSprite() {
    const texture = PIXI.Texture.fromImage('/pic/point.png');
    const node = new PIXI.Sprite(texture);
    node.width = this.defaultStyle.width;
    node.height = this.defaultStyle.height;
    node.interactive = true;
    this.addChild(node);
  }

  public getWidth() {
    return this.defaultStyle.width;
  }

  public getHeight() {
    return this.defaultStyle.height;
  }

}
