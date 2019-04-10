/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';

export class Application extends PIXI.Application {
  public domRegex: string = '';
  private viewWrapper: HTMLElement;
  private container: PIXI.Container | undefined;

  constructor(domRegex: string = '', options = null) {
    super(options || {
      antialias: true,
      height: 0,
      width: 0,
      autoResize: true,
      resolution: 2,
      backgroundColor: 0Xffffff,
      forceFXAA: true,
      forceCanvas: true,
    });
    this.domRegex = domRegex;
    this.viewWrapper = this.getWrapper();
    this.setup();
  }

  public setup() {
    this.initApplication();
    this.fitWrapperSize();
  }

  public initApplication() {
    if (this.viewWrapper) {
      this.renderer.resize(this.viewWrapper.clientWidth, this.viewWrapper.clientHeight);
      this.container = new PIXI.Container();
      this.viewWrapper.appendChild(this.view);
      if (this.container) {
        this.stage.addChild(this.container);
        this.moveCenter(this.viewWrapper.clientWidth / 2, this.viewWrapper.clientHeight / 2);
        this.container.hitArea = new PIXI.Rectangle(0, 0, this.viewWrapper.clientWidth, this.viewWrapper.clientHeight);
        this.container.interactive = true;
        (this.container as any).center = [this.viewWrapper.clientWidth / 2, this.viewWrapper.clientHeight / 2];
      }
    }
  }

  public moveCenter(x: number, y: number) {
    if (x && y && this.container && this.viewWrapper) {
      this.container.position.set(this.viewWrapper.clientWidth / 2 - x, this.viewWrapper.clientHeight / 2 - y);
      return this.container;
    }
  }

  public fitWrapperSize() {
    if (this.viewWrapper) {
      this.renderer.resize(this.viewWrapper.clientWidth, this.viewWrapper.clientHeight);
    }
    window.addEventListener('resize', () => {
      if (this.container && this.viewWrapper) {
        this.renderer.resize(this.viewWrapper.offsetWidth, this.viewWrapper.offsetHeight);
        this.moveCenter(this.viewWrapper.offsetWidth / 2, this.viewWrapper.offsetHeight / 2);
        this.container.hitArea = new PIXI.Rectangle(0, 0, this.viewWrapper.offsetWidth, this.viewWrapper.offsetHeight);
        (this.container as any).center = [this.viewWrapper.offsetWidth / 2, this.viewWrapper.offsetHeight / 2];
      }
    });
  }

  public getWrapperBoundings() {
    const domNode = this.getWrapper();
    const boundingRect = domNode ? domNode.getBoundingClientRect() : { width: 0, height: 0 };
    const width = boundingRect.width;
    const height = boundingRect.height;
    return [width, height];
  }

  public getContainerCenter() {
    const point = new PIXI.Point(this.viewWrapper.clientWidth / 2, this.viewWrapper.clientHeight / 2);
    return point;
  }

  public getWrapper() {
    if (this.domRegex) {
      const wrapper: any = document.getElementById(this.domRegex);
      return wrapper;
    }
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
      if (this.container && element) {
        this.container.addChild(element);
      }
    });
    return true;
  }

}
