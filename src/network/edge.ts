/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import { CommonElement } from './common-element';
import * as _ from 'lodash';
import { Group } from './group';
import { Node } from './node';

const  Point = PIXI.Point;

export class Edge extends CommonElement {
  private edge: PIXI.Graphics;
  private arrow: PIXI.Graphics;
  private startNode: any;
  private endNode: any;
  public styles: {[x: string]: any};
  private _arrowType: number;
  private _lineColor: number;
  private _lineWidth: number;
  private _lineDistance: number;
  private _arrowColor: number;
  private _arrowWidth: number;
  private _arrowLength: number;
  private _fillArrow: boolean;


  constructor(startNode: Node | Group, endNode: Node | Group) {
    super();
    this.edge = new PIXI.Graphics;
    this.arrow = new PIXI.Graphics;
    this.startNode = startNode;
    this.endNode = endNode;
    this._arrowType = 0;
    this.styles = {};
    this._lineColor = 0X000000;
    this._lineWidth =  1.4;
    this._arrowColor = 0X000000;
    this._arrowWidth =  1;
    this._lineDistance = 0;
    this._arrowLength = 15;
    this._fillArrow = false;
    this.drawLine();
  }

  public setStyle(styles: object) {
    _.extend(this.styles, styles);
    this._lineColor = this.styles.lineColor || 0X000000;
    this._lineWidth = this.styles.lineWidth || 1.4;
    this._lineDistance = this.styles.lineDistance || 0;
    this._arrowColor = this.styles.arrowColor || 0X000000;
    this._arrowWidth = this.styles.arrowWidth || 1.4;
    this._arrowType = this.styles.arrowType || 0;
    this._arrowLength = this.styles.arrowLength || 15;
    this._fillArrow = this.styles.fillArrow;
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
    this._arrowType = type;
  }

  public getLineFromNodePos(startNode: any) {
    return {
        x: startNode.x,
        y: startNode.y
    }
}

  public getLineEndNodePos(endNode: any) {
    return {
      x: endNode.x,
      y: endNode.y 
  }
}

  public getAngle(startNode: any, endNode: any) {
    return Math.atan2(startNode.x - endNode.x, startNode.y - endNode.y);
}

  public getAdjustedLocation(node: any, n: number, angel: number, distance_round: number) {
    return {
        x: node.x + n * distance_round * Math.sin(angel),
        y: node.y + n * distance_round * Math.cos(angel)
    };
}

public getArrowPints(pos:any, angle:number, direction:number) {
  var
      arrow_angel: any = arrow_angel || 20,
      // arrow_length: any = arrow_length || 15,
      middle_length: any = middle_length || 10,
      angel_t = angle + _.divide(arrow_angel * Math.PI, 180),
      angel_b = angle - _.divide(arrow_angel * Math.PI, 180),
      x = pos.x,
      y = pos.y;
      let t = direction
  // if (arguments.length == 2) {
  //     var t = 1;
  // } else {
  //     t = endArrow ? 1 : -1;
  // }
  return {
      p1: { x: x, y: y },
      p2: {
          x: x + this._arrowLength * Math.sin(angel_t) * t,
          y: y + this._arrowLength * Math.cos(angel_t) * t
      },
      p3: {
          x: x + middle_length * Math.sin(angle) * t,
          y: y + middle_length * Math.cos(angle) * t
      },
      p4: {
          x: x + this._arrowLength * Math.sin(angel_b) * t,
          y: y + this._arrowLength * Math.cos(angel_b) * t
      },
      p5: { x: x, y: y }
  };
}

  public drawLine() {
    this.edge.clear();
    this.arrow.clear();
    let srcNodePos = this.getLineFromNodePos(this.startNode);
    let endNodePos = this.getLineEndNodePos(this.endNode);
    let angle = this.getAngle(srcNodePos, endNodePos);
    srcNodePos = this.getAdjustedLocation(srcNodePos, -1, angle, this.startNode.width * 0.5 + this._lineDistance);
    endNodePos = this.getAdjustedLocation(endNodePos, 1, angle, this.endNode.width * 0.5 + this._lineDistance);
    this.edge.lineStyle(this._lineWidth, this._lineColor, 1);
    // this.edge.moveTo(srcNodePos.x, srcNodePos.y);
    // this.edge.lineTo(endNodePos.x, endNodePos.y);
    switch(this._arrowType)
    {
      case 0:
        this.edge.moveTo(srcNodePos.x, srcNodePos.y);
        this.edge.lineTo(endNodePos.x, endNodePos.y);
        this.addChild(this.edge);
        break;
      case 1:
        this.arrow.lineStyle(this._arrowWidth, this._arrowColor, 1)
        let arrowPoints = this.getArrowPints(endNodePos, angle, 1);
        if(this._fillArrow) {
          this.arrow.beginFill(this._arrowColor);
        }
        this.arrow.drawPolygon(_.flatMap(_.map(_.values(arrowPoints), (o) => { return [o.x, o.y] })));
        this.edge.moveTo(srcNodePos.x, srcNodePos.y);
        this.edge.lineTo(arrowPoints.p3.x, arrowPoints.p3.y);
        this.arrow.endFill();
        this.addChild(this.edge);
        this.addChild(this.arrow);
        break;
      case 2:
        this.arrow.lineStyle(this._arrowWidth, this._arrowColor, 1)
        let arrowPoints1 = this.getArrowPints(srcNodePos, angle, -1);;
        if(this._fillArrow) {
          this.arrow.beginFill(this._arrowColor);
        }
        this.arrow.drawPolygon(_.flatMap(_.map(_.values(arrowPoints1), (o) => { return [o.x, o.y] })));
        this.edge.moveTo(endNodePos.x, endNodePos.y);
        this.edge.lineTo(arrowPoints1.p3.x, arrowPoints1.p3.y);
        this.arrow.endFill();
        this.addChild(this.edge);
        this.addChild(this.arrow);
        break;
      case 3:
        this.arrow.lineStyle(this._arrowWidth, this._arrowColor, 1)
        let arrowPoints2 = this.getArrowPints(endNodePos, angle, 1);;
        if(this._fillArrow) {
          this.arrow.beginFill(this._arrowColor);
        }
        this.arrow.drawPolygon(_.flatMap(_.map(_.values(arrowPoints2), (o) => { return [o.x, o.y] })));
        let arrowPoints3 = this.getArrowPints(srcNodePos, angle, -1);;
        this.arrow.drawPolygon(_.flatMap(_.map(_.values(arrowPoints3), (o) => { return [o.x, o.y] })));
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
