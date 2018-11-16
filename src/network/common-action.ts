import * as _ from 'lodash';
import * as PIXI from 'pixi.js';
import { Application } from './application';
import { Node } from './node';

import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { Group } from './group';

export class CommonAction {
  private mouseMoveList: any = [];
  private positionList: any = [];
  private app: Application;
  private container: PIXI.Container;
  private dragging: boolean;
  private data: any;
  constructor(app: any) {
    this.app = app;
    this.container = app.getContainer();
    this.dragging = false;
    this.data = null;
  }

  public setZoom(num: number, event?: any) {
    const appContainer = this.container;
    const scale = appContainer.scale;
    const movePosition = this.positionList.pop();
    if (event) {
      const direction = event.deltaY < 0 ? 1 : -1;
      const zoom = 1 + (direction * num);
      if (scale.x * zoom > 0.3 && scale.x * zoom < 3) {
        this.setMouseList(event.clientX, event.clientY);
        const beforeWheel = this.mouseMoveList[0];
        const afterWheel = this.mouseMoveList[1];
        const zoomChange = scale.x * zoom;
        const scaleChange = zoomChange - 1;
        let offsetX = 0;
        let offsetY = 0;
        if (beforeWheel && afterWheel) {
          const wheelX = (afterWheel.x - beforeWheel.x) * (scaleChange / zoom);
          const wheelY = (afterWheel.y - beforeWheel.y) * (scaleChange / zoom);
          offsetX = -(event.clientX * scaleChange) + wheelX;
          offsetY = -(event.clientY * scaleChange) + wheelY;
        } else {
          offsetX = -(event.clientX * scaleChange);
          offsetY = -(event.clientY * scaleChange);
        }
        if (movePosition) {
          const x = movePosition.x;
          const y = movePosition.y;
          appContainer.
            setTransform(offsetX + x, offsetY + y, scale.x * zoom, scale.y * zoom, 0, 0, 0, 0, 0);
        } else {
          appContainer.
            setTransform(offsetX, offsetY, scale.x * zoom, scale.y * zoom, 0, 0, 0, 0, 0);
        }
      }
    } else {
      if (scale.x * (num + 1) > 0.3 && scale.x * (num + 1) < 2) {
        appContainer.setTransform(0, 0, scale.x * (num + 1), scale.y * (num + 1), 0, 0, 0, 0, 0);
      }
    }
  }

  public setMouseList(cx: number, cy: number) {
    if (this.mouseMoveList.length < 2) {
      this.mouseMoveList.push({ x: cx, y: cy });
    } else {
      if (cx !== this.mouseMoveList[1].x && Math.abs(cx - this.mouseMoveList[1].x) > 50) {
        this.mouseMoveList.shift();
        this.mouseMoveList.push({ x: cx, y: cy });
      }
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

  public dragContainer() {
    this.hitContainer();
    // this.container.buttonMode = true;
    this.container
      .on('mousedown', this.onDragStart.bind(this))
      .on('mouseup', this.onDragEnd.bind(this))
      .on('mouseout', this.onDragEnd.bind(this))
      .on('mousemove', this.onDragMove.bind(this));
  }

  public onDragStart(event: PIXI.interaction.InteractionEvent) {
    this.dragging = true;
    this.data = event.data;
  }

  public onDragEnd() {
    this.dragging = false;
  }

  public onDragMove() {
    if (this.dragging) {
      this.container.position.x += this.data.originalEvent.movementX;
      this.container.position.y += this.data.originalEvent.movementY;
      this.positionList.push({ x: this.container.position.x, y: this.container.position.y });
    }
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
