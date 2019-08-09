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
import { Topo } from './topo';

export interface ICondition {
  isLock: boolean;
  isSelectGroup: boolean;
}
export class EdgeGroup extends CommonElement {
  public type: string = 'EdgeGroup';
  public childrenEdge: Edge[] = [];
  public polygon: PIXI.Graphics;
  // label
  public labelContent: string = '';
  public centerPoint: IPosition = { x: 0, y: 0 };
  public isSelected: boolean = false;
  public polygonHullOutlineName: string = _.uniqueId('hull_outline_');
  /* add to differentiate select or drag*/
  public isSelecting: boolean = false;
  private labelStyle: any;
  private labelPosition: string = 'Center';
  // drag
  private dragging: boolean = false;
  private last: any;
  private elements: CommonElement;
  private childNodes: Node[] = [];
  // select
  private topo: Topo;
  private rectangle = new PIXI.Graphics();
  private selecting: boolean = false;
  private selectLockNodes: boolean = false;
  private isSelectGroup: boolean = false;
  constructor(elements: any, topo: Topo) {
    super();
    this.elements = elements;
    this.polygon = new PIXI.Graphics();
    this.polygon.name = this.polygonHullOutlineName;
    this.interactive = true;
    this.topo = topo;
    // this.buttonMode = true;
    document.addEventListener('mouseup', this.onMouseup.bind(this));
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
    if (this.width !== 0 && content) {
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
      this.labelContent = content;
      if (this.childNodes.length !== 1) {
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

  public setDrag() {
    this.isSelecting = false;
    this.off('mousedown');
    this.off('mousemove');
    this.off('mouseup');
    this.on('mousedown', this.onDragStart, this);
    this.highLightGroup();
    this.cursor = 'pointer';
    this.on('mousemove', this.onDragMove, this);
  }

  public setSelect(condition?: ICondition) {
    this.isSelecting = true;
    this.off('mousedown');
    this.off('mousemove');
    this.off('mouseup');
    this.cursor = 'crosshair';
    this.highLightGroup();
    if (condition) {
      this.selectLockNodes = condition.isLock;
      this.isSelectGroup = condition.isSelectGroup;
    }
    this.on('mousedown', this.onSelectStart, this);
    this.on('mousemove', this.onSelectMove, this);
    this.on('mouseup', this.onSelectEnd, this);
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
        const fontSize = _.floor(graph.width / 10) + 1;
        if (fontSize > 12 && fontSize < 20) {
          label.style.fontSize = _.floor(graph.width / 10) + 1;
        } else if (fontSize <= 12) {
          label.style.fontSize = 10;
        } else if (fontSize >= 20) {
          label.style.fontSize = 20;
        }
      } else {
        const textLength = _.ceil(label.text.length / 2);
        label.style.fontSize = nodeWidth / textLength;
      }
    }
  }

  private initPolygonOutline(): void {
    const graph = this.polygon;
    graph.interactive = true;
    // graph.buttonMode = true;
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

  private onDragStart(event: any) {
    event.stopPropagation();
    this.removeHighLight();
    if (event.data.originalEvent.button === 0) {
      const parent = this.parent.toLocal(event.data.global);
      this.dragging = true;
      this.selecting = false;
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

  /* set select on edge group */
  private onMouseup() {
    this.last = null;
    if (this.selecting) {
      this.onSelectEnd();
    }
    this.dragging = false;
    this.selecting = false;
    this.rectangle.clear();
    if (this.parent) {
      this.parent.addChild(this.rectangle);
    }
  }

  /* set move select more nodes on group*/
  private onSelectStart(event: any) {
    this.removeHighLight();
    const parent = this.parent.toLocal(event.data.global);
    this.dragging = false;
    this.selecting = true;
    this.last = { parents: parent };
  }

  private onSelectMove(event: any) {
    if (this.selecting) {
      this.rectangle.clear();
      const newPosition = this.parent.toLocal(event.data.global);
      const network = document.getElementById(this.topo.domRegex);
      let adjustedX = newPosition.x;
      let adjustedY = newPosition.y;
      if (network) {
        const borderTop = 1;
        const borderRight = network.clientWidth - 1;
        const borderBottom = network.clientHeight - 1;
        const borderLeft = 1;
        if (newPosition.x <= borderLeft) {
          adjustedX = borderLeft;
        } else if (newPosition.x >= borderRight) {
          adjustedX = borderRight;
        }
        if (newPosition.y <= borderTop) {
          adjustedY = borderTop;
        } else if (newPosition.y >= borderBottom) {
          adjustedY = borderBottom;
        }
      }
      const oldLeft = this.last.parents.x;
      const oldTop = this.last.parents.y;
      const width = adjustedX - oldLeft;
      const height = adjustedY - oldTop;
      this.rectangle.lineStyle(1, 0X024997, 1);
      this.rectangle.alpha = 0.8;
      this.rectangle.drawRect(oldLeft, oldTop, width, height);
    }
  }

  private onSelectEnd() {
    const bounds = this.rectangle.getLocalBounds();
    const elements = this.topo.getElements();
    const groups = this.topo.getGroups();
    const selectNodes: Node[] = [];
    _.each(elements, (element) => {
      if (element instanceof Node) {
        const sprite: any = element.getSprite();
        if (sprite) {
          const nodeTop = element.y - (sprite.height / 2);
          const nodeLeft = element.x - (sprite.width / 2);
          const nodeRight = element.x + (sprite.width / 2);
          const nodeBottom = element.y + (sprite.height / 2);
          if ((nodeTop >= bounds.top) && (nodeRight <= bounds.right) &&
            (nodeBottom <= bounds.bottom) && (nodeLeft >= bounds.left)) {
            selectNodes.push(element);
          }
        }
      }
    });
    _.each(selectNodes, (node: Node) => {
      if (this.selectLockNodes === node.isLock) {
        this.topo.setSelectedNodes(node);
      }
    });
    if (this.isSelectGroup) {
      const filterGroup = _.filter(groups, (group: any) => {
        const childNodes = group.getVisibleNodes();
        return _.every(childNodes, (node: any) => {
          const isInclude = _.includes(selectNodes, node);
          return isInclude;
        });
      });
      this.removeHighLight();
      _.each(filterGroup, (group: Group) => {
        this.topo.setSelectedGroups(group);
      });
    }
  }

  private highLightGroup() {
    this.on('mousedown', (event: PIXI.interaction.InteractionEvent) => {
      event.stopPropagation();
      this.removeHighLight();
      this.topo.setSelectedGroups(this);
      this.selectOn();
    });
  }

  private removeHighLight() {
    // clear highlight nodes
    const selectNodes = this.topo.getSelectedNodes();
    _.each(selectNodes, (node: Node) => {
      node.selectOff();
    });
    this.topo.removeSelectedNodes();
    // clear highlight edge
    const selectEdge: Edge | undefined = this.topo.getSelectedEdge();
    if (selectEdge) {
      selectEdge.selectOff();
    }
    this.topo.removeSelectedEdge();
    // clear highlight groups
    const selectGroups = this.topo.getSelectedGroups();
    _.each(selectGroups, (group: any) => {
      group.selectOff();
    });
    this.topo.removeSelectedGroups();
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
