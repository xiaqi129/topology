/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement, IStyles } from './common-element';
import { Group } from './group';
import { Node } from './node';

const Point = PIXI.Point;

export class Edge extends CommonElement {
  public startNode: any;
  public endNode: any;
  public edge: PIXI.Graphics;
  public arrow: PIXI.Graphics;

  constructor(startNode: Node | Group, endNode: Node | Group) {
    super();
    this.edge = new PIXI.Graphics();
    this.arrow = new PIXI.Graphics();
    this.startNode = startNode;
    this.endNode = endNode;
    this.draw();
  }

  public getEdge() {
    return this.edge;
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

  public calcEdgePoints(start: any, end: any, lineWidth: number) {
    const half = lineWidth * 0.5;
    let sLeft = {};
    let sRight = {};
    let eRight = {};
    let eLeft = {};
    const sX = start.x;
    const sY = start.y;
    const eX = end.x;
    const eY = end.y;
    const results: any = {};

    if ((sX < eX && sY < eY) ||
      (sX > eX && sY > eY)) {
      sLeft = new Point(sX - half, sY + half);
      sRight = new Point(sX + half, sY - half);
      eRight = new Point(eX + half, eY - half);
      eLeft = new Point(eX - half, eY + half);
    } else if ((sX > eX && sY < eY) ||
      (sX < eX && sY > eY)) {
      sLeft = new Point(sX - half, sY - half);
      sRight = new Point(sX + half, sY + half);
      eRight = new Point(eX + half, eY + half);
      eLeft = new Point(eX - half, eY - half);
    } else if (sX === eX &&
      (sY > eY || sY < eY)) {
      sLeft = new Point(sX - half, sY);
      sRight = new Point(sX + half, sY);
      eRight = new Point(eX + half, eY);
      eLeft = new Point(eX - half, eY);

    } else if (sY === eY &&
      (sX < eX || sX > eX)) {
      sLeft = new Point(sX, sY + half);
      sRight = new Point(sX, sY - half);
      eRight = new Point(eX, eY - half);
      eLeft = new Point(eX, eY + half);
    }

    results.sLeft = sLeft;
    results.sRight = sRight;
    results.eRight = eRight;
    results.eLeft = eLeft;

    return results;
  }

  public drawEdge(graph: any, points: any) {
    const style = this.defaultStyle;
    graph.lineStyle(style.lineWidth, style.lineColor);
    graph.beginFill(style.fillColor, style.fillOpacity);
    graph.moveTo(points.sLeft.x, points.sLeft.y);
    graph.lineTo(points.sRight.x, points.sRight.y);
    graph.lineTo(points.eRight.x, points.eRight.y);
    graph.lineTo(points.eLeft.x, points.eLeft.y);
    graph.endFill();
  }

  public getSrcNode() {
    return this.startNode;
  }

  public getTargetNode() {
    return this.endNode;
  }

  public setStyle(styles: object) {
    _.extend(this.defaultStyle, styles);
    this.draw();
  }

  public getStyle() {
    return this.defaultStyle;
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
    this.defaultStyle.arrowType = type;
  }

  public getLineFromNodePos(startNode: any) {
    const nodePos = {
      x: startNode.x,
      y: startNode.y,
    };
    return nodePos;
  }

  public getLineendNodePos(endNode: any) {
    const nodePos = {
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

  public getArrowPints(pos: any, angle: number, direction: boolean = true) {
    const arrowAngel = 20;
    const middleLength = 10;
    const angelT = angle + _.divide(arrowAngel * Math.PI, 180);
    const angelB = angle - _.divide(arrowAngel * Math.PI, 180);
    const x = pos.x;
    const y = pos.y;
    const t = direction ? 1 : -1;
    const style = this.defaultStyle;
    return {
      p1: { x: x + 0, y: y + 0 },
      p2: {
        x: x + style.arrowLength * Math.sin(angelT) * t,
        y: y + style.arrowLength * Math.cos(angelT) * t,
      },
      p3: {
        x: x + middleLength * Math.sin(angle) * t,
        y: y + middleLength * Math.cos(angle) * t,
      },
      p4: {
        x: x + style.arrowLength * Math.sin(angelB) * t,
        y: y + style.arrowLength * Math.cos(angelB) * t,
      },
      p5: { x: x + 0, y: y + 0 },
    };
  }

  public createArrow(position: any, angle: number, reverse: boolean = true) {
    const style = this.defaultStyle;
    this.arrow.lineStyle(style.arrowWidth, style.arrowColor, 1);
    if (style.fillArrow) this.arrow.beginFill(style.arrowColor);
    const arrowPoints = this.getArrowPints(position, angle, reverse);
    this.arrow.drawPolygon(_.flatMap(_.map(
      _.values(arrowPoints), o => ([o.x, o.y]))));
    this.arrow.endFill();
    return this.arrow;
  }

  public clearEdgeRelatedGraph() {
    this.edge.clear();
    this.arrow.clear();
  }

  public getDistance(size: any, lineDistance: number) {
    return (_.max([size.width, size.height]) || 0) * 0.5 + lineDistance;
  }

  public draw() {
    this.clearEdgeRelatedGraph();
    const style = this.defaultStyle;
    const lineDistance = style.lineDistance;
    let srcNodePos = this.getLineNodePosition(this.startNode);
    let endNodePos = this.getLineNodePosition(this.endNode);
    const srcNodeSize = this.getNodeSize(this.startNode);
    const endNodeSize = this.getNodeSize(this.endNode);
    const angle = this.getAngle(srcNodePos, endNodePos);
    srcNodePos = this.getAdjustedLocation(
      srcNodePos,
      -1,
      angle,
      this.getDistance(srcNodeSize, lineDistance),
    );
    endNodePos = this.getAdjustedLocation(
      endNodePos,
      1,
      angle,
      this.getDistance(endNodeSize, lineDistance),
    );
    // draw a rectangle line for interaction
    const points = this.calcEdgePoints(
      srcNodePos, endNodePos, this.defaultStyle.lineWidth);
    this.drawEdge(this.edge, points);
    this.addChild(this.edge);
    // create arrows
    const arrowsDirections = [[true], [false], [true, false]];
    const directions = arrowsDirections[style.arrowType];
    _.each(directions, (direction) => {
      const position = direction ? endNodePos : srcNodePos;
      this.createArrow(position, angle, direction);
    });
    this.addChild(this.arrow);
  }
}
