/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement, IStyles } from './common-element';
import { Edge } from './edge';
import { Group } from './group';

export class Node extends CommonElement {
  private parentNode: Group | null = null;
  private dragging: boolean;
  private data: any;
  private edgesGroupByNodes: {[key: string]: Edge[]};
  private elements: Edge | CommonElement[];

  constructor(edgesGroupByNodes: {[key: string]: Edge[]}, elements: Edge | CommonElement[]) {
    super();
    this.edgesGroupByNodes = edgesGroupByNodes;
    this.data = null;
    this.dragging = false;
    this.elements = elements;
    this.draw();
  }

  public setParentNode(node: Group) {
    this.parentNode = node;
  }

  public getChildNode() {
    return this.children[0];
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
        .on('mousedown', this.onDragStart.bind(this))
        .on('mouseup', this.onDragEnd.bind(this))
        .on('mousemove', this.onDragMove.bind(this));
    this.addChild(graph);
  }

  public onDragStart(event: PIXI.interaction.InteractionEvent) {
    event.stopPropagation();
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
      _.each(this.elements, (element: any) => {
        const groupEdges = element.groupEdges;
        const isExpanded = element.isExpanded;
        if (element instanceof Node && element.parent instanceof Group) {
          if (element.parent.isExpanded) {
            element.parent.draw();
          }
        }
        if (element instanceof Group && !isExpanded) {
          element.rmElements(groupEdges);
          element.drawEdges();
        }
      });
      _.each(this.edgesGroupByNodes, (edgesGroup, key) => {
        if (_.includes(key, this.getUID())) {
          _.each(edgesGroup, (edge: Edge) => {
            edge.draw();
          });
        }
      });
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
