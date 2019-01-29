/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import * as Viewport from 'pixi-viewport';
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
  private app: Application;
  private container: Viewport;
  private topo: ITopo;
  private initScale: number | undefined;
  // bundle
  private lastClickTime: number = 0;
  private bundleLabelFlag: boolean = true;
  private bundleData: any = {};
  private bundledEdge: any = [];
  private nodeLabelFlag: boolean = true;
  private tooltip: Tooltip;

  constructor(app: any, topo: ITopo, tooltip: Tooltip) {
    this.app = app;
    this.topo = topo;
    this.container = app.container;
    this.tooltip = tooltip;
  }

  public setZoom(num: number, center?: boolean) {
    let percent: number = 0;
    this.initScale = num;
    const save: any = this.getCenter();
    this.container.scale.set(1);
    this.container.moveCenter(save);
    if (num > 0 && num < 2) {
      percent = num - 1;
    } else if (num >= 2) {
      percent = num;
    } else {
      throw Error('Zoom percent must greater than 0 !');
    }
    this.container.zoomPercent(percent, center || true);
  }

  public getCenter() {
    return this.container.center;
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
  }

  public zoomReset() {
    this.container.setTransform(0, 0, this.initScale || 1, this.initScale || 1, 0, 0, 0, 0, 0);
  }

  public dragContainer() {
    this.container.removeAllListeners('mousemove');
    this.container.removeAllListeners('mouseup');
    this.container.drag();
  }

  public setSelect() {
    this.container.removePlugin('drag');
    this.moveSelect();
  }

  public getSelectNodes() {
    const selectNodes = this.topo.getSelectedNodes();
    return selectNodes;
  }

  public setSelectNodes(node: Node) {
    this.topo.setSelectedNodes(node);
  }

  public removeSelectNodes() {
    this.cleanEdge();
    this.cleanNode();
    this.topo.removeSelectedNodes();
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
    this.container.on('mouseup', (event: any) => {
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
          this.cleanEdge();
          this.cleanNode();
          event.stopPropagation();
          element.selectOn();
        });
      } else if (element instanceof EdgeBundle) {
        _.each(element.children, (edges: any) => {
          this.defaultLineColor = edges.defaultStyle.lineColor;
          edges.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
            this.cleanEdge();
            this.cleanNode();
            event.stopPropagation();
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
    this.container.on('mousedown', () => {
      _.each(this.container.children, (element) => {
        if (element instanceof Node) {
          element.selectOff();
        }
        if (element instanceof Edge) {
          element.setStyle({
            fillColor: this.defaultLineColor,
            lineColor: this.defaultLineColor,
          });
        }
        if (element instanceof EdgeBundle) {
          _.each(element.children, (edges: any) => {
            edges.setStyle({
              fillColor: this.defaultLineColor,
              lineColor: this.defaultLineColor,
            });
          });
        }
        if (element instanceof Group) {
          _.each(element.children, (node) => {
            if (node instanceof GroupEdge) {
              node.setStyle({
                fillColor: this.defaultLineColor,
                lineColor: this.defaultLineColor,
              });
            }
          });
        }
      });
    });
  }

  public cleanEdge() {
    _.each(this.container.children, (ele) => {
      if (ele instanceof Edge) {
        ele.setStyle({
          fillColor: this.defaultLineColor,
          lineColor: this.defaultLineColor,
        });
      }
      if (ele instanceof EdgeBundle) {
        _.each(ele.children, (edge: any) => {
          edge.setStyle({
            fillColor: this.defaultLineColor,
            lineColor: this.defaultLineColor,
          });
        });
      }
      if (ele instanceof Group) {
        _.each(ele.children, (groupedge) => {
          if (groupedge instanceof GroupEdge) {
            groupedge.setStyle({
              fillColor: this.defaultLineColor,
              lineColor: this.defaultLineColor,
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

  public nodeLabelToggle(labelToggle: boolean) {
    if (labelToggle) {
      _.each(this.container.children, (element) => {
        if (element instanceof Node) {
          element.setLabel(element.getLabelContent(), element.getLabelStyle());
        }
      });
    } else {
      _.each(this.container.children, (element) => {
        if (element instanceof Node) {
          element.removeChild(element.getChildByName('node_label'));
        }
      });
    }
  }

  public toggleLabel() {
    this.nodeLabelFlag = !this.nodeLabelFlag;
  }

  public searchNode(node: Node) {
    const clickColor = node.defaultStyle.clickColor;
    this.cleanNode();
    this.setZoom(2);
    this.container.moveCenter(node.x, node.y);
    node.selectOn(clickColor);
  }

  public lockElement(element: CommonElement) {
    if (element instanceof Node) {
      const lockTexture = PIXI.Texture.fromFrame('lock');
      const lock = new PIXI.Sprite(lockTexture);
      const sprite = element.getChildByName('node_sprite') ?
        element.getChildByName('node_sprite') : element.getChildByName('node_graph');
      sprite.off('mousemove');
      lock.width = element.iconWidth / 2;
      lock.height = element.iconHeight / 2;
      lock.anchor.set(1.5, 1.5);
      lock.name = 'node_lock';
      element.isLock = true;
      element.addChild(lock);
    } else if (element instanceof Group) {
      const nodes = element.expandedVisibleNodes;
      const graph = _.find(element.children, (g) => {
        return g instanceof PIXI.Graphics;
      });
      _.each(nodes, (node) => {
        const sprite = node.getChildByName('node_sprite') ?
          node.getChildByName('node_sprite') : node.getChildByName('node_graph');
        sprite.off('mousemove');
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
    }
  }

  public unLockElement(element: CommonElement) {
    if (element instanceof Node) {
      const sprite = element.getChildByName('node_sprite') ?
        element.getChildByName('node_sprite') : element.getChildByName('node_graph');
      sprite.on('mousemove', element.onDragMove.bind(element));
      const lock = element.getChildByName('node_lock');
      element.isLock = false;
      lock.destroy();
    } else if (element instanceof Group) {
      const nodes = element.expandedVisibleNodes;
      const graph = _.find(element.children, (g) => {
        return g instanceof PIXI.Graphics;
      });
      _.each(nodes, (node) => {
        const sprite = node.getChildByName('node_sprite') ?
          node.getChildByName('node_sprite') : node.getChildByName('node_graph');
        sprite.on('mousemove', node.onDragMove.bind(node));
        const lock = node.getChildByName('node_lock');
        node.isLock = false;
        lock.destroy();
      });
      if (graph) {
        graph.on('mousemove', element.onDragMove.bind(element));
        element.isLock = false;
      }
    }
  }

}
