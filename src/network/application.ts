/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import Viewport from 'pixi-viewport';
import * as PIXI from 'pixi.js';
import * as Rx from 'rxjs';
import { debounceTime, windowWhen } from 'rxjs/operators';
import { Group } from './group';

export class Application extends PIXI.Application {
  private domRegex: string = '';
  private viewWrapper: HTMLDivElement | null = null;
  private container: Viewport;
  // private viewport: Viewport;

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
    this.container = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      interaction: this.renderer.plugins.interaction,
    });
    this.domRegex = domRegex;
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
    this.container
      .clamp()
      .drag()
      .pinch()
      .wheel()
      .decelerate();
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
  }

}
