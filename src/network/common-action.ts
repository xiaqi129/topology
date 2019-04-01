/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { Application } from './application';
import { Node } from './node';
import { ITopo } from './topo';

import { CommonElement } from './common-element';
import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { GroupEdge } from './edge-conn-group';
import { Group } from './group';

export class CommonAction {
  public defaultLineColor: number = 0;
  public container: PIXI.Container;
  private app: Application;
  private topo: ITopo;
  private initScale: number | undefined;
  // bundle
  private nodeLabelFlag: boolean = true;
  // drag
  private dragging: boolean = false;
  private last: any;
  private data: any;

  constructor(app: any, topo: ITopo) {
    this.app = app;
    this.topo = topo;
    this.container = app.container;
  }

  public getCenter() {
    return this.app.getContainerCenter();
  }

  public dragContainer() {
    this.container.removeAllListeners();
    this.container.cursor = 'default';
    this.clearHighlight();
    this.drag();
  }

  public setSelect(isLock: boolean) {
    this.container.removeAllListeners();
    this.container.cursor = 'crosshair';
    this.clearHighlight();
    this.moveSelect(isLock);
  }

  public getSelectNodes() {
    const selectNodes = this.topo.getSelectedNodes();
    return selectNodes;
  }

  public setSelectNodes(node: Node) {
    this.topo.setSelectedNodes(node);
  }

  public getSelectEdge() {
    const selectEdge = this.topo.getSelectedEdge();
    return selectEdge;
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
  }

  public drag() {
    this.container.on('mousedown', (event: any) => {
      this.onDragStart(event);
      this.container.cursor = 'move';
    });
    this.container.on('mousemove', (event: any) => {
      this.onDragMove(event);
    });
    this.container.on('mouseup', () => {
      this.container.cursor = 'default';
    });
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
  }

  public onDragStart(event: PIXI.interaction.InteractionEvent) {
    const parent = this.container.parent.toLocal(event.data.global);
    this.dragging = true;
    this.data = event.data;
    this.last = { parents: parent };
  }

  public onDragMove(event: PIXI.interaction.InteractionEvent) {
    if (this.dragging) {
      const newPosition = this.data.getLocalPosition(this.container.parent);
      const distX = event.data.global.x;
      const distY = event.data.global.y;
      const edges = this.getChildEdges();
      const groups = this.getAllGroup();
      const elements: any = this.topo.getElements();
      _.each(elements, (element: CommonElement) => {
        if (element instanceof Node) {
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
    this.dragging = false;
    this.data = null;
    this.last = null;
    const edges = this.getChildEdges();
    const groups = this.getAllGroup();
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

  public getAllGroup() {
    const elements: any = this.topo.getElements();
    return _.filter(elements, (element: CommonElement) => {
      return element instanceof Group;
    });
  }

  public moveSelect(isLock: boolean) {
    const rectangle = new PIXI.Graphics();
    const elements = this.topo.getElements();
    let flag = false;
    let oldLeft = 0;
    let oldTop = 0;
    let width = 0;
    let height = 0;
    this.container.on('mousedown', (event: any) => {
      if (this.container.hitArea instanceof PIXI.Rectangle) {
        this.topo.removeSelectedNodes();
        flag = true;
        oldLeft = event.data.global.x;
        oldTop = event.data.global.y;
      }
    });
    this.container.on('mousemove', (event: any) => {
      if (flag) {
        rectangle.clear();
        width = event.data.global.x - oldLeft;
        height = event.data.global.y - oldTop;
        rectangle.lineStyle(1, 0X024997, 1);
        rectangle.alpha = 0.8;
        rectangle.drawRect(oldLeft, oldTop, width, height);
        this.app.addElement(rectangle);
      }
    });
    window.addEventListener('mouseup', (event: any) => {
      flag = false;
      const bounds = rectangle.getLocalBounds();
      _.each(elements, (element) => {
        let node: any;
        if (element instanceof Node) {
          if (isLock && element.isLock) {
            node = element;
          } else if (!isLock && !element.isLock) {
            node = element;
          }
        }
        if (node) {
          const sprite: any = node.getChildByName('node_sprite') ?
            node.getChildByName('node_sprite') : node.getChildByName('node_graph');
          const nodeTop = node.y - (sprite.height / 2);
          const nodeLeft = node.x - (sprite.width / 2);
          const nodeRight = node.x + (sprite.width / 2);
          const nodeBottom = node.y + (sprite.height / 2);
          if ((nodeTop >= bounds.top) && (nodeRight <= bounds.right) &&
            (nodeBottom <= bounds.bottom) && (nodeLeft >= bounds.left)) {
            this.topo.setSelectedNodes(node);
          }
        }
      });
      rectangle.clear();
    });
  }

  public setClick(color?: any) {
    const elements = this.topo.getElements();
    _.each(elements, (element) => {
      if (element instanceof Node) {
        element.defaultStyle.clickColor = color;
        element.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
          event.stopPropagation();
          if (this.getSelectNodes().length < 1) {
            this.removeHighLight();
            element.selectOne(color);
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
        element.on('click', (event: PIXI.interaction.InteractionEvent) => {
          this.removeHighLight();
        });
        element.addEventListener('mousedown', () => {
          this.removeHighLight();
        });
      }
    });
    this.clearHighlight();
  }

  public clearHighlight() {
    this.container.on('mousedown', () => {
      const selectNodes = this.topo.getSelectedNodes();
      const selectEdge: Edge | undefined = this.topo.getSelectedEdge();
      _.each(selectNodes, (node: Node) => {
        node.selectOff();
      });
      if (selectEdge) {
        selectEdge.selectOff();

      }
      this.topo.removeSelectedNodes();
      this.topo.removeSelectedEdge();
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

}
