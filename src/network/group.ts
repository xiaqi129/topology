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
import { CommonAction } from './common-action';
import { CommonElement, IPosition } from './common-element';
import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { GroupEdge } from './edge-conn-group';
import { Label } from './label';
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
  public centerPoint: IPosition[] = [];
  private positionList: IPosition[] = [];
  private elements: Edge | CommonElement[];
  private polygonHullOutlineName: string = _.uniqueId('hull_outline_');
  private childrenNode: Node[] = [];
  private outLineStyleType: number = 1;
  private lastClickTime: number = 0;
  // drag
  private dragging: boolean = false;
  private last: any;
  private current: number | undefined;
  private leftDown: boolean | undefined;
  private hideNodes: Node[] = [];
  private hideEdges: Edge[] = [];
  private labelPosition: string = 'Center';

  constructor(elements: Edge | CommonElement[]) {
    super();
    this.elements = elements;
    this.draw();
  }

  public toggleGroupExpand() {
    const graph = this.getChildByName(this.polygonHullOutlineName);
    graph.on('click', (event) => {
      // event.stopPropagation();
      const currentTime = new Date().getTime();
      if (this.intersection()[0].length === 0) {
        if (currentTime - this.lastClickTime < 500) {
          this.isExpanded = !this.isExpanded;
          this.lastClickTime = 0;
          this.setExpaned(this.isExpanded);
          this.toggleShowEdges(this.isExpanded);
        } else {
          this.lastClickTime = currentTime;
        }
      }
    });
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

  public setExpaned(expanded: boolean) {
    this.toggleChildNodesVisible(expanded);
    this.draw();
  }

  public getVisibleEdge() {
    let visibleEdges;
    const edges = this.filterEdge();
    if (!this.isExpanded) {
      this.hideEdges = _.filter(edges, (edge) => {
        return !edge.visible && !this.isExpanded;
      });
    }
    visibleEdges = _.difference(edges, this.hideEdges);
    return visibleEdges;
  }

  public addChildNodes(element: Node, preventDraw: boolean = false) {
    this.childrenNode.push(element);
    // this.addChild(element);
    // this.toggleChildNodesVisible(this.isExpanded, element);
    if (!preventDraw) {
      this.draw();
    }
  }

  public removeChildNodes() {
    _.remove(this.childrenNode);
    this.parent.removeChild(this);
  }

  public toggleChildNodesVisible(visible: boolean, element?: Node | Group) {
    const children = element ? [element] : this.getVisibleNodes();
    _.each(children, (node) => {
      node.visible = visible;
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

  public getAllVisibleNodes(children?: PIXI.DisplayObject[]) {
    const nodes: Node[] = [];
    _.each(children || this.childrenNode, (node) => {
      if (node instanceof Node && node.visible) {
        nodes.push(node);
      } else if (node instanceof Group && node.children.length > 0) {
        this.getAllVisibleNodes(node.children);
      }
    });
    return nodes;
  }

  public vertexPoints(children: PIXI.DisplayObject[]) {
    _.each(children, (node) => {
      if (node instanceof Node && node.visible) {
        this.positionList.push({
          x: node.x,
          y: node.y,
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
      this.leftDown = true;
      const parent = this.parent.toLocal(event.data.global);
      this.dragging = true;
      this.last = { parents: parent };
      this.current = event.data.pointerId;
    }
  }

  public onDragEnd(event: any) {
    if (event.data.originalEvent.button === 0) {
      this.leftDown = false;
      if (this.dragging) {
        this.dragging = false;
        this.last = null;
      }
    }
  }

  public onDragMove(event: any) {
    if (this.last && this.current === event.data.pointerId) {
      if (this.dragging) {
        const newPosition = this.parent.toLocal(event.data.global);
        const edges = this.filterEdge();
        const intersectionNodes = this.intersection()[0];
        const intersectionGroup = this.intersection()[1];
        _.each(this.childrenNode, (element) => {
          if (element instanceof Node) {
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
        this.draw();
        this.last = { parents: newPosition };
      } else {
        this.dragging = false;
      }
    }
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
      this.hitArea = new PIXI.Ellipse(centerX, centerY, ellipseWidth, ellipseHeight);
    } else {
      const x = vertexPointsNumber[0][0];
      const y = vertexPointsNumber[0][1];
      const radius = size;
      graph.drawCircle(x, y, radius);
      graph.endFill();
      this.hitArea = new PIXI.Circle(x, y, radius);
    }
  }

  // draw polygon background outline
  public drawGroupExpandedOutline() {
    const vertexPointsNumber = this.getGroupVertexNumber();
    this.centerPoint = this.getGroupPosition();
    const pointsCount = vertexPointsNumber.length;
    const graph = this.createOutlineGraphic();
    this.interactive = true;
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
    const edges = this.filterEdge();
    const nodes = _.filter(this.childrenNode, (item) => {
      return item instanceof Node;
    });
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
  }

  public sortGraphicsIndex() {
    const graphic = this.getChildByName(this.polygonHullOutlineName);
    // const children = this.children;
    if (graphic) {
      this.setChildIndex(graphic, 0);
      graphic
        .on('mousedown', this.onDragStart.bind(this))
        .on('mousemove', this.onDragMove.bind(this))
        .on('mouseup', this.onDragEnd.bind(this));
      // .on('mouseupoutside', this.onDragEnd.bind(this));
    }
  }

  public draw() {
    this.rmElements(this.groupEdges);
    this.clearDisplayObjects();
    if (!this.isExpanded) {
      this.drawEdges();
      this.drawGroupNode();
    } else {
      this.drawGroupExpandedOutline();
    }
    this.toggleGroupExpand();
    this.sortGraphicsIndex();
    this.updateLabelPos();
    this.updateLabelSize();
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
    const centerPoint = this.getGroupPosition();
    labelPos.x = centerPoint[0] + labelPositionData[this.labelPosition].x;
    labelPos.y = centerPoint[1] + labelPositionData[this.labelPosition].y;

    return labelPos;
  }

  public setLabel(content?: string, position?: string, style?: PIXI.TextStyleOptions) {
    const vertexPointsNumber = this.getGroupVertexNumber();
    if (this.width !== 0 && vertexPointsNumber.length > 1) {
      const size = _.floor(this.width / 25) + 1;
      const labelStyleOptions = {
        fontSize: size,
        fontWeight: 'bold',
      };
      const label = new Label(content || 'group', style || labelStyleOptions);
      label.setPosition(4);
      label.name = 'group_label';
      label.alpha = 0.8;
      if (position) {
        this.labelPosition = position;
      }
      const labelPos = this.getLabelPos();
      label.x = labelPos.x;
      label.y = labelPos.y;
      this.addChild(label);
    }
  }

  public updateLabelPos() {
    const vertexPointsNumber = this.getGroupVertexNumber();
    const label = this.getChildByName('group_label');
    if (label) {
      if (vertexPointsNumber.length > 1) {
        label.visible = true;
      } else {
        label.visible = false;
      }
      const labelPos = this.getLabelPos();
      label.x = labelPos.x;
      label.y = labelPos.y;
    }
  }

  public updateLabelSize() {
    const label = this.getChildByName('group_label');
    const nodeWidth = this.defaultStyle.width;
    if (label) {
      if (this.width !== 0 && this.isExpanded) {
        (label as PIXI.Text).style.fontSize = _.floor(this.width / 25) + 1;
      } else {
        const textLength = _.ceil((label as PIXI.Text).text.length / 2);
        (label as PIXI.Text).style.fontSize = nodeWidth / textLength;
      }
    }
  }

  private analyzeEdges() {
    const edges = this.getVisibleEdge();
    return _.values(_.groupBy(edges, (edge: Edge) => {
      const srcNodeId = edge.getSrcNode().getUID();
      const targetNodeId = edge.getTargetNode().getUID();
      return _.join([srcNodeId, targetNodeId].sort());
    }));

  }
}
