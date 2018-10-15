/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import 'polygon';
import { CommonElement } from './common-element';
import { Edge } from './edge';

declare var polygon: any;

export class Group extends CommonElement {
  public isExpanded: boolean = false;
  private childrenNodes: any[] = [];
  private edgeList: any[] = [];
  private groupEdgeList: any[] = [];
  private positionNodes: any [] = [];
  private group: any;

  constructor() {
    super();
    this.defaultView();
  }

  public setExpaned(expanded: boolean) {
    this.isExpanded = expanded;
  }

  public setChildrenNodes(element: any) {
    this.childrenNodes.push(element);
    const position = { x: element.x, y: element.y };
    this.positionNodes.push(position);
    element.alpha = 0;
  }

  public setGroupPosition() {
    const p = new polygon(this.positionNodes);
    const x = p.center().x;
    const y = p.center().y;
    this.x = x;
    this.y = y;
    return [x, y];
  }

  // public drawGroupLine() {
  //   _.each(edges,(edge: any) => {
  //     if(edge instanceof Edge) {
  //       this.setEdgeList(edge);
  //       _.each(this.getChildrenNodes(),(childrenNodes) => {
  //         if(edge.startNode.position === childrenNodes.position) {
  //           const edgeGroup = new Edge(this.group,edge.endNode);
  //           this.topo.addElements(edgeGroup);
  //           edgeGroup.setStyle(edge.styles);
  //           this.setGroupEdgeList(edgeGroup);
  //         }
  //         if(edge.endNode.position === childrenNodes.position) {
  //           const edgeGroup = new Edge(edge.startNode,this.group);
  //           this.topo.addElements(edgeGroup);
  //           edgeGroup.setStyle(edge.styles);
  //           this.setGroupEdgeList(edgeGroup);
  //         }
  //       });
  //     }
  //   });
  // }

  public setEdgeList(element: any) {
    this.edgeList.push(element);
  }

  public setGroupEdgeList(element: any) {
    this.groupEdgeList.push(element);
  }

  public getChildrenNodes() {
    return this.childrenNodes;
  }

  public getEdgeList() {
    return this.edgeList;
  }

  public calcRect() {
    const xArr: any[] = [];
    const yArr: any[] = [];
    _.each(this.positionNodes, (positionNode) => {
      xArr.push(positionNode.x);
      yArr.push(positionNode.y);
    });
    return [xArr, yArr];
  }

  public defaultView() {
    const graph = new PIXI.Graphics();
    const rectangle = new PIXI.Graphics();
    graph.lineStyle(1, 0xEEEEEE);
    graph.beginFill(0X08A029, 1);
    graph.drawCircle(0, 0, 25);
    graph.endFill();
    graph.interactive = true;
    graph.buttonMode = true;
    graph.on('click', (event: any) => {
      this.setExpaned(!this.isExpanded);
      if (this.isExpanded) {
        this.childrenNodes.forEach((element) => {
          element.alpha = 1;
        });
        this.edgeList.forEach((edge) => {
          edge.alpha = 1;
        });
        this.groupEdgeList.forEach((edgeGroup) => {
          edgeGroup.alpha = 0;
        });
        graph.alpha = 0 ;
        rectangle.clear();
        const minX = _.min(this.calcRect()[0]);
        const maxX = _.max(this.calcRect()[0]);
        const minY = _.min(this.calcRect()[1]);
        const maxY = _.max(this.calcRect()[1]);
        const width = maxX - minX;
        const height = maxY - minY;
        rectangle.beginFill(0x66CCFF);
        rectangle.alpha = 0.2;
        rectangle.drawRect(minX, minY, width, height);
        rectangle.endFill();
        rectangle.x = 0;
        rectangle.y = 0;
        this.x = 0;
        this.y = 0;
      }
    });
    this.addChild(rectangle);
    this.addChild(graph);
    rectangle.interactive = true;
    rectangle.buttonMode = true;
    rectangle.on('click', (event: any) => {
      this.setExpaned(!this.isExpanded);
      if (!this.isExpanded) {
        this.childrenNodes.forEach((element) => {
          element.alpha = 0;
        });
        this.edgeList.forEach((edge) => {
          edge.alpha = 0;
        });
        this.groupEdgeList.forEach((edgeGroup) => {
          edgeGroup.alpha = 1;
        });
        graph.alpha = 1 ;
        rectangle.alpha = 0;
        this.x = this.setGroupPosition()[0];
        this.y = this.setGroupPosition()[1];
      }
    });

  }
}
