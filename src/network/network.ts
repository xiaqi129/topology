/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import * as PIXI from 'pixi.js';
import { Application } from './application';
import { Drawer } from './drawer';
import { Edge } from './edge';
import { Group } from './group';
import { Node } from './node';
import { Topo } from './topo';
declare var require: any
let polygon = require('polygon');

export class Network {
  private loader = PIXI.loader;
  private topo: Topo;
  private drawer: Drawer;
  private app: Application;

  constructor(domRegex: string) {
    this.topo = new Topo(this.loader);
    this.drawer = new Drawer(domRegex, this.topo);
    this.app = this.drawer.getWhiteBoard();
  }

  public addResourceCache(key: string, image: string) {
    this.loader.add(key, image);
    return this.loader;
  }

  public createNode() {
    return this.topo.createNode();
  }

  public createGroup() {
    return this.topo.createGroup();
  }

  public createEdge(startNode: Node | Group, endNode: Node | Group) {
    return this.topo.createEdge(startNode, endNode);
  }

  public clear() {
    const elements = this.topo.getElements();
    _.each(elements, (element) => {
      element.destroy();
    });
    _.remove(elements, undefined);
  }

  public getElements() {
    return this.topo.getElements();
  }

  public addElement(element: Node | Group | Edge) {
    this.topo.addElements(element);
  }

  public removeElements(element: PIXI.Container) {
    element.destroy();
    const elements = this.topo.getElements();
    _.remove(elements, (elem) => {
      return element === elem;
    });
  }

  public syncView() {
    this.app.clearContainer();
    const elements = this.topo.getElements();
    this.app.addElements(elements);
    this.moveSelect();
  }

  public moveSelect() {
    let canvas = document.querySelector('canvas'); 
    let rectangle = new PIXI.Graphics();
    let flag = false;
    let oldLeft = 0;
    let oldTop = 0;
    let width = 0;
    let height = 0;
    if(canvas) {
      canvas.addEventListener('mousedown', (event: any) => {
        flag = true;
        oldLeft = event.offsetX;
        oldTop = event.offsetY;
      });
      canvas.addEventListener('mousemove', (event: any) => {
        if(!flag) return
        rectangle.clear();
      });
      canvas.addEventListener('mouseup', (event: any) => {
        width = event.offsetX - oldLeft;
        height = event.offsetY - oldTop;
        rectangle.beginFill(0x66CCFF);
        rectangle.alpha = 0.3;
        rectangle.drawRect(oldLeft, oldTop, width, height);
        rectangle.endFill();
        this.app.addElement(rectangle);
        flag = false;
      });
    }
    rectangle.interactive = true;
    rectangle.buttonMode = true;
    rectangle.on('click', (event: any) => {
      this.groupNode(rectangle);
    });
  }

  public groupNode(rectangle: any) {
    let bounds = rectangle.getBounds();
    let elements = this.topo.getElements();
    let selectedList = new Array;
    _.each(elements,(element: Node) => {
      let nodeBounds = element.getBounds();
      if((nodeBounds.top >= bounds.top) && (nodeBounds.right <= bounds.right) &&
        (nodeBounds.bottom <= bounds.bottom) && (nodeBounds.left >= bounds.left)) {
          selectedList.push(element);
        }
    });
    this.calculateCenter(selectedList,rectangle);
  }

  public calculateCenter(selectedList: any,rectangle: any) {
    if(selectedList.length > 1) {
      let group = this.createGroup();
      this.app.addElement(group);
      let positionNode:any [] =[];
      _.each(selectedList,(selected) => {
        group.setChildrenNodes(selected);
        if (selected instanceof Node) {
          let position = {'x': selected.x,'y': selected.y};
          positionNode.push(position);
        }
      });
      let p = new polygon(positionNode);
      let x = p.center().x;
      let y = p.center().y;
      group.x = x;
      group.y = y;
      rectangle.clear();
      this.drawGroupLine(group)
    } else {
      rectangle.clear();
    }
  }

  public drawGroupLine(group: any) {
    let elements = this.topo.getElements();
    _.each(elements,(edge: any) => {
      if(edge instanceof Edge) {
        group.setEdgeList(edge);
        _.each(group.getChildrenNodes(),(childrenNodes) => {
          if(edge.startNode.position === childrenNodes.position) {
            let edgeGroup = this.createEdge(group,edge.endNode);
            this.app.addElement(edgeGroup);
            edgeGroup.setStyle(edge.styles);
            group.setGroupEdgeList(edgeGroup);
          }
          if(edge.endNode.position === childrenNodes.position) {
            let edgeGroup = this.createEdge(edge.startNode,group);
            this.app.addElement(edgeGroup);
            edgeGroup.setStyle(edge.styles);
            group.setGroupEdgeList(edgeGroup);
          }
        });
      }
    });
  }
  
}
