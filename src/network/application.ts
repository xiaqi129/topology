/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import Viewport from 'pixi-viewport';
import * as Rx from 'rxjs';
import { debounceTime, windowWhen } from 'rxjs/operators';
import { Group } from './group';

export class Application extends PIXI.Application {
  private domRegex: string = '';
  private viewWrapper: HTMLElement | null = null;
  private container: Viewport | undefined;

  constructor(domRegex: string = '', iconResource: object, options = null) {
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
    this.domRegex = domRegex;
    this.initLoader(iconResource);
  }

  public initLoader(iconResource: any) {
    PIXI.loader.reset();
    PIXI.utils.clearTextureCache();
    _.each(iconResource, (icon: any) => {
      PIXI.loader.add(icon.name, icon.url);
    });
    PIXI.loader
      .load((loader: any, resources: any) => {
        _.each(resources, (resource) => {
          resource.texture.iconWidth = iconResource[resource.name].width;
          resource.texture.iconHeight = iconResource[resource.name].height;
        });
      });
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
