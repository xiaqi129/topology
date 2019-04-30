/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */
import * as _ from 'lodash';
import polygon from 'polygon';
import Offset from 'polygon-offset/dist/offset';
import { CommonElement } from './common-element';
import { Edge } from './edge';
import ConvexHullGrahamScan from './lib/convex-hull';
import { Node } from './node';

export interface IPoint {
  x: number;
  y: number;
}

export class EdgeGroup extends CommonElement {
  public childrenEdge: Edge[] = [];
  public polygon: PIXI.Graphics;
  // drag
  private dragging: boolean = false;
  private last: any;
  private elements: CommonElement;
  constructor(elements: any) {
    super();
    this.elements = elements;
    this.polygon = new PIXI.Graphics();
    this.polygon.name = 'edge_group';
    this.setDrag();
  }

  public addChildEdges(edge: Edge) {
    this.childrenEdge.push(edge);
    edge.setIncluedGroup(this);
    if (this.childrenEdge) {
      this.draw();
    }
  }

  public draw(): void {
    this.polygon.clear();
    this.initPolygonOutline();
    const pointsList = this.getPolygonPoints();
    this.drawPolygon(pointsList);
  }

  private initPolygonOutline(): void {
    const graph = this.polygon;
    graph.interactive = true;
    graph.buttonMode = true;
    this.addChild(graph);
    const style = this.defaultStyle;
    graph.lineStyle(style.lineWidth, style.lineColor);
    graph.beginFill(style.fillColor, style.fillOpacity);
  }

  private getPolygonPoints(): number[][] {
    let pointsList: number[] = [];
    if (this.childrenEdge) {
      _.each(this.childrenEdge, (edge: Edge) => {
        pointsList = _.concat(pointsList, edge.polygonData);
      });
    }
    const vertexPoints: number[][] = _.chunk(pointsList, 2);
    return vertexPoints;
  }

  private drawPolygon(vertexPoints: number[][]): void {
    const graph = this.polygon;
    const style = this.defaultStyle;
    const polygonObject: any = new polygon(vertexPoints);
    const rectVertexPoints = polygonObject.toArray();
    const hulls = this.getHulls(rectVertexPoints);
    const marginedPolygon: any = this.marginPolygon(hulls, style.margin | 5);
    const coordinates: number[] = _.flattenDeep(marginedPolygon);
    graph.drawPolygon(coordinates);
    graph.endFill();
  }

  private getHulls(rectVertexPoints: number[][]) {
    if (_.size(rectVertexPoints) < 3) {
      throw Error('Get hulls error: Points count must greater than 3.');
    }
    const convexHullScan = new ConvexHullGrahamScan();
    if (rectVertexPoints.length === 0) {
      return false;
    }
    convexHullScan.addPoints(rectVertexPoints);
    let hulls = convexHullScan.getHull();
    hulls = _.map(hulls, (point) => {
      return point.toArray();
    });
    hulls.push(hulls[0]);
    return hulls;
  }

  private marginPolygon(rectVertexPoints: number[][], margin: number) {
    const offset = new Offset();
    return offset.data(rectVertexPoints).margin(margin || 10);
  }

  // set edge group can drag
  private setDrag() {
    const graphic = this.polygon;
    graphic.on('mousedown', this.onDragStart, this);
    graphic.on('mousemove', this.onDragMove, this);
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
  }

  private onDragStart(event: any) {
    event.stopPropagation();
    if (event.data.originalEvent.button === 0) {
      const parent = this.parent.toLocal(event.data.global);
      this.dragging = true;
      this.last = { parents: parent };
    }
  }

  private onDragMove(event: any) {
    if (this.dragging) {
      const newPosition = this.parent.toLocal(event.data.global);
      const edges = this.childrenEdge;
      const allEdgeGroups = this.getEdgeGroup();
      let nodesLinkEdges: any[] = [];
      let includeGroups: EdgeGroup[] = [];
      if (edges.length > 0) {
        _.each(edges, (edge: Edge) => {
          const startNode: Node = edge.startNode;
          const endNode: Node = edge.endNode;
          includeGroups = _.concat(includeGroups, edge.includeGroup);
          nodesLinkEdges = _.concat(nodesLinkEdges, startNode.linksArray, endNode.linksArray);
          if (!startNode.isLock) {
            startNode.position.x += newPosition.x - this.last.parents.x;
            startNode.position.y += newPosition.y - this.last.parents.y;
          }
          if (!endNode.isLock) {
            endNode.position.x += newPosition.x - this.last.parents.x;
            endNode.position.y += newPosition.y - this.last.parents.y;
          }
          edge.draw();
        });
        _.each(nodesLinkEdges, (edge: Edge) => {
          edge.draw();
        });
        _.each(includeGroups, (group) => {
          group.draw();
        });
        _.each(allEdgeGroups, (group) => {
          group.draw();
        });
      }
      this.last = { parents: newPosition };
      this.draw();
    } else {
      this.dragging = false;
    }
  }

  private onDragEnd() {
    this.dragging = false;
    this.last = null;
  }

  private getEdgeGroup() {
    const edgeGroups: EdgeGroup[] = [];
    _.each(this.elements, (element) => {
      if (element instanceof EdgeGroup) {
        edgeGroups.push(element);
      }
    });
    return edgeGroups;
  }

}
