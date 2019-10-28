/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement } from './common-element';
import { Edge, IPoint } from './edge';
import { Label } from './label';
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
  /* set up label */
  private labelStyle: any;
  private labelPosition: string = 'center';
  private centerPoint: IPoint = { x: 0, y: 0 };
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
    this.updateLabelPos();
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

  public setLabel(content: string, position?: string, style?: PIXI.TextStyleOptions) {
    const channelLabel = this.getChildByName('label');
    if (channelLabel) {
      channelLabel.destroy();
    }
    if (style) {
      _.extend(this.labelStyle, style);
    }
    const label = new Label(content || undefined, this.labelStyle);
    label.anchor.set(0.5, 0.5);
    label.name = 'label';
    label.alpha = 0.8;
    label.interactive = false;
    label.buttonMode = false;
    if (position) {
      this.labelPosition = position;
    }
    this.addChild(label);
    const labelPos: IPoint = this.getLabelPos();
    label.x = labelPos.x;
    label.y = labelPos.y;
    return label;
  }

  public setLabelPosition(position: string) {
    this.labelPosition = position;
    this.draw();
  }

  public setLabelText(content: string) {
    const label: any = this.getChildByName('label');
    if (label) {
      label.setText(content);
      return label;
    }
  }

  private getLabelPos() {
    let height = 0;
    let width = 0;
    let fontSize;
    const channelLabel: any = this.getChildByName('label');
    if (channelLabel) {
      fontSize = channelLabel.style.fontSize;
    }
    let labelPos: IPoint = { x: 0, y: 0 };
    height = this.graphic.getBounds().height;
    width = this.graphic.getBounds().width;
    switch (this.labelPosition) {
      case 'center':
        labelPos = { x: 0, y: 0 };
        break;
      case 'bottom':
        labelPos = { x: 0, y: height / 2 + fontSize };
        break;
      case 'top':
        labelPos = { x: 0, y: -(height / 2 + fontSize) };
        break;
      case 'top-left':
        labelPos = { x: -(width / 2 + channelLabel.width / 2), y: -(height / 2 + fontSize) };
        break;
      case 'top-right':
        labelPos = { x: width / 2 + channelLabel.width / 2, y: -(height / 2 + fontSize) };
        break;
      case 'left':
        labelPos = { x: -(width / 2 + channelLabel.width / 2), y: 0 };
        break;
      case 'right':
        labelPos = { x: width / 2 + channelLabel.width / 2, y: 0 };
        break;
      case 'bottom-left':
        labelPos = { x: -(width / 2 + channelLabel.width / 2), y: height / 2 + fontSize };
        break;
      case 'bottom-right':
        labelPos = { x: width / 2 + channelLabel.width / 2, y: height / 2 + fontSize };
        break;
      default:
        labelPos = { x: 0, y: 0 };
        break;
    }
    labelPos.x = this.centerPoint.x + labelPos.x;
    labelPos.y = this.centerPoint.y + labelPos.y;
    return labelPos;
  }

  private updateLabelPos() {
    const label = this.getChildByName('label');
    if (label) {
      const labelPos = this.getLabelPos();
      label.x = labelPos.x;
      label.y = labelPos.y;
      this.setChildIndex(label, this.children.length - 1);
    }
  }

  private drawChannel() {
    const points: IPoint = this.getPosition();
    const style = this.defaultStyle;
    const size = this.getSize();
    const angle = this.calcAngle(points);
    this.graphic.rotation = angle;
    this.graphic.lineStyle(style.lineWidth, style.lineColor, 1);
    this.graphic.beginFill(style.fillColor, 1);
    this.graphic.drawEllipse(0, 0, size.width, size.height);
    this.graphic.position.x = points.x;
    this.graphic.position.y = points.y;
    this.graphic.endFill();
    this.addChild(this.graphic);
  }

  // Get ellipse position
  private getPosition(): IPoint {
    this.linesPoints = [];
    const position: IPoint = { x: 0, y: 0 };
    const rateList: number[] = [];
    let linePoint: IPoint;
    if (this.endNodes.length > 1) {
      _.each(this.endNodes, (node: Node, i: number) => {
        if (this.endNodes[0] && this.endNodes[i + 1]) {
          const rate = this.getLineLength(this.endNodes[0]) / this.getLineLength(this.endNodes[i + 1]);
          rateList.push(rate);
          linePoint = this.getRatioOfLine(
            this.formatNodeCoordinate(this.startNode),
            this.formatNodeCoordinate(node),
            this.ratio,
          );
        }
        if (i) {
          linePoint = this.getRatioOfLine(
            this.formatNodeCoordinate(this.startNode),
            this.formatNodeCoordinate(node),
            this.ratio * rateList[i - 1],
          );
        }
        this.linesPoints.push(linePoint);
        position.x = position.x + linePoint.x;
        position.y = position.y + linePoint.y;
      });
    } else {
      linePoint = this.getRatioOfLine(
        this.formatNodeCoordinate(this.startNode),
        this.formatNodeCoordinate(this.endNodes[0]),
        this.ratio,
      );
      this.linesPoints.push(linePoint);
      position.x = position.x + linePoint.x;
      position.y = position.y + linePoint.y;
    }
    position.x = position.x / this.endNodes.length;
    position.y = position.y / this.endNodes.length;
    this.centerPoint = position;
    return position;
  }

  private getSize(): ISize {
    const size: ISize = { width: 0, height: 0 };
    let first: any;
    let last: any;
    size.width = this.ellipseWidth;
    if (this.endNodes.length > 1) {
      /* same source but difference distination */
      this.setSortPoint(this.linesPoints);
      last = _.last(this.linesPoints);
      first = _.head(this.linesPoints);
      if (last && first) {
        size.height = this.edgeLength(last, first);
      }
    } else {
      /* same source and same distination */
      let distanceList: number[] = [];
      _.each(this.lines, (line: Edge) => {
        distanceList.push(line.defaultStyle.bezierLineDistance);
      });
      distanceList = distanceList.sort(this.sortNumber);
      last = _.last(distanceList);
      first = _.head(distanceList);
      if (last && first) {
        size.height = (last - first) * 1.5;
      }
    }
    return size;
  }

  private getAngle(srcNodePos: IPoint, endNodePos: IPoint, type: number): number {
    let result;
    if (type === 1) {
      result = Math.atan2(srcNodePos.y - endNodePos.y, srcNodePos.x - endNodePos.x);
    } else {
      result = Math.atan2(endNodePos.y - srcNodePos.y, endNodePos.x - srcNodePos.x);
    }
    return result;
  }

  private calcAngle(point: IPoint) {
    return this.getAngle(this.formatNodeCoordinate(this.startNode), point, -1);
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
  private getRatioOfLine(srcPoint: IPoint, endPoint: IPoint, ratio: number): IPoint {
    const result = { x: 0, y: 0 };
    result.x = srcPoint.x + (endPoint.x - srcPoint.x) * ratio;
    result.y = srcPoint.y + (endPoint.y - srcPoint.y) * ratio;
    return result;
  }

  private formatNodeCoordinate(node: Node) {
    return { x: node.x, y: node.y };
  }

  private sortNumber(a: number, b: number) {
    return a - b;
  }

  private getLineLength(node: Node) {
    return this.edgeLength(this.formatNodeCoordinate(this.startNode), this.formatNodeCoordinate(node));
  }

  private edgeLength(srcNode: IPoint, endNode: IPoint) {
    return Math.pow(Math.pow(srcNode.x - endNode.x, 2) + Math.pow(srcNode.y - endNode.y, 2), 0.5);
  }

  private setSortPoint(arry: IPoint[]) {
    const len = arry.length;
    for (let i = 0; i < len - 1; i += 1) {
      for (let j = 0; j < len - 1 - i; j += 1) {
        if (this.setSortRule(arry[j], arry[j + 1])) {
          const tmp = arry[j];
          arry[j] = arry[j + 1];
          arry[j + 1] = tmp;
        }
      }
    }
  }

  private setSortRule(p1: IPoint, p2: IPoint) {
    let result;
    if (p1.y > p2.y) {
      result = true;
    } else if (p1.y === p2.y) {
      result = (p1.x > p2.x);
    } else {
      result = false;
    }
    return result;
  }

}
