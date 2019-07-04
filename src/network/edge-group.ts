/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */
import * as _ from 'lodash';
import polygon from 'polygon';
import Offset from 'polygon-offset/dist/offset';
import { CommonElement, IPosition } from './common-element';
import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { Group } from './group';
import { Label } from './label';
import ConvexHullGrahamScan from './lib/convex-hull';
import { Node } from './node';

export class EdgeGroup extends CommonElement {
  public type: string = 'EdgeGroup';
  public childrenEdge: Edge[] = [];
  public polygon: PIXI.Graphics;
  // label
  public labelContent: string = '';
  public centerPoint: IPosition = { x: 0, y: 0 };
  public isSelected: boolean = false;
  private labelStyle: any;
  private labelPosition: string = 'Center';
  // drag
  private dragging: boolean = false;
  private last: any;
  private elements: CommonElement;
  private childNodes: Node[] = [];
  constructor(elements: any) {
    super();
    this.elements = elements;
    this.polygon = new PIXI.Graphics();
    this.polygon.name = 'edge_group';
    this.interactive = true;
    this.buttonMode = true;
    this.setDrag();
  }

  public addChildEdges(edge: Edge) {
    this.childrenEdge.push(edge);
    this.childrenEdge = _.uniq(this.childrenEdge);
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
    this.updateLabelPos();
    this.updateLabelSize();
  }

  // Set Group Label
  public setLabel(content?: string, position?: string, style?: PIXI.TextStyleOptions) {
    const groupLabel = this.getChildByName('group_label');
    if (groupLabel) {
      groupLabel.destroy();
    }
    const graph: any = this.getChildByName('edge_group');
    if (this.width !== 0 && content && graph) {
      const size = _.floor(graph.width / 20) + 1;
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
        });
      }
      const label = new Label(content || undefined, this.labelStyle);
      label.anchor.set(0.5, 0.5);
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
    const graph: any = this.getChildByName('edge_group');
    if (label && graph) {
      label.setText(content);
      label.style.fontSize = _.floor(graph.width / 20) + 1;
      label.style.breakWords = true;
      label.style.wordWrap = true;
      label.style.wordWrapWidth = graph.width / 2;
      this.labelContent = content;
    }
  }

  public removeChildEdge(edge: Edge): void {
    _.remove(this.childrenEdge, (e) => {
      return e === edge;
    });
    _.remove(this.childNodes, (n) => {
      return n === edge.startNode || n === edge.endNode;
    });
    this.draw();
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

  public getVisibleNodes() {
    const nodes: Node[] = [];
    _.each(this.childrenEdge, (edge: Edge) => {
      if (edge.visible) {
        nodes.push(edge.startNode);
        nodes.push(edge.endNode);
      }
    });
    return _.uniq(nodes);
  }

  private getLabelPos() {
    let height = 0;
    const graph: any = this.getChildByName('edge_group');
    if (graph) {
      height = graph.height;
    }
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
    labelPos.x = this.centerPoint.x + labelPositionData[this.labelPosition].x;
    labelPos.y = this.centerPoint.y + labelPositionData[this.labelPosition].y;
    return labelPos;
  }

  private updateLabelPos() {
    const label = this.getChildByName('group_label');
    let angle: number = 0;
    let oppositeAngle: number = 0;
    if (label) {
      if (this.childrenEdge.length === 1) {
        const edge: Edge = this.childrenEdge[0];
        angle = Math.atan2(edge.startNode.y - edge.endNode.y, edge.startNode.x - edge.endNode.x);
        oppositeAngle = Math.atan2(edge.endNode.y - edge.startNode.y, edge.endNode.x - edge.startNode.x);
        if (edge.startNode.x > edge.endNode.x) {
          label.rotation = angle;
          label.rotation = angle;
        } else {
          label.rotation = oppositeAngle;
          label.rotation = oppositeAngle;
        }
      }
      const labelPos = this.getLabelPos();
      label.x = labelPos.x;
      label.y = labelPos.y;
      this.setChildIndex(label, this.children.length - 1);
    }
  }

  private updateLabelSize() {
    const label: any = this.getChildByName('group_label');
    const graph: any = this.getChildByName('edge_group');
    const nodeWidth = this.defaultStyle.width;
    if (label && graph) {
      if (this.width !== 0) {
        label.style.fontSize = _.floor(graph.width / 20) + 1;
        label.style.wordWrapWidth = graph.width / 2;
      } else {
        const textLength = _.ceil(label.text.length / 2);
        label.style.fontSize = nodeWidth / textLength;
      }
    }
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
      if (this.childrenEdge.length <= 1) {
        _.each(this.childrenEdge, (edge: any) => {
          if (_.indexOf(this.childNodes, edge.startNode) === -1) {
            this.childNodes.push(edge.startNode);
          }
          if (_.indexOf(this.childNodes, edge.endNode) === -1) {
            this.childNodes.push(edge.endNode);
          }
          if (edge instanceof Edge && edge.visible) {
            pointsList = _.concat(pointsList, edge.polygonData);
          } else if (edge instanceof EdgeBundle) {
            _.each(edge.children, (e: any) => {
              pointsList = _.concat(pointsList, e.polygonData);
            });
          }
        });
      } else {
        _.each(this.childrenEdge, (edge: Edge) => {
          if (_.indexOf(this.childNodes, edge.startNode) === -1) {
            this.childNodes.push(edge.startNode);
          }
          if (_.indexOf(this.childNodes, edge.endNode) === -1) {
            this.childNodes.push(edge.endNode);
          }
          pointsList.push(edge.startNode.x, edge.startNode.y);
          pointsList.push(edge.endNode.x, edge.endNode.y);
        });
      }
    }
    const vertexPoints: number[][] = _.chunk(pointsList, 2);
    return vertexPoints;
  }

  private drawPolygon(vertexPoints: number[][]): void {
    const graph = this.polygon;
    const style = this.defaultStyle;
    if (vertexPoints.length > 0) {
      const polygonObject: any = new polygon(vertexPoints);
      this.centerPoint = polygonObject.center();
      const rectVertexPoints = polygonObject.toArray();
      const hulls = this.getHulls(rectVertexPoints);
      const marginedPolygon: any = this.marginPolygon(hulls, style.margin | 5);
      const coordinates: number[] = _.flattenDeep(marginedPolygon);
      graph.drawPolygon(coordinates);
      graph.endFill();
    }
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
      const edges = this.getChildEdges();
      const allEdgeGroups = this.getEdgeGroup();
      const nodesGroup = this.getGroups();
      if (this.childrenEdge.length > 0) {
        _.each(this.childNodes, (node: Node) => {
          if (!node.isLock) {
            node.position.x += newPosition.x - this.last.parents.x;
            node.position.y += newPosition.y - this.last.parents.y;
          }
        });
        _.each(edges, (edge: Edge) => {
          edge.draw();
        });
        _.each(allEdgeGroups, (group) => {
          group.draw();
        });
        _.each(nodesGroup, (group) => {
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
    const elements = this.elements;
    const edgeGroup = _.filter(elements, (ele) => {
      return ele instanceof EdgeGroup;
    });
    return edgeGroup;
  }

  private getGroups() {
    const elements = this.elements;
    const edgeGroup = _.filter(elements, (ele) => {
      return ele instanceof Group;
    });
    return edgeGroup;
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

}
