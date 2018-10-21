/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { Edge } from './edge';
import { Group } from './group';
import { Node } from './node';

export class GroupEdge extends Edge {
  public startNode: any;
  public endNode: any;
  public arrow: PIXI.Graphics;
  public srcNodePos: any;
  public endNodePos: any;
  public edges: Edge[];

  constructor(startNode: Node | Group, endNode: Node | Group, edges: Edge[]) {
    super(startNode, endNode);
    this.edges = edges;
    this.arrow = new PIXI.Graphics();
  }

  public getLineNodePosition(node: Node | Group) {
    let x: number = 0;
    let y: number = 0;
    if (node instanceof Node) {
      x = node.x;
      y = node.y;
    }

    if (node instanceof Group) {
      const position = node.getGroupPosition();
      if (position) {
        x = position[0];
        y = position[1];
      } else {
        x = 0;
        y = 0;
      }
    }

    return { x, y };
  }

  public draw() {
    const style = this.defaultStyle;
    this.edge.clear();
    this.arrow.clear();
    this.srcNodePos = this.getLineNodePosition(this.startNode);
    this.endNodePos = this.getLineNodePosition(this.endNode);
    const angle = this.getAngle(this.srcNodePos, this.endNodePos);
    this.srcNodePos = this.getAdjustedLocation(
      this.srcNodePos, -1, angle, this.startNode.width * 0.5 + style.lineDistance);
    this.endNodePos = this.getAdjustedLocation(
      this.endNodePos, 1, angle, this.endNode.width * 0.5 + style.lineDistance);
    this.edge.lineStyle(style.lineWidth, style.lineColor, 1);
    switch (style.arrowType) {
      case 0:
        this.edge.moveTo(this.srcNodePos.x, this.srcNodePos.y);
        this.edge.lineTo(this.endNodePos.x, this.endNodePos.y);
        this.addChild(this.edge);
        break;
      case 1:
        this.arrow.lineStyle(style.arrowWidth, style.arrowColor, 1);
        const arrowPoints = this.getArrowPints(this.endNodePos, angle, 1);
        if (style.fillArrow) {
          this.arrow.beginFill(style.arrowColor);
        }
        this.arrow.drawPolygon(_.flatMap(_.map(
          _.values(arrowPoints), o => ([o.x, o.y]))));
        this.edge.moveTo(this.srcNodePos.x, this.srcNodePos.y);
        this.edge.lineTo(arrowPoints.p3.x, arrowPoints.p3.y);
        this.arrow.endFill();
        this.addChild(this.edge);
        this.addChild(this.arrow);
        break;
      case 2:
        this.arrow.lineStyle(style.arrowWidth, style.arrowColor, 1);
        const arrowPoints1 = this.getArrowPints(this.srcNodePos, angle, -1);
        if (style.fillArrow) {
          this.arrow.beginFill(style.arrowColor);
        }
        this.arrow.drawPolygon(_.flatMap(_.map(
          _.values(arrowPoints1), o => ([o.x, o.y]))));
        this.edge.moveTo(this.endNodePos.x, this.endNodePos.y);
        this.edge.lineTo(arrowPoints1.p3.x, arrowPoints1.p3.y);
        this.arrow.endFill();
        this.addChild(this.edge);
        this.addChild(this.arrow);
        break;
      case 3:
        this.arrow.lineStyle(style.arrowWidth, style.arrowColor, 1);
        const arrowPoints2 = this.getArrowPints(this.endNodePos, angle, 1);
        if (style.fillArrow) {
          this.arrow.beginFill(style.arrowColor);
        }
        this.arrow.drawPolygon(_.flatMap(_.map(
          _.values(arrowPoints2), o => ([o.x, o.y]))));
        const arrowPoints3 = this.getArrowPints(this.srcNodePos, angle, -1);
        this.arrow.drawPolygon(_.flatMap(_.map(
          _.values(arrowPoints3), o => ([o.x, o.y]))));
        this.edge.moveTo(arrowPoints2.p3.x, arrowPoints2.p3.y);
        this.edge.lineTo(arrowPoints3.p3.x, arrowPoints3.p3.y);
        this.arrow.endFill();
        this.addChild(this.edge);
        this.addChild(this.arrow);
        break;
      default:
        break;
    }
  }

}
