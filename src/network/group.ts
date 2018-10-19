/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import convexHull from 'graham-scan-convex-hull/src/convex-hull';
import * as _ from 'lodash';
import * as PIXI from 'pixi.js';
import polygon from 'polygon';
import Offset from 'polygon-offset/dist/offset';
import { CommonElement, IPosition } from './common-element';
import { Edge } from './edge';
import ConvexHullGrahamScan from './lib/convex-hull';
import Line from './lib/line';
import { Node } from './node';

export class Group extends CommonElement {
  public isExpanded: boolean = true;
  private edgeList: Edge[] = [];
  private groupEdgeList: any[] = [];
  private positionList: IPosition[] = [];
  private networkEdges: Edge[];
  private polygonHullFrameName: string = _.uniqueId('hull_frame_');

  constructor(edges: Edge[]) {
    super();
    this.networkEdges = edges;
    this.draw();
  }

  public setExpaned(expanded: boolean) {
    this.isExpanded = expanded;
    this.toggleChildNodesVisible(expanded);
    this.draw();
  }

  public addChildNodes(element: Node | Group, preventDraw: boolean = false) {
    this.addChild(element);
    this.toggleChildNodesVisible(this.isExpanded, element);
    if (!preventDraw) {
      this.draw();
    }
    this.analyzeEdges();
  }

  public toggleChildNodesVisible(visible: boolean, element?: Node | Group) {
    const children = element ? [element] : this.children;
    _.each(children, (node) => {
      const nodeObject = node as (Node | Group);
      nodeObject.visible = visible;
    });
  }

  public getGroupVertexNumber() {
    this.positionList = [];
    this.vertexPoints(this.children);
    const vertexPointsList = _.map(this.positionList, (pos: IPosition) => {
      return _.values(pos);
    });
    return vertexPointsList;
  }

  public getGroupPosition() {
    const vertexPointsList = this.getGroupVertexNumber();
    if (!vertexPointsList.length) {
      return [];
    }
    const center = (new polygon(vertexPointsList)).center();
    return [center.x, center.y];
  }

  public setEdgeList(element: any) {
    this.edgeList.push(element);
  }

  public setGroupEdgeList(element: any) {
    this.groupEdgeList.push(element);
  }

  public getEdgeList() {
    return this.edgeList;
  }

  public getAllVisibleNodes(children?: PIXI.DisplayObject[]) {
    const nodes: Node[] = [];
    _.each(children || this.children, (node) => {
      if (node instanceof Node) {
        nodes.push(node);
      } else if (node instanceof Group && node.children.length > 0) {
        this.getAllVisibleNodes(node.children);
      }
    });
    return nodes;
  }

  public vertexPoints(children: PIXI.DisplayObject[]) {
    _.each(children, (node) => {
      if (node instanceof Node || node instanceof Group) {
        this.positionList.push({
          x: node.x,
          y: node.y,
        });
        if (node instanceof Group && node.children.length > 0) {
          this.vertexPoints(node.children);
        }
      }
    });
  }

  public drawGroupNode() {
    const position = this.getGroupPosition();
    const graph = new PIXI.Graphics();
    const style = this.defaultStyle;
    graph.lineStyle(style.lineWidth, style.lineWidth);
    graph.beginFill(style.fillColor, style.fillOpacity);
    graph.drawCircle(position[0], position[1], style.width);
    graph.endFill();
    graph.interactive = true;
    graph.buttonMode = true;
    this.addChild(graph);
  }

  public marginPolygon(rectVertexPoints: number[], margin: number) {
    const offset = new Offset();
    return offset.data(rectVertexPoints).margin(margin || 10);
  }

  public getHulls(rectVertexPoints: number[][]) {
    if (_.size(rectVertexPoints) < 3) {
      throw Error('Get hulls error: Points count must greater than 3.');
    }
    const convexHullScan = new ConvexHullGrahamScan();
    if (rectVertexPoints.length === 0) return false;
    convexHullScan.addPoints(rectVertexPoints);
    let hulls = convexHullScan.getHull();
    hulls = _.map(hulls, (point) => {
      return point.toArray();
    });
    hulls.push(hulls[0]);
    return hulls;
  }

  public setFrameGraphicStyle(graphic: PIXI.Graphics) {
    const style = this.defaultStyle;
    graphic.lineStyle(style.lineWidth, style.lineColor);
    graphic.beginFill(style.fillColor, style.fillOpacity);
    return graphic;
  }

  public createFrameGraphic() {
    const graph = new PIXI.Graphics();
    graph.name = this.polygonHullFrameName;
    graph.interactive = true;
    graph.buttonMode = true;
    this.addChild(graph);
    return graph;
  }

  public drawPolygonStyle(graph: PIXI.Graphics, vertexPointsNumber: number[][]) {
    const polygonObject: any = new polygon(vertexPointsNumber);
    const rectVertexPoints = polygonObject.toArray();
    const hulls = this.getHulls(rectVertexPoints);
    const marginedPolygon: any = this.marginPolygon(hulls, this.defaultStyle.margin);
    const coordinates: number[] = _.flattenDeep(marginedPolygon);
    graph.drawPolygon(coordinates);
    graph.endFill();
  }

  public drawEllipseStyle(graph: PIXI.Graphics, vertexPointsNumber: number[][]) {
    const nodes = this.getAllVisibleNodes();
    let ellipseWidth = 0;
    let ellipseHeight = 0;
    let ellipseX = 0;
    let ellipseY = 0;
    if (nodes.length === 2) {
      const nodesCoordinatesList = _.map(nodes, (node) => {
        if (! node) {
          return [0, 0];
        }
        return [node.x, node.y];
      });
      const nodeSize = _.map(nodes, (node) => {
        if (! node) {
          return [0, 0];
        }
        return [node.getWidth(), node.getHeight()];
      });
      const maxLength: number = _.max(_.flatten(nodeSize)) || 0;
      ellipseHeight =
        Math.sqrt(
          Math.pow(nodesCoordinatesList[0][0] - nodesCoordinatesList[1][0], 2) +
          Math.pow(nodesCoordinatesList[0][1] - nodesCoordinatesList[1][1], 2),
        );
      ellipseWidth = maxLength * 2;
      ellipseX = _.multiply(nodesCoordinatesList[1][0] + nodesCoordinatesList[0][0], 0.5);
      ellipseY = _.multiply(nodesCoordinatesList[1][1] + nodesCoordinatesList[0][1], 0.5);
      // console.log(ellipseX, ellipseY, ellipseWidth, ellipseHeight);
      graph.drawEllipse(ellipseX, ellipseY, ellipseWidth, ellipseHeight);
      // graph.rotation = 12;
      graph.on('click', () => {
        alert('222');
      });

    }
  }

  // draw polygon frame
  public drawGroupPolygonFrame() {
    const vertexPointsNumber = this.getGroupVertexNumber();
    const pointsCount = vertexPointsNumber.length;
    const graph = this.createFrameGraphic();
    this.setFrameGraphicStyle(graph);
    if (pointsCount === 0) {
      return false;
    }
    if (vertexPointsNumber.length > 2) {
      this.drawPolygonStyle(graph, vertexPointsNumber);
    } else {
      this.drawEllipseStyle(graph, vertexPointsNumber);
    }
  }

  public drawEdges() {
    // todo
  }

  public sortGraphicsIndex() {
    const graphic = this.getChildByName(this.polygonHullFrameName);
    const children = this.children;
    if (graphic) {
      this.setChildIndex(graphic, 0);
    }
  }

  public draw() {
    this.clearDisplayObjects();
    if (!this.isExpanded) {
      this.drawGroupNode();
      this.drawEdges();
    } else {
      this.drawGroupPolygonFrame();
    }
    this.sortGraphicsIndex();
  }

  private analyzeEdges() {
    const nodes = _.filter(this.children, (item) => {
      return item instanceof Node;
    });
    const edges = _.filter(this.networkEdges, (edge: Edge) => {
      const srcNode = edge.getSrcNode();
      const targetNode = edge.getTargetNode();
      if (_.includes(nodes, srcNode) || (_.includes(nodes, targetNode))) {
        return true;
      }
      return false;
    });

    // this.edgeList = _.groupBy(edges, (edge: Edge) => {
    //   const srcNodeId = edge.getSrcNode().getUID();
    //   const targetNodeId = edge.getTargetNode().getUID();
    //   return _.join([srcNodeId, targetNodeId].sort());
    // });
    // console.log(edges);
  }

}
