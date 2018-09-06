/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import { expect } from 'chai';
import * as PIXI from 'pixi.js';
import { Node } from '../src/node';

describe('Node', () => {
  it('should return a PIXI Container object', () => {
    const node = new Node();
    expect(node instanceof PIXI.Container).to.equal(true);
  });
});
