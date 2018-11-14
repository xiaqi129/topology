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
  private edgesGroupByNodes: { [key: string]: Edge[] };
  private elements: Edge | CommonElement[];

  constructor(
    edgesGroupByNodes: { [key: string]: Edge[] },
    elements: Edge | CommonElement[],
    resourceName?: string) {
    super();
    this.edgesGroupByNodes = edgesGroupByNodes;
    this.data = null;
    this.dragging = false;
    this.elements = elements;
    // this.draw();  // 圆点
    this.createSprite(resourceName || 'switch');  // 从loader中加载icon, 默认switch
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
        .on('mouseupoutside', this.onDragEnd.bind(this))
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

  public createSprite(resourceName: string) {
    let nodeSprite: PIXI.Sprite = new PIXI.Sprite();
    const loader = PIXI.loader;
    loader
      .load((load: any, resources: any) => {
        const resource = resources[resourceName];
        if (resource) {
          nodeSprite = new PIXI.Sprite(resource.texture);
        } else {
          nodeSprite = new PIXI.Sprite(resources.switch.texture);
        }

      }).onComplete.add(() => {
        const node = nodeSprite;
        node.width = 40;
        node.height = 40;
        node.anchor.set(0.5, 0.5);
        node.interactive = true;
        node
          .on('mousedown', this.onDragStart.bind(this))
          .on('mouseup', this.onDragEnd.bind(this))
          .on('mouseupoutside', this.onDragEnd.bind(this))
          .on('mousemove', this.onDragMove.bind(this));
        node
          .on('mouseover', this.tooltipOn.bind(this))
          .on('mouseout', this.tooltipOff.bind(this));
        this.addChild(node);
      });
  }

  public getWidth() {
    return this.defaultStyle.width;
  }

  public getHeight() {
    return this.defaultStyle.height;
  }

  public tooltipOn() {
    // TODO 将tooltip抽成公共部分
    const tooltip = PIXI.Sprite.fromImage('../pic/tooltip.png');
    tooltip.y = 20;
    tooltip.name = 'tooltip';
    const text = new PIXI.Text(this.getUID(), {
      fontSize: 12,
      fill: '0xffffff',
      fontWeight: 'bold',
    });
    text.x = 8;
    text.y = 2;
    tooltip.addChild(text);
    this.addChild(tooltip);
  }

  public tooltipOff() {
    this.removeChild(this.getChildByName('tooltip'));
  }
}
