/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */
import { CommonElement } from './common-element';
import { IPoint, IResultsPoints, LineCommonFunction } from './lib/line';
import { Node } from './node';

export interface IlineStyle {
  color: number;
  opacity: number;
}

export interface ISimpleSideStyle {
  left: IlineStyle;
  right: IlineStyle;
}

const Point = PIXI.Point;
export class MultipleColorLine extends CommonElement {
  public background: PIXI.Graphics;
  public type: string = 'MultipleColorLine';
  private leftRatio: number = 1;
  private rightRatio: number = 1;
  private start: Node;
  private end: Node;
  private leftLine: PIXI.Graphics;
  private rightLine: PIXI.Graphics;
  private lineFunction: LineCommonFunction;
  private eachSideStyle: ISimpleSideStyle;
  constructor(start: Node, end: Node) {
    super();
    this.start = start;
    this.end = end;
    this.background = new PIXI.Graphics();
    this.leftLine = new PIXI.Graphics();
    this.rightLine = new PIXI.Graphics();
    this.lineFunction = new LineCommonFunction(start, end);
    this.eachSideStyle = {
      left: {
        color: 0Xffff00,
        opacity: 1,
      },
      right: {
        color: 0X00ff00,
        opacity: 1,
      },
    };
    this.interactive = true;
    this.buttonMode = true;
    start.exceptEdgesArray.push(this);
    end.exceptEdgesArray.push(this);
  }

  // basic draw
  public draw(): void {
    this.clearOldGraphics();
    const nodePos = this.lineFunction.adustNodePos(this.defaultStyle);
    this.createBackground(nodePos.srcNode, nodePos.endNode);
    this.drawLeftLine();
    this.drawRightLine();
  }

  /**
   * Create a according to the specified proportion
   * from the start node is connected to the center line of graphics
   * @param {number} ratio how much need to draw ratio on the left side of the line
   */
  public createLeftLine(ratio: number, style?: IlineStyle) {
    this.leftRatio = ratio;
    if (style) {
      this.eachSideStyle.left = style;
    }
    this.drawLeftLine();
  }

  /**
   * Create a according to the specified proportion
   * from the end node is connected to the center line of graphics
   * @param {number} ratio how much need to draw ratio on the left side of the line
   */
  public createRightLine(ratio: number, style?: IlineStyle) {
    this.rightRatio = ratio;
    if (style) {
      this.eachSideStyle.right = style;
    }
    this.drawRightLine();
  }

  // Get left line
  public getLeftLine() {
    return this.leftLine;
  }

  // Get right line
  public getRightLine() {
    return this.rightLine;
  }

  public setLeftRatio(ratio: number) {
    this.leftRatio = ratio;
  }

  public setRightRatio(ratio: number) {
    this.rightRatio = ratio;
  }

  // Clear old graphics
  private clearOldGraphics() {
    this.background.clear();
    this.leftLine.clear();
    this.rightLine.clear();
  }

  // Get one side of link points
  private getOneSideLinkPoints(point: IPoint, rotio: number) {
    const nodePos = this.lineFunction.adustNodePos(this.defaultStyle);
    const centerPoint = this.lineFunction.getCenterPoint(nodePos.srcNode, nodePos.endNode);
    const result = { x: 0, y: 0 };
    result.x = point.x + (centerPoint.x - point.x) * rotio;
    result.y = point.y + (centerPoint.y - point.y) * rotio;
    return result;
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
      lineColor = 0xCCCCCC;
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
   * Calculate by the line, rectangle points position
   * @param {IPoint} start start node location
   * @param {IPoint} end end node location
   * @param {number} lineWidth line of width
   * @return {IResultsPoints} use the results to draw line rectangle
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

  private drawLeftLine() {
    const linkStyle = this.eachSideStyle.left;
    const graph = this.leftLine;
    const startDistance = this.lineFunction.getDistance(this.start, this.defaultStyle.lineDistance);
    const srcNodePos = this.lineFunction.getNodePosition(this.start);
    const srcNode = this.lineFunction.getAdjustedLocation(srcNodePos, -1, startDistance);
    const endNode = this.getOneSideLinkPoints(srcNode, this.leftRatio);
    const points = this.calcEdgePoints(srcNode, endNode);
    graph.beginFill(linkStyle.color, linkStyle.opacity);
    graph.moveTo(points.sLeft.x, points.sLeft.y);
    graph.lineTo(points.sRight.x, points.sRight.y);
    graph.lineTo(points.eRight.x, points.eRight.y);
    graph.lineTo(points.eLeft.x, points.eLeft.y);
    graph.endFill();
    this.background.addChild(graph);
  }

  private drawRightLine() {
    const linkStyle = this.eachSideStyle.right;
    const graph = this.rightLine;
    const endDistance = this.lineFunction.getDistance(this.end, this.defaultStyle.lineDistance);
    const endNodePos = this.lineFunction.getNodePosition(this.end);
    const endNode = this.lineFunction.getAdjustedLocation(endNodePos, 1, endDistance);
    const srcNode = this.getOneSideLinkPoints(endNode, this.rightRatio);
    const points = this.calcEdgePoints(srcNode, endNode);
    graph.beginFill(linkStyle.color, linkStyle.opacity);
    graph.moveTo(points.sLeft.x, points.sLeft.y);
    graph.lineTo(points.sRight.x, points.sRight.y);
    graph.lineTo(points.eRight.x, points.eRight.y);
    graph.lineTo(points.eLeft.x, points.eLeft.y);
    graph.endFill();
    this.background.addChild(graph);
  }

}
