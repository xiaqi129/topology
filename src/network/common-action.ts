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

import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { GroupEdge } from './edge-conn-group';
import { Group } from './group';
import { Tooltip } from './tooltip';

export class CommonAction {
  private app: Application;
  private container: Viewport;
  private topo: ITopo;
  private clickColor: any;
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
    this.container = app.getContainer();
    this.tooltip = tooltip;
  }

  public setZoom(num: number) {
    this.container.zoomPercent(num);
  }

  public zoomOver() {
    const appContainer = this.container;
    const wrapperContainr = this.app.getWrapperBoundings();
    const containerWidth = appContainer.width;
    const containerHeight = appContainer.height;
    const scaleX = wrapperContainr[0] / containerWidth;
    const scaleY = wrapperContainr[1] / containerHeight;
    const scale = scaleX > scaleY ? scaleY : scaleX;
    appContainer.setTransform(0, 0, scale, scale, 0, 0, 0, 0, 0);
  }

  public zoomReset() {
    this.container.setTransform(0, 0, 1, 1, 0, 0, 0, 0, 0);
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
        if (element instanceof Node) {
          const nodeTop = element.y - (element.height / 2);
          const nodeLeft = element.x - (element.width / 2);
          const nodeRight = element.x + (element.width / 2);
          const nodeBottom = element.y + (element.height / 2);
          if ((nodeTop >= bounds.top) && (nodeRight <= bounds.right) &&
            (nodeBottom <= bounds.bottom) && (nodeLeft >= bounds.left)) {
            element.selectOn(this.clickColor);
            this.topo.setSelectedNodes(element);
          }
        }
        if (element instanceof Group) {
          _.each(element.children, (node) => {
            if (node instanceof Node && node.parent instanceof Group) {
              const nodeTop = node.y - (node.height / 2);
              const nodeLeft = node.x - (node.width / 2);
              const nodeRight = node.x + (node.width / 2);
              const nodeBottom = node.y + (node.height / 2);
              if ((nodeTop >= bounds.top) && (nodeRight <= bounds.right) &&
                (nodeBottom <= bounds.bottom) && (nodeLeft >= bounds.left)) {
                node.selectOn(this.clickColor);
                this.topo.setSelectedNodes(node);
              }
            }
          });
        }
      });
      rectangle.clear();
    });
  }

  public getZoom() {
    return this.container.scale;
  }

  public setClick(color?: any) {
    this.clickColor = color;
    let defaultLineColor: number;
    _.each(this.container.children, (element) => {
      if (element instanceof Node) {
        element.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
          event.stopPropagation();
          this.cleanEdge(defaultLineColor);
          element.selectOne(color);
        });
      } else if (element instanceof Edge) {
        defaultLineColor = element.defaultStyle.lineColor;
        element.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
          this.cleanEdge(defaultLineColor);
          this.cleanNode();
          event.stopPropagation();
          element.selcteOn();
        });
      } else if (element instanceof EdgeBundle) {
        _.each(element.children, (edges: any) => {
          defaultLineColor = edges.defaultStyle.lineColor;
          edges.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
            this.cleanEdge(defaultLineColor);
            this.cleanNode();
            event.stopPropagation();
            edges.selcteOn();
          });
        });
      } else if (element instanceof Group) {
        _.each(element.children, (node) => {
          if (node instanceof Node && node.parent instanceof Group) {
            node.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
              event.stopPropagation();
              this.cleanEdge(defaultLineColor);
              node.selectOne(color);
            });
          }
          if (node instanceof GroupEdge) {
            node.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
              event.stopPropagation();
              this.cleanEdge(defaultLineColor);
              this.cleanNode();
              node.selcteOn();
            });
          }
        });
      }
    });
    this.container.on('mousedown', () => {
      _.each(this.container.children, (element) => {
        if (element instanceof Node) {
          element.clearBorder();
        }
        if (element instanceof Edge) {
          element.setStyle({
            fillColor: defaultLineColor,
            lineColor: defaultLineColor,
          });
        }
        if (element instanceof EdgeBundle) {
          _.each(element.children, (edges: any) => {
            edges.setStyle({
              fillColor: defaultLineColor,
              lineColor: defaultLineColor,
            });
          });
        }
        if (element instanceof Group) {
          _.each(element.children, (node) => {
            if (node instanceof Node && node.parent instanceof Group) {
              node.clearBorder();
            }
            if (node instanceof GroupEdge) {
              node.setStyle({
                fillColor: defaultLineColor,
                lineColor: defaultLineColor,
              });
            }
          });
        }
      });
    });
  }

  public cleanEdge(defaultLineColor: number) {
    _.each(this.container.children, (ele) => {
      if (ele instanceof Edge) {
        ele.setStyle({
          fillColor: defaultLineColor,
          lineColor: defaultLineColor,
        });
      }
      if (ele instanceof EdgeBundle) {
        _.each(ele.children, (edge: any) => {
          edge.setStyle({
            fillColor: defaultLineColor,
            lineColor: defaultLineColor,
          });
        });
      }
      if (ele instanceof Group) {
        _.each(ele.children, (groupedge) => {
          if (groupedge instanceof GroupEdge) {
            groupedge.setStyle({
              fillColor: defaultLineColor,
              lineColor: defaultLineColor,
            });
          }
        });
      }
    });
  }

  public cleanNode() {
    _.each(this.container.children, (ele) => {
      if (ele instanceof Node) {
        ele.clearBorder();
      }
    });
  }

  public setBundle(edge: any) {
    edge.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
      event.stopPropagation();
      const currentTime = new Date().getTime();
      // double click
      if (currentTime - this.lastClickTime < 500) {
        const parent = edge.parent;
        const color = edge.defaultStyle.lineColor;
        if (!this.bundleData[parent.getBundleID()]) {
          // collapse
          this.bundleData[parent.getBundleID()] = [];
          const children = parent.children;
          for (const child of children) {
            this.bundleData[parent.getBundleID()].push(child);
          }
          parent.removeChildren(0, parent.children.length);
          const afterBundle = new Edge(edge.startNode, edge.endNode);
          afterBundle.setStyle({
            arrowColor: 0Xc71bd3,
            arrowLength: 15,
            arrowType: 0,
            arrowWidth: 1,
            fillArrow: true,
            lineColor: 0xC7254E,
            lineDistance: 5,
            lineType: 0,
            lineWidth: 1,
          });
          if (this.bundleLabelFlag) {
            const label = this.topo.createLabel(
              `(${this.bundleData[parent.getBundleID()].length})`);
            label.name = 'bundle_label';
            label.setPosition(4);
            label.x = (edge.startNode.x + edge.endNode.x) / 2;
            label.y = (edge.startNode.y + edge.endNode.y) / 2;
            afterBundle.addChild(label);
          }
          this.setBundle(afterBundle);
          // add Edge to EdgeBundle
          const tmpBundle = new EdgeBundle(afterBundle);
          tmpBundle.name = `tmpBundle_${parent.getBundleID()}`;
          // add to elements
          this.topo.addElement(afterBundle);
          parent.addChild(afterBundle);

          this.bundledEdge.push(afterBundle);
        } else {
          // expand
          parent.removeChildren(0, parent.children.length);
          // remove from elements
          this.topo.removeEdgeBundleByName(`tmpBundle_${parent.getBundleID()}`);
          const edges = this.bundleData[parent.getBundleID()];
          for (const newEdge of edges) {
            parent.addChild(newEdge);
          }
          this.bundleData[parent.getBundleID()] = undefined;
        }
        this.tooltip.clearTooltip();
        this.setClick();
      } else {
        this.lastClickTime = currentTime;
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

  public nodeLabelToggle() {
    this.nodeLabelFlag = !this.nodeLabelFlag;

    if (this.nodeLabelFlag) {
      _.each(this.container.children, (element) => {
        if (element instanceof Node) {
          element.setLabel(element.getLabelContent());
        }
        if (element instanceof Group) {
          _.each(element.children, (e) => {
            if (e instanceof Node) {
              e.setLabel(e.getLabelContent());
            }
          });
        }
      });
    } else {
      _.each(this.container.children, (element) => {
        if (element instanceof Node) {
          element.removeChild(element.getChildByName('node_label'));
        }
        if (element instanceof Group) {
          _.each(element.children, (e) => {
            if (e instanceof Node) {
              e.removeChild(e.getChildByName('node_label'));
            }
          });
        }
      });
    }
  }

}
