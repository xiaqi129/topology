/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import { expect } from 'chai';
import * as PIXI from 'pixi.js';
import { Edge } from '../src/network/edge';
import { Group } from '../src/network/group';
import { Node } from '../src/network/node';

describe('Topo Element Type', () => {
  it('should be the instance of PIXI.Container', () => {
    const node = new Node();
    const group = new Group();
    const edge = new Edge(node, group);
    expect(node instanceof PIXI.Container &&
      group instanceof PIXI.Container &&
      edge instanceof PIXI.Container).to.equal(true);
  });
});
