/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement } from './common-element';
import { Edge } from './edge';
import { Label } from './label';
import { Node } from './node';

export class EdgeBundle extends CommonElement {
  public isExpanded: boolean = true;
  public bundleEdge: any[] = [];
  public toggleBundle: boolean = true;
  public type: string = 'EdgeBundle';
  private bundleID: string = '';
  private lastClickTime: number = 0;
  private bundleData: any = {};
  private startNode: Node;
  private endNode: Node;
  private style: any;
  private defaultColor: number;
  private defaultWidth: number;

  constructor(edge: Edge) {
    super();
    this.bundleID = edge.edgeNodesSortUIDStr();
    this.startNode = edge.startNode;
    this.endNode = edge.endNode;
    this.style = edge.defaultStyle;
    this.addChild(edge);
    this.defaultColor = _.cloneDeep(edge.defaultColor);
    this.defaultWidth = edge.invariableStyles.lineWidth;
    this.bundleEdge = this.children;
    this.setBundle(edge);
  }

  public draw() {
    if (this.toggleBundle) {
      const bundleId = this.getBundleID();
      if (!this.isExpanded) {
        // collapse
        if (this.children.length > 1) {
          this.bundleData[bundleId] = [];
          _.each(this.children, (child) => {
            this.bundleData[bundleId].push(child);
          });
        }
        this.removeChildren(0, this.children.length);
        const afterBundle = new Edge(this.startNode, this.endNode);
        afterBundle.setStyle(this.style);
        afterBundle.name = 'bundle_line';
        if (this.bundleData[bundleId]) {
          const graph = new PIXI.Graphics();
          const style = this.defaultStyle;
          graph.name = 'label_background';
          graph.beginFill(style.fillColor, 1);
          graph.drawCircle(0, 0, 7);
          graph.endFill();
          afterBundle.addChild(graph);
          const label = new Label(`${this.bundleData[bundleId].length}`, {
            fill: 0Xffffff,
            fontFamily: 'Times New Roman',
            fontWeight: 'bold',
          });
          label.name = 'bundle_label';
          label.setPosition(4);
          afterBundle.addChild(label);
          afterBundle.setChildIndex(label, afterBundle.children.length - 1);
          afterBundle.setChildIndex(graph, afterBundle.children.length - 2);
          // add to elements
          afterBundle.initStyle({
            lineType: 0,
            lineColor: this.defaultColor,
            lineWidth: this.defaultWidth,
          });
          this.addChild(afterBundle);
        } else {
          this.removeChild(this.getChildByName('bundle_label'));
        }
        this.setBundle(afterBundle);
      } else {
        // expand
        this.removeChild(this.getChildByName('bundle_line'));
        const edges = this.bundleData[bundleId];
        _.each(edges, (bundleEdge) => {
          this.addChild(bundleEdge);
          bundleEdge.draw();
        });
      }
      const tooltip = document.getElementById('tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    }
  }

  public addEdge(edge: Edge) {
    this.addEdges([edge]);
  }

  public changeLabelSize(size: number) {
    if (!this.isExpanded) {
      const edge: any = this.children[0];
      if (edge) {
        const bundleLabel = edge.getChildByName('bundle_label');
        const bundleBackground = edge.getChildByName('label_background');
        if (size <= 1.2 && size >= 0) {
          edge.setStyle({
            lineWidth: this.defaultWidth * size,
          });
          bundleBackground.clear();
          bundleBackground.beginFill(this.defaultStyle.fillColor, 1);
          bundleBackground.drawCircle(0, 0, 7 * size);
          bundleBackground.endFill();
          bundleLabel.setStyle({
            fontSize: 10 * size,
          });
        } else {
          edge.setStyle({
            lineWidth: this.defaultWidth * 1.2,
          });
          bundleBackground.clear();
          bundleBackground.beginFill(this.defaultStyle.fillColor, 1);
          bundleBackground.drawCircle(0, 0, 7 * 1.2);
          bundleBackground.endFill();
          bundleLabel.setStyle({
            fontSize: 10 * 1.2,
          });
        }
      }
    }
  }

  public setExpaned(expanded: boolean) {
    this.isExpanded = expanded;
    this.draw();
  }

  public addEdges(edges: Edge[]) {
    this.addChildren(edges);
    this.bundleEdge = this.children;
    this.setBundleEdgesPosition();
    _.each(edges, (edge) => {
      this.setBundle(edge);
    });
  }

  public setBundleEdgesPosition() {
    const edges = this.children;
    const bundleStyle = this.defaultStyle.bundleStyle;
    const degree = 15;
    const degreeStep = 8;
    const values: number[][] = [];
    const distance = 2;
    let distanceStep = 4;
    if (bundleStyle === 1) {
      distanceStep = 1;
    }
    const isSameDirection = _.every(edges, (edg: Edge) => {
      return edg.startNode === this.startNode;
    });
    _.each(edges, (edge: any, i: number) => {
      if (isSameDirection) {
        _.each([1, -1], (j) => {
          values.push([(distance + i * distanceStep) * j, (degree + i * degreeStep) * j]);
        });
      } else {
        values.push([(distance + i * distanceStep), (degree + i * degreeStep)]);
      }
    });
    _.each(this.children, (edge, i) => {
      if (edge instanceof Edge) {
        if (bundleStyle === 1) {
          edge.setStyle({
            bezierLineDistance: values[i][0],
            bezierLineDegree: values[i][1],
            lineType: 1,
            arrowType: 3,
          });
        } else {
          edge.setStyle({
            bezierLineDistance: values[i][0],
            bezierLineDegree: values[i][1],
            lineType: 0,
            arrowType: 3,
          });
        }
      }
    });
  }

  public getBundleID() {
    return this.bundleID;
  }

  public setBundle(edge: any) {
    if (this.toggleBundle) {
      edge.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
        // event.stopPropagation();
        const currentTime = new Date().getTime();
        // double click
        if (currentTime - this.lastClickTime < 500) {
          this.isExpanded = !this.isExpanded;
          this.draw();
        } else {
          this.lastClickTime = currentTime;
        }
      });
    }
  }
}
