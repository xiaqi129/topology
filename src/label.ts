/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import * as PIXI from 'pixi.js';

class Label extends PIXI.Text {
  constructor(text?: string, style?: PIXI.TextStyleOptions, canvas?: HTMLCanvasElement) {
    super(text, style, canvas);
  }

  public setText(label: string) {
    this.text = label;
  }

  public setStyle(key: string, value: string) {
    _.extend(this.style, { key, value });
  }

}
