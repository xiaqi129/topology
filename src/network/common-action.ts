/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { Application } from './application';
import { CommonElement } from './common-element';
import { DataFlow } from './data-flow';
import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { EdgeGroup } from './edge-group';
import { Group } from './group';
import { Node } from './node';
import { ITopo } from './topo';

export interface ICondition {
  isLock: boolean;
  isSelectGroup: boolean;
}

export class CommonAction {
  public defaultLineColor: number = 0;
  public container: PIXI.Container;
  private app: Application;
  private topo: ITopo;
  // bundle
  private nodeLabelFlag: boolean = true;
  // drag
  private dragging: boolean = false;
  private last: any;
  private data: any;

  // select
  private rectangle = new PIXI.Graphics();
  private isSelect: boolean = false;
  private isLock: boolean = false;
  private isSelectGroup: boolean = false;
  private domRegex: string;
  private containerUp: boolean = false;
  constructor(app: any, topo: ITopo, domRegex: string) {
    this.app = app;
    this.topo = topo;
    this.container = app.container;
    this.domRegex = domRegex;
    document.addEventListener('mouseup', this.ondocumentEnd.bind(this), true);
  }

  public getCenter() {
    return this.app.getContainerCenter();
  }

  public dragContainer() {
    this.container.removeAllListeners();
    this.container.cursor = 'default';
    this.drag();
  }

  public setSelect(condition?: any) {
    this.container.removeAllListeners();
    this.container.cursor = 'crosshair';
    this.moveSelect(condition);
  }

  public getSelectNodes() {
    const selectNodes = this.topo.getSelectedNodes();
    return selectNodes;
  }

  public setSelectNodes(node: Node) {
    this.topo.setSelectedNodes(node);
  }

  public setSelectGroups(group: Group) {
    this.topo.setSelectedGroups(group);
  }

  public getSelectEdge() {
    const selectEdge = this.topo.getSelectedEdge();
    return selectEdge;
  }

  public getSelectGroups() {
    const selectGroups = this.topo.getSelectedGroups();
    return selectGroups;
  }

  public setSelectEdge(edge: Edge) {
    this.topo.setSelectedEdge(edge);
  }

  public moveCenter(x: number, y: number) {
    this.app.moveCenter(x, y);
  }

  public removeHighLight() {
    this.cleanEdge();
    this.cleanNode();
    this.cleanGroup();
  }

  public clearNodeAndLineHighlight() {
    this.cleanEdge();
    this.cleanNode();
  }

  public drag() {
    this.container.on('mousedown', (event: any) => {
      this.removeHighLight();
      this.cleanGroup();
      this.onDragStart(event);
      this.container.cursor = 'move';
    });
    this.container.on('mousemove', (event: any) => {
      this.onDragMove(event);
    });
    this.container.on('mouseup', () => {
      this.container.cursor = 'default';
    });
    this.container.on('mouseup', this.onDragEnd.bind(this));
  }

  public onDragStart(event: PIXI.interaction.InteractionEvent) {
    const parent = this.container.parent.toLocal(event.data.global);
    this.dragging = true;
    this.data = event.data;
    this.last = { parents: parent };
  }

  public onDragMove(event: PIXI.interaction.InteractionEvent) {
    if (this.dragging && !this.isSelect) {
      const newPosition = this.data.getLocalPosition(this.container.parent);
      const distX = event.data.global.x;
      const distY = event.data.global.y;
      const edges = this.getChildEdges();
      const groups = this.getOtherElements();
      const elements: any = this.topo.getElements();
      _.each(elements, (element: CommonElement) => {
        if (element instanceof Node && !element.isLock) {
          element.position.x += (newPosition.x - this.last.parents.x);
          element.position.y += (newPosition.y - this.last.parents.y);
        }
      });
      _.each(groups, (group) => {
        group.draw();
      });
      _.each(edges, (edge: Edge) => {
        edge.draw();
      });
      this.last = { parents: newPosition, x: distX, y: distY };
    } else {
      this.dragging = false;
    }
  }

  public onDragEnd() {
    const edges = this.getChildEdges();
    const groups = this.getOtherElements();
    _.each(groups, (group) => {
      group.draw();
    });
    _.each(edges, (edge: Edge) => {
      edge.draw();
    });
  }

  public getChildEdges() {
    let edges: Edge[] = [];
    const elements: any = this.topo.getElements();

    _.each(elements, (element: CommonElement) => {
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

  public getOtherElements() {
    const elements: any = this.topo.getElements();
    const instanceList = [Group, EdgeGroup, DataFlow];
    const filterElements = _.filter(elements, (element: CommonElement) => {
      return _.indexOf(instanceList, element.constructor) > -1;
    });
    return filterElements;
  }

  public getGroups(): Group[] {
    const elements: any = this.topo.getElements();
    const groups = _.filter(elements, (element) => {
      return element instanceof Group && element.getChildNodes().length > 0;
    });
    return groups;
  }

  public moveSelect(condition?: ICondition) {
    if (condition) {
      this.isLock = condition.isLock;
      this.isSelectGroup = condition.isSelectGroup;
    }
    this.container.on('mousedown', (event: any) => {
      this.onSelectStart(event);
    });
    this.container.on('mousemove', this.onSelectMove.bind(this));
    this.container.on('mouseup', this.onSelectEnd.bind(this));
  }

  public setClick() {
    const elements = this.topo.getElements();
    const groups = this.getOtherElements();
    _.each(elements, (element) => {
      if (element instanceof Node) {
        element.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
          event.stopPropagation();
          if (this.getSelectNodes().length < 1) {
            this.removeHighLight();
            element.selectOne();
            this.setSelectNodes(element);
          }
        });
      } else if (element instanceof Edge) {
        this.defaultLineColor = element.defaultStyle.lineColor;
        element.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
          event.stopPropagation();
          this.removeHighLight();
          this.topo.setSelectedEdge(element);
          element.selectOn();
        });
      } else if (element instanceof EdgeBundle) {
        _.each(element.children, (edges: any) => {
          this.defaultLineColor = edges.defaultStyle.lineColor;
          edges.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
            event.stopPropagation();
            this.removeHighLight();
            this.topo.setSelectedEdge(edges);
            edges.selectOn();
          });
        });
      } else if (element instanceof Group) {
        element.addEventListener('click', (event: PIXI.interaction.InteractionEvent) => {
          event.stopPropagation();
          this.removeHighLight();
          this.topo.setSelectedGroups(element);
          element.selectOn();
        });
      }
    });
    _.each(groups, (group) => {
      group.on('click', (event: PIXI.interaction.InteractionEvent) => {
        this.clearNodeAndLineHighlight();
      });
    });
  }

  public cleanEdge() {
    const selectEdge: Edge | undefined = this.topo.getSelectedEdge();
    if (selectEdge) {
      selectEdge.selectOff();
    }
    this.topo.removeSelectedEdge();
  }

  public cleanNode() {
    const selectNodes = this.topo.getSelectedNodes();
    _.each(selectNodes, (node: Node) => {
      node.selectOff();
    });
    this.topo.removeSelectedNodes();
  }

  public cleanGroup() {
    const selectGroups = this.topo.getSelectedGroups();
    _.each(selectGroups, (group: Group) => {
      group.selectOff();
    });
    this.topo.removeSelectedGroups();
  }

  public toggleLabel() {
    this.nodeLabelFlag = !this.nodeLabelFlag;
  }

  public lockElement(element: CommonElement) {
    if (element instanceof Node) {
      element.removeNodeMark('lock');
      element.addNodeMark('lock', 'top-right', 12, 12);
      element.off('mousemove');
      element.isLock = true;
    } else if (element instanceof Group) {
      element.draw();
      const nodes = element.expandedVisibleNodes;
      const substratumGroups = element.substratumInfo;
      const graph = _.find(element.children, (g) => {
        return g instanceof PIXI.Graphics;
      });
      _.each(nodes, (node: Node) => {
        node.off('mousemove');
        node.removeNodeMark('lock');
        node.addNodeMark('lock', 'top-right', 12, 12);
        element.isLock = true;
      });
      if (graph) {
        graph.off('mousemove');
        element.isLock = true;
      }
      _.each(substratumGroups, (group) => {
        const back = _.find(group.children, (g) => {
          return g instanceof PIXI.Graphics;
        });
        if (back) {
          back.off('mousemove');
          group.isLock = true;
        }
      });
    }
  }

  public unLockElement(element: CommonElement) {
    if (element instanceof Node) {
      element.on('mousemove', element.onDragMove);
      element.removeNodeMark('lock');
      element.isLock = false;
    } else if (element instanceof Group) {
      const nodes = element.expandedVisibleNodes;
      const substratumGroups = element.substratumInfo;
      const graph = _.find(element.children, (g) => {
        return g instanceof PIXI.Graphics;
      });
      _.each(nodes, (node: Node) => {
        node.on('mousemove', node.onDragMove);
        node.isLock = false;
        node.removeNodeMark('lock');
      });
      if (graph) {
        graph.on('mousemove', element.onDragMove.bind(element));
        element.isLock = false;
      }
      _.each(substratumGroups, (group) => {
        const back = _.find(group.children, (g) => {
          return g instanceof PIXI.Graphics;
        });
        if (back) {
          back.on('mousemove', group.onDragMove.bind(group));
          group.isLock = false;
        }
      });
    }
  }

  private onSelectStart(event: PIXI.interaction.InteractionEvent) {
    if (this.container.hitArea instanceof PIXI.Rectangle) {
      this.removeHighLight();
      const parent = this.container.parent.toLocal(event.data.global);
      this.dragging = true;
      this.isSelect = true;
      this.data = event.data;
      this.last = { parents: parent };
      this.containerUp = false;
    }
  }

  private onSelectMove() {
    if (this.dragging && this.isSelect) {
      this.rectangle.clear();
      const newPosition = this.data.getLocalPosition(this.container.parent);
      const network = document.getElementById(this.domRegex);
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
      this.app.addElement(this.rectangle);
    } else {
      this.dragging = false;
    }
  }

  private ondocumentEnd() {
    if (event && (event as any).button === 0) {
      this.dragging = false;
      this.isSelect = false;
      this.data = null;
      this.last = null;
      if (!this.containerUp) {
        this.onSelectEnd();
      }
      this.rectangle.clear();
    }
  }

  private onSelectEnd() {
    const bounds = this.rectangle.getLocalBounds();
    const elements = this.topo.getElements();
    const groups = this.getGroups();
    const selectNodes: Node[] = [];
    this.containerUp = true;
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
      if (this.isLock === node.isLock) {
        this.topo.setSelectedNodes(node);
      }
    });
    if (this.isSelectGroup) {
      const filterGroup = _.filter(groups, (group: Group) => {
        const childNodes = group.getChildNodes();
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
}
