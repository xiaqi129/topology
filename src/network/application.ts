/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import * as PIXI from 'pixi.js';
import * as Rx from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Group } from './group';

export class Application extends PIXI.Application {
  private domRegex: string = '';
  private viewWrapper: HTMLDivElement | null = null;
  private container: PIXI.Container;
  private dragging: boolean;
  private data: any;

  constructor(domRegex: string = '', options = null) {
    super(options || {
      antialias: true,
      autoResize: true,
      height: 0,
      powerPreference: 'high-performance',
      resolution: 2,
      transparent: true,
      width: 0,
      forceFXAA: true,
    });
    this.container = new PIXI.Container();
    this.domRegex = domRegex;
    this.dragging = false;
    this.data = null;
    this.setup();
  }

  public setup() {
    this.initApplication();
    this.fitWrapperSize();
  }

  public initApplication() {
    this.viewWrapper = document.querySelector(this.domRegex);
    if (this.viewWrapper) {
      this.viewWrapper.appendChild(this.view);
    }
    this.stage.addChild(this.container);
  }

  public fitWrapperSize() {
    this.autoResizeByWrapperBoundings();
    Rx.
      fromEvent(window, 'resize').
      pipe(debounceTime(500)).
      subscribe(() => {
        this.autoResizeByWrapperBoundings();
      });
  }

  public autoResizeByWrapperBoundings() {
    const boundingsRect = this.getWrapperBoundings();
    const width = _.get(boundingsRect, 0);
    const height = _.get(boundingsRect, 1);
    this.renderer.resize(width, height);
  }

  public getWrapperBoundings() {
    const domNode = document.querySelector(this.domRegex);
    const boundingRect = domNode ? domNode.getBoundingClientRect() : { width: 0, height: 0 };
    const width = boundingRect.width;
    const height = boundingRect.height;
    return [width, height];
  }

  public getContainer() {
    return this.container;
  }

  public clearContainer() {
    this.container.removeChildren(0, this.container.children.length);
  }

  public addElement(element: PIXI.Container) {
    this.container.addChild(element);
  }

  public addElements(elements: PIXI.Container[]) {
    _.each(elements, (element) => {
      if (!(element.parent instanceof Group)) {
        this.container.addChild(element);
      }
    });
    // this.dragContainer();
  }

  public dragContainer() {
    this.container.hitArea = new PIXI.Rectangle(0, 0, this.container.width, this.container.height);
    this.container.interactive = true;
    this.container.buttonMode = true;
    this.container
      .on('mousedown', this.onDragStart.bind(this))
      .on('mouseup', this.onDragEnd.bind(this))
      .on('mousemove', this.onDragMove.bind(this));
  }

  public onDragStart(event: PIXI.interaction.InteractionEvent) {
    event.stopPropagation();
    this.dragging = true;
    this.data = event.data;
  }

  public onDragEnd() {
    this.dragging = false;
  }

  public onDragMove(event: PIXI.interaction.InteractionEvent) {
    if (this.dragging) {
      event.stopPropagation();
      this.container.position.x += this.data.originalEvent.movementX;
      this.container.position.y += this.data.originalEvent.movementY;
    }
  }

}
