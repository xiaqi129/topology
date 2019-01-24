/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement, IStyles } from './common-element';

import { Group } from './group';
import { Label } from './label';
import { Tooltip } from './tooltip';

import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';

export class Node extends CommonElement {
  public isLock: boolean = false;
  public incluedGroups: Group[] = [];
  public iconWidth: number = 20;
  public iconHeight: number = 20;
  private parentNode: Group | null = null;
  private data: any;
  private elements: Edge | CommonElement[];
  private selectedNodes: any[] = [];
  private dragging: boolean;
  private last: any;
  private tooltip: Tooltip;
  private labelContent: string = '';
  private labelStyle: {} = {};
  private icon: any;

  constructor(
    elements: CommonElement[],
    selectedNodes: any[] = [],
    loader: PIXI.loaders.Loader,
    icon?: any) {
    super();
    this.data = null;
    this.labelStyle = {};
    this.dragging = false;
    this.elements = elements;
    this.selectedNodes = selectedNodes;
    // this.draw();  // 圆点
    // this.createSprite(resourceName || 'switch');  // 从loader中加载icon, 默认switch
    this.icon = icon;
    loader.onComplete.add(() => {
      this.draw();
    });
    PIXI.loader.onComplete.add(() => {
      this.draw();
    });
    this.tooltip = new Tooltip();
    this.setTooltip();
    // this.setLabel();
  }

  public setParentNode(node: Group) {
    this.parentNode = node;
  }

  public getChildNode() {
    return this.children[0];
  }

  public getParentNode() {
    return this.parentNode;
  }

  public draw() {
    if (this.icon) {
      this.drawSprite(this.icon);
    } else {
      this.drawGraph();
    }
  }

  public drawGraph() {
    this.clearDisplayObjects();
    const style = this.defaultStyle;
    const graph = new PIXI.Graphics();
    graph.name = 'node_graph';
    graph.lineStyle(style.lineWidth, style.lineColor);
    graph.beginFill(style.fillColor, style.fillOpacity);
    graph.drawCircle(0, 0, 5);
    graph.endFill();
    graph.interactive = true;
    graph.buttonMode = true;
    graph
      .on('mousedown', this.onDragStart.bind(this))
      .on('mouseup', this.onDragEnd.bind(this))
      .on('mouseupoutside', this.onDragEnd.bind(this))
      .on('mousemove', this.onDragMove.bind(this));
    this.addChild(graph);
  }

  public onDragStart(event: PIXI.interaction.InteractionEvent) {
    const parent = this.parent.toLocal(event.data.global);
    const isInSelect = _.find(this.selectedNodes, (node) => {
      return node === this;
    });
    if (!(this.selectedNodes.length > 0 && isInSelect)) {
      _.remove(this.selectedNodes);
    }
    this.dragging = true;
    this.data = event.data;
    this.last = { parents: parent, x: event.data.global.x, y: event.data.global.y };
  }

  public onDragEnd() {
    this.dragging = false;
    this.data = null;
    this.last = null;
  }

  public onDragMove(event: PIXI.interaction.InteractionEvent) {
    if (this.dragging) {
      const newPosition = this.data.getLocalPosition(this.parent);
      const isInSelect = _.find(this.selectedNodes, (node) => {
        return node === this;
      });
      if (this.selectedNodes.length > 0 && isInSelect
        && this.last) {
        const distX = event.data.global.x;
        const distY = event.data.global.y;
        _.each(this.selectedNodes, (node) => {
          node.position.x += (newPosition.x - this.last.parents.x);
          node.position.y += (newPosition.y - this.last.parents.y);
          node.redrawEdge();
        });
        this.last = { parents: newPosition, x: distX, y: distY };
      } else {
        this.position.x = newPosition.x;
        this.position.y = newPosition.y;
      }
      this.redrawEdge();
    }
  }

  public redrawEdge() {
    _.each(this.elements, (element: any) => {
      const groupEdges = element.groupEdges;
      const isExpanded = element.isExpanded;
      // redraw all of the EdgeBundle and Edge
      if (element instanceof EdgeBundle) {
        _.each(element.children, (edge: any) => {
          edge.draw();
        });
      }
      if (element instanceof Edge) {
        element.draw();
      }
      // when the group is Expanded redraw it
      if (element instanceof Group && element.isExpanded) {
        element.draw();
      }
      // when the group is close on redraw groupEdges
      if (element instanceof Group && !isExpanded) {
        element.rmElements(groupEdges);
        element.drawEdges();
      }
    });
  }

  public drawSprite(icon: any) {
    // const id = PIXI.loader.resources['./pic/resources.json'].textures;
    // if (id) {
    // console.log(id);
    // const texture = id['cisco-18.png'];

    // old
    // const texture = PIXI.Texture.fromImage(icon);
    // const node = new PIXI.Sprite(texture);
    // node.width = (texture as any).iconWidth;
    // node.height = (texture as any).iconHeight;

    // sprite
    const texture = PIXI.Texture.fromFrame(icon);
    const node = new PIXI.Sprite(texture);
    node.width = this.iconWidth;
    node.height = this.iconHeight;
    node.anchor.set(0.5, 0.5);
    node.interactive = true;
    node.buttonMode = true;
    node
      .on('mousedown', this.onDragStart.bind(this))
      .on('mouseup', this.onDragEnd.bind(this))
      .on('mouseupoutside', this.onDragEnd.bind(this))
      .on('mousemove', this.onDragMove.bind(this));
    node.name = 'node_sprite';
    this.addChild(node);
    // }
  }

  public getWidth() {
    const sprite = this.getChildByName('node_sprite');
    if (sprite) {
      return (sprite as any).width;
    }
    return this.width;
  }

  public getHeight() {
    const sprite = this.getChildByName('node_sprite');
    if (sprite) {
      return (sprite as any).height;
    }
    return this.height;
  }

  public selectOne(color?: any) {
    const isInSelect = _.find(this.selectedNodes, (node) => {
      return node === this;
    });
    if (this.selectedNodes.length > 0 && isInSelect) {
      this.selectOn(color);
    } else {
      _.each(this.elements, (element: any) => {
        if (element instanceof Node) {
          // element.clearBorder();
          element.selectOff();
        }
      });
      this.selectOn(color);
    }
  }

  public selectOn(color?: any) {
    this.selectOff();

    const children = this.children;
    _.each(children, (child: any) => {
      if (child.name === 'node_sprite') {
        const border = new PIXI.Graphics();
        const lineWidth = 8;
        border.lineStyle(lineWidth, color || 0X00e5ff, 1);
        border.drawRoundedRect(
          -(child.texture.width + lineWidth) / 2,
          -(child.texture.height + lineWidth) / 2,
          child.texture.width + lineWidth,
          child.texture.height + lineWidth,
          5,
        );
        border.name = 'node_border';
        child.addChild(border);
      }
      if (child.name === 'node_graph') {
        const border = new PIXI.Graphics();
        const lineWidth = 2;
        border.lineStyle(lineWidth, color || 0X00e5ff, 1);
        border.drawRoundedRect(
          -(child.width + lineWidth) / 2,
          -(child.height + lineWidth) / 2,
          child.width + lineWidth,
          child.height + lineWidth,
          7,
        );
        border.name = 'node_border';
        child.addChild(border);
      }
    });
    this.scale.set(1.5);
  }

  public selectOff() {
    const children = this.children;
    _.each(children, (child: any) => {
      if (child.name === 'node_sprite') {
        child.removeChild(child.getChildByName('node_border'));
      } else if (child.name === 'node_graph') {
        child.removeChild(child.getChildByName('node_border'));
      }
    });
    this.scale.set(1);
  }

  public setTooltip(content?: string, style?: any) {
    this.removeAllListeners();
    this.tooltip.addTooltip(this, content || this.getUID(), style);
  }

  public setLabel(content?: string, style?: PIXI.TextStyleOptions) {
    if (style) {
      this.labelStyle = style;
    }
    const oldLabel = this.getChildByName('node_label');
    if (oldLabel) {
      (oldLabel as any).setText(content || this.getUID());
      this.labelContent = (oldLabel as any).text;
    } else {
      const label = new Label(content || this.getUID(), style);
      label.name = 'node_label';
      this.addChild(label);
      this.labelContent = label.text;
    }
  }

  public getLabelContent() {
    return this.labelContent;
  }

  public getLabelStyle() {
    return this.labelStyle;
  }

  public changeIcon(icon: string) {
    this.removeChild(this.getChildByName('node_sprite'));
    this.drawSprite(icon);
  }

  public setIncluedGroup(group: Group) {
    this.incluedGroups.push(group);
  }

  public getIncluedGroup() {
    return this.incluedGroups;
  }
}
