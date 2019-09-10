/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement, IStyles } from './common-element';
import { EdgeGroup } from './edge-group';
import { Group } from './group';
import { Label } from './label';
import { Node } from './node';
import { Tooltip } from './tooltip';

const Point = PIXI.Point;

export interface IPoint {
  x: number;
  y: number;
}

export interface MarkInfo {
  content: string;
  color: number;
}
export interface IResultsPoints {
  sLeft: IPoint;
  sRight: IPoint;
  eRight: IPoint;
  eLeft: IPoint;
}

export interface IDottedPoints {
  start: IPoint;
  end: IPoint;
}

export class Edge extends CommonElement {
  public type: string = 'Edge';
  public endNode: any;
  public startNode: any;
  public edge: PIXI.Graphics;
  public arrow: PIXI.Graphics;
  public bundleParent: any;
  public includeGroup: EdgeGroup[] = [];
  public tooltip: Tooltip;
  public brotherEdges: Edge[] = [];
  public defaultColor: number = 0;
  public polygonData: number[] = [];
  private labelStyle: any;
  private labelContent: string[];

  constructor(startNode: Node | Group, endNode: Node | Group, domRegex?: string) {
    super();
    this.edge = new PIXI.Graphics();
    this.edge.name = 'edge_line';
    this.arrow = new PIXI.Graphics();
    this.arrow.name = 'edge_arrow';
    this.startNode = startNode;
    this.endNode = endNode;
    this.labelStyle = {};
    this.labelContent = [];
    this.interactive = true;
    this.buttonMode = true;
    this.readyLinkArray();
    this.analysisBrotherEdge();
    this.tooltip = new Tooltip(domRegex);
  }

  // Basic draw
  public draw() {
    this.clearEdgeRelatedGraph();
    const style = this.defaultStyle;
    const lineDistance = style.lineDistance;
    let srcNodePos = this.getLineNodePosition(this.startNode);
    let endNodePos = this.getLineNodePosition(this.endNode);
    const angle = this.getAngle(srcNodePos, endNodePos);
    srcNodePos = this.getAdjustedLocation(
      srcNodePos,
      -1,
      angle,
      this.getDistance(this.startNode, lineDistance),
    );
    endNodePos = this.getAdjustedLocation(
      endNodePos,
      1,
      angle,
      this.getDistance(this.endNode, lineDistance),
    );
    let elements: PIXI.Graphics[] = [];
    if (style.lineType === 0 && style.lineFull === 0) {
      elements = this.drawLineEdge(srcNodePos, endNodePos, this.defaultStyle);
    } else if (style.lineType === 1 && style.lineFull === 0) {
      elements = this.drawBezierEdge(srcNodePos, endNodePos, this.defaultStyle);
    } else if (style.lineType === 0 && style.lineFull === 1) {
      elements = this.drawImaginaryEdge(srcNodePos, endNodePos, this.defaultStyle);
    } else if (style.lineType === 1 && style.lineFull === 1) {
      elements = this.drawDottedEdge(srcNodePos, endNodePos, this.defaultStyle);
    }
    this.addChildren(elements);
    this.addOthers();
  }

  // Selected an edge
  public selectOn() {
    this.setStyle({
      lineColor: 0X024997,
    });
  }

  // Cancle selected on the edge
  public selectOff() {
    this.setStyle({
      lineColor: this.defaultColor,
    });
  }

  // Set up tooltip on the edge
  public setTooltip(content: string, style?: any) {
    this.removeListener('mouseover');
    this.removeListener('mouseout');
    this.tooltip.addTooltip(this, content || `${this.startNode.id}  >>>>  ${this.endNode.id}`, style);
    return this.tooltip;
  }

  // Set up label on the edge
  public setLabel(srcContent: string, endContent: string, style?: PIXI.TextStyleOptions) {
    if (style) {
      _.extend(this.labelStyle, style);
    }
    const oldSrc = this.getChildByName('edge_srclabel');
    const oldEnd = this.getChildByName('edge_endlabel');
    if (oldSrc || oldEnd) {
      oldSrc.destroy();
      oldEnd.destroy();
    }
    if (srcContent || endContent) {
      const srcLabel = new Label(srcContent, this.labelStyle);
      const endLabel = new Label(endContent, this.labelStyle);
      srcLabel.anchor.set(0.5, 1.5);
      endLabel.anchor.set(0.5, 1.5);
      this.labelContent.push(srcContent);
      this.labelContent.push(endContent);
      this.labelContent = _.uniq(this.labelContent);
      srcLabel.name = 'edge_srclabel';
      endLabel.name = 'edge_endlabel';
      this.addChild(srcLabel);
      this.addChild(endLabel);
      this.setLabelPosition(srcLabel, endLabel);
      if (this.defaultStyle.lineType === 1) {
        this.draw();
      }
      const result = {
        src: srcLabel,
        end: endLabel,
      };
      return result;
    }
  }

  // Set up mark on edge
  public setMark(srcMark?: MarkInfo, endMark?: MarkInfo) {
    if (srcMark) {
      /* src mark */
      this.removeChild(this.getChildByName('src_mark_background'));
      this.removeChild(this.getChildByName('src_mark_label'));
      const srcGraph = new PIXI.Graphics();
      srcGraph.name = 'src_mark_background';
      srcGraph.beginFill(srcMark.color, 1);
      srcGraph.drawCircle(0, 0, 7);
      srcGraph.endFill();
      this.addChild(srcGraph);
      const srcLabel = new Label(srcMark.content, {
        fill: 0Xffffff,
        fontFamily: 'Times New Roman',
        fontWeight: 'bold',
      });
      srcLabel.name = 'src_mark_label';
      srcLabel.setPosition(4);
      this.addChild(srcLabel);
      this.setChildIndex(srcLabel, this.children.length - 1);
      this.setChildIndex(srcLabel, this.children.length - 2);

    }
    if (endMark) {
      /* end mark */
      this.removeChild(this.getChildByName('end_mark_background'));
      this.removeChild(this.getChildByName('end_mark_label'));
      const endGraph = new PIXI.Graphics();
      endGraph.name = 'end_mark_background';
      endGraph.beginFill(endMark.color, 1);
      endGraph.drawCircle(0, 0, 7);
      endGraph.endFill();
      this.addChild(endGraph);
      const endLabel = new Label(endMark.content, {
        fill: 0Xffffff,
        fontFamily: 'Times New Roman',
        fontWeight: 'bold',
      });
      endLabel.name = 'end_mark_label';
      endLabel.setPosition(4);
      this.addChild(endLabel);
      this.setChildIndex(endLabel, this.children.length - 1);
      this.setChildIndex(endLabel, this.children.length - 2);
    }
  }

  // Get part of line position
  public getPartPosition(part: number) {
    const len = this.edgeLength(this.startNode.x, this.startNode.y, this.endNode.x, this.endNode.y) * part;
    const angle = Math.atan2(this.startNode.y - this.endNode.y, this.startNode.x - this.endNode.x);
    const result = {
      src: {
        x: 0,
        y: 0,
      },
      end: {
        x: 0,
        y: 0,
      },
    };
    if (this.defaultStyle.lineType !== 1) {
      result.src.x = this.startNode.x - len * Math.cos(angle);
      result.src.y = this.startNode.y - len * Math.sin(angle);
      result.end.x = this.endNode.x + len * Math.cos(angle);
      result.end.y = this.endNode.y + len * Math.sin(angle);
    }
    return result;
  }

  // Get edge group included this edge
  public setIncluedGroup(group: EdgeGroup) {
    this.includeGroup.push(group);
  }

  // Get Nodes sort UID string with this edge
  public edgeNodesSortUIDStr(edge?: Edge) {
    const edgeTmp = edge ? edge : this;
    return [edgeTmp.startNode.getUID(), edgeTmp.endNode.getUID()].sort().join();
  }

  public getSrcNode() {
    return this.startNode;
  }

  public getTargetNode() {
    return this.endNode;
  }

  public readyLinkArray() {
    if (this.startNode instanceof Node) {
      if (_.indexOf(this.startNode.linksArray, this) < 0) {
        this.startNode.linksArray.push(this);
      }
    } else {
      _.each(this.startNode.childrenNode, (node: Node) => {
        if (_.indexOf(node.linksArray, this) < 0) {
          node.linksArray.push(this);
        }
      });
    }
    if (this.endNode instanceof Node) {
      if (_.indexOf(this.endNode.linksArray, this) < 0) {
        this.endNode.linksArray.push(this);
      }
    } else {
      _.each(this.endNode.childrenNode, (node: Node) => {
        if (_.indexOf(node.linksArray, this) < 0) {
          node.linksArray.push(this);
        }
      });
    }
  }

  // Setup brother edges used to create Edge Bundle
  private analysisBrotherEdge() {
    const edgeList = this.startNode.linksArray;
    this.brotherEdges = _.filter(edgeList, (edge: Edge) => {
      return ((edge.startNode === this.startNode && edge.endNode === this.endNode)
        || (edge.startNode === this.endNode && edge.endNode === this.startNode));
    });
    _.remove(this.brotherEdges, (edge: Edge) => {
      return edge === this;
    });
  }

  // Get origin position with nodes or groups
  private getLineNodePosition(node: Node | Group) {
    let x: number = 0;
    let y: number = 0;
    if (node instanceof Node) {
      x = node.x;
      y = node.y;
    }

    if (node instanceof Group) {
      const position = node.getGroupPosition();
      if (position) {
        x = position.x;
        y = position.y;
      } else {
        x = 0;
        y = 0;
      }
    }
    return { x, y };
  }

  // Get line points
  private calcEdgePoints(start: any, end: any) {
    const lineWidth = this.defaultStyle.lineWidth;
    const lineDistance = this.defaultStyle.bezierLineDistance;
    const angle = this.getAngle();
    const half = lineWidth * 3;
    const sX = start.x + Math.cos(angle) * lineDistance;
    const sY = start.y - Math.sin(angle) * lineDistance;
    const eX = end.x + Math.cos(angle) * lineDistance;
    const eY = end.y - Math.sin(angle) * lineDistance;
    const result: IDottedPoints = {
      start: { x: sX, y: sY },
      end: { x: eX, y: eY },
    };
    this.polygonData = [];
    if ((sX < eX && sY < eY) ||
      (sX > eX && sY > eY)) {
      this.polygonData.push(
        sX - half,
        sY + half,
        sX + half,
        sY - half,
        eX + half,
        eY - half,
        eX - half,
        eY + half,
      );
    } else if ((sX > eX && sY < eY) ||
      (sX < eX && sY > eY)) {
      this.polygonData.push(
        sX - half,
        sY - half,
        sX + half,
        sY + half,
        eX + half,
        eY + half,
        eX - half,
        eY - half,
      );
    } else if (sX === eX &&
      (sY > eY || sY < eY)) {
      this.polygonData.push(
        sX - half,
        sY,
        sX + half,
        sY,
        eX + half,
        eY,
        eX - half,
        eY,
      );
    } else if (sY === eY &&
      (sX < eX || sX > eX)) {
      this.polygonData.push(
        sX,
        sY + half,
        sX,
        sY - half,
        eX,
        eY - half,
        eX,
        eY + half,
      );
    }
    return result;
  }

  // Get imaginary line points
  private calcDottedEdgePoints(start: any, end: any, lineWidth: number) {
    const angle = this.getAngle();
    const flowLength = 10;
    const xLength = start.x - end.x;
    const yLength = start.y - end.y;
    const distance = Math.sqrt(xLength * xLength + yLength * yLength);
    const segmentNum = (distance / flowLength / 2);
    const moveX = flowLength * Math.sin(angle);
    const moveY = flowLength * Math.cos(angle);
    const lineDistance = this.defaultStyle.bezierLineDistance;
    const pointsList = [];
    let sX = start.x + Math.cos(angle) * lineDistance;
    let sY = start.y - Math.sin(angle) * lineDistance;
    this.calcEdgePoints(start, end);
    for (let index = 0; index < segmentNum; index = index + 1) {
      const result: IDottedPoints = {
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
      };
      const dottedStart = new Point(sX, sY);
      const dottedEnd = new Point(sX - moveX, sY - moveY);
      sX = sX - moveX * 2;
      sY = sY - moveY * 2;
      result.start = dottedStart;
      result.end = dottedEnd;
      pointsList.push(result);
    }
    return pointsList;
  }

  // Draw edge with line points
  private drawEdge(graph: any, points: IDottedPoints) {
    const style = this.defaultStyle;
    this.hitArea = new PIXI.Polygon(this.polygonData);
    graph.lineStyle(style.lineWidth, style.lineColor);
    graph.moveTo(points.start.x, points.start.y);
    graph.lineTo(points.end.x, points.end.y);
  }

  // Draw imaginary line with imaginary line points
  private drawImaginaryLink(graph: any, points: IDottedPoints[]) {
    const style = this.defaultStyle;
    const isHit = this.hitTestRectangle(this.startNode, this.endNode);
    this.hitArea = new PIXI.Polygon(this.polygonData);
    if (!isHit) {
      _.each(points, (point) => {
        graph.lineStyle(style.lineWidth, style.lineColor);
        graph.moveTo(point.start.x, point.start.y);
        graph.lineTo(point.end.x, point.end.y);
      });
    }
  }

  // The length of the Pythagorean theorem to get the line
  private edgeLength(sx: number, sy: number, ex: number, ey: number) {
    return Math.pow(Math.pow(sx - ex, 2) + Math.pow(sy - ey, 2), 0.5);
  }

  // Get start node and end node angle
  private getAngle(
    srcNodeLocation?: { [key: string]: number }, endNodeLocation?: { [key: string]: number }) {
    const srcNodePos = srcNodeLocation || this.getLineNodePosition(this.startNode);
    const endNodePos = endNodeLocation || this.getLineNodePosition(this.endNode);
    return Math.atan2(srcNodePos.x - endNodePos.x, srcNodePos.y - endNodePos.y);
  }

  // Get the center of the curve
  private getControlPoint(
    srcNodePos: { [key: string]: number },
    endNodePos: { [key: string]: number },
  ) {
    const sx: number = srcNodePos.x;
    const sy: number = srcNodePos.y;
    const ex: number = endNodePos.x;
    const ey: number = endNodePos.y;
    const linkAngle = Math.atan2(sx - ex, sy - ey);
    const len = this.edgeLength(sx, sy, ex, ey) * 0.3;
    const sxc = sx - len * Math.sin(linkAngle);
    const syc = sy - len * Math.cos(linkAngle);
    const exc = ex + len * Math.sin(linkAngle);
    const eyc = ey + len * Math.cos(linkAngle);
    return [sxc, syc, exc, eyc];
  }

  // Get parallel points
  private getParallelPoint(edge: { [key: string]: number }, lineSpace: number, angle: number) {
    const x = _.get(edge, 'x', 0);
    const y = _.get(edge, 'y', 0);
    return {
      x: x + lineSpace * Math.cos(angle),
      y: y - lineSpace * Math.sin(angle),
    };
  }

  // Draw curve
  private drawBezierCurve(
    graph: any, points: any, angle: number, curveDistance: number, curveDegree: number) {
    this.polygonData = [];
    const parallelPoint = this.getParallelPoint(
      { x: points.shift(), y: points.shift() }, curveDistance, angle);
    const srcLabel = this.getChildByName('edge_srclabel');
    const endLabel = this.getChildByName('edge_endlabel');
    this.polygonData.push(parallelPoint.x, parallelPoint.y);
    graph.moveTo(parallelPoint.x, parallelPoint.y);
    points.reverse();
    points[1] = points[1] + curveDistance * Math.cos(angle);
    points[0] = points[0] - curveDistance * Math.sin(angle);
    points.reverse();
    points[0] = points[0] + curveDegree * Math.cos(angle);
    points[1] = points[1] - curveDegree * Math.sin(angle);
    points[2] = points[2] + curveDegree * Math.cos(angle);
    points[3] = points[3] - curveDegree * Math.sin(angle);
    if (srcLabel || endLabel) {
      srcLabel.x = points[0];
      srcLabel.y = points[1];
      endLabel.x = points[2];
      endLabel.y = points[3];
    }
    this.polygonData = this.polygonData.concat(points);
    graph.bezierCurveTo.apply(graph, points);
    this.hitArea = new PIXI.Polygon(this.polygonData);
    return [parallelPoint.x, parallelPoint.y].concat(points);
  }

  // Draw imaginary curve
  private drawDottedBezierCurve(graph: any, points: any, angle: number, curveDistance: number, curveDegree: number) {
    const parallelPoint = this.getParallelPoint(
      { x: points.shift(), y: points.shift() }, curveDistance, angle);
    const style = this.defaultStyle;
    const oldBezier = this.getChildByName('bezier');
    if (oldBezier) {
      oldBezier.destroy();
    }
    const bezier = new PIXI.Graphics();
    bezier.name = 'bezier';
    bezier.lineStyle(0, style.lineColor);
    this.polygonData = [];
    const srcLabel = this.getChildByName('edge_srclabel');
    const endLabel = this.getChildByName('edge_endlabel');
    this.polygonData.push(parallelPoint.x, parallelPoint.y);
    bezier.moveTo(parallelPoint.x, parallelPoint.y);
    points.reverse();
    points[1] = points[1] + curveDistance * Math.cos(angle);
    points[0] = points[0] - curveDistance * Math.sin(angle);
    points.reverse();
    points[0] = points[0] + curveDegree * Math.cos(angle);
    points[1] = points[1] - curveDegree * Math.sin(angle);
    points[2] = points[2] + curveDegree * Math.cos(angle);
    points[3] = points[3] - curveDegree * Math.sin(angle);
    if (srcLabel || endLabel) {
      srcLabel.x = points[0];
      srcLabel.y = points[1];
      endLabel.x = points[2];
      endLabel.y = points[3];
    }
    bezier.bezierCurveTo.apply(bezier, points);
    this.addChild(bezier);
    this.polygonData = this.polygonData.concat(points);
    this.hitArea = new PIXI.Polygon(this.polygonData);
    const calcPoints = _.chunk(bezier.currentPath.shape.points, 4);
    _.each(calcPoints, (point) => {
      const srcX = Number(point[0]);
      const srcY = Number(point[1]);
      const endX = Number(point[2]);
      const endY = Number(point[3]);
      graph.moveTo(srcX, srcY);
      graph.lineTo(endX, endY);
    });
    return [parallelPoint.x, parallelPoint.y].concat(points);
  }

  // Get adjusted position with start node and end node
  private getAdjustedLocation(node: any, n: number, angel: number, distanceRound: number) {
    const location = {
      x: node.x + n * distanceRound * Math.sin(angel),
      y: node.y + n * distanceRound * Math.cos(angel),
    };

    return location;
  }

  // Get the path of the arrow
  private getArrowPints(pos: any, angle: number, direction: boolean = true) {
    const arrowAngel = this.defaultStyle.arrowAngle;
    const middleLength = this.defaultStyle.arrowMiddleLength;
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

  // Create arrow
  private createArrow(position: any, angle: number, reverse: boolean = true) {
    const style = this.defaultStyle;
    this.arrow.name = 'edge_arrow';
    this.arrow.lineStyle(style.arrowWidth, style.arrowColor, 1);
    if (style.fillArrow) {
      this.arrow.beginFill(style.arrowColor);
    }
    const arrowPoints = this.getArrowPints(position, angle, reverse);
    this.arrow.drawPolygon(_.flatMap(_.map(
      _.values(arrowPoints), o => ([o.x, o.y]))));
    this.arrow.endFill();
    return this.arrow;
  }

  // Clear edge and arrow
  private clearEdgeRelatedGraph() {
    this.edge.clear();
    this.arrow.clear();
  }

  // Get distance to adjusted node position
  private getDistance(node: Node | Group, lineDistance: number) {
    let result;
    if (node instanceof Node) {
      result = node.getWidth() < node.getHeight() ? node.getWidth() / 2 : node.getHeight() / 2;
    } else {
      const pi = Math.atan2(node.getWidth() * 0.5, node.getHeight() * 0.5);
      const angle = this.getAngle();
      let oneSide = 0;
      if (angle <= pi && angle >= -pi) {
        oneSide = node.getHeight() * 0.5 / Math.cos(angle);
      }
      if (angle <= Math.PI && angle >= Math.PI - pi) {
        oneSide = node.getHeight() * 0.5 / Math.cos(angle);
      }
      if (angle <= -(Math.PI - pi) && angle >= -Math.PI) {
        oneSide = node.getHeight() * 0.5 / Math.cos(angle);
      }
      if (angle < Math.PI - pi && angle > pi) {
        oneSide = node.getWidth() * 0.5 / Math.sin(angle);
      }
      if (angle < -pi && angle > -(Math.PI - pi)) {
        oneSide = node.getWidth() * 0.5 / Math.sin(angle);
      }
      result = Math.abs(oneSide);
    }
    return result + lineDistance;
  }

  // Complete generated edge
  private createLinkEdge(srcNodePos: any, endNodePos: any, style: any) {
    const points = this.calcEdgePoints(srcNodePos, endNodePos);
    this.drawEdge(this.edge, points);
    return this.edge;
  }

  // Complete generated imaginary line
  private createImaginaryEdge(srcNodePos: any, endNodePos: any, style: any) {
    const pointsList = this.calcDottedEdgePoints(
      srcNodePos, endNodePos, style.lineWidth);
    this.drawImaginaryLink(this.edge, pointsList);
    return this.edge;
  }

  // Complete genneated arrow
  private createLinkArrows(
    start: any, end: any, style: any) {
    const arrowsDirections = [[true], [false], [true, false], [undefined]];
    const directions = arrowsDirections[style.arrowType];
    const lineDistance = this.defaultStyle.bezierLineDistance;
    const angle = this.getAngle();
    const sX = start.x + Math.cos(angle) * lineDistance;
    const sY = start.y - Math.sin(angle) * lineDistance;
    const eX = end.x + Math.cos(angle) * lineDistance;
    const eY = end.y - Math.sin(angle) * lineDistance;
    const srcPoint: IPoint = {
      x: sX,
      y: sY,
    };
    const endPoint: IPoint = {
      x: eX,
      y: eY,
    };
    _.each(directions, (direction) => {
      if (direction !== undefined) {
        const position = direction ? endPoint : srcPoint;
        this.createArrow(position, angle, direction);
      }
    });
    return this.arrow;
  }

  // Complete generated curve
  private createBezierEdge(
    srcNodePos: any,
    endNodePos: any,
    controlPoints: any,
    style: any,
  ) {
    const curveDistance = style.bezierLineDistance;
    const curveDegree = style.bezierLineDegree;
    const angle = this.getAngle();
    this.edge.lineStyle(style.lineWidth, style.lineColor);
    const curveEnds = this.drawBezierCurve(
      this.edge,
      _.flatten(
        [
          [
            srcNodePos.x,
            srcNodePos.y,
          ],
          controlPoints,
          [
            endNodePos.x,
            endNodePos.y,
          ],
        ],
      ),
      angle,
      curveDistance,
      curveDegree,
    );
    return curveEnds;
  }

  // Calculate bezier tangent
  private bezierTangent(a: number, b: number, c: number, d: number, t: number) {
    return 3 * t * t * (-a + 3 * b - 3 * c + d) + 6 * t * (a - 2 * b + c) + 3 * (-a + b);
  }

  // Get bezier angle
  private getTangentAngle(start: any, cps: any, end: any, t: any) {
    const tx = this.bezierTangent(start.x, cps[0], cps[2], end.x, t);
    const ty = this.bezierTangent(start.y, cps[1], cps[3], end.y, t);
    return Math.atan2(tx, ty) + Math.PI;
  }

  // Get curve's arrow points
  private bezierArrowPoints(
    pos: any,
    angleLine: any,
    endArrow: any,
    arrowAngel: any,
    arrowLength: any,
    middleLength: any,
  ) {
    const angelT = angleLine + arrowAngel * Math.PI / 180;
    const angelB = angleLine - arrowAngel * Math.PI / 180;
    const x = pos.x;
    const y = pos.y;
    const t = endArrow ? 1 : -1;
    return {
      p1: { x, y },
      p2: {
        x: x + arrowLength * Math.sin(angelT) * t,
        y: y + arrowLength * Math.cos(angelT) * t,
      },
      p3: {
        x: x + middleLength * Math.sin(angleLine) * t,
        y: y + middleLength * Math.cos(angleLine) * t,
      },
      p4: {
        x: x + arrowLength * Math.sin(angelB) * t,
        y: y + arrowLength * Math.cos(angelB) * t,
      },
    };
  }

  // Complete generated curve's arrow
  private createBezierArrows(
    srcNodePos: any,
    endNodePos: any,
    controlPoints: any,
    style: any,
  ) {
    this.arrow = new PIXI.Graphics();
    this.arrow.lineStyle(style.arrowWidth, style.arrowColor, 1);
    if (style.fillArrow) {
      this.arrow.beginFill(style.arrowColor);
    }
    const tangenAngle =
      this.getTangentAngle(srcNodePos, controlPoints, endNodePos, 1);
    const arrowsPoints = this.bezierArrowPoints(
      endNodePos,
      tangenAngle,
      1,
      this.defaultStyle.arrowAngle,
      this.defaultStyle.arrowLength,
      this.defaultStyle.arrowMiddleLength,
    );
    this.arrow.drawPolygon(_.flatMap(_.map(_.values(arrowsPoints), o => ([o.x, o.y]))));
    return this.arrow;
  }

  // Draw line edge
  private drawLineEdge(
    srcNodePos: { [key: string]: number },
    endNodePos: { [key: string]: number },
    style: IStyles) {
    const edge = this.createLinkEdge(srcNodePos, endNodePos, style);
    const arrow = this.createLinkArrows(srcNodePos, endNodePos, style);
    return [edge, arrow];
  }

  // Draw bezier edge
  private drawBezierEdge(
    srcNodePos: { [key: string]: number },
    endNodePos: { [key: string]: number },
    style: IStyles,
  ) {
    const controlPoints = this.getControlPoint(srcNodePos, endNodePos);
    const edgeRelated: any =
      this.createBezierEdge(
        srcNodePos,
        endNodePos,
        controlPoints,
        style,
      );
    if (style.arrowType === 3) {
      return [this.edge];
    }
    const arrow = this.createBezierArrows(
      { x: edgeRelated[0], y: edgeRelated[1] },
      { x: edgeRelated[edgeRelated.length - 2], y: edgeRelated[edgeRelated.length - 1] },
      [edgeRelated[2], edgeRelated[3], edgeRelated[4], edgeRelated[5]],
      style,
    );
    return [this.edge, arrow];
  }

  // Draw imaginary edge
  private drawImaginaryEdge(
    srcNodePos: any,
    endNodePos: any,
    style: any,
  ) {
    const srcNodePosAdjusted =
      this.getParallelPoint(srcNodePos, this.defaultStyle.lineDistance, this.getAngle());
    const endNodePosAdjusted =
      this.getParallelPoint(endNodePos, this.defaultStyle.lineDistance, this.getAngle());
    const edge = this.createImaginaryEdge(srcNodePosAdjusted, endNodePosAdjusted, style);
    const arrow = this.createLinkArrows(srcNodePos, endNodePos, style);
    return [edge, arrow];
  }

  // Draw imaginary curve
  private drawDottedEdge(
    srcNodePos: any,
    endNodePos: any,
    style: any,
  ) {
    const controlPoints = this.getControlPoint(srcNodePos, endNodePos);
    const curveDistance = style.bezierLineDistance;
    const curveDegree = style.bezierLineDegree;
    const angle = this.getAngle();
    this.edge.lineStyle(style.lineWidth, style.lineColor);
    const edgeRelated = this.drawDottedBezierCurve(
      this.edge,
      _.flatten(
        [
          [
            srcNodePos.x,
            srcNodePos.y,
          ],
          controlPoints,
          [
            endNodePos.x,
            endNodePos.y,
          ],
        ],
      ),
      angle,
      curveDistance,
      curveDegree,
    );
    if (style.arrowType === 3) {
      return [this.edge];
    }
    const arrow = this.createBezierArrows(
      { x: edgeRelated[0], y: edgeRelated[1] },
      { x: edgeRelated[edgeRelated.length - 2], y: edgeRelated[edgeRelated.length - 1] },
      [edgeRelated[2], edgeRelated[3], edgeRelated[4], edgeRelated[5]],
      style,
    );
    return [this.edge, arrow];
  }

  // Add label and so on after draw
  private addOthers() {
    const markLocation = this.getPartPosition(0.3);
    const centerLocation = this.getPartPosition(0.5);
    const bundleLabel = this.getChildByName('bundle_label');
    const bundleBackground = this.getChildByName('label_background');
    const srcMarkBackground = this.getChildByName('src_mark_background');
    const srcMarkLabel = this.getChildByName('src_mark_label');
    const endMarkBackground = this.getChildByName('end_mark_background');
    const endMarkLabel = this.getChildByName('end_mark_label');
    const srcLabel = this.getChildByName('edge_srclabel');
    const endLabel = this.getChildByName('edge_endlabel');
    if (bundleLabel && bundleBackground) {
      bundleLabel.x = centerLocation.src.x;
      bundleLabel.y = centerLocation.src.y;
      bundleBackground.x = centerLocation.src.x;
      bundleBackground.y = centerLocation.src.y;
      this.setChildIndex(bundleLabel, this.children.length - 1);
      this.setChildIndex(bundleBackground, this.children.length - 2);
    }
    if (srcLabel || endLabel) {
      this.setLabelPosition(srcLabel, endLabel);
    }
    if (srcMarkBackground && srcMarkLabel) {
      srcMarkBackground.x = markLocation.src.x;
      srcMarkBackground.y = markLocation.src.y;
      srcMarkLabel.x = markLocation.src.x;
      srcMarkLabel.y = markLocation.src.y;
      this.setChildIndex(srcMarkLabel, this.children.length - 1);
      this.setChildIndex(srcMarkBackground, this.children.length - 2);
    }
    if (endMarkBackground && endMarkLabel) {
      endMarkBackground.x = markLocation.end.x;
      endMarkBackground.y = markLocation.end.y;
      endMarkLabel.x = markLocation.end.x;
      endMarkLabel.y = markLocation.end.y;
      this.setChildIndex(endMarkLabel, this.children.length - 1);
      this.setChildIndex(endMarkBackground, this.children.length - 2);
    }
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

  // Set label position
  private setLabelPosition(srcLabel: PIXI.DisplayObject, endLabel: PIXI.DisplayObject) {
    const len = this.edgeLength(this.startNode.x, this.startNode.y, this.endNode.x, this.endNode.y) * 0.25;
    const angle = Math.atan2(this.startNode.y - this.endNode.y, this.startNode.x - this.endNode.x);
    // console.log('bezierLineDistance', this.defaultStyle.bezierLineDistance);
    // console.log(this.defaultStyle.bezierLineDegree);
    if (this.defaultStyle.lineType !== 1) {
      srcLabel.x = this.startNode.x - len * Math.cos(angle);
      srcLabel.y = this.startNode.y - len * Math.sin(angle);
      endLabel.x = this.endNode.x + len * Math.cos(angle);
      endLabel.y = this.endNode.y + len * Math.sin(angle);
    }
    if (this.startNode.x > this.endNode.x) {
      srcLabel.rotation = angle;
      endLabel.rotation = angle;
    } else {
      srcLabel.rotation = Math.atan2(this.endNode.y - this.startNode.y, this.endNode.x - this.startNode.x);
      endLabel.rotation = Math.atan2(this.endNode.y - this.startNode.y, this.endNode.x - this.startNode.x);
    }
  }

}
