/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */
import * as _ from 'lodash';
import { Node } from '../node';
export interface IPoint {
  x: number;
  y: number;
}

export interface IAdjustedNodePosition {
  srcNode: IPoint;
  endNode: IPoint;
}

export interface IResultsPoints {
  sLeft: IPoint;
  sRight: IPoint;
  eRight: IPoint;
  eLeft: IPoint;
}

const Point = PIXI.Point;
export class LineCommonFunction {
  private start: Node;
  private end: Node;

  constructor(start: Node, end: Node) {
    this.start = start;
    this.end = end;
  }

  // get nodes init position
  public getNodePosition(node: Node): IPoint {
    const x: number = node.x;
    const y: number = node.y;
    return { x, y };
  }

  // get the angle which between the start and end node
  public getAngle(): number {
    const srcNodePos = this.getNodePosition(this.start);
    const endNodePos = this.getNodePosition(this.end);
    return Math.atan2(srcNodePos.x - endNodePos.x, srcNodePos.y - endNodePos.y);
  }

  /**
   * get after adjusted the location of the node
   * @param {IPoint} node nodes position
   * @param {number} n direction '1' means from end node and '-1' means from start node
   * @param {number} distanceRound need to adjust the distance
   * @returns adjusted location
   */
  public getAdjustedLocation(node: IPoint, n: number, distanceRound: number): IPoint {
    const angle = this.getAngle();
    const location = {
      x: node.x + n * distanceRound * Math.sin(angle),
      y: node.y + n * distanceRound * Math.cos(angle),
    };
    return location;
  }

  /**
   * get how many distances need to adjusted
   * @param {IPoint} node nodes position
   * @param {number} lineDistance need to adjust the distance
   */
  public getDistance(node: Node, lineDistance: number): number {
    const result = node.getWidth() < node.getHeight() ? node.getWidth() : node.getHeight();
    return result * 0.5 + lineDistance;
  }

  /**
   * Calculate by the line, rectangle points position
   * @param {IPoint} start start node location
   * @param {IPoint} end end node location
   * @param {number} lineWidth line of width
   * @return {IResultsPoints} use the results to draw line rectangle
   */
  public calcEdgePoints(start: IPoint, end: IPoint, lineWidth: number): IResultsPoints {
    const angle = this.getAngle();
    const half = lineWidth * 4;
    const sX = start.x;
    const sY = start.y;
    const eX = end.x;
    const eY = end.y;
    const results: IResultsPoints = {
      sLeft: { x: 0, y: 0 },
      sRight: { x: 0, y: 0 },
      eRight: { x: 0, y: 0 },
      eLeft: { x: 0, y: 0 },
    };
    const sLeft = new Point(sX - Math.cos(angle) * half, sY + Math.sin(angle) * half);
    const sRight = new Point(sX + Math.cos(angle) * half, sY - Math.sin(angle) * half);
    const eRight = new Point(eX + Math.cos(angle) * half, eY - Math.sin(angle) * half);
    const eLeft = new Point(eX - Math.cos(angle) * half, eY + Math.sin(angle) * half);
    results.sLeft = sLeft;
    results.sRight = sRight;
    results.eRight = eRight;
    results.eLeft = eLeft;
    return results;
  }

  // adjust draw line's rectangle position
  public adustNodePos(style: any): IAdjustedNodePosition {
    const nodePos: IAdjustedNodePosition = {
      srcNode: { x: 0, y: 0 },
      endNode: { x: 0, y: 0 },
    };
    const startDistance = this.getDistance(this.start, style.lineDistance);
    const endDistance = this.getDistance(this.end, style.lineDistance);
    const srcNodePos = this.getNodePosition(this.start);
    const endNodePos = this.getNodePosition(this.end);
    nodePos.srcNode = this.getAdjustedLocation(srcNodePos, -1, startDistance);
    nodePos.endNode = this.getAdjustedLocation(endNodePos, 1, endDistance);
    return nodePos;
  }

  public getCenterPoint(srcNode: IPoint, endNode: IPoint): IPoint {
    const center = { x: 0, y: 0 };
    center.x = (srcNode.x + endNode.x) / 2;
    center.y = (srcNode.y + endNode.y) / 2;
    return center;
  }

}
