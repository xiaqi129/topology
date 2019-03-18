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

export interface IMark {
  name: string;
  width: number;
  height: number;
  position: string;
}

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
  private markList: IMark[] = [];

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
    this
      .on('mousedown', this.onDragStart)
      .on('mouseup', this.onDragEnd)
      .on('mouseupoutside', this.onDragEnd)
      .on('mousemove', this.onDragMove);
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
    graph.beginFill(0X0386d2, style.fillOpacity);
    graph.drawCircle(0, 0, style.width);
    graph.endFill();
    graph.interactive = true;
    graph.buttonMode = true;
    this.addChild(graph);
    _.each(this.markList, (mark) => {
      const addSprite: any = this.getChildByName(`node_${mark.name}`);
      if (addSprite) {
        addSprite.width = 13;
        addSprite.height = 13;
        switch (mark.position) {
          case 'top':
            addSprite.x = -6.5;
            addSprite.y = -13;
            break;
          case 'left':
            addSprite.x = -13;
            addSprite.y = -6.5;
            break;
          case 'bottom':
            addSprite.x = -6.5;
            addSprite.y = 0;
            break;
          case 'right':
            addSprite.x = 0;
            addSprite.y = -6.5;
            break;
          case 'top-left':
            addSprite.x = -13;
            addSprite.y = -13;
            break;
          case 'top-right':
            addSprite.x = 0;
            addSprite.y = -13;
            break;
          case 'bottom-left':
            addSprite.x = -13;
            addSprite.y = 0;
            break;
          case 'bottom-right':
            addSprite.x = 0;
            addSprite.y = 0;
            break;
          default:
            addSprite.x = -6.5;
            addSprite.y = -13;
            break;
        }
        this.setChildIndex(addSprite, this.children.length - 1);
      }
    });
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
    });
  }

  public drawSprite(icon: any) {
    // sprite
    const oldSprite = this.getChildByName('node_sprite');
    const oldgraph = this.getChildByName('node_graph');
    this.removeChild(oldSprite);
    this.removeChild(oldgraph);
    const texture = PIXI.Texture.fromFrame(icon);
    const node = new PIXI.Sprite(texture);
    const sclaeWidth = this.iconWidth / texture.width;
    const scaleHeight = this.iconHeight / texture.height;
    const scale = sclaeWidth > scaleHeight ? scaleHeight : sclaeWidth;
    node.width = texture.width * scale;
    node.height = texture.height * scale;
    node.anchor.set(0.5, 0.5);
    node.interactive = true;
    node.buttonMode = true;
    node.name = 'node_sprite';
    this.addChild(node);
    _.each(this.markList, (mark: IMark) => {
      const markSprite: any = this.getChildByName(`node_${mark.name}`);
      if (markSprite) {
        markSprite.width = mark.width;
        markSprite.height = mark.height;
        this.switchPos(markSprite, mark.position);
        this.setChildIndex(markSprite, this.children.length - 1);
      }
    });
  }

  public switchPos(addSprite: any, pos: string) {
    switch (pos) {
      case 'top':
        addSprite.x = -(addSprite.width / 2);
        addSprite.y = -addSprite.height;
        break;
      case 'left':
        addSprite.x = -addSprite.width;
        addSprite.y = -(addSprite.height / 2);
        break;
      case 'bottom':
        addSprite.x = -(addSprite.width / 2);
        addSprite.y = 0;
        break;
      case 'right':
        addSprite.x = 0;
        addSprite.y = -(addSprite.height / 2);
        break;
      case 'top-left':
        addSprite.x = -addSprite.width;
        addSprite.y = -addSprite.height;
        break;
      case 'top-right':
        addSprite.x = 0;
        addSprite.y = -addSprite.height;
        break;
      case 'bottom-left':
        addSprite.x = -addSprite.width;
        addSprite.y = 0;
        break;
      case 'bottom-right':
        addSprite.x = 0;
        addSprite.y = 0;
        break;
      default:
        addSprite.x = -(addSprite.width / 2);
        addSprite.y = -addSprite.height;
        break;
    }
  }

  public getWidth() {
    const sprite = this.getChildByName('node_sprite');
    if (sprite) {
      return (sprite as any).width;
    }
    return 8;
  }

  public getHeight() {
    const sprite = this.getChildByName('node_sprite');
    if (sprite) {
      return (sprite as any).height;
    }
    return 8;
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
          element.selectOff();
        }
      });
      this.selectOn(color);
    }
  }

  public selectOn(color?: any) {
    this.selectOff();
    const border = new PIXI.Graphics();
    const lineWidth = 2;
    let radius = 0;
    border.lineStyle(lineWidth, color || 0Xf5bd71, 1);
    border.name = 'node_border';
    const sprite: any = this.getChildByName('node_sprite') ?
      this.getChildByName('node_sprite') : this.getChildByName('node_graph');
    if (sprite.name === 'node_sprite') {
      radius = sprite.width >= sprite.height ? sprite.width : sprite.height;
      border.drawCircle(0, 0, radius / 2 + 5);
      this.addChild(border);
    }
    if (sprite.name === 'node_graph') {
      radius = 4;
      border.drawCircle(0, 0, radius / 2 + 5);
      this.addChild(border);
    }

    this.scale.set(1.5);
  }

  public selectOff() {
    const sprite: any = this.getChildByName('node_sprite') ?
      this.getChildByName('node_sprite') : this.getChildByName('node_graph');
    if (sprite.name === 'node_sprite') {
      this.removeChild(this.getChildByName('node_border'));
    } else if (sprite.name === 'node_graph') {
      this.removeChild(this.getChildByName('node_border'));
    }
    // this.removeChild(this.getChildByName('node_map-greenSVG'));

    this.scale.set(1);
  }

  public setTooltip(content: string, style?: any) {
    this.tooltip.addTooltip(this, content, style);
  }

  // Set Node Label
  public setLabel(content?: string, style?: PIXI.TextStyleOptions) {
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
      return label;
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
    this.icon = icon;
    this.removeChild(this.getChildByName('node_sprite'));
    this.drawSprite(icon);
  }

  public setIncluedGroup(group: Group) {
    this.incluedGroups.push(group);
  }

  public getIncluedGroup() {
    return this.incluedGroups;
  }
  // add and remove node mark at node around
  public addNodeMark(icon: string, pos: string, iconWidth?: number, iconHeight?: number) {
    const excessSprite = this.getChildByName(`node_${icon}`);
    if (excessSprite) {
      this.removeChild(excessSprite);
    }
    const txture = PIXI.Texture.fromFrame(icon);
    const addSprite = new PIXI.Sprite(txture);
    const sprite: any = this.getChildByName('node_sprite') ?
      this.getChildByName('node_sprite') : this.getChildByName('node_graph');
    let markObj: IMark;
    addSprite.width = iconWidth || sprite.width;
    addSprite.height = iconHeight || sprite.height;
    addSprite.interactive = true;
    addSprite.name = `node_${icon}`;
    this.switchPos(addSprite, pos);
    this.addChild(addSprite);
    this.setChildIndex(addSprite, this.children.length - 1);
    if (iconWidth && iconHeight) {
      markObj = {
        name: icon,
        width: iconWidth,
        height: iconHeight,
        position: pos,

      };
    } else {
      markObj = {
        name: icon,
        width: this.iconWidth,
        height: this.iconHeight,
        position: pos,
      };
    }
    this.markList.push(markObj);
    return addSprite;
  }

  public removeNodeMark(icon: string) {
    const sprite = this.getChildByName(`node_${icon}`);
    if (sprite) {
      this.removeChild(sprite);
      _.remove(this.markList, (mark: IMark) => {
        return mark.name === icon;
      });
    }
  }

}
