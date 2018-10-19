/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import * as PIXI from 'pixi.js';

export interface IStyles {
  lineWidth: number;
  lineColor: number;
  fillColor: any;
  fillOpacity: number;
  arrowColor: number;
  arrowLength: number;
  arrowType: number;
  arrowWidth: number;
  fillArrow: boolean;
  lineDistance: number;
  padding: number;
  margin: number;
  height: number;
  width: number;
}

export interface IPosition {
  x: number;
  y: number;
}

export abstract class CommonElement extends PIXI.Container {
  public renderer: any;
  public defaultStyle: IStyles = {
    lineWidth: 1,
    lineColor: 0xEEEEEE,
    fillColor: 0xDDDDDD,
    fillOpacity: 1,
    arrowColor: 0Xc71bd3,
    arrowLength: 15,
    arrowType: 1,
    arrowWidth: 1,
    fillArrow: true,
    lineDistance: 5,
    padding: 10,
    margin: 10,
    height: 15,
    width: 15,
  };
  private id: string = _.uniqueId('element_');

  constructor() {
    super();
  }

  public clearDisplayObjects() {
    const childNodes = _.filter(this.children, (child) => {
      return child instanceof PIXI.Graphics;
    });
    _.each(childNodes, (node: any) => {
      node.destroy();
    });
  }

  public getUID() {
    return this.id;
  }

  public setStyle(styles: object, draw: boolean = true) {
    _.extend(this.defaultStyle, styles);
    if (draw) {
      this.draw();
    }
  }

  public abstract draw(): void;

}
