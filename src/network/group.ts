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
import { EdgeGroup } from './edge-group';
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
  public type: string = 'Group';
  public isExpanded: boolean = true;
  public centerPoint: IPosition = { x: 0, y: 0 };
  public expandedVisibleNodes: any[] = [];
  public superstratumInfo: Group[] = [];
  public substratumInfo: Group[] = [];
  public labelContent: string = '';
  public linksArray: Edge[] = [];
  public isSelected: boolean = false;
  public isLock: boolean = false;
  private childNodesList: Node[][] = [];
  private edgeResource: IedgeResource[] = [];
  private labelStyle: any = {};
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
    this.emptyObj = emptyObj;
    this.edgeResource = this.getEdgeResource();
    this.interactive = true;
    this.buttonMode = true;
    if (this.emptyObj) {
      this.centerPoint.x = this.emptyObj.location.x;
      this.centerPoint.y = this.emptyObj.location.y;
    }
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
  }

  public draw() {
    const graph = this.getChildByName(this.polygonHullOutlineName);
    if (graph) {
      graph.destroy();
    }
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

  public addChildNodes(element: Node) {
    element.setIncluedGroup(this);
    this.position.set(0, 0);
    this.childrenNode.push(element);
    this.emptyObj = undefined;
    this.edgeArray = _.difference(this.filterEdge(), this.filterInsideEdge());
    if (this.childrenNode) {
      this.draw();
    }
  }

  public setOutlineStyle(styleType: number) {
    if (_.indexOf([1, 2, 3, 4], styleType) < 0) {
      throw Error(
        'The group outline type only support polygon & ellipse. 1: polygon, 2: ellipse, 3: rectangle, 4: square');
    }
    this.outLineStyleType = styleType;
    this.draw();
  }

  public setToggleExpanded(expanded: boolean) {
    this.toggleExpanded = expanded;
  }

  // Set Group Label
  public setLabel(content: string, position?: string, style?: PIXI.TextStyleOptions) {
    const groupLabel = this.getChildByName('group_label');
    if (groupLabel) {
      groupLabel.destroy();
    }
    const graph: any = this.getChildByName(this.polygonHullOutlineName);
    if (this.width !== 0 && content && graph) {
      this.labelStyle = {
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

  public setLabelText(content: string) {
    const label: any = this.getChildByName('group_label');
    const graph: any = this.getChildByName(this.polygonHullOutlineName);
    if (label && graph) {
      label.setText(content);
      this.labelContent = content;
      if (this.expandedVisibleNodes.length !== 1) {
        label.style.fontSize = _.floor(graph.width / 20) + 1;
        label.style.breakWords = true;
        label.style.wordWrap = true;
        label.style.wordWrapWidth = graph.width - 10;
      } else {
        label.style.wordWrap = false;
        label.style.breakWords = false;
        label.style.fontSize = 10;
      }
      return label;
    }
  }

  public getChildNodes() {
    return this.childrenNode;
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

  public getWidth() {
    const graph: any = this.getChildByName(this.polygonHullOutlineName);
    return graph.width / 2;
  }

  public getHeight() {
    const graph: any = this.getChildByName(this.polygonHullOutlineName);
    return graph.height / 2;
  }

  public selectOn() {
    this.isSelected = true;
    this.setStyle({
      lineColor: 0Xf5bd71,
      lineWidth: 3,
    });
  }

  public selectOff() {
    const initStyle = this.invariableStyles;
    this.isSelected = false;
    this.setStyle({
      lineColor: initStyle.lineColor,
      lineWidth: initStyle.lineWidth,
    });
  }

  public getGroupPosition() {
    const vertexPointsList = this.getGroupVertexNumber();
    if (vertexPointsList.length === 1) {
      const result: IPosition = { x: vertexPointsList[0][0], y: vertexPointsList[0][1] };
      return result;
    }
    const center = (new polygon(vertexPointsList)).center();
    return center;
  }

  public removeChildNodes() {
    _.remove(this.childrenNode);
    this.parent.removeChild(this);
  }

  public removeChildNode(node: Node) {
    _.remove(this.childrenNode, (e) => {
      return e === node;
    });
    this.draw();
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

  private toggleGroupExpand() {
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

  private updateLabelPos() {
    const label = this.getChildByName('group_label');
    if (label) {
      const labelPos = this.getLabelPos();
      label.x = labelPos.x;
      label.y = labelPos.y;
    }
  }

  private updateLabelSize() {
    const label: any = this.getChildByName('group_label');
    const graph: any = this.getChildByName(this.polygonHullOutlineName);
    const nodeWidth = this.defaultStyle.width;
    if (label && graph) {
      if (this.width !== 0 && this.isExpanded) {
        const fontSize = _.floor(graph.width / 10) + 1;
        if (fontSize > 12 && fontSize < 20) {
          label.style.fontSize = _.floor(graph.width / 10) + 1;
        } else if (fontSize <= 12) {
          label.style.fontSize = 10;
        } else if (fontSize >= 20) {
          label.style.fontSize = 20;
        }
        // label.style.breakWords = true;
        // label.style.wordWrap = true;
        // label.style.wordWrapWidth = graph.width - 10;
      } else {
        const textLength = _.ceil(label.text.length / 2);
        label.style.fontSize = nodeWidth / textLength;
      }
    }
  }

  private setExpanded() {
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

  private getExpandedVisibleNodes() {
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

  private redrawGroup(expanded: boolean) {
    _.each(this.substratumInfo, (group) => {
      group.visible = expanded;
    });
    _.each(this.superstratumInfo, (group) => {
      group.draw();
    });
    this.draw();
  }

  private analyzeSubstratum() {
    let subStratum: any = [];
    this.substratumInfo = [];
    _.each(this.childrenNode, (node: Node) => {
      const index = _.indexOf(node.includedGroups, this) + 1;
      const sliceList = _.slice(node.includedGroups, index);
      subStratum = _.concat(subStratum, sliceList);
    });
    this.substratumInfo = _.union(subStratum);
  }

  private removeEdgeLabel() {
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

  private changeEdgeResource() {
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

  private getAllEdgeBundle() {
    return _.filter(this.elements, (element) => {
      return element instanceof EdgeBundle;
    });
  }

  private resetEdge() {
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

  private groupEdge(changeEdges: IedgeResource[]) {
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

  private getElementById(id: string) {
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

  private getVisibleEdge(edges: Edge[]) {
    let visibleEdges;
    if (!this.isExpanded) {
      this.hideEdges = _.filter(edges, (edge) => {
        return !edge.visible && !this.isExpanded;
      });
    }
    visibleEdges = _.difference(edges, this.hideEdges);
    return visibleEdges;
  }

  private getAllGroup() {
    return _.filter(this.elements, (element: CommonElement) => {
      return element instanceof Group;
    });
  }

  private getEdgeResource() {
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

  private toggleChildNodesVisible(visible: boolean, element?: Node) {
    const children = element ? [element] : this.getVisibleNodes();
    _.each(children, (node) => {
      node.visible = visible;
    });
  }

  private getGroupVertexNumber() {
    this.positionList = [];
    this.vertexPoints(this.expandedVisibleNodes);
    const vertexPointsList = _.map(this.positionList, (pos: IPosition) => {
      return _.values(pos);
    });
    return vertexPointsList;
  }

  private getAllVisibleNodes(children?: PIXI.DisplayObject[]) {
    this.visibleNode = [];
    _.each(children || this.childrenNode, (node) => {
      if (node instanceof Node && node.visible) {
        this.visibleNode.push(node);
      }
    });
    return this.visibleNode;
  }

  private vertexPoints(children: PIXI.DisplayObject[]) {
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

  private drawGroupNode() {
    const position = this.getGroupPosition();
    const style = this.defaultStyle;
    const graph = new PIXI.Graphics();
    graph.name = this.polygonHullOutlineName;
    graph.lineStyle(style.lineWidth, style.lineWidth);
    graph.beginFill(style.fillColor, style.fillOpacity);
    graph.drawCircle(0, 0, style.width);
    graph.position.set(position.x, position.y);
    graph.endFill();
    graph.interactive = true;
    graph.buttonMode = true;
    this.addChild(graph);
  }

  private onDragStart(event: any) {
    event.stopPropagation();
    if (event.data.originalEvent.button === 0) {
      const parent = this.parent.toLocal(event.data.global);
      this.dragging = true;
      this.last = { parents: parent };
    }
  }

  private onDragEnd() {
    this.dragging = false;
    this.last = null;
  }

  private onDragMove(event: any) {
    if (this.dragging) {
      const newPosition = this.parent.toLocal(event.data.global);
      const edges = this.getChildEdges();
      const edgeGroups = this.getEdgeGroups();
      const intersectionNodes = this.intersection()[0];
      const intersectionGroup = this.intersection()[1];
      if (this.childrenNode.length > 0) {
        _.each(this.childrenNode, (element) => {
          if (element instanceof Node) {
            element.position.x += newPosition.x - this.last.parents.x;
            element.position.y += newPosition.y - this.last.parents.y;
          }
        });
        _.each(edges, (edge: Edge) => {
          edge.draw();
        });
        _.each(edgeGroups, (edgeGroup: EdgeGroup) => {
          edgeGroup.draw();
        });
        if (intersectionNodes) {
          _.each(intersectionGroup, (group) => {
            group.draw();
          });
        }
      } else {
        this.position.x += newPosition.x - this.last.parents.x;
        this.position.y += newPosition.y - this.last.parents.y;
        this.centerPoint.x = newPosition.x;
        this.centerPoint.y = newPosition.y;
      }
      this.last = { parents: newPosition };
      this.draw();
    } else {
      this.dragging = false;
    }
  }

  private marginPolygon(rectVertexPoints: number[], margin: number) {
    const offset = new Offset();
    return offset.data(rectVertexPoints).margin(margin || 10);
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

  private setOutlineGraphicStyle(graphic: PIXI.Graphics) {
    const style = this.defaultStyle;
    graphic.lineStyle(style.lineWidth, style.lineColor);
    graphic.beginFill(style.fillColor, style.fillOpacity);
    return graphic;
  }

  private createOutlineGraphic() {
    const graph = new PIXI.Graphics();
    graph.name = this.polygonHullOutlineName;
    graph.interactive = true;
    graph.buttonMode = true;
    this.addChild(graph);
    return graph;
  }

  private getMeanSize(nodes: Node[]) {
    const nodeSize = _.map(nodes, (node) => {
      if (node instanceof Node) {
        if (!node) {
          return [0, 0];
        }
        return [node.getWidth(), node.getHeight()];
      }
    });
    return _.mean(_.flatten(nodeSize)) || 0;
  }

  private getNodesMeanSize() {
    const nodes = this.expandedVisibleNodes;
    const size = this.getMeanSize(nodes);
    return size;
  }

  private drawHull(graph: PIXI.Graphics, vertexPointsNumber: number[][]) {
    const size = this.getNodesMeanSize();
    const polygonObject: any = new polygon(vertexPointsNumber);
    const rectVertexPoints = polygonObject.toArray();
    const hulls = this.getHulls(rectVertexPoints);
    const marginedPolygon: any = this.marginPolygon(hulls, this.defaultStyle.padding + size);
    const coordinates: number[] = _.flattenDeep(marginedPolygon);
    graph.drawPolygon(coordinates);
    graph.endFill();
  }

  private drawPolygonOutline(graph: PIXI.Graphics, vertexPointsNumber: number[][]) {
    const size = this.getNodesMeanSize();
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

  private drawEllipseOutline(graph: PIXI.Graphics, vertexPointsNumber: number[][]) {
    const size = this.getNodesMeanSize();
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

  private drawRectOutline(graph: PIXI.Graphics, vertexPointsNumber: number[][]) {
    const size = this.getNodesMeanSize();
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
  private drawGroupExpandedOutline() {
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

  private toggleShowEdges(visible: boolean) {
    const edges = this.getVisibleEdge(this.filterInsideEdge());
    _.each(edges, (edge: Edge) => {
      edge.visible = visible;
    });
  }

  private addEdgeLabel() {
    if (this.nodeResource.length > 0) {
      _.each(this.edgeArray, (edge: Edge, i: number) => {
        if (this.nodeResource[i].srcLabel && this.nodeResource[i].endLabel) {
          edge.addChild(this.nodeResource[i].srcLabel);
          edge.addChild(this.nodeResource[i].endLabel);
        }
      });
    }
  }

  private sortGraphicsIndex() {
    const graphic = this.getChildByName(this.polygonHullOutlineName);
    if (graphic) {
      this.setChildIndex(graphic, 0);
      graphic.on('mousedown', this.onDragStart, this);
      if (!this.isLock) {
        graphic.on('mousemove', this.onDragMove, this);
      }
    }
  }

  private drawEmptyGroup() {
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

  private getChildEdges(): Edge[] {
    let edges: Edge[] = [];

    _.each(this.elements, (element: CommonElement) => {
      if (element instanceof Edge) {
        edges.push(element);
      } else if (element instanceof EdgeBundle) {
        const childrenEdges = element.children as Edge[];
        edges = edges.concat(childrenEdges);
      }
    });
    return edges;
  }

  private filterEdge() {
    let edges: Edge[] = this.getChildEdges();
    const nodes = _.filter(this.childrenNode, (item) => {
      return item instanceof Node;
    });

    edges = _.filter(edges, (edge: Edge) => {
      const srcNode = edge.startNode;
      const targetNode = edge.endNode;
      if (_.includes(nodes, srcNode) || (_.includes(nodes, targetNode))) {
        return true;
      }
      return false;
    });
    return edges;
  }

  private filterInsideEdge() {
    let edges: Edge[] = this.getChildEdges();
    let nodes = _.filter(this.childrenNode, (item) => {
      return item instanceof Node;
    });
    nodes = _.concat(nodes, this.substratumInfo);
    edges = _.filter(edges, (edge: Edge) => {
      const srcNode = edge.startNode;
      const targetNode = edge.endNode;
      return _.includes(nodes, srcNode) && _.includes(nodes, targetNode);
    });
    return edges;
  }

  private getLabelPos() {
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
      centerPoint.x = this.getGroupPosition().x;
      centerPoint.y = this.getGroupPosition().y;
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

  private getEdgeGroups() {
    const elements = this.elements;
    const edgeGroup = _.filter(elements, (ele) => {
      return ele instanceof EdgeGroup;
    });
    return edgeGroup;
  }
}
