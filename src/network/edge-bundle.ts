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
  public bundleData: any[] = [];
  private bundleID: string = '';
  private lastClickTime: number = 0;
  private startNode: Node;
  private endNode: Node;
  private style: any;
  private defaultColor: number;
  private defaultWidth: number;
  private afterBundle: Edge;

  constructor(edge: Edge) {
    super();
    this.bundleID = edge.edgeNodesSortUIDStr();
    this.startNode = edge.startNode;
    this.endNode = edge.endNode;
    this.style = edge.defaultStyle;
    this.defaultColor = _.cloneDeep(edge.defaultColor);
    this.defaultWidth = edge.invariableStyles.lineWidth;
    this.bundleEdge = this.children;
    this.afterBundle = new Edge(this.startNode, this.endNode);
    this.addChild(edge);
    this.setBundle(edge);
    this.removeBundleEdge();
  }

  public draw() {
    _.each(this.children, (edge: any) => {
      edge.draw();
    });
  }

  public multiEdgeBundle() {
    if (this.toggleBundle) {
      if (!this.isExpanded) {
        this.closeBundle();
      } else {
        this.openBundle();
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
        if (size <= 1.2 && size >= 0.2) {
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
        } else if (size > 1.2) {
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
        } else if (size < 0.1) {
          edge.setStyle({
            lineWidth: this.defaultWidth * 0.1,
          });
          bundleBackground.clear();
          bundleBackground.beginFill(this.defaultStyle.fillColor, 1);
          bundleBackground.drawCircle(0, 0, 7 * 0.1);
          bundleBackground.endFill();
          bundleLabel.setStyle({
            fontSize: 10 * 0.1,
          });
        }
      }
    }
  }

  public setExpaned(expanded: boolean) {
    this.isExpanded = expanded;
    this.multiEdgeBundle();
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

  public setBundle(edge: Edge) {
    edge.bundleParent = this;
    if (this.toggleBundle) {
      edge.addEventListener('mousedown', (event: PIXI.interaction.InteractionEvent) => {
        // event.stopPropagation();
        const currentTime = new Date().getTime();
        // double click
        if (currentTime - this.lastClickTime < 500) {
          if (edge.parent instanceof EdgeBundle) {
            this.isExpanded = !this.isExpanded;
            this.multiEdgeBundle();
          }
        } else {
          this.lastClickTime = currentTime;
        }
      });
    }
  }

  private closeBundle() {
    // collapse
    this.bundleData = [];
    _.each(this.children, (child) => {
      this.bundleData.push(child);
      _.remove(this.startNode.linksArray, (edge) => {
        return edge === child;
      });
      _.remove(this.endNode.linksArray, (edge) => {
        return edge === child;
      });
    });
    this.startNode.linksArray.push(this.afterBundle);
    this.endNode.linksArray.push(this.afterBundle);
    this.removeChildren(0, this.children.length);
    this.afterBundle.setStyle(this.style);
    this.afterBundle.name = 'bundle_line';
    if (this.bundleData.length > 0) {
      const graph = new PIXI.Graphics();
      const style = this.defaultStyle;
      graph.name = 'label_background';
      graph.beginFill(style.fillColor, 1);
      graph.drawCircle(0, 0, 7);
      graph.endFill();
      this.afterBundle.addChild(graph);
      const label = new Label(`${this.bundleData.length}`, {
        fill: 0Xffffff,
        fontFamily: 'Times New Roman',
        fontWeight: 'bold',
      });
      label.name = 'bundle_label';
      label.setPosition(4);
      this.afterBundle.addChild(label);
      this.afterBundle.setChildIndex(label, this.afterBundle.children.length - 1);
      this.afterBundle.setChildIndex(graph, this.afterBundle.children.length - 2);
      // add to elements
      this.afterBundle.initStyle({
        lineType: 0,
        lineColor: this.defaultColor,
        lineWidth: this.defaultWidth,
      });
      this.addChild(this.afterBundle);
    } else {
      this.removeChild(this.getChildByName('bundle_label'));
    }
    this.setBundle(this.afterBundle);
  }

  private openBundle() {
    // expand
    this.removeChild(this.getChildByName('bundle_line'));
    const edges = this.bundleData;
    _.each(edges, (bundleEdge) => {
      this.addChild(bundleEdge);
      bundleEdge.draw();
      this.startNode.linksArray.push(bundleEdge);
      this.endNode.linksArray.push(bundleEdge);
    });
    this.removeBundleEdge();
  }

  private removeBundleEdge() {
    _.remove(this.startNode.linksArray, (edge) => {
      return edge.id === this.afterBundle.id;
    });
    _.remove(this.endNode.linksArray, (edge) => {
      return edge.id === this.afterBundle.id;
    });
  }

}
