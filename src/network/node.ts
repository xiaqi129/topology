/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

import * as _ from 'lodash';
import { CommonElement } from './common-element';
import { DataFlow } from './data-flow';
import { Edge } from './edge';
import { EdgeBundle } from './edge-bundle';
import { EdgeGroup } from './edge-group';
import { Group } from './group';
import { Label } from './label';
import { Tooltip } from './tooltip';

export interface IMark {
  name: string;
  width: number;
  height: number;
  position: string;
}

export interface ILabelMarkStyle {
  fillColor: number;
  alpha: number;
}

export class Node extends CommonElement {
  public type: string = 'Node';
  public icon: string = '';
  public includedGroups: Group[] = [];
  public linksArray: Edge[] = [];
  public iconWidth: number = 20;
  public iconHeight: number = 20;
  public markList: IMark[] = [];
  public tooltip: Tooltip;
  public isLock: boolean = false;
  public clients: {} = {};
  public labelContent: string = '';
  public exceptEdgesArray: CommonElement[] = [];
  private defaultWidth: number = 20;
  private defaultHeight: number = 20;
  private data: any = null;
  private elements: Edge | CommonElement[];
  private selectedNodes: any[] = [];
  private dragging: boolean = false;
  private last: any;
  private labelStyle: {} = {};
  private labelMarkStyle: ILabelMarkStyle | undefined = undefined;

  constructor(
    elements: CommonElement[],
    domRegex: string,
    selectedNodes: any[] = [],
    icon?: any) {
    super();
    this.elements = elements;
    this.selectedNodes = selectedNodes;
    this.icon = icon;
    this.tooltip = new Tooltip(domRegex);
    this.interactive = true;
    this.buttonMode = true;
    this.setDrag();
    this.draw();
  }

  public setNodeSize(width: number, height: number) {
    this.iconWidth = width;
    this.iconHeight = height;
    this.defaultWidth = width;
    this.defaultHeight = height;
    this.draw();
  }

  public getDefaultSize() {
    const result = {
      width: this.defaultWidth,
      height: this.defaultHeight,
    };
    return result;
  }

  public draw() {
    if (this.icon) {
      this.drawSprite(this.icon);
    } else {
      this.drawGraph();
    }
  }

  public drawGraph() {
    const oldSprite = this.getChildByName('node_sprite');
    const oldgraph = this.getChildByName('node_graph');
    this.removeChild(oldSprite);
    this.removeChild(oldgraph);
    const style = this.defaultStyle;
    const graph = new PIXI.Graphics();
    graph.name = 'node_graph';
    graph.lineStyle(style.lineWidth, style.lineColor);
    graph.beginFill(style.fillColor, style.fillOpacity);
    graph.drawCircle(0, 0, style.width);
    graph.endFill();
    this.addChild(graph);
    _.each(this.markList, (mark) => {
      const addSprite: any = this.getChildByName(`node_${mark.name}`);
      if (addSprite) {
        addSprite.width = mark.width;
        addSprite.height = mark.height;
        this.switchPos(addSprite, mark.position);
        this.setChildIndex(addSprite, this.children.length - 1);
      }
    });
    return graph;
  }

  public drawSprite(icon: any) {
    // sprite
    const oldSprite = this.getChildByName('node_sprite');
    const oldgraph = this.getChildByName('node_graph');
    const oldLabel = this.getChildByName('node_label');
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
    node.name = 'node_sprite';
    this.addChild(node);
    if (oldLabel) {
      oldLabel.y = node.height;
    }
    _.each(this.markList, (mark: IMark) => {
      const markSprite: any = this.getChildByName(`node_${mark.name}`);
      if (markSprite) {
        markSprite.width = mark.width;
        markSprite.height = mark.height;
        this.switchPos(markSprite, mark.position);
        this.setChildIndex(markSprite, this.children.length - 1);
      }
    });
    const labelMark: any = this.getChildByName('labelMark');
    if (labelMark) {
      const labelMarkBackground = labelMark.getChildByName('labelMark_background');
      const labelMarkLabel = labelMark.getChildByName('labelMark_label');
      this.drawLabelMark(labelMark, labelMarkBackground, labelMarkLabel);
    }
    return node;
  }

  public getWidth() {
    const sprite: any = this.getSprite();
    if (sprite) {
      return sprite.width;
    }
  }

  public getHeight() {
    const sprite: any = this.getSprite();
    if (sprite) {
      return sprite.height;
    }
  }

  public selectOne() {
    const isInSelect = _.find(this.selectedNodes, (node) => {
      return node === this;
    });
    if (this.selectedNodes.length > 0 && isInSelect) {
      this.selectOn();
    } else {
      _.each(this.elements, (element: any) => {
        if (element instanceof Node) {
          element.selectOff();
        }
      });
      this.selectOn();
    }
  }

  public selectOn() {
    this.selectOff();
    const border = new PIXI.Graphics();
    const lineWidth = 2;
    let radius = 0;
    border.lineStyle(lineWidth, 0Xf5bd71, 1);
    border.name = 'node_border';
    const sprite: any = this.getChildByName('node_sprite') ?
      this.getChildByName('node_sprite') : this.getChildByName('node_graph');
    if (sprite.name === 'node_sprite') {
      radius = sprite.width >= sprite.height ? sprite.width : sprite.height;
      border.drawCircle(0, 0, radius / 2 + 5);
      this.addChild(border);
    }
    if (sprite.name === 'node_graph') {
      radius = sprite.width;
      border.drawCircle(0, 0, radius / 2 + 5);
      this.addChild(border);
    }
    this.hitArea = new PIXI.Circle(0, 0, radius / 2 + 5);
    this.scale.set(1.5);
  }

  public selectOff() {
    const sprite: any = this.getChildByName('node_sprite') ?
      this.getChildByName('node_sprite') : this.getChildByName('node_graph');
    if (sprite) {
      if (sprite.name === 'node_sprite') {
        this.removeChild(this.getChildByName('node_border'));
      } else if (sprite.name === 'node_graph') {
        this.removeChild(this.getChildByName('node_border'));
      }
    }
    // this.removeChild(this.getChildByName('node_map-greenSVG'));

    this.scale.set(1);
  }

  public setTooltip(content: string, style?: any) {
    this.removeListener('mouseover');
    this.removeListener('mouseout');
    this.tooltip.addTooltip(this, content, style);
    return this.tooltip;
  }

  // Set Node Label
  public setLabel(content: string, style?: PIXI.TextStyleOptions) {
    if (style) {
      _.extend(this.labelStyle, style);
    }
    const oldLabel = this.getChildByName('node_label');
    const sprite: any = this.getChildByName('node_sprite');
    if (oldLabel) {
      (oldLabel as any).setText(content);
      this.labelContent = (oldLabel as any).text;
    } else {
      const label = new Label(content, this.labelStyle);
      label.name = 'node_label';
      if (sprite) {
        label.anchor.set(0.5, -0.5);
      } else {
        label.anchor.set(0.5, 0.5);
      }
      this.addChild(label);
      this.labelContent = label.text;
      return label;
    }
  }

  public getSprite() {
    const sprite = this.getChildByName('node_sprite') ?
      this.getChildByName('node_sprite') : this.getChildByName('node_graph');
    if (sprite) {
      return sprite;
    }
  }

  public setLabelText(content: string) {
    const label: any = this.getChildByName('node_label');
    if (label) {
      label.setText(content);
      this.labelContent = content;
    }
    return label;
  }

  public setLabelStyle(style: any) {
    const label: any = this.getChildByName('node_label');
    _.extend(this.labelStyle, style);
    label.setStyle(style);
    return label;
  }

  public changeIcon(icon: string) {
    this.icon = icon;
    this.removeChild(this.getChildByName('node_sprite'));
    const node = this.drawSprite(icon);
    return node;
  }

  public setIncluedGroup(group: Group) {
    this.includedGroups.push(group);
  }

  public getIncluedGroup() {
    return this.includedGroups;
  }
  // add and remove node mark at node around
  public addNodeMark(icon: string, pos: string, iconWidth?: number, iconHeight?: number) {
    const excessSprite = this.getChildByName(`node_${icon}`);
    if (excessSprite) {
      this.removeChild(excessSprite);
      _.remove(this.markList, (mark: IMark) => {
        return mark.name === icon;
      });
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

  /* add and remove label mark  */
  public addLabelMark(content: string, style?: ILabelMarkStyle) {
    if (content.length > 3) {
      throw Error('The content length is not greater than 3');
    }
    this.removeLabelMark();
    const markContainer = new PIXI.Container();
    const markBackground = new PIXI.Graphics();
    const markLabel = new Label(content, {
      fill: 0Xffffff,
    });
    markContainer.name = 'labelMark';
    markBackground.name = 'labelMark_background';
    markLabel.name = 'labelMark_label';
    if (style) {
      this.labelMarkStyle = style;
    }
    this.drawLabelMark(markContainer, markBackground, markLabel);
  }

  public removeLabelMark() {
    const oldMarkContainer = this.getChildByName('labelMark');
    if (oldMarkContainer) {
      this.removeChild(oldMarkContainer);
    }
  }

  private drawLabelMark(markContainer: PIXI.Container, markBackground: PIXI.Graphics, markLabel: Label) {
    let fillColor;
    let alpha;
    const style = this.labelMarkStyle;
    if (style) {
      this.labelMarkStyle = style;
      fillColor = style.fillColor;
      alpha = style.alpha;
    } else {
      fillColor = 0XFFC125;
      alpha = 1;
    }
    markBackground.clear();
    markBackground.beginFill(fillColor, alpha);
    let radius;
    if (this.icon) {
      radius = this.iconWidth / 3;
    } else {
      radius = this.defaultStyle.width / 2;
    }
    markBackground.drawCircle(0, 0, radius);
    markBackground.endFill();
    if (radius <= 10) {
      radius = 10;
    } else if (radius >= 12) {
      radius = 12;
    }
    markContainer.addChild(markBackground);
    markContainer.addChild(markLabel);
    markLabel.setPosition(4);
    markLabel.setStyle({
      fontSize: radius,
    });
    this.addChild(markContainer);
    this.setChildIndex(markContainer, this.children.length - 1);
    markContainer.x = this.iconWidth;
    if (this.icon) {
      markContainer.y = -this.iconHeight / 2;
    } else {
      markContainer.y = -this.iconHeight;
    }
  }

  private switchPos(addSprite: any, pos: string) {
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
  // set node can be draged
  private setDrag() {
    this
      .on('mousedown', this.onDragStart)
      .on('mouseup', this.onDragEnd)
      .on('mouseupoutside', this.onDragEnd)
      .on('mousemove', this.onDragMove);
  }

  private onDragStart(event: PIXI.interaction.InteractionEvent) {
    const parent = this.parent.toLocal(event.data.global);
    const isInSelect = _.find(this.selectedNodes, (node) => {
      return node === this;
    });
    if (!(this.selectedNodes.length > 0 && isInSelect)) {
      _.remove(this.selectedNodes);
    }
    event.stopPropagation();
    this.dragging = true;
    this.data = event.data;
    this.last = { parents: parent, x: event.data.global.x, y: event.data.global.y };
  }

  private onDragEnd() {
    this.dragging = false;
    this.data = null;
    this.last = null;
  }

  private onDragMove(event: PIXI.interaction.InteractionEvent) {
    if (this.dragging) {
      const newPosition = this.data.getLocalPosition(this.parent);
      const isInSelect = _.find(this.selectedNodes, (node) => {
        return node === this;
      });
      let edgeGroupList: EdgeGroup[] = [];
      if (this.selectedNodes.length > 1 && isInSelect
        && this.last) {
        const distX = event.data.global.x;
        const distY = event.data.global.y;
        let groups: Group[] = [];
        let edges: Edge[] = [];
        let dataFlows: CommonElement[] = [];
        _.each(this.selectedNodes, (node: Node) => {
          node.position.x += (newPosition.x - this.last.parents.x);
          node.position.y += (newPosition.y - this.last.parents.y);
          edges = edges.concat(node.linksArray);
          groups = groups.concat(node.includedGroups);
          dataFlows = dataFlows.concat(node.exceptEdgesArray);
        });
        this.last = { parents: newPosition, x: distX, y: distY };
        _.each(_.uniq(edges), (edge) => {
          edge.draw();
          edgeGroupList = edgeGroupList.concat(edge.includeGroup);
        });
        _.each(_.uniq(groups), (group) => {
          group.draw();
        });
        _.each(_.uniq(edgeGroupList), (edgeGroup) => {
          edgeGroup.draw();
        });
        _.each(_.uniq(dataFlows), (dataFlow) => {
          dataFlow.draw();
        });
      } else {
        this.position.x = newPosition.x;
        this.position.y = newPosition.y;
        _.each(this.linksArray, (edge) => {
          edgeGroupList = edgeGroupList.concat(edge.includeGroup);
          edge.draw();
        });
        _.each(_.uniq(edgeGroupList), (edgeGroup: EdgeGroup) => {
          edgeGroup.draw();
        });
        _.each(this.includedGroups, (group) => {
          group.draw();
        });
        _.each(this.exceptEdgesArray, (dataFlow) => {
          dataFlow.draw();
        });
      }
    }
  }

}
