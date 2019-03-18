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
import { Tooltip } from './tooltip';

export class CommonAction {
  public defaultLineColor: number = 0;
  public container: PIXI.Container;
  private app: Application;
  private topo: ITopo;
  private initScale: number | undefined;
  // bundle
  private lastClickTime: number = 0;
  private bundleLabelFlag: boolean = true;
  private bundleData: any = {};
  private bundledEdge: any = [];
  private nodeLabelFlag: boolean = true;
  private tooltip: Tooltip;
  // drag
  private dragging: boolean = false;
  private last: any;
  private data: any;

  constructor(app: any, topo: ITopo, tooltip: Tooltip) {
    this.app = app;
    this.topo = topo;
    this.container = app.container;
    this.tooltip = tooltip;
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
  }

  public getCenter() {
    return this.app.getContainerCenter();
  }

  public zoomOver() {
    const appContainer = this.container;
    const wrapperContainr = this.app.getWrapperBoundings();
    const containerWidth = appContainer.width;
    const containerHeight = appContainer.height;
    const scaleX = containerWidth < wrapperContainr[0] ? containerWidth / wrapperContainr[0] : wrapperContainr[0] / containerWidth;
    const scaleY = containerHeight < wrapperContainr[1] ? containerHeight / wrapperContainr[1] : wrapperContainr[1] / containerHeight;
    const scale = scaleX > scaleY ? scaleY : scaleX;
    appContainer.setTransform(0, 0, scale, scale, 0, 0, 0, 0, 0);
    this.app.moveCenter(wrapperContainr[0] / 2, wrapperContainr[1] / 2);
  }

  public zoomReset() {
    const wrapperContainr = this.app.getWrapperBoundings();
    this.container.setTransform(0, 0, this.initScale || 1, this.initScale || 1, 0, 0, 0, 0, 0);
    this.app.moveCenter(wrapperContainr[0] / 2, wrapperContainr[1] / 2);
  }

  public dragContainer() {
    this.container.removeAllListeners();
    this.container.cursor = 'default';
    this.clearHighlight();
    this.drag();
  }

  public setSelect() {
    this.container.removeAllListeners();
    this.container.cursor = 'crosshair';
    this.clearHighlight();
    this.moveSelect();
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

  public removeSelectNodes() {
    this.cleanEdge();
    this.cleanNode();
    this.topo.removeSelectedNodes();
  }

  public drag() {
    this.container.on('mousedown', (event: any) => {
      this.onDragStart(event);
      this.container.cursor = 'move';
    });
    this.container.on('mousemove', (event: any) => {
      this.onDragMove(event);
    });
  }

  public onDragStart(event: PIXI.interaction.InteractionEvent) {
    const parent = this.container.parent.toLocal(event.data.global);
    this.dragging = true;
    this.data = event.data;
    this.last = { parents: parent, x: event.data.global.x, y: event.data.global.y };
  }

  public onDragMove(event: PIXI.interaction.InteractionEvent) {
    if (this.dragging) {
      const newPosition = this.data.getLocalPosition(this.container.parent);
      const distX = event.data.global.x;
      const distY = event.data.global.y;
      const elements = this.container.children;
      _.each(elements, (element) => {
        if (element instanceof Node) {
          element.position.x += (newPosition.x - this.last.parents.x);
          element.position.y += (newPosition.y - this.last.parents.y);
        } else if (element instanceof Group) {
          element.draw();
        } else if (element instanceof Edge) {
          element.draw();
        } else if (element instanceof EdgeBundle) {
          _.each(element.children, (edge: any) => {
            edge.draw();
          });
        }
      });
      this.last = { parents: newPosition, x: distX, y: distY };
    }
  }

  public onDragEnd() {
    this.dragging = false;
    this.container.cursor = 'default';
    this.data = null;
    this.last = null;
    const elements = this.container.children;
    _.each(elements, (element) => {
      if (element instanceof Group) {
        element.draw();
      } else if (element instanceof Edge) {
        element.draw();
      } else if (element instanceof EdgeBundle) {
        _.each(element.children, (edge: any) => {
          edge.draw();
        });
      }
    });
  }

  public moveSelect() {
    const rectangle = new PIXI.Graphics();
    const elements = this.container.children;
    let flag = false;
    let oldLeft = 0;
    let oldTop = 0;
    let hitAreaX = 0;
    let hitAreaY = 0;
    let width = 0;
    let height = 0;
    this.container.on('mousedown', (event: any) => {
      if (this.container.hitArea instanceof PIXI.Rectangle) {
        this.topo.removeSelectedNodes();
        flag = true;
        hitAreaX = this.container.hitArea.x;
        hitAreaY = this.container.hitArea.y;
        oldLeft = (event.data.global.x / this.container.scale.x) + hitAreaX;
        oldTop = (event.data.global.y / this.container.scale.y) + hitAreaY;
      }
    });
    this.container.on('mousemove', (event: any) => {
      if (flag) {
        rectangle.clear();
        width = (event.data.global.x / this.container.scale.x) + hitAreaX - oldLeft;
        height = (event.data.global.y / this.container.scale.y) + hitAreaY - oldTop;
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
        if (element instanceof Node && !element.isLock) {
          const sprite: any = element.getChildByName('node_sprite') ?
            element.getChildByName('node_sprite') : element.getChildByName('node_graph');
          const nodeTop = element.y - (sprite.height / 2);
          const nodeLeft = element.x - (sprite.width / 2);
          const nodeRight = element.x + (sprite.width / 2);
          const nodeBottom = element.y + (sprite.height / 2);
          if ((nodeTop >= bounds.top) && (nodeRight <= bounds.right) &&
            (nodeBottom <= bounds.bottom) && (nodeLeft >= bounds.left)) {
            this.topo.setSelectedNodes(element);
          }
        }
      });
      rectangle.clear();
    });
  }

  public getZoom() {
    return this.container.scale.x;
  }

  public setClick(color?: any) {
    _.each(this.container.children, (element) => {
      if (element instanceof Node) {
        element.defaultStyle.clickColor = color;
        element.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
          event.stopPropagation();
          if (this.getSelectNodes().length < 1) {
            this.removeSelectNodes();
            element.selectOne(color);
            this.setSelectNodes(element);
          }
        });
      } else if (element instanceof Edge) {
        this.defaultLineColor = element.defaultStyle.lineColor;
        element.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
          event.stopPropagation();
          this.cleanEdge();
          this.cleanNode();
          this.topo.setSelectedEdge(element);
          element.selectOn();
        });
      } else if (element instanceof EdgeBundle) {
        _.each(element.children, (edges: any) => {
          this.defaultLineColor = edges.defaultStyle.lineColor;
          edges.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
            event.stopPropagation();
            this.cleanEdge();
            this.cleanNode();
            this.topo.setSelectedEdge(edges);
            edges.selectOn();
          });
        });
      } else if (element instanceof Group) {
        element.on('click', (event: PIXI.interaction.InteractionEvent) => {
          this.cleanEdge();
          this.cleanNode();
          this.topo.removeSelectedNodes();
        });
        element.addEventListener('mousedown', () => {
          this.cleanEdge();
          this.cleanNode();
          // node.selectOn();
        });
        _.each(element.children, (node) => {
          if (node instanceof GroupEdge) {
            node.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
              event.stopPropagation();
              this.cleanEdge();
              this.cleanNode();
              node.selectOn();
            });
          }
        });
      }
    });
    this.clearHighlight();
  }

  public clearHighlight() {
    this.container.on('mousedown', () => {
      _.each(this.container.children, (element) => {
        if (element instanceof Node) {
          element.selectOff();
          this.topo.removeSelectedNodes();
        }
        if (element instanceof Edge) {
          element.setStyle({
            lineColor: element.defalultColor,
          });
        }
        if (element instanceof EdgeBundle) {
          _.each(element.children, (edges: any) => {
            edges.setStyle({
              lineColor: edges.defalultColor,
            });
          });
        }
        if (element instanceof Group) {
          _.each(element.children, (node) => {
            if (node instanceof GroupEdge) {
              node.setStyle({
                lineColor: node.defalultColor,
              });
            }
          });
        }
      });
    });
  }

  public cleanEdge() {
    this.topo.removeSelectedEdge();
    _.each(this.container.children, (ele) => {
      if (ele instanceof Edge) {
        ele.setStyle({
          lineColor: ele.defalultColor,
        });
      }
      if (ele instanceof EdgeBundle) {
        _.each(ele.children, (edge: any) => {
          edge.setStyle({
            lineColor: edge.defalultColor,
          });
        });
      }
      if (ele instanceof Group) {
        _.each(ele.children, (groupedge) => {
          if (groupedge instanceof GroupEdge) {
            groupedge.setStyle({
              lineColor: groupedge.defalultColor,
            });
          }
        });
      }
    });
  }

  public cleanNode() {
    _.each(this.container.children, (ele) => {
      if (ele instanceof Node) {
        ele.selectOff();
      }
    });
  }

  public bundleLabelToggle() {
    this.bundleLabelFlag = !this.bundleLabelFlag;

    if (this.bundleLabelFlag) {
      _.each(this.bundledEdge, (edge) => {
        const label = this.topo.createLabel(
          `(${this.bundleData[edge.parent.getBundleID()].length})`);
        label.name = 'bundle_label';
        label.setPosition(4);
        label.x = (edge.startNode.x + edge.endNode.x) / 2;
        label.y = (edge.startNode.y + edge.endNode.y) / 2;
        edge.addChild(label);
      });
    } else {
      _.each(this.bundledEdge, (edge) => {
        edge.removeChild(edge.getChildByName('bundle_label'));
      });
    }
  }

  public toggleLabel() {
    this.nodeLabelFlag = !this.nodeLabelFlag;
  }

  public lockElement(element: CommonElement) {
    if (element instanceof Node) {
      const nodeLock = element.getChildByName('node_lock');
      if (nodeLock) {
        element.removeChild(nodeLock);
      }
      const lockTexture = PIXI.Texture.fromFrame('lock');
      const lock = new PIXI.Sprite(lockTexture);
      element.off('mousemove');
      lock.width = element.iconWidth / 2;
      lock.height = element.iconHeight / 2;
      lock.anchor.set(1.5, 1.5);
      lock.name = 'node_lock';
      element.isLock = true;
      element.addChild(lock);
    } else if (element instanceof Group) {
      element.draw();
      const nodes = element.expandedVisibleNodes;
      const substratumGroups = element.substratumInfo;
      const graph = _.find(element.children, (g) => {
        return g instanceof PIXI.Graphics;
      });
      _.each(nodes, (node) => {
        node.off('mousemove');
        const nodeLock = node.getChildByName('node_lock');
        if (nodeLock) {
          node.removeChild(nodeLock);
        }
        const lockTexture = PIXI.Texture.fromFrame('lock');
        const lock = new PIXI.Sprite(lockTexture);
        lock.width = node.iconWidth / 2;
        lock.height = node.iconHeight / 2;
        lock.anchor.set(1.5, 1.5);
        lock.name = 'node_lock';
        node.isLock = true;
        node.addChild(lock);
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
      const lock = element.getChildByName('node_lock');
      element.isLock = false;
      if (lock) {
        lock.destroy();
      }
    } else if (element instanceof Group) {
      const nodes = element.expandedVisibleNodes;
      const substratumGroups = element.substratumInfo;
      const graph = _.find(element.children, (g) => {
        return g instanceof PIXI.Graphics;
      });
      _.each(nodes, (node) => {
        node.on('mousemove', node.onDragMove);
        const lock = node.getChildByName('node_lock');
        node.isLock = false;
        if (lock) {
          lock.destroy();
        }
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
