/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import Viewport from 'pixi-viewport';
import * as PIXI from 'pixi.js';
import { Application } from './application';
import { Node } from './node';
import { ITopo } from './topo';

import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { Group } from './group';

export class CommonAction {
  private app: Application;
  private container: Viewport;
  private topo: ITopo;
  constructor(app: any, topo: ITopo) {
    this.app = app;
    this.topo = topo;
    this.container = app.getContainer();
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
            element.selectOn();
            this.topo.setSelectedNodes(element);
          }
        }
      });
      rectangle.clear();
    });
  }

  public getZoom() {
    return this.container.scale;
  }

  public setClick(color?: any) {
    let defaultFillColor: number;
    _.each(this.container.children, (element) => {
      if (element instanceof Node) {
        element.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
          event.stopPropagation();
          element.selectOne(color);
        });
      } else if (element instanceof Edge) {
        defaultFillColor = element.defaultStyle.fillColor;
        element.addEventListener('click', (event: PIXI.interaction.InteractionEvent) => {
          event.stopPropagation();
          event.stopped = false;
          element.selcteOn();
        });
      } else if (element instanceof EdgeBundle) {
        _.each(element.children, (edges: any) => {
          defaultFillColor = edges.defaultStyle.fillColor;
          edges.addEventListener('click', (event: PIXI.interaction.InteractionEvent) => {
            event.stopPropagation();
            event.stopped = false;
            edges.selcteOn();
          });
        });
      } else if (element instanceof Group) {
        _.each(element.children, (node) => {
          if (node instanceof Node && node.parent instanceof Group) {
            node.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
              event.stopPropagation();
              node.selectOne();
            });
          }
        });
      }
    });
    this.container.on('mousedown', () => {
      _.each(this.container.children, (element) => {
        if (element instanceof Node) {
          element.clearDisplayObjects();
        }
        if (element instanceof Edge) {
          element.setStyle({
            fillColor: defaultFillColor,
            lineColor: defaultFillColor,
          });
        }
        if (element instanceof EdgeBundle) {
          _.each(element.children, (edges: any) => {
            edges.setStyle({
              fillColor: defaultFillColor,
              lineColor: defaultFillColor,
            });
          });
        }
        if (element instanceof Group) {
          _.each(element.children, (node) => {
            if (node instanceof Node && node.parent instanceof Group) {
              node.clearDisplayObjects();
            }
          });
        }
      });
    });
  }
}
