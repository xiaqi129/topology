/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';

export class Label extends PIXI.Text {
  constructor(text?: string, style?: PIXI.TextStyleOptions, canvas?: HTMLCanvasElement) {

    // default styles
    const defaultStyles = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: '0x0386d2',
    });
    if (style) {
      _.extend(defaultStyles, style);
    }
    super(text, defaultStyles, canvas);
    this.interactive = true;
    this.buttonMode = true;
    this.name = 'label';
  }

  public setText(label: string) {
    this.text = label;
  }

  public getText() {
    return this.text;
  }

  public setStyle(style: PIXI.TextStyleOptions) {
    _.extend(this.style, style);
  }

  public setPosition(position: number) {

    const posDisX = 1;  // x定位系数
    const posDisY = 2.5;  // y定位系数
    switch (position) {
      case 0:
        this.anchor.set(0.5, 1.5);
        break;
      case 1:
        this.anchor.set(0.5, -0.5);
        break;
      case 2:
        this.anchor.set(1.5 * posDisX, 0.55 * posDisY);
        break;
      case 3:
        this.anchor.set(-0.5 * posDisX, 0.55 * posDisY);
        break;
      case 4:
        this.anchor.set(0.5, 0.5);
    }
  }

}
