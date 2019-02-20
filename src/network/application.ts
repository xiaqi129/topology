/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import Viewport from 'pixi-viewport';
import { Group } from './group';

export class Application extends PIXI.Application {
  private domRegex: string = '';
  private viewWrapper: HTMLElement | null = null;
  private container: Viewport | undefined;

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
      forceCanvas: true,
    });
    this.domRegex = domRegex;
    this.setup();
  }

  public setup() {
    this.initApplication();
    this.fitWrapperSize();
  }

  public initApplication() {
    this.viewWrapper = document.getElementById(this.domRegex);
    if (this.viewWrapper) {
      this.container = new Viewport({
        screenWidth: this.viewWrapper.clientWidth,
        screenHeight: this.viewWrapper.clientHeight,
        interaction: this.renderer.plugins.interaction,
        divWheel: this.viewWrapper,
      });
      this.viewWrapper.appendChild(this.view);
    }
    if (this.container) {
      this.stage.addChild(this.container);
      this.container
        .clamp()
        .pinch()
        .wheel()
        .decelerate();

    }
  }

  public fitWrapperSize() {
    this.viewWrapper = document.getElementById(this.domRegex);
    if (this.viewWrapper) {
      this.renderer.resize(this.viewWrapper.clientWidth, this.viewWrapper.clientHeight);
    }
    window.addEventListener('resize', () => {
      if (this.container && this.viewWrapper) {
        this.renderer.resize(this.viewWrapper.clientWidth, this.viewWrapper.clientHeight);
        this.container.resize(this.viewWrapper.clientWidth, this.viewWrapper.clientHeight);
      }
    });
  }

  public getWrapperBoundings() {
    const domNode = document.getElementById(this.domRegex);
    const boundingRect = domNode ? domNode.getBoundingClientRect() : { width: 0, height: 0 };
    const width = boundingRect.width;
    const height = boundingRect.height;
    return [width, height];
  }

  public getContainer() {
    if (this.container) {
      return this.container;
    }
  }

  public clearContainer() {
    if (this.container) {
      this.container.removeChildren(0, this.container.children.length);
    }
  }

  public addElement(element: PIXI.Container) {
    if (this.container) {
      this.container.addChild(element);
    }
  }

  public addElements(elements: PIXI.Container[]) {
    _.each(elements, (element) => {
      if (!(element.parent instanceof Group) && this.container) {
        this.container.addChild(element);
      }
    });
  }

}
