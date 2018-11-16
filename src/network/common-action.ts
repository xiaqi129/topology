import * as _ from 'lodash';
import * as PIXI from 'pixi.js';
import { Application } from './application';
import { Node } from './node';

import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { Group } from './group';

export class CommonAction {
  private app: Application;
  private container: PIXI.Container;
  constructor(app: any) {
    this.app = app;
    this.container = app.getContainer();
  }

  public setZoom(num: number) {
    const appContainer = this.container;
    const scale = appContainer.scale;
    if (scale.x * (num + 1) > 0.3 && scale.x * (num + 1) < 2) {
      appContainer.setTransform(0, 0, scale.x * (num + 1), scale.y * (num + 1), 0, 0, 0, 0, 0);
    }

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

  public hitContainer() {
    this.container.hitArea = new PIXI.Rectangle(0, 0, this.container.width, this.container.height);
    this.container.interactive = true;
  }

  public setClick(color?: any) {
    let defaultFillColor: number;
    _.each(this.container.children, (element) => {
      if (element instanceof Node) {
        element.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
          event.stopPropagation();
          element.selcteOn(color);
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
              node.selcteOn();
            });
          }
        });
      }
    });
    this.hitContainer();
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
