/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import { CommonElement } from './common-element';


export class Group extends CommonElement {
  private childrenNodes: any[] = [];
  private isExpanded: boolean = false;
  constructor() {
    super();
    this.childrenNodes = [];
    this.defaultView();
  }

  public setExpaned(expanded: boolean) {
    this.isExpanded = expanded;
  }

  public getExpaned() {
    return this.isExpanded;
  }

  public setChildrenNodes(element: any) {
    this.childrenNodes.push(element);
    element.alpha = 0;
  }

  public defaultView() {
    const graph = new PIXI.Graphics();
    graph.lineStyle(1, 0xEEEEEE);
    graph.beginFill(0X08A029, 1);
    graph.drawCircle(0, 0, 25);
    graph.endFill();
    graph.interactive = true;
    graph.buttonMode = true;
    graph.on("click",(event: any) =>{
      this.setExpaned(!this.isExpanded);
      if(this.isExpanded) {
        this.childrenNodes.forEach(element => {
          element.alpha = 1;
        });
        graph.clear();
      }
      console.log(this);
    });
    this.addChild(graph);
  }

}
