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

export class Edge extends CommonElement {
  public startNode: any;
  public endNode: any;
  public edge: PIXI.Graphics;
  public arrow: PIXI.Graphics;
  public defaultColor: number = 0;
  public bundleExplosion: boolean = false;
  public labelToggle: boolean = false;
  public brotherEdges: Edge[] = [];
  public tooltip: Tooltip;
  public polygonData: number[] = [];
  public includeGroup: EdgeGroup[] = [];
  private labelStyle: any;
  private labelContent: string[];
  private bundleStyle: number = 1; // 0: link style, 1: bezier style

  constructor(startNode: Node | Group, endNode: Node | Group, domRegex?: string) {
    super();
    this.edge = new PIXI.Graphics();
    this.edge.name = 'edge_line';
    this.arrow = new PIXI.Graphics();
    this.arrow.name = 'edge_arrow';
    this.startNode = startNode;
    this.endNode = endNode;
    startNode.linksArray.push(this);
    endNode.linksArray.push(this);
    this.labelStyle = {};
    this.labelContent = [];
    this.draw();
    this.tooltip = new Tooltip(domRegex);
  }

  public getEdge() {
    return this.edge;
  }

  public setBundleStyle(styleNumber: number) {
    if (this.parent instanceof Edge) {
      this.parent.bundleStyle = styleNumber;
      this.parent.draw();
    } else {
      this.bundleStyle = styleNumber;
      this.draw();
    }
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
    let eRight: any = {};
    let eLeft: any = {};
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

  public calcDottedEdgePoints(start: any, end: any, lineWidth: number) {
    const half = lineWidth * 0.5;
    const breakNum = 15;
    const breakLength = 5;
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

  public drawEdge(graph: any, points: any) {
    const style = this.defaultStyle;
    graph.interactive = true;
    graph.lineStyle(style.lineWidth, style.lineColor);
    graph.beginFill(style.lineColor, style.fillOpacity);
    graph.moveTo(points.sLeft.x, points.sLeft.y);
    graph.lineTo(points.sRight.x, points.sRight.y);
    graph.lineTo(points.eRight.x, points.eRight.y);
    graph.lineTo(points.eLeft.x, points.eLeft.y);
    graph.endFill();
  }

  public drawImaginaryLink(graph: any, points: any) {
    const style = this.defaultStyle;
    graph.interactive = true;
    _.each(points, (point) => {
      graph.lineStyle(style.lineWidth, style.lineColor);
      graph.beginFill(style.lineColor, style.fillOpacity);
      graph.moveTo(point.sLeft.x, point.sLeft.y);
      graph.lineTo(point.sRight.x, point.sRight.y);
      graph.lineTo(point.eRight.x, point.eRight.y);
      graph.lineTo(point.eLeft.x, point.eLeft.y);
      graph.endFill();
    });
  }

  public edgeLength(sx: number, sy: number, ex: number, ey: number) {
    return Math.pow(Math.pow(sx - ex, 2) + Math.pow(sy - ey, 2), 0.5);
  }

  public getAngle(
    srcNodeLocation?: { [key: string]: number }, endNodeLocation?: { [key: string]: number }) {
    const srcNodePos = srcNodeLocation || this.getLineNodePosition(this.startNode);
    const endNodePos = endNodeLocation || this.getLineNodePosition(this.endNode);
    return Math.atan2(srcNodePos.x - endNodePos.x, srcNodePos.y - endNodePos.y);
  }

  public getControlPoint(
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

  public getParallelPoint(edge: { [key: string]: number }, lineSpace: number, angle: number) {
    const x = _.get(edge, 'x', 0);
    const y = _.get(edge, 'y', 0);
    return {
      x: x + lineSpace * Math.cos(angle),
      y: y - lineSpace * Math.sin(angle),
    };
  }

  public drawBezierCurve(
    graph: any, points: any, angle: number, curveDistance: number = 10, curveDegree: number = 50) {
    const style = this.defaultStyle;
    graph.lineStyle(0, style.lineColor);
    // const srcPointX = points.shift() + curveDistance * Math.cos(angle);
    // const srcPointY = points.shift() - curveDistance * Math.sin(angle);
    const parallelPoint = this.getParallelPoint(
      { x: points.shift(), y: points.shift() }, curveDistance, angle);
    const srcLabel = this.getChildByName('edge_srclabel');
    const endLabel = this.getChildByName('edge_endlabel');
    graph.interactive = true;
    graph.beginFill(style.lineColor, style.bezierOacity);
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
    graph.bezierCurveTo.apply(graph, points);
    this.polygonData = _.take(graph.currentPath.shape.points, 42);
    const echoDistance = style.lineWidth * 1.5; // curve width
    const echoPoints = [];
    const echoSrc = this.getParallelPoint(
      { x: parallelPoint.x, y: parallelPoint.y },
      echoDistance,
      angle,
    );
    echoPoints.push(echoSrc.y, echoSrc.x);
    for (let i: number = 0, len: number = points.length; i < len; i += 2) {
      const tmp = this.getParallelPoint(
        { x: points[i], y: points[i + 1] },
        echoDistance,
        angle,
      );
      echoPoints.push(tmp.y, tmp.x);
    }
    echoPoints.reverse();
    graph.lineTo(echoPoints.shift(), echoPoints.shift());
    graph.bezierCurveTo.apply(graph, echoPoints);
    graph.endFill();
    return [parallelPoint.x, parallelPoint.y].concat(points);
  }

  public drawDottedBezierCurve(
    graph: any, points: any, angle: number, curveDistance: number = 10, curveDegree: number = 50) {
    const style = this.defaultStyle;
    const bezier = new PIXI.Graphics();
    bezier.lineStyle(0, style.lineColor);
    const parallelPoint = this.getParallelPoint(
      { x: points.shift(), y: points.shift() }, curveDistance, angle);
    const srcLabel = this.getChildByName('edge_srclabel');
    const endLabel = this.getChildByName('edge_endlabel');
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
    this.polygonData = bezier.currentPath.shape.points;
    const calcPoints = _.chunk(bezier.currentPath.shape.points, 4);
    _.each(calcPoints, (point) => {
      const srcX = Number(point[0]);
      const srcY = Number(point[1]);
      const endX = Number(point[2]);
      const endY = Number(point[3]);
      const linePoints = this.calcEdgePoints({ x: srcX, y: srcY }, { x: endX, y: endY }, style.lineWidth);
      graph.lineStyle(1, style.lineColor);
      graph.beginFill(style.lineColor, style.bezierOacity);
      graph.moveTo(linePoints.sLeft.x, linePoints.sLeft.y);
      graph.lineTo(linePoints.sRight.x, linePoints.sRight.y);
      graph.lineTo(linePoints.eRight.x, linePoints.eRight.y);
      graph.lineTo(linePoints.eLeft.x, linePoints.eLeft.y);
      graph.endFill();
    });
  }

  public getSrcNode() {
    return this.startNode;
  }

  public getTargetNode() {
    return this.endNode;
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
   * :0 from --> to
   * :1 from <-- to
   * :2 from <-> to
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

  public getAdjustedLocation(node: any, n: number, angel: number, distanceRound: number) {
    const location = {
      x: node.x + n * distanceRound * Math.sin(angel),
      y: node.y + n * distanceRound * Math.cos(angel),
    };

    return location;
  }

  public getArrowPints(pos: any, angle: number, direction: boolean = true) {
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

  public createArrow(position: any, angle: number, reverse: boolean = true) {
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

  public clearEdgeRelatedGraph() {
    this.edge.clear();
    if (this.arrow) {
      this.arrow.clear();
    }
  }

  public getDistance(node: Node | Group, lineDistance: number) {
    const result = node.getWidth() < node.getHeight() ? node.getWidth() : node.getHeight();
    return result * 0.5 + lineDistance;
  }

  public createLinkEdge(srcNodePos: any, endNodePos: any, style: any) {
    const points = this.calcEdgePoints(
      srcNodePos, endNodePos, style.lineWidth);
    this.drawEdge(this.edge, points);
    const polygonData: number[] = [];
    _.each(points, (point) => {
      polygonData.push(point.x, point.y);
    });
    this.polygonData = polygonData;
    return this.edge;
  }

  public createImaginaryEdge(srcNodePos: any, endNodePos: any, style: any) {
    const pointsList = this.calcDottedEdgePoints(
      srcNodePos, endNodePos, style.lineWidth);
    const polygonData: number[] = [];
    const points = this.calcEdgePoints(
      srcNodePos, endNodePos, style.lineWidth);
    _.each(points, (point) => {
      polygonData.push(point.x, point.y);
    });
    this.polygonData = polygonData;
    this.drawImaginaryLink(this.edge, pointsList);
    return this.edge;
  }

  public createLinkArrows(
    srcNodePos: any, endNodePos: any, angle: any, style: any) {
    const arrowsDirections = [[true], [false], [true, false], [undefined]];
    const directions = arrowsDirections[style.arrowType];
    _.each(directions, (direction) => {
      if (direction !== undefined) {
        const position = direction ? endNodePos : srcNodePos;
        this.createArrow(position, angle, direction);
      }
    });
    return this.arrow;
  }

  public getBrotherEdges() {
    return this.brotherEdges;
  }

  public removeBrotherEdge(edge: Edge) {
    const edges = _.remove(this.brotherEdges, (brotherEdge: Edge) => {
      return brotherEdge === edge;
    });
    if (edges) {
      this.draw();
    }
  }

  public edgeNodesSortUIDStr(edge?: Edge) {
    const edgeTmp = edge ? edge : this;
    return [edgeTmp.getSrcNode().getUID(), edgeTmp.getTargetNode().getUID()].sort().join();
  }

  public addEdgesToBundle(edge: Edge) {
    if (
      edge instanceof Edge &&
      edge.getBrotherEdges.length === 0
    ) {
      const edgeNodesIDStr = this.edgeNodesSortUIDStr(edge);
      const currentEdgeNodesIDStr = this.edgeNodesSortUIDStr(this);
      if (edgeNodesIDStr === currentEdgeNodesIDStr) {
        this.brotherEdges.push(edge);
        this.draw();
      } else {
        throw Error('Brother edges added, must drawn between same nodes.');
      }
    } else {
      throw Error(
        'The element must be intance of Edge and should be without other brother edges.');
    }
  }

  public getChildEdges() {
    const children = this.brotherEdges;
    // _.filter()
  }

  public createBezierEdge(
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
    return [this.edge, curveEnds];
  }

  public bezierTangent(a: number, b: number, c: number, d: number, t: number) {
    return 3 * t * t * (-a + 3 * b - 3 * c + d) + 6 * t * (a - 2 * b + c) + 3 * (-a + b);
  }

  public getTangentAngle(start: any, cps: any, end: any, t: any) {
    const tx = this.bezierTangent(start.x, cps[0], cps[2], end.x, t);
    const ty = this.bezierTangent(start.y, cps[1], cps[3], end.y, t);
    return Math.atan2(tx, ty) + Math.PI;
  }

  public bezierArrowPoints(
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

  public createBezierArrows(
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

  public selectOn() {
    const highLight = {
      lineColor: 0X024997,
    };
    _.extend(this.defaultStyle, highLight);
    this.draw();
  }

  public selectOff() {
    this.setStyle({
      lineColor: this.defaultColor,
    });
  }

  public drawLineEdge(
    srcNodePos: { [key: string]: number },
    endNodePos: { [key: string]: number },
    angle: number,
    style: IStyles) {
    const edge = this.createLinkEdge(srcNodePos, endNodePos, style);
    const arrow = this.createLinkArrows(srcNodePos, endNodePos, angle, style);
    return [edge, arrow];
  }

  public drawBezierEdge(
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
    const curveEnds = edgeRelated[1];
    if (style.arrowType === 3) {
      return [edgeRelated[0]];
    }
    const arrow = this.createBezierArrows(
      { x: curveEnds[0], y: curveEnds[1] },
      { x: curveEnds[curveEnds.length - 2], y: curveEnds[curveEnds.length - 1] },
      [curveEnds[2], curveEnds[3], curveEnds[4], curveEnds[5]],
      style,
    );
    return [edgeRelated[0], arrow];
  }

  public drawImaginaryEdge(
    srcNodePos: any,
    endNodePos: any,
    style: any,
  ) {
    const srcNodePosAdjusted =
      this.getParallelPoint(srcNodePos, this.defaultStyle.lineDistance, this.getAngle());
    const endNodePosAdjusted =
      this.getParallelPoint(endNodePos, this.defaultStyle.lineDistance, this.getAngle());
    const edge = this.createImaginaryEdge(srcNodePosAdjusted, endNodePosAdjusted, style);
    return [edge];
  }

  public drawDottedEdge(
    srcNodePos: any,
    endNodePos: any,
    style: any,
  ) {
    const controlPoints = this.getControlPoint(srcNodePos, endNodePos);
    const curveDistance = style.bezierLineDistance;
    const curveDegree = style.bezierLineDegree;
    const angle = this.getAngle();
    this.edge.lineStyle(style.lineWidth, style.lineColor);
    this.drawDottedBezierCurve(
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
    return [this.edge];
  }

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
    let elements: any[] = [];
    if (style.lineType === 0 && style.lineFull === 0) {
      elements = this.drawLineEdge(srcNodePos, endNodePos, angle, this.defaultStyle);
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

  public setIncluedGroup(group: EdgeGroup) {
    this.includeGroup.push(group);
  }

  public setTooltip(content?: string, style?: any) {
    this.removeAllListeners();
    this.tooltip.addTooltip(this, content || `${this.startNode.id}  >>>>  ${this.endNode.id}`, style);
  }

  public addOthers() {
    const bundleLabel = this.getChildByName('bundle_label');
    const bundleBackground = this.getChildByName('label_background');
    const srcLabel = this.getChildByName('edge_srclabel');
    const endLabel = this.getChildByName('edge_endlabel');
    if (bundleLabel && bundleBackground) {
      bundleLabel.x = (this.startNode.x + this.endNode.x) / 2;
      bundleLabel.y = (this.startNode.y + this.endNode.y) / 2;
      bundleBackground.x = (this.startNode.x + this.endNode.x) / 2;
      bundleBackground.y = (this.startNode.y + this.endNode.y) / 2;
      this.setChildIndex(bundleLabel, this.children.length - 1);
      this.setChildIndex(bundleBackground, this.children.length - 2);
    }
    if (srcLabel || endLabel) {
      this.setLabelPosition(srcLabel, endLabel);
    }
  }

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
      this.labelContent.push(srcContent);
      this.labelContent.push(endContent);
      this.labelContent = _.uniq(this.labelContent);
      srcLabel.setPosition(0);
      endLabel.setPosition(0);
      srcLabel.name = 'edge_srclabel';
      endLabel.name = 'edge_endlabel';
      this.setLabelPosition(srcLabel, endLabel);
      this.addChild(srcLabel);
      this.addChild(endLabel);
      if (this.defaultStyle.lineType === 1) {
        this.draw();
      }
    }
  }

  public getLabelContent() {
    return this.labelContent;
  }

  public getLabelStyle() {
    return this.labelStyle;
  }

  public setLabelPosition(srcLabel: PIXI.DisplayObject, endLabel: PIXI.DisplayObject) {
    const len = this.edgeLength(this.startNode.x, this.startNode.y, this.endNode.x, this.endNode.y) * 0.2;
    const angle = Math.atan2(this.startNode.y - this.endNode.y, this.startNode.x - this.endNode.x);
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
