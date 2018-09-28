/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import { CommonElement } from './common-element';


export class Group extends CommonElement {
  private childrenNodes: any[] = [];
  private edgeList: any[] = [];
  private groupEdgeList: any[] = [];
  public isExpanded: boolean = false;
  constructor() {
    super();
    this.childrenNodes = [];
    this.edgeList = [];
    this.groupEdgeList = [];
    this.defaultView();
  }

  public setExpaned(expanded: boolean) {
    this.isExpanded = expanded;
  }

  public setChildrenNodes(element: any) {
    this.childrenNodes.push(element);
    element.alpha = 0;
  }

  public setEdgeList(element: any) {
    this.edgeList.push(element);
  }

  public setGroupEdgeList(element: any) {
    this.groupEdgeList.push(element);
  }

  public setGroupEdge(edge:any, edgeGroup:any) {
    if(this.isExpanded) {
      edge.alpha = 1;
      edgeGroup.alpha = 0;
    } else {
      edge.alpha = 0;
      edgeGroup.alpha = 1;
    }
  }

  public getChildrenNodes() {
    return this.childrenNodes;
  }

  public getEdgeList() {
    return this.edgeList;
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
        this.edgeList.forEach(edge => {
          this.groupEdgeList.forEach(edgeGroup => {
            edge.alpha = 1;
            edgeGroup.alpha = 0;
          });
        });
        graph.clear();
      }
    });
    this.addChild(graph);
  }

}
