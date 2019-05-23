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
import { Label } from './label';
import ConvexHullGrahamScan from './lib/convex-hull';
import { Node } from './node';

interface IEvent {
  [event: string]: (edges: Edge[]) => {};
}

export interface IEmptyGroup {
  type: string;
  location: { x: number, y: number };
  size: number;
  color: number;
  opacity: number;
}

export interface InodeResource {
  src: Node;
  end: Node;
  srcLabel: PIXI.DisplayObject;
  endLabel: PIXI.DisplayObject;
}

export interface IedgeResource {
  src: string;
  end: string;
  line: string;
}

export class Group extends CommonElement {
  public isExpanded: boolean = true;
  public centerPoint: any[] = [];
  public isLock: boolean = false;
  public expandedVisibleNodes: any[] = [];
  public superstratumInfo: Group[] = [];
  public substratumInfo: Group[] = [];
  public labelContent: string = '';
  // analyze children nodes array
  public childNodesList: Node[][] = [];
  public linksArray: Edge[] = [];
  // layer hide nodes
  public isLayer: boolean = true;
  private edgeResource: IedgeResource[] = [];
  private labelStyle: any;
  private toggleExpanded: boolean = false;
  private positionList: IPosition[] = [];
  private elements: any[];
  private polygonHullOutlineName: string = _.uniqueId('hull_outline_');
  private childrenNode: any[] = [];
  private visibleNode: Node[] = [];
  private outLineStyleType: number = 1;
  private lastClickTime: number = 0;
  // drag
  private dragging: boolean = false;
  private last: any;
  private hideNodes: Node[] = [];
  private hideEdges: Edge[] = [];
  private labelPosition: string = 'Center';
  private emptyObj: IEmptyGroup | undefined;
  // toggle
  private edgeArray: Edge[] = [];
  private nodeResource: InodeResource[] = [];
  private removeEdge: IedgeResource[] = [];

  constructor(element: any, emptyObj: IEmptyGroup | undefined) {
    super();
    this.elements = element;
    this.labelStyle = {};
    this.emptyObj = emptyObj;
    this.edgeResource = this.getEdgeResource();
    this.interactive = true;
    this.buttonMode = true;
    this.draw();
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
  }

  public analyzeChildNodesList() {
    const childNodesList: Node[][] = [];
    const outsideEdges: Edge[] = this.edgeArray;
    const nodes = this.getAllVisibleNodes();
    let insideEdge: Edge[] = this.filterInsideEdge();
    let fatherNode: Node[] = [];
    _.each(outsideEdges, (edge: Edge) => {
      const srcNode = edge.getSrcNode();
      const targetNode = edge.getTargetNode();
      if (_.includes(nodes, srcNode) && !(_.includes(nodes, targetNode))) {
        if (!(_.includes(fatherNode, srcNode))) {
          fatherNode.push(srcNode);
        }
      } else if (!(_.includes(nodes, srcNode)) && _.includes(nodes, targetNode)) {
        if (!(_.includes(fatherNode, targetNode))) {
          fatherNode.push(targetNode);
        }
      }
    });
    childNodesList.push(fatherNode);
    while (insideEdge.length > 0) {
      const childNode: Node[] = [];
      const removeEdge: Edge[] = [];
      _.each(insideEdge, (edge: Edge) => {
        const srcNode = edge.getSrcNode();
        const targetNode = edge.getTargetNode();
        if (_.includes(fatherNode, srcNode) && !(_.includes(childNode, targetNode))) {
          childNode.push(targetNode);
          removeEdge.push(edge);
        } else if (_.includes(fatherNode, targetNode) && !(_.includes(childNode, srcNode))) {
          childNode.push(srcNode);
          removeEdge.push(edge);
        }
      });
      if (childNode.length === 0 && removeEdge.length === 0) {
        break;
      }
      const delChildNode = _.difference(childNode, fatherNode);
      const concatArray = _.flattenDeep(childNodesList);
      if (delChildNode.length > 0 && concatArray.length < this.childrenNode.length) {
        childNodesList.push(delChildNode);
      }
      fatherNode = delChildNode;
      insideEdge = _.difference(insideEdge, removeEdge);
    }
    this.childNodesList = childNodesList;
  }

  public toggleGroupExpand() {
    const graph = this.getChildByName(this.polygonHullOutlineName);
    graph.on('click', () => {
      const currentTime = new Date().getTime();
      if (this.childrenNode[0]) {
        const includeGroups = this.childrenNode[0].getIncluedGroup();
        this.superstratumInfo = _.slice(includeGroups, 0, _.indexOf(includeGroups, this));
        if (currentTime - this.lastClickTime < 500) {
          this.lastClickTime = 0;
          this.setExpanded();
        } else {
          this.lastClickTime = currentTime;
        }
      }
    });
  }

  public setExpanded() {
    const isBundle = _.every(this.edgeArray, (edge: Edge) => {
      return edge.parent !== null;
    });
    if (this.childrenNode.length > 0) {
      const includeGroups = this.childrenNode[0].getIncluedGroup();
      this.superstratumInfo = _.slice(includeGroups, 0, _.indexOf(includeGroups, this));
    }
    if (this.intersection()[0].length === 0) {
      if (isBundle) {
        this.isExpanded = !this.isExpanded;
        this.changeEdgeResource();
        this.toggleChildNodesVisible(this.isExpanded);
        if (!this.isExpanded) {
          this.removeEdgeLabel();
        } else {
          this.addEdgeLabel();
        }
        this.toggleShowEdges(this.isExpanded);
        this.redrawGroup(this.isExpanded);
      }
    }
  }

  public getExpandedVisibleNodes() {
    let visibleNodes: any[] = [];
    this.expandedVisibleNodes = _.filter(this.childrenNode, (node) => {
      return node.visible;
    });
    const closeSubstratum = _.filter(this.substratumInfo, (group: Group) => {
      return !group.isExpanded;
    });
    _.each(closeSubstratum, (group: Group) => {
      visibleNodes = _.concat(this.expandedVisibleNodes, group);
      this.expandedVisibleNodes = _.flatten(visibleNodes);
    });
  }

  public redrawGroup(expanded: boolean) {
    _.each(this.substratumInfo, (group) => {
      group.visible = expanded;
    });
    _.each(this.superstratumInfo, (group) => {
      group.draw();
    });
    this.draw();
  }

  public analyzeSubstratum() {
    let subStratum: any = [];
    this.substratumInfo = [];
    _.each(this.childrenNode, (node: Node) => {
      const index = _.indexOf(node.incluedGroups, this) + 1;
      const sliceList = _.slice(node.incluedGroups, index);
      subStratum = _.concat(subStratum, sliceList);
    });
    this.substratumInfo = _.union(subStratum);
  }

  public getVisibleNodes() {
    let visibleNodes;
    if (!this.isExpanded) {
      this.hideNodes = _.filter(this.childrenNode, (node) => {
        return !node.visible && !this.isExpanded;
      });
    }
    visibleNodes = _.difference(this.childrenNode, this.hideNodes);
    return visibleNodes;
  }

  public removeEdgeLabel() {
    _.each(this.edgeArray, (edge: Edge) => {
      this.nodeResource.push({
        src: edge.startNode,
        end: edge.endNode,
        srcLabel: edge.getChildByName('edge_srclabel'),
        endLabel: edge.getChildByName('edge_endlabel'),
      });
      edge.removeChild(edge.getChildByName('edge_srclabel'));
      edge.removeChild(edge.getChildByName('edge_endlabel'));
    });
  }

  public changeEdgeResource() {
    const edgeResource: IedgeResource[] = _.cloneDeep(this.edgeResource);
    let changeEdges: IedgeResource[] = [];
    this.resetEdge();
    _.remove(this.removeEdge);
    _.remove(changeEdges);
    _.each(this.getAllGroup(), (group: any) => {
      if (!group.isExpanded) {
        const nodes = group.childrenNode;
        _.each(nodes, (node: Node) => {
          const change = edgeResource.filter(n => n.src === node.getUID() || n.end === node.getUID());
          _.each(change, (e: IedgeResource) => {
            const edge = this.getElementById(e.line);
            if (e.src !== e.end && edge) {
              if (e.src === node.getUID() || e.end === node.getUID()) {
                if (e.src === node.getUID()) {
                  e.src = group.getUID();
                } else if (e.end === node.getUID()) {
                  e.end = group.getUID();
                }
                changeEdges.push(e);
                changeEdges = _.uniq(changeEdges);
              }
            }
          });
        });
        _.each(_.concat(group.edgeArray, group.filterInsideEdge()), (edge) => {
          if (edge.parent instanceof EdgeBundle) {
            edge.parent.toggleBundle = false;
          }
        });
      }
    });

    // group edge by src and end id then hide redundant edge
    this.groupEdge(changeEdges);

    // change edge startNode and endNode
    _.each(edgeResource, (e: IedgeResource) => {
      const edge: Edge = this.getElementById(e.line);
      if (edge && edge.visible && e.src !== e.end) {
        edge.startNode = this.getElementById(e.src);
        edge.endNode = this.getElementById(e.end);
        edge.draw();
      }
    });
  }

  public getAllEdgeBundle() {
    return _.filter(this.elements, (element) => {
      return element instanceof EdgeBundle;
    });
  }

  public resetEdge() {
    _.each(this.removeEdge, (e: IedgeResource) => {
      const edge: Edge = this.getElementById(e.line);
      if (edge) {
        edge.visible = true;
      }
    });
    _.each(this.getAllEdgeBundle(), (edgeBundle: EdgeBundle) => {
      edgeBundle.toggleBundle = true;
    });
  }

  public groupEdge(changeEdges: IedgeResource[]) {
    const edgeGroupBy = _.groupBy(changeEdges, (edge: IedgeResource) => {
      if (this.getElementById(edge.src) instanceof Group || this.getElementById(edge.end) instanceof Group) {
        return [`${edge.src}`, `${edge.end}`].sort().join();
      }
    });
    _.each(edgeGroupBy, (groupEdge) => {
      if (groupEdge.length > 1) {
        const index = _.findIndex(groupEdge, (edgeRes: IedgeResource) => {
          const edge: Edge = this.getElementById(edgeRes.line);
          return edge.visible;
        });
        _.each(groupEdge, (edgeRes: IedgeResource, n: number) => {
          const edge: Edge = this.getElementById(edgeRes.line);
          if (n !== index && edge && edgeRes.src !== edgeRes.end && edge.visible) {
            this.removeEdge.push(edgeRes);
            edge.visible = false;
          }
        });
      }
    });
    return changeEdges;
  }

  public getElementById(id: string) {
    let elements: CommonElement[] = [];
    _.each(this.elements, (element: CommonElement) => {
      if (element instanceof EdgeBundle) {
        const childrenEdges = element.children as Edge[];
        elements = elements.concat(childrenEdges);
      } else {
        elements.push(element);
      }
    });
    const ele: any = _.find(elements, (element) => {
      return element.id === id;
    });
    return ele;
  }

  public getVisibleEdge(edges: Edge[]) {
    let visibleEdges;
    if (!this.isExpanded) {
      this.hideEdges = _.filter(edges, (edge) => {
        return !edge.visible && !this.isExpanded;
      });
    }
    visibleEdges = _.difference(edges, this.hideEdges);
    return visibleEdges;
  }

  public addChildNodes(element: Node, preventDraw: boolean = false) {
    element.setIncluedGroup(this);
    this.position.set(0, 0);
    this.childrenNode.push(element);
    this.emptyObj = undefined;
    this.edgeArray = _.difference(this.filterEdge(), this.filterInsideEdge());
    // this.analyzeChildNodesList();
    if (this.childrenNode) {
      this.draw();
    }
  }

  public getAllGroup() {
    return _.filter(this.elements, (element: CommonElement) => {
      return element instanceof Group;
    });
  }

  public getEdgeResource() {
    const edges = this.getChildEdges();
    const edgeResource: IedgeResource[] = [];
    _.each(edges, (edge: Edge) => {
      const edgeObj = {
        src: edge.startNode.getUID(),
        end: edge.endNode.getUID(),
        line: edge.getUID(),
      };
      edgeResource.push(edgeObj);
    });
    return edgeResource;
  }

  public removeChildNodes() {
    _.remove(this.childrenNode);
    this.parent.removeChild(this);
  }

  public toggleChildNodesVisible(visible: boolean, element?: Node) {
    const children = element ? [element] : this.getVisibleNodes();
    _.each(children, (node) => {
      node.visible = visible;
    });
  }

  public getGroupVertexNumber() {
    this.positionList = [];
    this.vertexPoints(this.expandedVisibleNodes);
    const vertexPointsList = _.map(this.positionList, (pos: IPosition) => {
      return _.values(pos);
    });
    return vertexPointsList;
  }

  public getGroupPosition() {
    const vertexPointsList = this.getGroupVertexNumber();
    // if (!vertexPointsList.length) {
    //   return [];
    // }
    if (vertexPointsList.length === 1) {
      return [vertexPointsList[0][0], vertexPointsList[0][1]];
    }
    const center = (new polygon(vertexPointsList)).center();
    return [center.x, center.y];
  }

  public getAllVisibleNodes(children?: PIXI.DisplayObject[]) {
    this.visibleNode = [];
    _.each(children || this.childrenNode, (node) => {
      if (node instanceof Node && node.visible) {
        this.visibleNode.push(node);
      }
    });
    return this.visibleNode;
  }

  public vertexPoints(children: PIXI.DisplayObject[]) {
    _.each(children, (node) => {
      if (node instanceof Node) {
        this.positionList.push({
          x: node.x,
          y: node.y,
        });
      } else if (node instanceof Group) {
        const graph = node.getChildByName(node.polygonHullOutlineName);
        this.positionList.push({
          x: graph.x,
          y: graph.y,
        });
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
    if (event.data.originalEvent.button === 0) {
      const parent = this.parent.toLocal(event.data.global);
      this.dragging = true;
      this.last = { parents: parent };
    }
  }

  public onDragEnd() {
    this.dragging = false;
    this.last = null;
  }

  public onDragMove(event: any) {
    if (this.dragging) {
      const newPosition = this.parent.toLocal(event.data.global);
      const edges = this.getChildEdges();
      const intersectionNodes = this.intersection()[0];
      const intersectionGroup = this.intersection()[1];
      if (this.childrenNode.length > 0) {
        _.each(this.childrenNode, (element) => {
          if (element instanceof Node && !element.isLock) {
            element.position.x += newPosition.x - this.last.parents.x;
            element.position.y += newPosition.y - this.last.parents.y;
          }
        });
        _.each(edges, (edge: Edge) => {
          edge.draw();
        });
        if (intersectionNodes) {
          _.each(intersectionGroup, (group) => {
            group.draw();
          });
        }
      } else {
        this.position.x += newPosition.x - this.last.parents.x;
        this.position.y += newPosition.y - this.last.parents.y;
        this.centerPoint[0] = this.position.x;
        this.centerPoint[1] = this.position.y;
      }
      this.last = { parents: newPosition };
      this.draw();
    } else {
      this.dragging = false;
    }
  }

  public selectOn() {
    this.setStyle({
      lineColor: 0Xf5bd71,
      lineWidth: 3,
    });
  }

  public selectOff() {
    const initStyle = this.invariableStyles;
    this.setStyle({
      lineColor: initStyle.lineColor,
      lineWidth: initStyle.lineWidth,
    });
  }

  /**
   * 1: polygon, 2: ellipse
   */
  public setOutlineStyle(styleType: number) {
    if (_.indexOf([1, 2, 3, 4], styleType) < 0) {
      throw Error(
        'The group outline type only support polygon & ellipse. 1: polygon, 2: ellipse, 3: rectangle, 4: square');
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
      if (node instanceof Node) {
        if (!node) {
          return [0, 0];
        }
        return [node.getWidth(), node.getHeight()];
      }
    });
    return _.max(_.flatten(nodeSize)) || 0;
  }

  public getNodesMaxSize() {
    const nodes = this.expandedVisibleNodes;
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
    const size = this.getNodesMaxSize();
    const padding = size + this.defaultStyle.padding;
    if (vertexPointsNumber.length > 2) {
      this.drawHull(graph, vertexPointsNumber);
    } else {
      const nodes = this.expandedVisibleNodes;
      let ellipseX = 0;
      let ellipseY = 0;
      if (vertexPointsNumber.length > 1) {
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
        const x = vertexPointsNumber[0][0];
        const y = vertexPointsNumber[0][1];
        const radius = size + padding / 2;
        graph.drawCircle(x, y, radius);
        graph.endFill();
      }
    }
  }

  public getWidth() {
    return this.defaultStyle.width * 1.8 + this.defaultStyle.padding;
  }

  public getHeight() {
    return this.defaultStyle.height * 1.8 + this.defaultStyle.padding;
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
      const radius = size + padding / 2;
      graph.drawCircle(x, y, radius);
      graph.endFill();
    }
  }

  public drawRectOutline(graph: PIXI.Graphics, vertexPointsNumber: number[][]) {
    const size = this.getNodesMaxSize();
    const padding = size + this.defaultStyle.padding;
    if (vertexPointsNumber.length > 1) {
      const polygonObject: any = new polygon(vertexPointsNumber);
      const rect = polygonObject.aabb();
      const x = rect.x - padding;
      const y = rect.y - padding;
      const width = rect.w + padding * 2;
      const height = rect.h + padding * 2;
      graph.drawRect(x, y, width, height);
      graph.endFill();
    } else {
      const radius = size + padding;
      const x = vertexPointsNumber[0][0] - padding;
      const y = vertexPointsNumber[0][1] - padding;
      graph.drawRect(x, y, radius, radius);
      graph.endFill();
    }
  }

  // draw polygon background outline
  public drawGroupExpandedOutline() {
    this.getExpandedVisibleNodes();
    this.centerPoint = this.getGroupPosition();
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
      case 3:
        this.drawRectOutline(graph, vertexPointsNumber);
        break;
      default:
        this.drawPolygonOutline(graph, vertexPointsNumber);
    }
  }

  public toggleShowEdges(visible: boolean) {
    const edges = this.getVisibleEdge(this.filterInsideEdge());
    _.each(edges, (edge: Edge) => {
      edge.visible = visible;
    });
  }

  public getChildNodes() {
    return this.childrenNode;
  }

  public addEdgeLabel() {
    if (this.nodeResource.length > 0) {
      _.each(this.edgeArray, (edge: Edge, i: number) => {
        if (this.nodeResource[i].srcLabel && this.nodeResource[i].endLabel) {
          edge.addChild(this.nodeResource[i].srcLabel);
          edge.addChild(this.nodeResource[i].endLabel);
        }
      });
    }
  }

  public sortGraphicsIndex() {
    const graphic = this.getChildByName(this.polygonHullOutlineName);
    if (graphic) {
      this.setChildIndex(graphic, 0);
      graphic.on('mousedown', this.onDragStart, this);
      if (!this.isLock) {
        graphic.on('mousemove', this.onDragMove, this);
      }
      this.analyzeChildNodesList();
    }
  }

  public draw() {
    const graph = this.getChildByName(this.polygonHullOutlineName);
    if (graph) {
      graph.destroy();
    }
    this.clearDisplayObjects();
    if (!this.isExpanded) {
      this.drawGroupNode();
    } else {
      if (!this.emptyObj) {
        this.drawGroupExpandedOutline();
      } else {
        this.drawEmptyGroup();
      }
    }
    this.analyzeSubstratum();
    if (this.toggleExpanded) {
      this.toggleGroupExpand();
    }
    this.sortGraphicsIndex();
    this.updateLabelPos();
    this.updateLabelSize();
  }

  public drawEmptyGroup() {
    if (this.emptyObj) {
      const graph = new PIXI.Graphics();
      const emptyInfo = this.emptyObj;
      const style = this.defaultStyle;
      graph.name = this.polygonHullOutlineName;
      graph.interactive = true;
      graph.buttonMode = true;
      this.addChild(graph);
      graph.lineStyle(style.lineWidth, style.lineColor);
      graph.beginFill(style.fillColor, style.fillOpacity);
      switch (emptyInfo.type) {
        case 'circle':
          graph.drawCircle(emptyInfo.location.x, emptyInfo.location.y, emptyInfo.size);
          graph.endFill();
          this.outLineStyleType = 2;
          break;
        case 'square':
          graph.drawRect(emptyInfo.location.x, emptyInfo.location.y, emptyInfo.size, emptyInfo.size);
          graph.endFill();
          this.outLineStyleType = 3;
          break;
        default:
          graph.drawCircle(emptyInfo.location.x, emptyInfo.location.y, emptyInfo.size);
          graph.endFill();
          this.outLineStyleType = 2;
          break;
      }
    }
  }

  public getChildEdges(): Edge[] {
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

  public filterInsideEdge() {
    let edges: Edge[] = this.getChildEdges();
    let nodes = _.filter(this.childrenNode, (item) => {
      return item instanceof Node;
    });
    nodes = _.concat(nodes, this.substratumInfo);
    edges = _.filter(edges, (edge: Edge) => {
      const srcNode = edge.getSrcNode();
      const targetNode = edge.getTargetNode();
      return _.includes(nodes, srcNode) && _.includes(nodes, targetNode);
    });
    return edges;
  }

  public intersection() {
    const intersectionGroup: any[] = [];
    let intersectionNode: Node[] = [];
    _.each(this.elements, (groups: CommonElement) => {
      if (groups instanceof Group && groups !== this) {
        intersectionNode = _.intersection(this.childrenNode, groups.childrenNode);
        if (intersectionNode.length > 0) {
          intersectionGroup.push(groups);
        }
      }
    });
    return [intersectionNode, intersectionGroup];
  }

  public setToggleExpanded(expanded: boolean) {
    this.toggleExpanded = expanded;
  }

  public getLabelPos() {
    let height = 0;
    _.each(this.children, (child: any) => {
      if (child.name && child.name.indexOf('hull_outline') !== -1) {
        height = child.height;
      }
    });
    const labelPositionData: any = {
      Center: {
        x: 0,
        y: 0,
      },
      Above: {
        x: 0,
        y: -(height / 2),
      },
      Below: {
        x: 0,
        y: (height / 2),
      },
    };
    const labelPos = { x: 0, y: 0 };
    const centerPoint: { x: number, y: number } = { x: 0, y: 0 };
    if (!this.emptyObj) {
      centerPoint.x = this.getGroupPosition()[0];
      centerPoint.y = this.getGroupPosition()[1];
    } else {
      switch (this.emptyObj.type) {
        case 'circle':
          centerPoint.x = this.emptyObj.location.x;
          centerPoint.y = this.emptyObj.location.y;
          break;
        case 'square':
          centerPoint.x = this.emptyObj.location.x + this.emptyObj.size / 2;
          centerPoint.y = this.emptyObj.location.y + this.emptyObj.size / 2;
          break;
        default:
          centerPoint.x = this.emptyObj.location.x;
          centerPoint.y = this.emptyObj.location.y;
          break;
      }
    }
    labelPos.x = centerPoint.x + labelPositionData[this.labelPosition].x;
    labelPos.y = centerPoint.y + labelPositionData[this.labelPosition].y;
    return labelPos;
  }
  // Set Group Label
  public setLabel(content?: string, position?: string, style?: PIXI.TextStyleOptions) {
    const groupLabel = this.getChildByName('group_label');
    if (groupLabel) {
      groupLabel.destroy();
    }
    const graph: any = this.getChildByName(this.polygonHullOutlineName);
    if (this.width !== 0 && content && graph) {
      const size = _.floor(graph.width / 25) + 1;
      this.labelStyle = {
        fontSize: size,
        fill: [
          '#0776da',
          '#5146d9',
        ],
        fontFamily: 'Georgia',
        fontWeight: 'bold',
        letterSpacing: 1,
      };
      if (style) {
        _.extend(this.labelStyle, style);
      }
      if (content.length > 25) {
        _.extend(this.labelStyle, {
          breakWords: true,
          wordWrap: true,
          wordWrapWidth: graph.width - 10,
        });
      }
      const label = new Label(content || undefined, this.labelStyle);
      label.setPosition(4);
      label.name = 'group_label';
      label.alpha = 0.8;
      label.interactive = false;
      label.buttonMode = false;
      if (position) {
        this.labelPosition = position;
      }
      const labelPos = this.getLabelPos();
      label.x = labelPos.x;
      label.y = labelPos.y;
      this.addChild(label);
      this.labelContent = label.text;
      return label;
    }
  }

  public getLabelContent() {
    return this.labelContent;
  }

  public getLabelStyle() {
    return this.labelStyle;
  }

  public getLabelPosition() {
    return this.labelPosition;
  }

  public setLabelText(content: string) {
    const label: any = this.getChildByName('group_label');
    const graph: any = this.getChildByName(this.polygonHullOutlineName);
    if (label && graph) {
      label.setText(content);
      label.style.fontSize = _.floor(graph.width / 25) + 1;
      label.style.breakWords = true;
      label.style.wordWrap = true;
      label.style.wordWrapWidth = graph.width - 10;
      this.labelContent = content;
    }
  }

  public updateLabelPos() {
    const label = this.getChildByName('group_label');
    if (label) {
      const labelPos = this.getLabelPos();
      label.x = labelPos.x;
      label.y = labelPos.y;
    }
  }

  public updateLabelSize() {
    const label: any = this.getChildByName('group_label');
    const graph: any = this.getChildByName(this.polygonHullOutlineName);
    const nodeWidth = this.defaultStyle.width;
    if (label && graph) {
      if (this.width !== 0 && this.isExpanded) {
        label.style.fontSize = _.floor(graph.width / 25) + 1;
        label.style.wordWrapWidth = graph.width - 10;
      } else {
        const textLength = _.ceil(label.text.length / 2);
        label.style.fontSize = nodeWidth / textLength;
      }
    }
  }

  public layerHideNodes(zoom: number) {
    if (zoom <= 0.6) {
      if (this.substratumInfo.length === 0 && this.childNodesList.length > 1) {
        const showNodesList = _.drop(this.childNodesList);
        let showEdgeList: Edge[] = [];
        let groups: Group[] = [];
        if (showNodesList) {
          const showNodes: any = _.flattenDeep(showNodesList);
          _.each(showNodes, (node: Node) => {
            node.visible = true;
            showEdgeList = _.concat(showEdgeList, node.linksArray);
            groups = _.concat(groups, node.incluedGroups);
          });
          _.each(showEdgeList, (edge: Edge) => {
            edge.visible = true;
          });
          groups = _.uniq(groups);
          const index = showNodesList.length;
          let hideNodeList: any[] = [];
          let hideEdge: Edge[] = [];
          if (this.isLayer) {
            if (zoom <= 0.5 && index > 0 && zoom > 0.3) {
              hideNodeList = _.flattenDeep(_.takeRight(showNodesList));
            } else if (zoom <= 0.3 && index - 1 > 0 && zoom > 0.2) {
              hideNodeList = _.flattenDeep(_.takeRight(showNodesList, 2));
            } else if (zoom <= 0.2 && index - 2 > 0 && zoom > 0.1) {
              hideNodeList = _.flattenDeep(_.takeRight(showNodesList, 3));
            } else if (zoom <= 0.1) {
              hideNodeList = _.flattenDeep(showNodesList);
            }
            if (hideNodeList.length === 0 && zoom < 0.5) {
              hideNodeList = _.flattenDeep(showNodesList);
            }
            _.each(hideNodeList, (node: Node) => {
              node.visible = false;
              hideEdge = _.concat(hideEdge, node.linksArray);

            });
            _.each(hideEdge, (edge: Edge) => {
              edge.visible = false;
            });
          }
        }
        _.each(groups, (g: Group) => {
          g.draw();
        });
      }
    }
  }
}
