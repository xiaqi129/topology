/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */
import * as _ from 'lodash';
import { CommonElement } from './common-element';
import { Label } from './label';
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
  private leftRatio: number = 1;
  private rightRatio: number = 1;
  private start: Node;
  private end: Node;
  private leftLine: PIXI.Graphics;
  private rightLine: PIXI.Graphics;
  private lineFunction: LineCommonFunction;
  private eachSideStyle: ISimpleSideStyle;
  /* LABEL */
  private labelIdList: string[] = [];
  private labelId: number = 0;
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
        color: 0Xef5050,
        opacity: 1,
      },
      right: {
        color: 0X20c1a1,
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
    if (this.midLine) {
      this.drawMidline();
    } else {
      this.removeMidline();
    }
    this.addLabel();
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

  // Set up the ratio and style of the left side of the multiple color line
  public setLeftLine(ratio: number, style?: IlineStyle) {
    this.leftRatio = ratio;
    if (style) {
      this.eachSideStyle.right = style;
    }
    this.draw();
  }

  // Set up the ratio and style of the right side of the multiple color line
  public setRightLine(ratio: number, style?: IlineStyle) {
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
    this.addChild(label);
    this.draw();
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

  // Set up the multiple color line of the midline
  private drawMidline() {
    const nodePos = this.lineFunction.adustNodePos(this.defaultStyle);
    const centerPoint: IPoint = this.lineFunction.getCenterPoint(nodePos.srcNode, nodePos.endNode);
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

  private addLabel() {
    _.each(this.labelObj, (data: ILabelData) => {
      this.setLabelPosition(data.label, data.ratio);
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
  }

  private deleteSpace(str: string) {
    const str1 = str.replace(/\s+$/, '');
    const str2 = str1.replace(/^\s+/, '');
    return str2;
  }

}
