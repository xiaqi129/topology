/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement } from './common-element';

export class PortChannel extends CommonElement {
  public backgroundShape: PIXI.Graphics;
  constructor() {
    super();
    this.backgroundShape = new PIXI.Graphics();
    this.draw();
  }

  public draw() {
    const graph = this.backgroundShape;
  }
}
