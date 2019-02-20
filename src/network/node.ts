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
  public labelContent: string = '';
  public iconHeight: number = 20;
  public clients: {} = {};
  private parentNode: Group | null = null;
  private data: any;
  private elements: Edge | CommonElement[];
  private selectedNodes: any[] = [];
  private dragging: boolean;
  private last: any;
  private tooltip: Tooltip;
  private labelStyle: {} = {};
  private icon: any;

  constructor(
    elements: CommonElement[],
    selectedNodes: any[] = [],
    icon?: any) {
    super();
    this.data = null;
    this.labelStyle = {};
    this.dragging = false;
    this.elements = elements;
    this.selectedNodes = selectedNodes;
    this.icon = icon;
    this.draw();
    this.tooltip = new Tooltip();
    this.setTooltip();
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
    // sprite
    const oldSprite = this.getChildByName('node_sprite');
    this.removeChild(oldSprite);
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
        const lineWidth = 4;
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

  // Set Node Label
  public setLabel(content?: string, style?: PIXI.TextStyleOptions) {
    this.labelStyle = {
      fontFamily: 'Arial',
      fontSize: '0.6em',
      fontWeight: 'bold',
      fill: ['#ffffff', '#0099ff'],
      lineJoin: 'round',
      miterLimit: 2,
      strokeThickness: 3,
      breakWords: true,
      wordWrap: true,
      wordWrapWidth: 44,
    };
    if (style) {
      _.extend(this.labelStyle, style);
    }
    const oldLabel = this.getChildByName('node_label');
    if (oldLabel) {
      (oldLabel as any).setText(content);
      this.labelContent = (oldLabel as any).text;
    } else {
      const label = new Label(content, this.labelStyle);
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

  public setLabelText(content: string) {
    const label: any = this.getChildByName('node_label');
    if (label) {
      label.setText(content);
      this.labelContent = content;
    }
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
