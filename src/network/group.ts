/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

// import convexHull from 'graham-scan-convex-hull/src/convex-hull';
import * as _ from 'lodash';
import polygon from 'polygon';
import Offset from 'polygon-offset/dist/offset';
import { CommonElement, IPosition } from './common-element';
import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { GroupEdge } from './edge-conn-group';
import ConvexHullGrahamScan from './lib/convex-hull';
// import Point from './lib/point';
import { Node } from './node';

interface IEvent {
  [event: string]: (edges: Edge[]) => {};
}

export class Group extends CommonElement {
  public groupEdgesEvent?: IEvent = {};
  public isExpanded: boolean = true;
  public groupEdges: GroupEdge[] = [];
  private positionList: IPosition[] = [];
  private elements: Edge | CommonElement[];
  private polygonHullOutlineName: string = _.uniqueId('hull_outline_');
  private childrenNode: Node[] = [];
  private outLineStyleType: number = 1;
  private lastClickTime: number = 0;
  private dragging: boolean;
  private last: any;
  private current: any;

  constructor(elements: Edge | CommonElement[]) {
    super();
    this.elements = elements;
    this.dragging = false;
    this.draw();
  }

  public toggleGroupExpand() {
    const graph = this.getChildByName(this.polygonHullOutlineName);
    graph.on('click', (event) => {
      event.stopPropagation();
      const currentTime = new Date().getTime();
      if (this.intersection()[0].length === 0) {
        if (currentTime - this.lastClickTime < 500) {
          this.isExpanded = !this.isExpanded;
          // this.draw();
          this.lastClickTime = 0;
          this.setExpaned(this.isExpanded);
        } else {
          this.lastClickTime = currentTime;
        }
        this.toggleShowEdges(this.isExpanded);
      }
    });
  }

  public setExpaned(expanded: boolean) {
    this.isExpanded = expanded;
    this.toggleChildNodesVisible(expanded);
    this.draw();
  }

  public addChildNodes(element: Node, preventDraw: boolean = false) {
    this.childrenNode.push(element);
    // this.addChild(element);
    this.toggleChildNodesVisible(this.isExpanded, element);
    // if (!preventDraw) {
    //   this.draw();
    // }
    // this.analyzeEdges();
  }

  public toggleChildNodesVisible(visible: boolean, element?: Node | Group) {
    const children = element ? [element] : this.childrenNode;
    _.each(children, (node) => {
      const nodeObject = node as (Node | Group);
      nodeObject.visible = visible;
    });
  }

  public getGroupVertexNumber() {
    this.positionList = [];
    this.vertexPoints(this.childrenNode);
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

  public getEdgeList() {
    return _.flatten(this.analyzeEdges());
  }

  public getAllVisibleNodes(children?: PIXI.DisplayObject[]) {
    const nodes: Node[] = [];
    _.each(children || this.childrenNode, (node) => {
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
    const style = this.defaultStyle;
    const graph = new PIXI.Graphics();
    graph.name = this.polygonHullOutlineName;
    graph.lineStyle(style.lineWidth, style.lineWidth);
    graph.beginFill(style.fillColor, style.fillOpacity);
    graph.drawCircle(0, 0, style.width);
    graph.position.set(position[0], position[1]);
    graph.endFill();
    graph.interactive = true;
    graph.buttonMode = true;
    this.addChild(graph);
  }

  public onDragStart(event: any) {
    event.stopPropagation();
    const parent = this.parent.toLocal(event.data.global);
    this.dragging = true;
    this.last = { parents: parent, x: event.data.global.x, y: event.data.global.y };
    this.current = event.data.pointerId;
  }

  public onDragEnd() {
    this.dragging = false;
    this.last = null;
  }

  public onDragMove(event: any) {
    if (this.dragging && this.last && this.current === event.data.pointerId) {
      const newPosition = this.toLocal(event.data.global);
      const edges = this.filterEdge();
      const intersectionNodes = this.intersection()[0];
      const intersectionGroup = this.intersection()[1];
      _.each(edges, (edge: Edge) => {
        edge.draw();
      });
      const distX = event.data.global.x;
      const distY = event.data.global.y;
      _.each(this.childrenNode, (element) => {
        if (element instanceof Node) {
          element.position.x += (newPosition.x - this.last.parents.x);
          element.position.y += (newPosition.y - this.last.parents.y);
        }
      });
      this.last = { parents: newPosition, x: distX, y: distY };
      if (intersectionNodes) {
        _.each(intersectionGroup, (group) => {
          group.draw();
        });
        this.draw();
      } else {
        this.draw();
      }
    }
  }

  public dragGroup() {
    const graph = this.getChildByName(this.polygonHullOutlineName);
    graph
      .on('mousedown', this.onDragStart.bind(this))
      .on('mouseup', this.onDragEnd.bind(this))
      .on('mouseupoutside', this.onDragEnd.bind(this))
      .on('mousemove', this.onDragMove.bind(this));
  }

  /**
   * 1: polygon, 2: ellipse
   */
  public setOutlineStyle(styleType: number) {
    if (_.indexOf([1, 2], styleType) < 0) {
      throw Error(
        'The group outline type only support polygon & ellipse. 1: polygon, 2: ellipse.');
    }
    this.outLineStyleType = styleType;
    this.draw();
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

  public setOutlineGraphicStyle(graphic: PIXI.Graphics) {
    const style = this.defaultStyle;
    graphic.lineStyle(style.lineWidth, style.lineColor);
    graphic.beginFill(style.fillColor, style.fillOpacity);
    return graphic;
  }

  public createOutlineGraphic() {
    const graph = new PIXI.Graphics();
    graph.name = this.polygonHullOutlineName;
    graph.interactive = true;
    graph.buttonMode = true;
    this.addChild(graph);
    return graph;
  }

  public getMaxSize(nodes: Node[]) {
    const nodeSize = _.map(nodes, (node) => {
      if (!node) {
        return [0, 0];
      }
      return [node.getWidth(), node.getHeight()];
    });
    return _.max(_.flatten(nodeSize)) || 0;
  }

  public getNodesMaxSize() {
    const nodes = this.getAllVisibleNodes();
    const size = this.getMaxSize(nodes);
    return size;
  }

  public drawHull(graph: PIXI.Graphics, vertexPointsNumber: number[][]) {
    const size = this.getNodesMaxSize();
    const polygonObject: any = new polygon(vertexPointsNumber);
    const rectVertexPoints = polygonObject.toArray();
    const hulls = this.getHulls(rectVertexPoints);
    const marginedPolygon: any = this.marginPolygon(hulls, this.defaultStyle.padding + size);
    const coordinates: number[] = _.flattenDeep(marginedPolygon);
    graph.drawPolygon(coordinates);
    graph.endFill();
  }

  public drawPolygonOutline(graph: PIXI.Graphics, vertexPointsNumber: number[][]) {
    if (vertexPointsNumber.length > 2) {
      this.drawHull(graph, vertexPointsNumber);
    } else {
      const nodes = this.getAllVisibleNodes();
      let ellipseX = 0;
      let ellipseY = 0;
      if (nodes.length === 2) {
        const nodesCoordinatesList = _.map(nodes, (node) => {
          if (!node) {
            return [0, 0];
          }
          return [node.x, node.y];
        });
        ellipseX = _.multiply(nodesCoordinatesList[1][0] + nodesCoordinatesList[0][0], 0.5);
        ellipseY = _.multiply(nodesCoordinatesList[1][1] + nodesCoordinatesList[0][1], 0.5);
        vertexPointsNumber.push([ellipseX, ellipseY + 0.5]);
        this.drawHull(graph, vertexPointsNumber);
      } else {
        let size = this.getMaxSize(nodes);
        const node = nodes.pop();
        const x = node ? node.x : 0;
        const y = node ? node.y : 0;
        size += this.defaultStyle.padding;
        graph.drawEllipse(x, y, size, size);
      }
    }
  }

  public addEventListener(event: string, callback: any) {
    const eventsMap: any = {};
    eventsMap[event] = callback;
    _.extend(this.groupEdgesEvent, eventsMap);
  }

  public getWidth() {
    return this.defaultStyle.width + this.defaultStyle.padding;
  }

  public getHeight() {
    return this.defaultStyle.height + this.defaultStyle.padding;
  }

  public drawEllipseOutline(graph: PIXI.Graphics, vertexPointsNumber: number[][]) {
    const size = this.getNodesMaxSize();
    const padding = size + this.defaultStyle.padding;
    if (vertexPointsNumber.length > 1) {
      const polygonObject: any = new polygon(vertexPointsNumber);
      const rect = polygonObject.aabb();
      const x = rect.x - padding / 2;
      const y = rect.y - padding / 2;
      const width = rect.w + padding;
      const height = rect.h + padding;
      const centerX = x + width * 0.5;
      const centerY = y + height * 0.5;
      const ellipseWidth = width / Math.sqrt(2);
      const ellipseHeight = height / Math.sqrt(2);
      graph.drawEllipse(centerX, centerY, ellipseWidth, ellipseHeight);
      graph.endFill();
    } else {
      const x = vertexPointsNumber[0][0];
      const y = vertexPointsNumber[0][1];
      const radius = size;
      graph.drawCircle(x, y, radius);
      graph.endFill();
    }
  }

  // draw polygon background outline
  public drawGroupExpandedOutline() {
    const vertexPointsNumber = this.getGroupVertexNumber();
    const pointsCount = vertexPointsNumber.length;
    const graph = this.createOutlineGraphic();
    this.setOutlineGraphicStyle(graph);
    if (pointsCount === 0) {
      return false;
    }
    switch (this.outLineStyleType) {
      case 1:
        this.drawPolygonOutline(graph, vertexPointsNumber);
        break;
      case 2:
        this.drawEllipseOutline(graph, vertexPointsNumber);
        break;
      default:
        this.drawPolygonOutline(graph, vertexPointsNumber);
    }
  }

  public toggleShowEdges(visible: boolean) {
    const edgeListGroup = this.analyzeEdges();
    _.each(_.flatten(edgeListGroup), (edge: Edge) => {
      edge.visible = visible;
    });
    return edgeListGroup;
  }

  public rmElements(elements: PIXI.DisplayObject[]) {
    _.each(elements, (element: PIXI.DisplayObject) => {
      element.destroy();
    });
    return _.remove(elements);
  }

  public setBundleEdgesPosition(edges: Edge[]) {
    // const edges = this.children;
    const distance = 5;
    const degree = 20;
    const step = 8;
    const values: number[][] = [];
    for (let i = 0, len = edges.length; i < len;) {
      _.each([1, -1], (j) => {
        values.push([(distance + i * step) * j, (degree + i * step) * j]);
      });
      i += 1;
    }
    _.each(this.children, (edge, i) => {
      if (edge instanceof Edge) {
        edge.setStyle({
          bezierLineDistance: values[i][0],
          bezierLineDegree: values[i][1],
        });
      }
    });
  }

  public drawEdges() {
    const edgesListGroup = this.toggleShowEdges(this.isExpanded);
    const nodes = _.filter(this.childrenNode, (item) => {
      return item instanceof Node;
    });
    _.each(edgesListGroup, (edges: Edge[]) => {
      _.each(edges, (edge: Edge) => {
        // const edge = edges[0];
        const srcNode = edge.getSrcNode();
        const targetNode = edge.getTargetNode();
        const srcNodeInGroup = _.includes(nodes, srcNode);
        const targetNodeInGroup = _.includes(nodes, targetNode);
        if (!(srcNodeInGroup && targetNodeInGroup)) {
          const groupEdgeParams =
            (srcNodeInGroup && !targetNodeInGroup) ?
              [this, targetNode, edges] : [srcNode, this, edges];
          const groupEdge: GroupEdge = new GroupEdge(
            groupEdgeParams[0], groupEdgeParams[1], groupEdgeParams[2]);
          groupEdge.setStyle(edge.getStyle());
          this.addChild(groupEdge);
          this.groupEdges.push(groupEdge);
          const edgeGraphic = groupEdge.getEdge();
          edgeGraphic.interactive = true;
          edgeGraphic.buttonMode = true;
          _.each(this.groupEdgesEvent, ((call: any, event: any) => {
            edgeGraphic.on(event, () => {
              call(edges, this);
            });
          }).bind(this));
        }
      });
    });
  }

  public sortGraphicsIndex() {
    const graphic = this.getChildByName(this.polygonHullOutlineName);
    // const children = this.children;
    if (graphic) {
      this.setChildIndex(graphic, 0);
    }
  }

  public draw() {
    this.rmElements(this.groupEdges);
    this.clearDisplayObjects();
    if (!this.isExpanded) {
      this.drawGroupNode();
      this.drawEdges();
    } else {
      this.drawGroupExpandedOutline();
    }
    this.sortGraphicsIndex();
    this.toggleGroupExpand();
    this.dragGroup();
  }

  public getChildEdges() {
    let edges: Edge[] = [];
    _.each(this.elements, (element: CommonElement) => {
      if (element instanceof Edge) {
        edges.push(element);
      }
      if (element instanceof EdgeBundle) {
        const childrenEdges = element.children as Edge[];
        edges = edges.concat(childrenEdges);
      }
    });
    return edges;
  }

  public filterEdge() {
    let edges: Edge[] = this.getChildEdges();

    const nodes = _.filter(this.childrenNode, (item) => {
      return item instanceof Node;
    });

    edges = _.filter(edges, (edge: Edge) => {
      const srcNode = edge.getSrcNode();
      const targetNode = edge.getTargetNode();
      if (_.includes(nodes, srcNode) || (_.includes(nodes, targetNode))) {
        return true;
      }
      return false;
    });
    return edges;
  }

  public intersection() {
    const intersectionGroup: any[] = [];
    let intersectionNode: Node[] = [];
    _.each(this.elements, (groups: CommonElement) => {
      if (groups instanceof Group && groups !== this) {
        intersectionNode = _.intersection(this.childrenNode, groups.childrenNode);
        if (intersectionNode) {
          intersectionGroup.push(groups);
        }
      }
    });
    return [intersectionNode, intersectionGroup];
  }

  private analyzeEdges() {
    const edges = this.filterEdge();
    return _.values(_.groupBy(edges, (edge: Edge) => {
      const srcNodeId = edge.getSrcNode().getUID();
      const targetNodeId = edge.getTargetNode().getUID();
      return _.join([srcNodeId, targetNodeId].sort());
    }));
  }
}
