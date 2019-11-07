/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */
import Bezier from 'bezier-js/lib/bezier';
import * as _ from 'lodash';
import { CommonElement } from './common-element';
import { IPoint, IResultsPoints, LineCommonFunction } from './lib/line';
import { Node } from './node';

const Point = PIXI.Point;
export class DataFlow extends CommonElement {
  public type: string = 'DataFlow';
  public flowLength: number = 30;
  private background: PIXI.Graphics;
  private neon: PIXI.Graphics;
  private moveDistance: number = 0;
  private start: Node;
  private end: Node;
  private lineFunction: LineCommonFunction;
  /* BESIZER CURVE */
  private bezierPoints: IPoint[] = [];
  private bezierData: Bezier | undefined;
  private splitStartList: number[] = [];
  private splitRatio: number = 0;
  private pointsList: IPoint[][] = [];
  constructor(start: Node, end: Node) {
    super();
    this.start = start;
    this.end = end;
    this.background = new PIXI.Graphics();
    this.neon = new PIXI.Graphics();
    this.lineFunction = new LineCommonFunction(start, end);
    start.exceptEdgesArray.push(this);
    end.exceptEdgesArray.push(this);
    this.analysisBrotherEdge();
    this.gameLoop();
  }

  // basic draw
  public draw(): void {
    this.clearRelatedGraph();
    const nodePos = this.lineFunction.adustNodePos(this.defaultStyle);
    const style = this.defaultStyle;
    if (style.lineType === 0) {
      const points = this.calcDottedEdgePoints(nodePos.srcNode, nodePos.endNode);
      this.createBackground(nodePos.srcNode, nodePos.endNode);
      this.drawImaginaryLink(points);
    } else {
      this.createBezierBackground(nodePos.srcNode, nodePos.endNode);
      this.calcDottedBezierPoints(nodePos.srcNode, nodePos.endNode);
      this.drawDottedBezierCurve(this.pointsList);
    }
  }

  // clear data flow graph
  private clearRelatedGraph(): void {
    this.background.clear();
    this.neon.clear();
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
    if (this.invariableStyles && this.invariableStyles.lineColor && this.invariableStyles.lineColor !== 0xEEEEEE) {
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

  /**
   * draw background of the bezier's data flow
   * @param {IPoint} srcNodePos src node postion
   * @param {IPoint} endNodePos end node postion
   */
  private createBezierBackground(srcNodePos: IPoint, endNodePos: IPoint): void {
    const style = this.defaultStyle;
    const graph = this.background;
    const curveDistance = style.bezierLineDistance;
    const curveDegree = style.bezierLineDegree;
    const originPoints = [];
    let lineColor;
    const originControlPoints = this.lineFunction.getControlPoint(srcNodePos, endNodePos);
    if (this.invariableStyles && this.invariableStyles.lineColor && this.invariableStyles.lineColor !== 0xEEEEEE) {
      lineColor = this.invariableStyles.lineColor;
    } else {
      lineColor = 0X2c3e50;
    }
    graph.lineStyle(style.lineWidth * 8, lineColor);
    originPoints.push(srcNodePos);
    originPoints.push({ x: originControlPoints[0], y: originControlPoints[1] });
    originPoints.push({ x: originControlPoints[2], y: originControlPoints[3] });
    originPoints.push(endNodePos);
    const points = this.calcBezierCurvePoints(originPoints, curveDistance, curveDegree);
    this.bezierData = new Bezier(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
    this.bezierPoints = points;
    const hitAreaData = [points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y];
    graph.moveTo(points[0].x, points[0].y);
    graph.bezierCurveTo(points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
    this.hitArea = new PIXI.Polygon(hitAreaData);
    this.addChild(graph);
  }

  /**
   * draw neon of the data flow
   * @param {IResultsPoints[]} points points list of the neon
   */
  private drawImaginaryLink(points: IResultsPoints[]) {
    const style = this.defaultStyle;
    const isHit = this.hitTestRectangle(this.start, this.end);
    if (!isHit) {
      const graph = this.neon;
      graph.interactive = true;
      let fillColor: number;
      if (this.invariableStyles && this.invariableStyles.fillColor) {
        fillColor = this.invariableStyles.fillColor;
      } else {
        fillColor = 0Xffff00;
      }
      _.each(points, (point) => {
        graph.beginFill(fillColor, style.fillOpacity);
        graph.moveTo(point.sLeft.x, point.sLeft.y);
        graph.lineTo(point.sRight.x, point.sRight.y);
        graph.lineTo(point.eRight.x, point.eRight.y);
        graph.lineTo(point.eLeft.x, point.eLeft.y);
        graph.endFill();
      });
      this.background.addChild(graph);

    }
  }

  /**
   * draw neon of the bezier's data flow
   * @param {IPoint[][]} points points list of the neon
   */
  private drawDottedBezierCurve(points: IPoint[][]) {
    const style = this.defaultStyle;
    const isHit = this.hitTestRectangle(this.start, this.end);
    if (!isHit) {
      const graph = this.neon;
      graph.interactive = true;
      let fillColor: number;
      if (this.invariableStyles && this.invariableStyles.fillColor) {
        fillColor = this.invariableStyles.fillColor;
      } else {
        fillColor = 0Xffff00;
      }
      graph.lineStyle(style.lineWidth * 8, fillColor);
      _.each(points, (point: IPoint[]) => {
        graph.moveTo(point[0].x, point[0].y);
        graph.bezierCurveTo(point[1].x, point[1].y, point[2].x, point[2].y, point[3].x, point[3].y);
      });
      this.background.addChild(graph);

    }
  }

  /**
   * Calculate by the line, rectangle points position
   * @param {IPoint} start start node location
   * @param {IPoint} end end node location
   */
  private calcEdgePoints(start: IPoint, end: IPoint): IResultsPoints {
    const lineWidth = this.defaultStyle.lineWidth;
    const angle = this.lineFunction.getAngle();
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

  /**
   * Calculate by the line, rectangle points position list
   * @param {IPoint} start start node location
   * @param {IPoint} end end node location
   */
  private calcDottedEdgePoints(start: IPoint, end: IPoint): IResultsPoints[] {
    const lineWidth = this.defaultStyle.lineWidth;
    const half = lineWidth * 4;
    const angle = this.lineFunction.getAngle();
    const flowLength = this.flowLength;
    const xLength = start.x - end.x;
    const yLength = start.y - end.y;
    const distance = Math.sqrt(xLength * xLength + yLength * yLength);
    const segmentNum = (distance / flowLength / 2);
    const moveX = flowLength * Math.sin(angle);
    const moveY = flowLength * Math.cos(angle);
    const pointsList = [];
    let sX = start.x;
    let sY = start.y;
    for (let index = 0; index < segmentNum; index = index + 1) {
      const result: IResultsPoints = {
        sLeft: { x: 0, y: 0 },
        sRight: { x: 0, y: 0 },
        eRight: { x: 0, y: 0 },
        eLeft: { x: 0, y: 0 },
      };
      const sLeft = new Point(sX - Math.cos(angle) * half, sY + Math.sin(angle) * half);
      const sRight = new Point(sX + Math.cos(angle) * half, sY - Math.sin(angle) * half);
      const eRight = new Point(sX - moveX + Math.cos(angle) * half, sY - moveY - Math.sin(angle) * half);
      const eLeft = new Point(sX - moveX - Math.cos(angle) * half, sY - moveY + Math.sin(angle) * half);
      sX = sX - moveX * 2;
      sY = sY - moveY * 2;
      result.sLeft = sLeft;
      result.sRight = sRight;
      result.eRight = eRight;
      result.eLeft = eLeft;
      pointsList.push(result);
    }
    return pointsList;
  }

  private calcDottedBezierPoints(start: IPoint, end: IPoint): void {
    const flowLength = this.flowLength;
    const xLength = start.x - end.x;
    const yLength = start.y - end.y;
    const distance = Math.sqrt(xLength * xLength + yLength * yLength);
    const segmentNum = distance / flowLength;
    this.pointsList = [];
    this.splitStartList = [];
    this.splitRatio = 1 / segmentNum;
    for (let index = 0; index < segmentNum; index = index + 1) {
      if (index % 2 === 0) {
        this.splitStartList.push(index * this.splitRatio);
      }
    }
    _.each(this.splitStartList, (startNum: number) => {
      if (this.bezierData) {
        const bezierPoints: IPoint[] = this.bezierData.split(startNum, startNum + this.splitRatio).points;
        this.pointsList.push(bezierPoints);
      }
    });
  }

  // Collision detection function
  private hitTestRectangle(r1: any, r2: any) {
    let hit;
    let combinedHalfWidths;
    let combinedHalfHeights;
    let vx;
    let vy;
    hit = false;
    r1.centerX = r1.x;
    r1.centerY = r1.y;
    r2.centerX = r2.x;
    r2.centerY = r2.y;
    r1.halfWidth = r1.iconWidth / 2;
    r1.halfHeight = r1.iconHeight / 2;
    r2.halfWidth = r2.iconWidth / 2;
    r2.halfHeight = r2.iconHeight / 2;
    vx = r1.centerX - r2.centerX;
    vy = r1.centerY - r2.centerY;
    combinedHalfWidths = r1.halfWidth + r2.halfWidth;
    combinedHalfHeights = r1.halfHeight + r2.halfHeight;
    if (Math.abs(vx) < combinedHalfWidths) {
      if (Math.abs(vy) < combinedHalfHeights) {
        hit = true;
      } else {
        hit = false;
      }
    } else {
      hit = false;
    }
    return hit;
  }

  // animate the data flow
  private gameLoop(): void {
    requestAnimationFrame(this.gameLoop.bind(this));
    const nodePos = this.lineFunction.adustNodePos(this.defaultStyle);
    const style = this.defaultStyle;
    if (style.lineType === 0) {
      this.moveDistance += 1;
      if (this.moveDistance === this.flowLength + 1) {
        this.moveDistance = -(this.flowLength + 1);
      }
      const points = this.calcDottedEdgePoints(nodePos.srcNode, nodePos.endNode);
      this.movePoints(points);
    } else {
      this.moveDistance += this.splitRatio / this.flowLength;
      if (this.moveDistance > this.splitRatio * 2) {
        this.moveDistance = 0;
      }
      this.moveBezierPoints(this.pointsList);
    }
  }

  // animate the data flow with move points
  private movePoints(points: IResultsPoints[]): void {
    const angle = this.lineFunction.getAngle();
    const moveX = this.moveDistance * Math.sin(angle);
    const moveY = this.moveDistance * Math.cos(angle);
    const adustedPoints = _.each(points, (point: IResultsPoints) => {
      point.sLeft = new Point(point.sLeft.x - moveX, point.sLeft.y - moveY);
      point.sRight = new Point(point.sRight.x - moveX, point.sRight.y - moveY);
      point.eLeft = new Point(point.eLeft.x - moveX, point.eLeft.y - moveY);
      point.eRight = new Point(point.eRight.x - moveX, point.eRight.y - moveY);
      // tslint:disable-next-line: no-parameter-reassignment
      point = this.adjustedPoints(point);
    });
    this.neon.clear();
    this.drawImaginaryLink(adustedPoints);
  }

  private moveBezierPoints(points: IPoint[][]): void {
    interface ISplit {
      start: number;
      end: number;
    }
    const adjustedSplitStartAndEnd: ISplit[] = [];
    _.each(this.splitStartList, (num: number) => {
      let adjustedSplitStart = num + this.moveDistance;
      let adjustedSplitEnd = adjustedSplitStart + this.splitRatio;
      if (adjustedSplitStart >= 1 - this.splitRatio && adjustedSplitStart < 1) {
        adjustedSplitEnd = 1;
      } else if (adjustedSplitStart >= 1) {
        const end = adjustedSplitStart - 1;
        adjustedSplitStart = 0;
        adjustedSplitEnd = end;
      }
      adjustedSplitStartAndEnd.push({
        start: adjustedSplitStart,
        end: adjustedSplitEnd,
      });
    });
    const adustedPoints: IPoint[][] = [];
    _.each(adjustedSplitStartAndEnd, (splitNum: ISplit) => {
      if (this.bezierData) {
        const bezierPoints: IPoint[] = this.bezierData.split(splitNum.start, splitNum.end).points;
        adustedPoints.push(bezierPoints);
      }
    });
    this.neon.clear();
    this.drawDottedBezierCurve(adustedPoints);
  }

  // Setup brother edges used to create Edge Bundle
  private analysisBrotherEdge() {
    const dataFlows = this.start.exceptEdgesArray;
    const brotherLines = _.filter(dataFlows, (dataFlow: DataFlow) => {
      return ((dataFlow.start === this.start && dataFlow.end === this.end)
        || (dataFlow.start === this.end && dataFlow.end === this.start));
    });
    if (brotherLines.length > 1) {
      this.setBundleEdgesPosition(brotherLines);
    }
  }

  private setBundleEdgesPosition(dataFlows: any[]) {
    const degree = 15;
    const degreeStep = 6;
    const values: number[][] = [];
    const distance = 10;
    const distanceStep = 1;
    const isSameDirection = _.every(dataFlows, (dataFlow: DataFlow) => {
      return dataFlow.start === this.start;
    });
    let ratio = 1;
    if (dataFlows.length > 2) {
      ratio = 2;
    }
    _.each(dataFlows, (dataFlow: DataFlow, i: number) => {
      if (isSameDirection) {
        _.each([1, -1], (j) => {
          values.push([(distance + i * distanceStep) * j, (degree + i * degreeStep * ratio) * j]);
        });
      } else {
        values.push([(distance + i * distanceStep), (degree + i * degreeStep * ratio)]);
      }
    });
    _.each(dataFlows, (dataFlow: DataFlow, i) => {
      if (dataFlow instanceof DataFlow) {
        dataFlow.setStyle({
          bezierLineDistance: values[i][0],
          bezierLineDegree: values[i][1],
          lineType: 1,
        });
      }
    });
  }

  private calcBezierCurvePoints(points: IPoint[], curveDistance: number, curveDegree: number) {
    const angle = this.lineFunction.getAngle();
    points[0].x = points[0].x + curveDistance * Math.cos(angle);
    points[0].y = points[0].y - curveDistance * Math.sin(angle);
    points[3].x = points[3].x + curveDistance * Math.cos(angle);
    points[3].y = points[3].y - curveDistance * Math.sin(angle);
    points[1].x = points[1].x + curveDegree * Math.cos(angle);
    points[1].y = points[1].y - curveDegree * Math.sin(angle);
    points[2].x = points[2].x + curveDegree * Math.cos(angle);
    points[2].y = points[2].y - curveDegree * Math.sin(angle);
    return points;
  }

  /**
   * adusted the data flow points, remove two spare parts
   * @param {IResultsPoints} point prepare to adjusted points
   */
  private adjustedPoints(point: IResultsPoints): IResultsPoints {
    const result = point;
    const nodePos = this.lineFunction.adustNodePos(this.defaultStyle);
    const lineWidth = this.defaultStyle.lineWidth;
    const half = lineWidth * 4;
    const angle = this.lineFunction.getAngle();
    const sX = nodePos.srcNode.x;
    const sY = nodePos.srcNode.y;
    const eX = nodePos.endNode.x;
    const eY = nodePos.endNode.y;
    const startLeft = new Point(sX - Math.cos(angle) * half, sY + Math.sin(angle) * half);
    const startRight = new Point(sX + Math.cos(angle) * half, sY - Math.sin(angle) * half);
    const endRight = new Point(eX + Math.cos(angle) * half, eY - Math.sin(angle) * half);
    const endLeft = new Point(eX - Math.cos(angle) * half, eY + Math.sin(angle) * half);
    if (sX <= eX && sY <= eY) {
      if (result.eRight.x >= endRight.x && result.eRight.y >= endRight.y) {
        result.eRight = endRight;
        result.eLeft = endLeft;
      }
      if (result.sRight.x >= endRight.x && result.sRight.y >= endRight.y) {
        result.sRight = endRight;
        result.sLeft = endLeft;
      }
      if (result.sRight.x <= startRight.x && result.sRight.y <= startRight.y) {
        result.sRight = startRight;
        result.sLeft = startLeft;
      }
      if (result.eRight.x <= startRight.x && result.eRight.y <= startRight.y) {
        result.eRight = startRight;
        result.eLeft = startLeft;
      }
    } else if (sX > eX && sY < eY) {
      if (result.eRight.x <= endRight.x && result.eRight.y >= endRight.y) {
        result.eRight = endRight;
        result.eLeft = endLeft;
      }
      if (result.sRight.x <= endRight.x && result.sRight.y >= endRight.y) {
        result.sRight = endRight;
        result.sLeft = endLeft;
      }
      if (result.sRight.x >= startRight.x && result.sRight.y <= startRight.y) {
        result.sRight = startRight;
        result.sLeft = startLeft;
      }
      if (result.eRight.x >= startRight.x && result.eRight.y <= startRight.y) {
        result.eRight = startRight;
        result.eLeft = startLeft;
      }
    } else if (sX > eX && sY > eY) {
      if (result.eRight.x <= endRight.x && result.eRight.y <= endRight.y) {
        result.eRight = endRight;
        result.eLeft = endLeft;
      }
      if (result.sRight.x <= endRight.x && result.sRight.y <= endRight.y) {
        result.sRight = endRight;
        result.sLeft = endLeft;
      }
      if (result.sRight.x >= startRight.x && result.sRight.y >= startRight.y) {
        result.sRight = startRight;
        result.sLeft = startLeft;
      }
      if (result.eRight.x >= startRight.x && result.eRight.y >= startRight.y) {
        result.eRight = startRight;
        result.eLeft = startLeft;
      }
    } else if (sX < eX && sY > eY) {
      if (result.eRight.x >= endRight.x && result.eRight.y <= endRight.y) {
        result.eRight = endRight;
        result.eLeft = endLeft;
      }
      if (result.sRight.x >= endRight.x && result.sRight.y <= endRight.y) {
        result.sRight = endRight;
        result.sLeft = endLeft;
      }
      if (result.sRight.x <= startRight.x && result.sRight.y >= startRight.y) {
        result.sRight = startRight;
        result.sLeft = startLeft;
      }
      if (result.eRight.x <= startRight.x && result.eRight.y >= startRight.y) {
        result.eRight = startRight;
        result.eLeft = startLeft;
      }
    } else if (sY === eY && sX <= eX) {
      if (result.eRight.x >= endRight.x) {
        result.eRight = endRight;
        result.eLeft = endLeft;
      }
      if (result.sRight.x >= endRight.x) {
        result.sRight = endRight;
        result.sLeft = endLeft;
      }
      if (result.sRight.x <= startRight.x) {
        result.sRight = startRight;
        result.sLeft = startLeft;
      }
      if (result.eRight.x <= startRight.x) {
        result.eRight = startRight;
        result.eLeft = startLeft;
      }
    } else if (sY === eY && sX > eX) {
      if (result.eRight.x < endRight.x) {
        result.eRight = endRight;
        result.eLeft = endLeft;
      }
      if (result.sRight.x < endRight.x) {
        result.sRight = endRight;
        result.sLeft = endLeft;
      }
      if (result.sRight.x > startRight.x) {
        result.sRight = startRight;
        result.sLeft = startLeft;
      }
      if (result.eRight.x > startRight.x) {
        result.eRight = startRight;
        result.eLeft = startLeft;
      }
    } else if (sX === eX && sY < eY) {
      if (result.eRight.y > endRight.y) {
        result.eRight = endRight;
        result.eLeft = endLeft;
      }
      if (result.sRight.y > endRight.y) {
        result.sRight = endRight;
        result.sLeft = endLeft;
      }
      if (result.sRight.y < startRight.y) {
        result.sRight = startRight;
        result.sLeft = startLeft;
      }
      if (result.eRight.y < startRight.y) {
        result.eRight = startRight;
        result.eLeft = startLeft;
      }
    } else if (sX === eX && sY > eY) {
      if (result.eRight.y <= endRight.y) {
        result.eRight = endRight;
        result.eLeft = endLeft;
      }
      if (result.sRight.y <= endRight.y) {
        result.sRight = endRight;
        result.sLeft = endLeft;
      }
      if (result.sRight.y >= startRight.y) {
        result.sRight = startRight;
        result.sLeft = startLeft;
      }
      if (result.eRight.y >= startRight.y) {
        result.eRight = startRight;
        result.eLeft = startLeft;
      }
    }
    return result;
  }

}
