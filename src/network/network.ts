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
    const elements = this.topo.getElements();
    let selectedList = new Array;
    _.each(elements,(element: Node) => {
      if (element instanceof Node) {
        let nodeBounds = element.getBounds();
        if((nodeBounds.top >= bounds.top) && (nodeBounds.right <= bounds.right) &&
         (nodeBounds.bottom <= bounds.bottom) && (nodeBounds.left >= bounds.left)) {
           selectedList.push(element)
         }
      }
      if (element instanceof Edge) {
        let nodeBounds = element.getBounds();
        if((nodeBounds.top >= bounds.top) && (nodeBounds.right <= bounds.right) &&
         (nodeBounds.bottom <= bounds.bottom) && (nodeBounds.left >= bounds.left)) {
           element.alpha = 0;
         }
      }
    });
    let group = this.createGroup();
    _.each(selectedList,(selected) => {
      group.addChild(selected);
    });
    // this.defaultView();
    console.log(group);
  }

  // public defaultView() {
  //   const graph = new PIXI.Graphics();
  //   graph.lineStyle(1, 0xEEEEEE);
  //   graph.beginFill(0X08A029, 1);
  //   graph.drawCircle(0, 0, 25);
  //   graph.endFill();
  //   graph.interactive = true;
  //   graph.buttonMode = true;
  //   graph.on("click",(event: any) =>{
  //     console.log(this);
  //   });
  //   this.app.addElement(graph);
  // }

}
