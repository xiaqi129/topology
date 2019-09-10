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
  public afterBundle: Edge;
  private bundleID: string = '';
  private lastClickTime: number = 0;
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
    const isSameDirection = _.every(edges, (edg: Edge) => {
      return edg.startNode === this.startNode;
    });
    if (bundleStyle === 1) {
      distanceStep = 1;
      _.each(edges, (edge: any, i: number) => {
        if (isSameDirection) {
          _.each([1, -1], (j) => {
            values.push([(distance + i * distanceStep) * j, (degree + i * degreeStep) * j]);
          });
        } else {
          values.push([(distance + i * distanceStep), (degree + i * degreeStep)]);
        }
      });
    } else {
      _.each(edges, (edge: any, i: number) => {
        const direction = i % 2 === 1 ? 1 : -1;
        if (edge.startNode === this.startNode) {
          values.push([(distance + i * distanceStep) * direction, (degree + i * degreeStep) * direction]);
        } else {
          values.push([-(distance + i * distanceStep) * direction, (degree + i * degreeStep) * direction]);
        }
      });
    }
    let old = 0;
    _.each(this.children, (edge, i) => {
      if (edge instanceof Edge) {
        if (bundleStyle === 1) {
          edge.setStyle({
            bezierLineDistance: values[i][0],
            bezierLineDegree: values[i][1],
            lineType: 1,
          });
        } else {
          const direction = i % 2 === 1 ? 1.5 : -1.5;
          const srcLabel: any = edge.getChildByName('edge_srclabel');
          const endLabel: any = edge.getChildByName('edge_endlabel');
          const srcLength = this.deleteSpace(srcLabel.text).split(/\s+/).length;
          const endLength = this.deleteSpace(endLabel.text).split(/\s+/).length;
          if (srcLabel || endLabel) {
            if (srcLength > 1) {
              srcLabel.anchor.set(0.5, old + i * direction / srcLength * 1.7);
            } else {
              srcLabel.anchor.set(0.5, old + i * direction);
            }
            if (endLength > 1) {
              endLabel.anchor.set(0.5, old + i * direction / endLength * 1.7);
            } else {
              endLabel.anchor.set(0.5, old + i * direction);
            }
            old = old + i * direction;
          }
          edge.setStyle({
            bezierLineDistance: values[i][0],
            bezierLineDegree: values[i][1],
            lineType: 0,
          });
        }
      }
    });
  }

  public getBundleID() {
    return this.bundleID;
  }

  public removeBundleEdge() {
    _.remove(this.startNode.linksArray, (edge) => {
      return edge.id === this.afterBundle.id;
    });
    _.remove(this.endNode.linksArray, (edge) => {
      return edge.id === this.afterBundle.id;
    });
  }

  public setBundle(edge: Edge) {
    edge.bundleParent = this;
    if (this.toggleBundle) {
      edge.addEventListener('click', (event: PIXI.interaction.InteractionEvent) => {
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

  public updateNum() {
    const label: any = this.afterBundle.getChildByName('bundle_label');
    if (label) {
      label.setText(`${this.bundleData.length}`, {
        fill: 0Xffffff,
        fontFamily: 'Times New Roman',
        fontWeight: 'bold',
      });
    }
  }

  private deleteSpace(str: string) {
    const str1 = str.replace(/\s+$/, '');
    const str2 = str1.replace(/^\s+/, '');
    return str2;
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
    this.afterBundle.removeChild(this.afterBundle.getChildByName('label_background'));
    this.afterBundle.removeChild(this.afterBundle.getChildByName('bundle_label'));
    this.afterBundle.removeAllListeners();
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
      this.setBundle(this.afterBundle);
    } else {
      this.removeChild(this.getChildByName('bundle_label'));
    }
  }

  private openBundle() {
    // expand
    this.removeChildren(0, this.children.length);
    const edges = this.bundleData;
    _.each(edges, (bundleEdge) => {
      this.addChild(bundleEdge);
      bundleEdge.draw();
      this.startNode.linksArray.push(bundleEdge);
      this.endNode.linksArray.push(bundleEdge);
    });
    this.removeBundleEdge();
  }

}
