/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import { expect } from 'chai';
import { Edge } from '../src/network/edge';
import { Group } from '../src/network/group';
import { Network } from '../src/network/network';
import { Node } from '../src/network/node';

describe('Network class methods test', () => {

  it('call createNode function successfully', () => {
    const network = new Network('div#wrapper');
    expect(network.createNode() instanceof PIXI.Container).to.equal(true);
  });

  it('call createGroup function successfully', () => {
    const network = new Network('div#wrapper');
    expect(network.createGroup() instanceof PIXI.Container).to.equal(true);
  });

  it('call createEdge function successfully', () => {
    const network = new Network('div#wrapper');
    const node = network.createNode();
    const group = network.createGroup();
    expect(network.createEdge(node, group) instanceof PIXI.Container).to.equal(true);
  });

  it('call clear function successfully', () => {
    const network = new Network('div#wrapper');
    const node = network.createNode();
    const group = network.createGroup();
    expect(network.createEdge(node, group) instanceof PIXI.Container).to.equal(true);
  });

  it('call addElement successfully', () => {
    const network = new Network('div#wrapper');
    const node = network.createNode();
    network.addElement(node);
    expect(network.getElements().length).to.equal(1);
    network.syncView();
    network.clear();
    expect(network.getElements().length).to.equal(0);
  });

});
