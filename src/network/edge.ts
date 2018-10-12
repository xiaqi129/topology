/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement } from './common-element';
import { Group } from './group';
import { Node } from './node';

const  Point = PIXI.Point;

export class Edge extends CommonElement {
  public startNode: any;
  public endNode: any;
  public styles: {[x: string]: any};
  private edge: PIXI.Graphics;
  private arrow: PIXI.Graphics;
  private arrowType: number;
  private lineColor: number;
  private lineWidth: number;
  private lineDistance: number;
  private arrowColor: number;
  private arrowWidth: number;
  private arrowLength: number;
  private fillArrow: boolean;
  private srcNodePos: any;
  private endNodePos:any;

  constructor(startNode: Node | Group, endNode: Node | Group) {
    super();
    this.edge = new PIXI.Graphics();
    this.arrow = new PIXI.Graphics();
    this.startNode = startNode;
    this.endNode = endNode;
    this.arrowType = 0;
    this.styles = {};
    this.lineColor = 0X000000;
    this.lineWidth =  1.4;
    this.arrowColor = 0X000000;
    this.arrowWidth =  1;
    this.lineDistance = 0;
    this.arrowLength = 15;
    this.fillArrow = false;
    this.drawLine();
  }

  public setStyle(styles: object) {
    _.extend(this.styles, styles);
    this.lineColor = this.styles.lineColor || 0X000000;
    this.lineWidth = this.styles.lineWidth || 1.4;
    this.lineDistance = this.styles.lineDistance || 0;
    this.arrowColor = this.styles.arrowColor || 0X000000;
    this.arrowWidth = this.styles.arrowWidth || 1.4;
    this.arrowType = this.styles.arrowType || 0;
    this.arrowLength = this.styles.arrowLength || 15;
    this.fillArrow = this.styles.fillArrow;
    this.drawLine();
  }

  public setNodes(startNode: Node | Group, endNode: Node | Group) {
    this.startNode = startNode;
    this.endNode = endNode;
  }

  public setStartNode(node: Node | Group) {
    this.startNode = node;
  }

  public setEndNode(node: Node | Group) {
    this.endNode = node;
  }

  /**
   * set arrow type
   * @type
   * :0 from --- to
   * :1 from --> to
   * :2 from <-- to
   * :3 from <-> to
   */
  public setArrowStyle(type: number) {
    this.arrowType = type;
  }

  public getLineFromNodePos(startNode: any) {
    let nodePos = {
      x: startNode.x,
      y: startNode.y,
    };
    return nodePos;
  }

  public getLineendNodePos(endNode: any) {
    let nodePos = {
      x: endNode.x,
      y: endNode.y,
    };
    return nodePos;
  }

  public getAngle(startNode: any, endNode: any) {
    return Math.atan2(startNode.x - endNode.x, startNode.y - endNode.y);
  }

  public getAdjustedLocation(node: any, n: number, angel: number, distanceRound: number) {
    const location = {
      x: node.x + n * distanceRound * Math.sin(angel),
      y: node.y + n * distanceRound * Math.cos(angel),
    };
    return location;
  }

  public getArrowPints(pos: any, angle: number, direction: number) {
    const arrowAngel =  20;
    const middleLength =  10;
    const angelT = angle + _.divide(arrowAngel * Math.PI, 180);
    const angelB = angle - _.divide(arrowAngel * Math.PI, 180);
    const x = pos.x;
    const y = pos.y;
    const t = direction;
    return {
      p1: { x: x + 0, y: y + 0 },
      p2: {
        x: x + this.arrowLength * Math.sin(angelT) * t,
        y: y + this.arrowLength * Math.cos(angelT) * t,
      },
      p3: {
        x: x + middleLength * Math.sin(angle) * t,
        y: y + middleLength * Math.cos(angle) * t,
      },
      p4: {
        x: x + this.arrowLength * Math.sin(angelB) * t,
        y: y + this.arrowLength * Math.cos(angelB) * t,
      },
      p5: { x: x + 0, y: y + 0 },
    };
  }

  public drawLine() {
    this.edge.clear();
    this.arrow.clear();
    this.srcNodePos = this.getLineFromNodePos(this.startNode);
    this.endNodePos = this.getLineendNodePos(this.endNode);
    const angle = this.getAngle(this.srcNodePos, this.endNodePos);
    this.srcNodePos = this.getAdjustedLocation(this.srcNodePos, -1,angle, this.startNode.width * 0.5 + this.lineDistance);
    this.endNodePos = this.getAdjustedLocation(this.endNodePos, 1, angle, this.endNode.width * 0.5 + this.lineDistance);
    this.edge.lineStyle(this.lineWidth, this.lineColor, 1);
    switch (this.arrowType)
    {
      case 0:
        this.edge.moveTo(this.srcNodePos.x, this.srcNodePos.y);
        this.edge.lineTo(this.endNodePos.x, this.endNodePos.y);
        this.addChild(this.edge);
        break;
      case 1:
        this.arrow.lineStyle(this.arrowWidth, this.arrowColor, 1);
        const arrowPoints = this.getArrowPints(this.endNodePos, angle, 1);
        if (this.fillArrow) {
          this.arrow.beginFill(this.arrowColor);
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
        this.arrow.lineStyle(this.arrowWidth, this.arrowColor, 1)
        const arrowPoints1 = this.getArrowPints(this.srcNodePos, angle, -1);;
        if (this.fillArrow) {
          this.arrow.beginFill(this.arrowColor);
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
        this.arrow.lineStyle(this.arrowWidth, this.arrowColor, 1);
        const arrowPoints2 = this.getArrowPints(this.endNodePos, angle, 1);
        if (this.fillArrow) {
          this.arrow.beginFill(this.arrowColor);
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
