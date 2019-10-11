/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement } from './common-element';
import { Edge, IPoint } from './edge';
import { Node } from './node';

export interface ISize {
  width: number;
  height: number;
}

export class PortChannel extends CommonElement {
  public graphic: PIXI.Graphics;
  /* parameters with lines and ratio */
  private lines: Edge[];
  private ratio: number;
  /* origin point and destination points*/
  private startNode: any;
  private endNodes: Node[] = [];
  private ellipseWidth: number = 15;
  private linesPoints: IPoint[] = [];
  constructor(
    lines: Edge[],
    ratio?: number,
  ) {
    super();
    this.graphic = new PIXI.Graphics();
    this.lines = lines;
    this.ratio = ratio || 0.3;
    this.initNodesDirection();
    this.draw();
  }

  // basic draw
  public draw(): void {
    this.graphic.clear();
    this.drawChannel();
  }

  // Set up the ratio of the port channel on the line
  public setRatio(ratio: number) {
    this.ratio = ratio;
    this.draw();
  }

  public setChannelWidth(width: number) {
    this.ellipseWidth = width;
    this.draw();
  }

  private drawChannel() {
    const points = this.getPosition();
    const style = this.defaultStyle;
    const size = this.getSize();
    this.graphic.lineStyle(style.lineWidth, style.lineColor, 1);
    this.graphic.beginFill(style.fillColor, 1);
    this.graphic.drawEllipse(points.x, points.y, size.width, size.height);
    this.graphic.endFill();
    this.addChild(this.graphic);
  }

  // Get ellipse position
  private getPosition(): IPoint {
    this.linesPoints = [];
    const position: IPoint = { x: 0, y: 0 };
    _.each(this.endNodes, (node: Node) => {
      const linePoint = this.getRatioOfLine(
        this.formatNodeCoordinate(this.startNode),
        this.formatNodeCoordinate(node),
      );
      this.linesPoints.push(linePoint);
      position.x = position.x + linePoint.x;
      position.y = position.y + linePoint.y;
    });
    position.x = position.x / this.endNodes.length;
    position.y = position.y / this.endNodes.length;
    // console.log('position', position);
    return position;
  }

  private getSize(): ISize {
    const size: ISize = { width: 0, height: 0 };
    size.width = this.ellipseWidth;
    let distanceList: number[] = [];
    if (this.endNodes.length > 1) {
      /* same source but difference distination */
      _.each(this.linesPoints, (point: IPoint) => {
        distanceList.push(point.y);
      });
    } else {
      /* same source and same distination */
      _.each(this.lines, (line: Edge) => {
        distanceList.push(line.defaultStyle.bezierLineDistance);
      });
    }
    distanceList = distanceList.sort(this.sortNumber);
    const last = _.last(distanceList);
    const first = _.head(distanceList);
    if (last && first) {
      size.height = last - first;
    }
    return size;
  }

  // According to all the lines to get the same origin point and destination points
  private initNodesDirection() {
    const srcNodesList: Node[] = [];
    const destNodesList: Node[] = [];
    _.each(this.lines, (line: Edge) => {
      if (srcNodesList.indexOf(line.startNode) < 0) {
        srcNodesList.push(line.startNode);
        if (line.startNode.exceptEdgesArray.indexOf(this) < 0) {
          line.startNode.exceptEdgesArray.push(this);
        }
      }
      if (destNodesList.indexOf(line.endNode) < 0) {
        destNodesList.push(line.endNode);
        if (line.endNode.exceptEdgesArray.indexOf(this) < 0) {
          line.endNode.exceptEdgesArray.push(this);
        }
      }
    });
    if (srcNodesList.length === 1 && destNodesList.length >= 1) {
      this.startNode = srcNodesList[0];
      this.endNodes = destNodesList;
    } else if (srcNodesList.length > 1 && destNodesList.length === 1) {
      this.startNode = destNodesList[0];
      this.endNodes = srcNodesList;
    } else {
      throw Error('Port channel contains lines must be from the same point');
    }
  }

  // Take a percentage of the line coordinates
  private getRatioOfLine(srcPoint: IPoint, endPoint: IPoint): IPoint {
    const result = { x: 0, y: 0 };
    result.x = srcPoint.x + (endPoint.x - srcPoint.x) * this.ratio;
    result.y = srcPoint.y + (endPoint.y - srcPoint.y) * this.ratio;
    return result;
  }

  private formatNodeCoordinate(node: Node) {
    return { x: node.x, y: node.y };
  }

  private sortNumber(a: number, b: number) {
    return a - b;
  }

  private edgeLength(sx: number, sy: number, ex: number, ey: number) {
    return Math.pow(Math.pow(sx - ex, 2) + Math.pow(sy - ey, 2), 0.5);
  }

}
