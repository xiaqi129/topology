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
// import { CommonElement } from './common-element';

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

  public getNodeSize(node: Node | Group) {
    let width = 0;
    let height = 0;
    if (node instanceof Node) {
      width = node.width;
      height = node.height;
    }

    if (node instanceof Group) {
      width = node.getWidth();
      height = node.getHeight();
    }

    return { width, height };
  }

  public draw() {
    this.edge.clear();
    this.arrow.clear();
    const style = this.defaultStyle;
    const lineDistance = style.lineDistance;
    this.srcNodePos = this.getLineNodePosition(this.startNode);
    this.endNodePos = this.getLineNodePosition(this.endNode);
    const srcNodeSize = this.getNodeSize(this.startNode);
    const endNodeSize = this.getNodeSize(this.endNode);
    const angle = this.getAngle(this.srcNodePos, this.endNodePos);
    this.srcNodePos = this.getAdjustedLocation(
      this.srcNodePos,
      -1,
      angle,
      srcNodeSize.width * 0.5 + lineDistance,
    );
    this.endNodePos = this.getAdjustedLocation(
      this.endNodePos,
      1,
      angle,
      endNodeSize.width * 0.5 + lineDistance,
    );
    this.edge.lineStyle(style.lineWidth, style.lineColor, 1);
    const elGraph = new PIXI.Graphics();
    elGraph.lineStyle(style.lineWidth, style.lineColor);
    elGraph.beginFill(style.fillColor, style.fillOpacity);
    this.addChild(elGraph);
    this.edge.moveTo(this.srcNodePos.x, this.srcNodePos.y);
    this.edge.lineTo(this.endNodePos.x, this.endNodePos.y);
    this.addChild(this.edge);
    let arrowPoints: any;
    switch (style.arrowType) {
      case 1:
        this.arrow.lineStyle(style.arrowWidth, style.arrowColor, 1);
        arrowPoints = this.getArrowPints(this.endNodePos, angle, 1);
        if (style.fillArrow) {
          this.arrow.beginFill(style.arrowColor);
        }
        this.arrow.drawPolygon(_.flatMap(_.map(
          _.values(arrowPoints), o => ([o.x, o.y]))));
        this.arrow.endFill();
        this.addChild(this.arrow);
        break;
      case 2:
        this.arrow.lineStyle(style.arrowWidth, style.arrowColor, 1);
        arrowPoints = this.getArrowPints(this.srcNodePos, angle, -1);
        if (style.fillArrow) {
          this.arrow.beginFill(style.arrowColor);
        }
        this.arrow.drawPolygon(_.flatMap(_.map(
          _.values(arrowPoints), o => ([o.x, o.y]))));
        this.arrow.endFill();
        this.addChild(this.arrow);
        break;
      case 3:
        this.arrow.lineStyle(style.arrowWidth, style.arrowColor, 1);
        arrowPoints = this.getArrowPints(this.endNodePos, angle, 1);
        if (style.fillArrow) {
          this.arrow.beginFill(style.arrowColor);
        }
        this.arrow.drawPolygon(_.flatMap(_.map(
          _.values(arrowPoints), o => ([o.x, o.y]))));
        arrowPoints = this.getArrowPints(this.srcNodePos, angle, -1);
        this.arrow.drawPolygon(_.flatMap(_.map(
          _.values(arrowPoints), o => ([o.x, o.y]))));
        this.arrow.endFill();
        this.addChild(this.arrow);
        break;
      default:
        break;
    }
  }

}
