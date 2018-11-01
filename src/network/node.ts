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
  public dragging: boolean;
  private parentNode: Group | null = null;
  private data: any;

  constructor() {
    super();
    this.data = null;
    this.dragging = false;
    this.draw();
  }

  public setParentNode(node: Group) {
    this.parentNode = node;
  }

  public getDragging() {
    return this.dragging;
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
    graph
        .on('mousedown', this.onDragStart)
        .on('mouseup', this.onDragEnd)
        .on('mousemove', this.onDragMove);
    this.addChild(graph);
  }

  public onDragStart(event: PIXI.interaction.InteractionEvent) {
    this.dragging = true;
    this.data = event.data;
  }

  public onDragEnd() {
    this.dragging = false;
    this.data = null;
  }

  public onDragMove() {
    if (this.dragging) {
      const newPosition = this.data.getLocalPosition(this.parent);
      this.position.x = newPosition.x;
      this.position.y = newPosition.y;
    }
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
