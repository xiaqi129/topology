/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */
import * as _ from 'lodash';
import { CommonElement, IStyles } from './common-element';
import { Node } from './node';

export interface IPoint {
  x: number;
  y: number;
}

export interface IResultsPoints {
  sLeft: IPoint;
  sRight: IPoint;
  eRight: IPoint;
  eLeft: IPoint;
}

const Point = PIXI.Point;
export class DataFlow extends CommonElement {
  public background: PIXI.Graphics;
  public neon: PIXI.Graphics;
  private start: Node;
  private end: Node;
  constructor(start: Node, end: Node) {
    super();
    this.start = start;
    this.end = end;
    this.background = new PIXI.Graphics();
    this.neon = new PIXI.Graphics();
    this.draw();
    this.background.on('click', () => {
      // console.log('click!!11');
    });
  }

  // basic draw
  public draw(): void {
    this.clearRelatedGraph();
    const style = this.defaultStyle;
    const startDistance = this.getDistance(this.start, style.lineDistance);
    const endDistance = this.getDistance(this.end, style.lineDistance);
    let srcNodePos = this.getNodePosition(this.start);
    let endNodePos = this.getNodePosition(this.end);
    srcNodePos = this.getAdjustedLocation(srcNodePos, -1, startDistance);
    endNodePos = this.getAdjustedLocation(endNodePos, 1, endDistance);
    this.createBackground(srcNodePos, endNodePos);
    this.drawImaginaryLink(srcNodePos, endNodePos);
  }

  // clear data flow graph
  private clearRelatedGraph(): void {
    this.background.clear();
    this.neon.clear();
  }

  // get nodes init position
  private getNodePosition(node: Node): IPoint {
    const x: number = node.x;
    const y: number = node.y;
    return { x, y };
  }

  // get the angle which between the start and end node
  private getAngle(): number {
    const srcNodePos = this.getNodePosition(this.start);
    const endNodePos = this.getNodePosition(this.end);
    return Math.atan2(srcNodePos.x - endNodePos.x, srcNodePos.y - endNodePos.y);
  }

  /**
   * get after adjusted the location of the node
   * @param {IPoint} node nodes position
   * @param {number} n direction '1' means from end node and '-1' means from start node
   * @param {number} distanceRound need to adjust the distance
   */
  private getAdjustedLocation(node: IPoint, n: number, distanceRound: number): IPoint {
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
  private getDistance(node: Node, lineDistance: number): number {
    const result = node.getWidth() < node.getHeight() ? node.getWidth() : node.getHeight();
    return result * 0.5 + lineDistance;
  }

  /**
   * draw background of the data flow
   * @param {IPoint} srcNodePos src node postion
   * @param {IPoint} endNodePos end node postion
   */
  private createBackground(srcNodePos: IPoint, endNodePos: IPoint): void {
    const style = this.defaultStyle;
    const graph = this.background;
    const points = this.calcEdgePoints(srcNodePos, endNodePos);
    let lineColor;
    if (this.invariableStyles && this.invariableStyles.lineColor) {
      lineColor = this.invariableStyles.lineColor;
    } else {
      lineColor = 0X2c3e50;
    }
    graph.interactive = true;
    graph.buttonMode = true;
    graph.beginFill(lineColor, style.fillOpacity);
    graph.moveTo(points.sLeft.x, points.sLeft.y);
    graph.lineTo(points.sRight.x, points.sRight.y);
    graph.lineTo(points.eRight.x, points.eRight.y);
    graph.lineTo(points.eLeft.x, points.eLeft.y);
    graph.endFill();
    this.addChild(graph);
  }

  private drawImaginaryLink(srcNodePos: IPoint, endNodePos: IPoint) {
    const style = this.defaultStyle;
    const points = this.calcDottedEdgePoints(srcNodePos, endNodePos);
    const graph = this.neon;
    graph.interactive = true;
    _.each(points, (point) => {
      graph.beginFill(0Xffff00, style.fillOpacity);
      graph.moveTo(point.sLeft.x, point.sLeft.y);
      graph.lineTo(point.sRight.x, point.sRight.y);
      graph.lineTo(point.eRight.x, point.eRight.y);
      graph.lineTo(point.eLeft.x, point.eLeft.y);
      graph.endFill();
    });
    this.background.addChild(graph);
    // this.addChild(graph);
  }

  /**
   * Calculate by the line, rectangle points position
   * @param {IPoint} start start node location
   * @param {IPoint} end end node location
   */
  private calcEdgePoints(start: IPoint, end: IPoint): IResultsPoints {
    const lineWidth = this.defaultStyle.lineWidth;
    const angle = this.getAngle();
    const half = lineWidth * 4;
    let sLeft = {};
    let sRight = {};
    let eRight: any = {};
    let eLeft: any = {};
    const sX = start.x;
    const sY = start.y;
    const eX = end.x;
    const eY = end.y;
    const results: any = {};
    sLeft = new Point(sX - Math.cos(angle) * half, sY + Math.sin(angle) * half);
    sRight = new Point(sX + Math.cos(angle) * half, sY - Math.sin(angle) * half);
    eRight = new Point(eX + Math.cos(angle) * half, eY - Math.sin(angle) * half);
    eLeft = new Point(eX - Math.cos(angle) * half, eY + Math.sin(angle) * half);
    results.sLeft = sLeft;
    results.sRight = sRight;
    results.eRight = eRight;
    results.eLeft = eLeft;
    return results;
  }

  private calcDottedEdgePoints(start: IPoint, end: IPoint): IResultsPoints[] {
    const lineWidth = this.defaultStyle.lineWidth;
    const half = lineWidth * 4;
    const neonLength = 30;
    const breakNum = 2;
    const breakLength = 30;
    const pointsList = [];
    const angle = this.getAngle();
    const breakX = breakLength * Math.sin(angle);
    const breakY = breakLength * Math.cos(angle);
    const distanceX = Math.abs(start.x - end.x) / breakNum - Math.abs(breakX);
    const distanceY = Math.abs(start.y - end.y) / breakNum - Math.abs(breakY);
    let sLeft = {};
    let sRight = {};
    let eRight: any = {};
    let eLeft: any = {};
    let sX = start.x;
    let sY = start.y;
    const eX = end.x;
    const eY = end.y;
    for (let index = 0; index < breakNum; index = index + 1) {
      const result: any = {};
      if (sX > eX && sY > eY && (sX - distanceX > eX) && (sY - distanceY > eY)) {
        sLeft = new Point(sX - half, sY + half);
        sRight = new Point(sX + half, sY - half);
        eRight = new Point(sX + half - distanceX, sY - half - distanceY);
        eLeft = new Point(sX - half - distanceX, sY + half - distanceY);
        sX = sX - distanceX - breakX;
        sY = sY - distanceY - breakY;
      } else if (sX < eX && sY < eY && (sX + distanceX < eX) && (sY + distanceY < eY)) {
        sLeft = new Point(sX - half, sY + half);
        sRight = new Point(sX + half, sY - half);
        eRight = new Point(sX + half + distanceX, sY - half + distanceY);
        eLeft = new Point(sX - half + distanceX, sY + half + distanceY);
        sX = sX + distanceX - breakX;
        sY = sY + distanceY - breakY;
      } else if (sX > eX && sY < eY && (sX - distanceX > eX) && (sY + distanceY < eY)) {
        sLeft = new Point(sX - half, sY - half);
        sRight = new Point(sX + half, sY + half);
        eRight = new Point(sX + half - distanceX, sY + half + distanceY);
        eLeft = new Point(sX - half - distanceX, sY - half + distanceY);
        sX = sX - distanceX - breakX;
        sY = sY + distanceY - breakY;
      } else if (sX < eX && sY > eY && (sX + distanceX < eX) && (sY - distanceY > eY)) {
        sLeft = new Point(sX - half, sY - half);
        sRight = new Point(sX + half, sY + half);
        eRight = new Point(sX + half + distanceX, sY + half - distanceY);
        eLeft = new Point(sX - half + distanceX, sY - half - distanceY);
        sX = sX + distanceX - breakX;
        sY = sY - distanceY - breakY;
      } else if (sX === eX && sY > eY && (sY - distanceY > eY)) {
        sLeft = new Point(sX - half, sY);
        sRight = new Point(sX + half, sY);
        eRight = new Point(eX + half, sY - distanceY);
        eLeft = new Point(eX - half, sY - distanceY);
        sY = sY - distanceY - breakY;
      } else if (sX === eX && sY < eY && (sY + distanceY < eY)) {
        sLeft = new Point(sX - half, sY);
        sRight = new Point(sX + half, sY);
        eRight = new Point(eX + half, sY + distanceY);
        eLeft = new Point(eX - half, sY + distanceY);
        sY = sY + distanceY - breakY;
      } else if (sY === eY && sX < eX && (sX + distanceX < eX)) {
        sLeft = new Point(sX, sY + half);
        sRight = new Point(sX, sY - half);
        eRight = new Point(sX + distanceX, eY - half);
        eLeft = new Point(sX + distanceX, eY + half);
        sX = sX + distanceX - breakX;
      } else if (sY === eY && sX > eX && (sX - distanceX > eX)) {
        sLeft = new Point(sX, sY + half);
        sRight = new Point(sX, sY - half);
        eRight = new Point(sX - distanceX, eY - half);
        eLeft = new Point(sX - distanceX, eY + half);
        sX = sX - distanceX - breakX;
      }
      result.sLeft = sLeft;
      result.sRight = sRight;
      result.eRight = eRight;
      result.eLeft = eLeft;
      pointsList.push(result);
    }
    return pointsList;
  }

}
