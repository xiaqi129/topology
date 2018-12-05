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
      fontSize: 10,
      fill: '0x0099ff',
    });
    if (style) {
      _.extend(defaultStyles, style);
    }
    super(text, defaultStyles, canvas);
    this.setPosition(1);
    this.interactive = true;
    this.buttonMode = true;
    this.addListener('click', () => {
      alert(this.text);
    });
  }

  public setText(label: string) {
    this.text = label;
  }

  public setStyle(key: string, value: string) {
    _.extend(this.style, { key, value });
  }

  public setPosition(position: number) {

    const posDisX = 1;  // x定位系数
    const posDisY = 3;  // y定位系数
    switch (position) {
      case 0:
        this.anchor.set(0.5 * posDisX, 1.5 * posDisY);
        break;
      case 1:
        this.anchor.set(0.5 * posDisX, -0.5 * posDisY);
        break;
      case 2:
        this.anchor.set(1.5 * posDisX, 0.55 * posDisY);
        break;
      case 3:
        this.anchor.set(-0.5 * posDisX, 0.55 * posDisY);
        break;
    }
  }

}
