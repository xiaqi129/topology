/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */
import Bezier from 'bezier-js/lib/bezier';
import * as _ from 'lodash';
import { CommonElement } from './common-element';
import { Label } from './label';
import { IPoint, IResultsPoints, LineCommonFunction } from './lib/line';
import { Node } from './node';
import { Tooltip } from './tooltip';

export interface IlineStyle {
  color: number;
  opacity: number;
}

export interface IArrowStyle {
  color: number;
  opacity: number;
  lineWidth?: number;
}
export interface ISimpleSideStyle {
  left: IlineStyle;
  startArrow: IArrowStyle;
  right: IlineStyle;
  endArrow: IArrowStyle;
}

export interface ILabel {
  content: string;
  ratio: number;
  style?: PIXI.TextStyleOptions;
}

export interface ILabelData {
  style: object;
  ratio: number;
  label: Label;
}

const Point = PIXI.Point;
export class MultipleColorLine extends CommonElement {
  public background: PIXI.Graphics;
  public type: string = 'MultipleColorLine';
  public labelObj: any = {};
  public midLine: boolean = false;
  public tooltip: Tooltip;
  private leftRatio: number = 1;
  private rightRatio: number = 1;
  private start: Node;
  private end: Node;
  private leftLine: PIXI.Graphics;
  private rightLine: PIXI.Graphics;
  private lineFunction: LineCommonFunction;
  private eachSideStyle: ISimpleSideStyle;
  /* ARROW */
  private startArrow: PIXI.Graphics;
  private endArrow: PIXI.Graphics;
  private isStartArrow: boolean = false;
  private isEndArrow: boolean = false;
  /* LABEL */
  private labelIdList: string[] = [];
  private labelId: number = 0;
  /* BESIZER CURVE */
  private bezierPoints: IPoint[] = [];
  constructor(start: Node, end: Node, domRegex: string) {
    super();
    this.start = start;
    this.end = end;
    this.background = new PIXI.Graphics();
    this.leftLine = new PIXI.Graphics();
    this.rightLine = new PIXI.Graphics();
    this.startArrow = new PIXI.Graphics();
    this.endArrow = new PIXI.Graphics();
    this.lineFunction = new LineCommonFunction(start, end);
    this.eachSideStyle = {
      // red
      left: {
        color: 0Xef5050,
        opacity: 1,
      },
      startArrow: {
        color: 0Xef5050,
        opacity: 1,
      },
      // green
      right: {
        color: 0X20c1a1,
        opacity: 1,
      },
      endArrow: {
        color: 0X20c1a1,
        opacity: 1,
      },
    };
    this.interactive = true;
    this.buttonMode = true;
    this.tooltip = new Tooltip(domRegex);
    start.exceptEdgesArray.push(this);
    end.exceptEdgesArray.push(this);
    this.analysisBrotherEdge();
  }

  // basic draw
  public draw(): void {
    this.clearOldGraphics();
    const style = this.defaultStyle;
    let centerPoint: IPoint = { x: 0, y: 0 };
    if (style.lineType === 0) {
      this.createBackground();
      this.drawLeftLine();
      this.drawRightLine();
      this.drawStartToEndArrow();
      this.drawEndToStartArrow();
      centerPoint = this.getLineCenterPoint();
    } else {
      this.createBezierBackground();
      this.drawBezierLeftLine();
      this.drawBezierRightLine();
      this.drawBezierStartToEndArrow();
      this.drawBezierEndToStartArrow();
      centerPoint = this.getBeizerCurveCenterPoint();
    }
    this.addLabel();
    if (this.midLine) {
      this.drawMidline(centerPoint);
    } else {
      this.removeMidline();
    }
  }

  /**
   * Create a according to the specified proportion
   * from the start node is connected to the center line of graphics
   * @param {number} ratio how much need to draw ratio on the left side of the line
   */
  public createStartLine(ratio: number, style?: IlineStyle) {
    const defaultStyle = this.defaultStyle;
    if (ratio > 1 || ratio <= 0) {
      throw Error('Ratio must be greater than zero and less than 1');
    }
    this.leftRatio = ratio;
    if (style) {
      this.eachSideStyle.left = style;
    }
    if (defaultStyle.lineType === 0) {
      this.drawLeftLine();
    } else {
      this.drawBezierLeftLine();
    }
    this.background.addChild(this.leftLine);
  }

  /**
   * Create a according to the specified proportion
   * from the end node is connected to the center line of graphics
   * @param {number} ratio how much need to draw ratio on the left side of the line
   */
  public createEndLine(ratio: number, style?: IlineStyle) {
    const defaultStyle = this.defaultStyle;
    if (ratio > 1 || ratio <= 0) {
      throw Error('Ratio must be greater than zero and less than 1');
    }
    this.rightRatio = ratio;
    if (style) {
      this.eachSideStyle.right = style;
    }
    if (defaultStyle.lineType === 0) {
      this.drawRightLine();
    } else {
      this.drawBezierRightLine();
    }
    this.background.addChild(this.rightLine);
  }

  // Get left line
  public getStartLine() {
    return this.leftLine;
  }

  // Get right line
  public getEndLine() {
    return this.rightLine;
  }

  public getEndArrow() {
    return this.startArrow;
  }

  public getStartArrow() {
    return this.endArrow;
  }

  // Set up the ratio and style of the left side of the multiple color line
  public setStartLine(ratio: number, style?: IlineStyle) {
    this.leftRatio = ratio;
    if (style) {
      this.eachSideStyle.left = style;
    }
    this.draw();
  }

  // Set up the ratio and style of the right side of the multiple color line
  public setEndLine(ratio: number, style?: IlineStyle) {
    if (style) {
      this.eachSideStyle.right = style;
    }
    this.rightRatio = ratio;
    this.draw();
  }

  // Set up the multiple color line with or without midLine.(default is without midLine)
  public setMidline(flag: boolean) {
    this.midLine = flag;
    this.draw();
  }

  public setLabel(content: string, ratio: number, style?: PIXI.TextStyleOptions) {
    this.labelId += 1;
    const labelId = `label_${this.labelId}`;
    this.labelIdList.push(labelId);
    this.labelObj[labelId] = {};
    this.labelObj[labelId].style = {};
    _.extend(this.labelObj[labelId].style, {
      fontSize: 14,
      wordWrap: true,
      wordWrapWidth: 10,
    });
    if (style) {
      _.extend(this.labelObj[labelId].style, style);
    }
    const label = new Label(content, this.labelObj[labelId].style);
    label.name = labelId;
    this.labelObj[labelId].label = label;
    this.labelObj[labelId].ratio = ratio;
    this.draw();
  }

  // Set up tooltip on the edge
  public setTooltip(content: string, style?: any) {
    this.removeListener('mouseover');
    this.removeListener('mouseout');
    this.tooltip.addTooltip(this, content, style);
    return this.tooltip;
  }

  // Create arrow
  public createStartArrow(style?: IArrowStyle) {
    const defaultStyle = this.defaultStyle;
    if (style) {
      this.eachSideStyle.startArrow = style;
    }
    this.isStartArrow = true;
    if (defaultStyle.lineType === 0) {
      this.drawStartToEndArrow();
    } else {
      this.drawBezierStartToEndArrow();
    }
    this.background.addChild(this.startArrow);
  }

  public createEndArrow(style?: IArrowStyle) {
    const defaultStyle = this.defaultStyle;
    if (style) {
      this.eachSideStyle.endArrow = style;
    }
    this.isEndArrow = true;
    if (defaultStyle.lineType === 0) {
      this.drawEndToStartArrow();
    } else {
      this.drawBezierEndToStartArrow();
    }
    this.background.addChild(this.endArrow);
  }

  public setStartArrow(style: IArrowStyle) {
    if (style) {
      this.eachSideStyle.startArrow = style;
    }
    const oldStartArrow = this.background.getChildByName('start_end_arrow');
    if (oldStartArrow) {
      this.isStartArrow = true;
      this.draw();
    }
  }

  public setEndArrow(style: IArrowStyle) {
    if (style) {
      this.eachSideStyle.endArrow = style;
    }
    const oldEndArrow = this.background.getChildByName('end_start_arrow');
    if (oldEndArrow) {
      this.isEndArrow = true;
      this.draw();
    }
  }

  public visibleElement(element: PIXI.Graphics, flag: boolean) {
    element.visible = flag;
    if (element.name && element.name.indexOf('arrow') !== -1) {
      if (element.name === 'start_end_arrow') {
        this.isStartArrow = flag;
      } else if (element.name === 'end_start_arrow') {
        this.isEndArrow = flag;
      }
      this.draw();
    }
  }

  private drawStartToEndArrow() {
    const style = this.eachSideStyle.startArrow;
    const nodePos = this.lineFunction.adustNodePos(this.defaultStyle);
    const angle = this.lineFunction.getAngle();
    this.startArrow.name = 'start_end_arrow';
    this.startArrow.lineStyle(1 || style.lineWidth, style.color, style.opacity);
    if (this.defaultStyle.fillArrow) {
      this.startArrow.beginFill(style.color);
    }
    const arrowPoints = this.getArrowPints(nodePos.srcNode, angle, true);
    this.startArrow.drawPolygon(_.flatMap(_.map(
      _.values(arrowPoints), o => ([o.x, o.y]))));
    this.startArrow.endFill();
    return this.startArrow;
  }

  private drawBezierStartToEndArrow() {
    const style = this.eachSideStyle.startArrow;
    const points = this.bezierPoints;
    this.startArrow.lineStyle(1 || style.lineWidth, style.color, style.opacity);
    if (this.defaultStyle.fillArrow) {
      this.startArrow.beginFill(style.color);
    }
    const angle = this.getTangentAngle(points[3], points[2], points[1], points[0], 1);
    const arrowPoints = this.getBezierArrowPints(
      points[0],
      angle,
      false,
    );
    this.startArrow.drawPolygon(_.flatMap(_.map(
      _.values(arrowPoints), o => ([o.x, o.y]))));
    this.startArrow.endFill();
    this.startArrow.name = 'start_end_arrow';
    return this.startArrow;
  }

  private drawEndToStartArrow() {
    const style = this.eachSideStyle.endArrow;
    const nodePos = this.lineFunction.adustNodePos(this.defaultStyle);
    const angle = this.lineFunction.getAngle();
    this.endArrow.name = 'end_start_arrow';
    this.endArrow.lineStyle(1 || style.lineWidth, style.color, style.opacity);
    if (this.defaultStyle.fillArrow) {
      this.endArrow.beginFill(style.color);
    }
    const arrowPoints = this.getArrowPints(nodePos.endNode, angle, false);
    this.endArrow.drawPolygon(_.flatMap(_.map(
      _.values(arrowPoints), o => ([o.x, o.y]))));
    this.endArrow.endFill();
    return this.endArrow;
  }

  private drawBezierEndToStartArrow() {
    const style = this.eachSideStyle.endArrow;
    const points = this.bezierPoints;
    if (this.defaultStyle.fillArrow) {
      this.endArrow.beginFill(style.color);
    }
    const angle = this.getTangentAngle(points[0], points[1], points[2], points[3], 1);
    const arrowPoints = this.getArrowPints(
      points[3],
      angle,
      false,
    );
    this.endArrow.drawPolygon(_.flatMap(_.map(
      _.values(arrowPoints), o => ([o.x, o.y]))));
    this.endArrow.endFill();
    this.endArrow.name = 'end_start_arrow';
    return this.endArrow;
  }

  // Get bezier angle
  private getTangentAngle(start: IPoint, cp1: IPoint, cp2: IPoint, end: IPoint, t: number) {
    const tx = this.bezierTangent(start.x, cp1.x, cp2.x, end.x, t);
    const ty = this.bezierTangent(start.y, cp2.y, cp2.y, end.y, t);
    return Math.atan2(tx, ty) + Math.PI;
  }

  // Calculate bezier tangent
  private bezierTangent(a: number, b: number, c: number, d: number, t: number) {
    return 3 * t * t * (-a + 3 * b - 3 * c + d) + 6 * t * (a - 2 * b + c) + 3 * (-a + b);
  }
  // Clear old graphics
  private clearOldGraphics() {
    this.background.clear();
    this.leftLine.clear();
    this.rightLine.clear();
    this.startArrow.clear();
    this.endArrow.clear();
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

  // Set up the multiple color line of the midline
  private drawMidline(centerPoint: IPoint) {
    this.removeMidline();
    const lineWidth = this.defaultStyle.lineWidth;
    const midLine = new PIXI.Graphics();
    midLine.name = 'midLine';
    midLine.lineStyle(0);
    midLine.beginFill(0X74b9ff, 1);
    midLine.drawCircle(centerPoint.x, centerPoint.y, lineWidth * 4);
    midLine.endFill();
    this.background.addChild(midLine);
  }

  // Remove the multiple color line of the midline
  private removeMidline() {
    const oldMidline = this.background.getChildByName('midLine');
    if (oldMidline) {
      this.background.removeChild(oldMidline);
    }
  }

  /**
   * draw background of the multiple color line
   */
  private createBackground(): void {
    const style = this.defaultStyle;
    const graph = this.background;
    let startDistance;
    let endDistance;
    if (!this.isStartArrow) {
      startDistance = this.lineFunction.getDistance(this.start, style.lineDistance);
    } else {
      startDistance = this.lineFunction.getDistance(this.start, style.lineDistance + style.lineWidth * 10);
    }
    if (!this.isEndArrow) {
      endDistance = this.lineFunction.getDistance(this.end, style.lineDistance);
    } else {
      endDistance = this.lineFunction.getDistance(this.end, style.lineDistance + style.lineWidth * 10);
    }
    const endNodePos = this.lineFunction.getNodePosition(this.end);
    const endNode = this.lineFunction.getAdjustedLocation(endNodePos, 1, endDistance);
    const srcNodePos = this.lineFunction.getNodePosition(this.start);
    const srcNode = this.lineFunction.getAdjustedLocation(srcNodePos, -1, startDistance);
    const points = this.calcEdgePoints(srcNode, endNode);
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
   * draw background of the multiple color bezier curve
   */
  private createBezierBackground(): void {
    const style = this.defaultStyle;
    const graph = this.background;
    const curveDistance = style.bezierLineDistance;
    const curveDegree = style.bezierLineDegree;
    const nodePos = this.lineFunction.adustNodePos(style);
    const originPoints = [];
    let lineColor;
    const originControlPoints = this.lineFunction.getControlPoint(nodePos.srcNode, nodePos.endNode);
    if (this.invariableStyles && this.invariableStyles.lineColor && this.invariableStyles.lineColor !== 0xEEEEEE) {
      lineColor = this.invariableStyles.lineColor;
    } else {
      lineColor = 0xCCCCCC;
    }
    graph.lineStyle(style.lineWidth * 8, lineColor);
    originPoints.push(nodePos.srcNode);
    originPoints.push({ x: originControlPoints[0], y: originControlPoints[1] });
    originPoints.push({ x: originControlPoints[2], y: originControlPoints[3] });
    originPoints.push(nodePos.endNode);
    const points = this.calcBezierCurvePoints(originPoints, curveDistance, curveDegree);
    this.bezierPoints = points;
    const hitAreaData = [points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y];
    graph.moveTo(points[0].x, points[0].y);
    graph.bezierCurveTo(points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
    this.hitArea = new PIXI.Polygon(hitAreaData);
    this.addChild(graph);
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

  private getCurvePointsWithRatio(points: IPoint[], ratio: number, isLeft: boolean): IPoint[] {
    let curve;
    if (isLeft) {
      curve = new Bezier(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
    } else {
      curve = new Bezier(points[3].x, points[3].y, points[2].x, points[2].y, points[1].x, points[1].y, points[0].x, points[0].y);
    }
    const split = curve.split(0, ratio / 2);
    return split.points;
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
    const style = this.defaultStyle;
    let startDistance;
    if (!this.isStartArrow) {
      startDistance = this.lineFunction.getDistance(this.start, style.lineDistance);
    } else {
      startDistance = this.lineFunction.getDistance(this.start, style.lineDistance + style.lineWidth * 10);
    }
    const srcNodePos = this.lineFunction.getNodePosition(this.start);
    const srcNode = this.lineFunction.getAdjustedLocation(srcNodePos, -1, startDistance);
    const endNode = this.getOneSideLinkPoints(srcNode, this.leftRatio);
    const points = this.calcEdgePoints(srcNode, endNode);
    graph.name = 'left_line';
    graph.beginFill(linkStyle.color, linkStyle.opacity);
    graph.moveTo(points.sLeft.x, points.sLeft.y);
    graph.lineTo(points.sRight.x, points.sRight.y);
    graph.lineTo(points.eRight.x, points.eRight.y);
    graph.lineTo(points.eLeft.x, points.eLeft.y);
    graph.endFill();
  }

  private drawBezierLeftLine() {
    const linkStyle = this.eachSideStyle.left;
    const graph = this.leftLine;
    const style = this.defaultStyle;
    const points = this.getCurvePointsWithRatio(this.bezierPoints, this.leftRatio, true);
    graph.name = 'left_line';
    graph.lineStyle(style.lineWidth * 8, linkStyle.color, linkStyle.opacity);
    graph.moveTo(points[0].x, points[0].y);
    graph.bezierCurveTo(points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
  }

  private drawRightLine() {
    const linkStyle = this.eachSideStyle.right;
    const graph = this.rightLine;
    const style = this.defaultStyle;
    let endDistance;
    if (!this.isEndArrow) {
      endDistance = this.lineFunction.getDistance(this.end, style.lineDistance);
    } else {
      endDistance = this.lineFunction.getDistance(this.end, style.lineDistance + style.lineWidth * 10);
    }
    const endNodePos = this.lineFunction.getNodePosition(this.end);
    const endNode = this.lineFunction.getAdjustedLocation(endNodePos, 1, endDistance);
    const srcNode = this.getOneSideLinkPoints(endNode, this.rightRatio);
    const points = this.calcEdgePoints(srcNode, endNode);
    graph.name = 'right_line';
    graph.beginFill(linkStyle.color, linkStyle.opacity);
    graph.moveTo(points.sLeft.x, points.sLeft.y);
    graph.lineTo(points.sRight.x, points.sRight.y);
    graph.lineTo(points.eRight.x, points.eRight.y);
    graph.lineTo(points.eLeft.x, points.eLeft.y);
    graph.endFill();
  }

  private drawBezierRightLine() {
    const linkStyle = this.eachSideStyle.right;
    const graph = this.rightLine;
    const style = this.defaultStyle;
    graph.name = 'right_line';
    const points = this.getCurvePointsWithRatio(this.bezierPoints, this.rightRatio, false);
    graph.lineStyle(style.lineWidth * 8, linkStyle.color, linkStyle.opacity);
    graph.moveTo(points[0].x, points[0].y);
    graph.bezierCurveTo(points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
  }

  private addLabel() {
    _.each(this.labelObj, (data: ILabelData) => {
      if (this.defaultStyle.lineType === 0) {
        this.setLabelPosition(data.label, data.ratio);
      } else {
        this.setBezierLabelPosition(data.label, data.ratio);
      }
    });
  }

  // Set label position
  private setLabelPosition(label: Label, ratio: number) {
    const startDistance = this.lineFunction.getDistance(this.start, this.defaultStyle.lineDistance);
    const srcNodePos = this.lineFunction.getNodePosition(this.start);
    const srcNode = this.lineFunction.getAdjustedLocation(srcNodePos, -1, startDistance);
    const point = this.getOneSideLinkPoints(srcNode, ratio);
    const nodePos = this.lineFunction.adustNodePos(this.defaultStyle);
    label.anchor.set(0.5, 0.5);
    const length = this.deleteSpace(label.getText()).split(/\s+/).length;
    const angle = this.lineFunction.getAngle();
    const height = Number(label.style.fontSize) + 8 * (length - 1);
    label.x = point.x - Math.cos(angle) * height;
    label.y = point.y + Math.sin(angle) * height;
    if (this.start.x > this.end.x) {
      label.rotation = Math.atan2(nodePos.srcNode.y - nodePos.endNode.y, nodePos.srcNode.x - nodePos.endNode.x);
    } else {
      label.rotation = Math.atan2(nodePos.endNode.y - nodePos.srcNode.y, nodePos.endNode.x - nodePos.srcNode.x);
    }
    this.addChild(label);
  }

  private setBezierLabelPosition(label: Label, ratio: number) {
    const points = this.bezierPoints;
    const curve = new Bezier(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
    const point = curve.get(ratio / 2);
    const nodePos = this.lineFunction.adustNodePos(this.defaultStyle);
    label.anchor.set(0.5, 0.5);
    const angle = this.getTangentAngle(points[3], points[2], points[1], points[0], 1);
    const length = this.deleteSpace(label.getText()).split(/\s+/).length;
    const height = Number(label.style.fontSize) + 8 * (length - 1);
    if (this.defaultStyle.bezierLineDegree > 0) {
      label.x = point.x - Math.cos(angle) * height;
      label.y = point.y + Math.sin(angle) * height;
    } else {
      label.x = point.x + Math.cos(angle) * height;
      label.y = point.y - Math.sin(angle) * height;
    }
    if (this.start.x > this.end.x) {
      label.rotation = Math.atan2(nodePos.srcNode.y - nodePos.endNode.y, nodePos.srcNode.x - nodePos.endNode.x);
    } else {
      label.rotation = Math.atan2(nodePos.endNode.y - nodePos.srcNode.y, nodePos.endNode.x - nodePos.srcNode.x);
    }
    this.addChild(label);
  }

  private deleteSpace(str: string) {
    const str1 = str.replace(/\s+$/, '');
    const str2 = str1.replace(/^\s+/, '');
    return str2;
  }

  private getBeizerCurveCenterPoint() {
    const points = this.bezierPoints;
    const curve = new Bezier(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
    const centerPoint = curve.get(0.5);
    return centerPoint;
  }

  private getLineCenterPoint() {
    const nodePos = this.lineFunction.adustNodePos(this.defaultStyle);
    const centerPoint = this.lineFunction.getCenterPoint(nodePos.srcNode, nodePos.endNode);
    return centerPoint;
  }

  // Get the path of the arrow
  private getArrowPints(pos: IPoint, angle: number, direction: boolean) {
    const style = this.defaultStyle;
    const arrowAngel = style.arrowAngle;
    const angelT = angle + _.divide(arrowAngel * Math.PI, 180);
    const angelB = angle - _.divide(arrowAngel * Math.PI, 180);
    const x = pos.x;
    const y = pos.y;
    const t = direction ? -1 : 1;
    return {
      p1: { x: x + 0, y: y + 0 },
      p2: {
        x: x + style.lineWidth * 15 * Math.sin(angelT) * t,
        y: y + style.lineWidth * 15 * Math.cos(angelT) * t,
      },
      p3: {
        x: x + style.lineWidth * 15 * Math.sin(angelB) * t,
        y: y + style.lineWidth * 15 * Math.cos(angelB) * t,
      },
      p4: { x: x + 0, y: y + 0 },
    };
  }

  // Get the path of the arrow
  private getBezierArrowPints(pos: IPoint, angle: number, direction: boolean) {
    const style = this.defaultStyle;
    const arrowAngel = style.arrowAngle;
    const angelT = angle + _.divide(arrowAngel * Math.PI, 180);
    const angelB = angle - _.divide(arrowAngel * Math.PI, 180);
    const x = pos.x;
    const y = pos.y;
    const t = direction ? -1 : 1;
    return {
      p1: { x: x + 0, y: y + 0 },
      p2: {
        x: x + style.lineWidth * 15 * Math.sin(angelT) * t,
        y: y + style.lineWidth * 15 * Math.cos(angelT) * t,
      },
      p3: {
        x: x + style.lineWidth * 15 * Math.sin(angelB) * t,
        y: y + style.lineWidth * 15 * Math.cos(angelB) * t,
      },
      p4: { x: x + 0, y: y + 0 },
    };
  }

  // Setup brother edges used to create Edge Bundle
  private analysisBrotherEdge() {
    const multipleColorLines = this.start.exceptEdgesArray;
    const brotherLines = _.filter(multipleColorLines, (multipleLine: MultipleColorLine) => {
      return ((multipleLine.start === this.start && multipleLine.end === this.end)
        || (multipleLine.start === this.end && multipleLine.end === this.start));
    });
    if (brotherLines.length > 1) {
      this.setBundleEdgesPosition(brotherLines);
    }
  }

  private setBundleEdgesPosition(multipleLines: any[]) {
    const degree = 30;
    const degreeStep = 8;
    const values: number[][] = [];
    const distance = 10;
    const distanceStep = 4;
    const isSameDirection = _.every(multipleLines, (multipleLine: MultipleColorLine) => {
      return multipleLine.start === this.start;
    });
    _.each(multipleLines, (multipleLine: MultipleColorLine, i: number) => {
      if (isSameDirection) {
        _.each([1, -1], (j) => {
          values.push([(distance + i * distanceStep) * j, (degree + i * degreeStep) * j]);
        });
      } else {
        values.push([(distance + i * distanceStep), (degree + i * degreeStep)]);
      }
    });
    _.each(multipleLines, (multipleLine: MultipleColorLine, i) => {
      if (multipleLine instanceof MultipleColorLine) {
        multipleLine.setStyle({
          bezierLineDistance: values[i][0],
          bezierLineDegree: values[i][1],
          lineType: 1,
        });
      }
    });
  }
}
