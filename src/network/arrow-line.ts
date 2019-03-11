/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */
import * as _ from 'lodash';
import { CommonElement, IStyles } from './common-element';

export interface IPoint {
  x: number;
  y: number;
}

export class ArrowLine extends CommonElement {
  public edge: PIXI.Graphics;
  public arrow: PIXI.Graphics;
  private start: IPoint;
  private end: IPoint;
  constructor(start: IPoint, end: IPoint) {
    super();
    this.start = start;
    this.end = end;
    this.edge = new PIXI.Graphics();
    this.arrow = new PIXI.Graphics();
    this.draw();
  }

  public clearEdgeRelatedGraph() {
    this.edge.clear();
    this.arrow.clear();

  }

  public draw() {
    this.clearEdgeRelatedGraph();
    const style = this.defaultStyle;
    // console.log(this.start, this.end);
  }
}
