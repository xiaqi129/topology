import * as _ from 'lodash';
import * as PIXI from 'pixi.js';
import { CommonElement } from './common-element';
import { Edge } from './edge';
import { Node } from './node';

export class Tooltip {

  public addTooltip(ele: CommonElement) {
    if (ele instanceof Node) {
      ele.addEventListener('mouseover', (event: any) => {
        this.nodeTooltipOn(event);
      });
      ele.addEventListener('mouseout', this.nodeTooltipOff);
    } else if (ele instanceof Edge) {
      ele.addEventListener('mouseover', this.edgeTooltipOn);
      ele.addEventListener('mouseout', this.edgeTooltipOff);
    }
  }

  public nodeTooltipOn(event: any, content?: string, textStyle?: any, shape?: string) {

    const tooltipShape = shape || 'rect-sm';  // pic resource of shape
    const tooltipContent = content || (this as any).getUID();  // content
    const tooltipStyle = textStyle || {
      fontSize: 12,
      fill: '0xffffff',
      fontWeight: 'bold',
    };  // styles

    const tooltip = PIXI.Sprite.fromImage(`../pic/${tooltipShape}.png`);  // tooltip main
    tooltip.y = 20;
    tooltip.name = 'nodeTooltip';
    const text = new PIXI.Text(tooltipContent, tooltipStyle);
    text.x = 8;
    text.y = 2;
    tooltip.addChild(text);
    (this as any).addChild(tooltip);
  }

  public nodeTooltipOff() {
    (this as any).removeChild((this as any).getChildByName('nodeTooltip'));
  }

  public edgeTooltipOn(event: any, content?: string, textStyle?: any, shape?: string) {

    const tooltipShape = shape || 'rect-lg';  // pic resource of shape
    const tooltipContent = content ||
      `${(this as any).startNode.id}  >>>>  ${(this as any).endNode.id}`;  // content
    const tooltipStyle = textStyle || {
      fontSize: 12,
      fill: '0x00ff00',
      fontWeight: 'bold',
    };  // styles

    const tooltip = PIXI.Sprite.fromImage(`../pic/${tooltipShape}.png`);  // tooltip main
    tooltip.x = event.data.global.x + 10;
    tooltip.y = event.data.global.y;
    tooltip.name = 'edgeTooltip';
    const text = new PIXI.Text(tooltipContent, tooltipStyle);
    text.x = 8;
    text.y = 2;
    tooltip.addChild(text);
    (this as any).addChild(tooltip);
  }

  public edgeTooltipOff() {
    (this as any).removeChild((this as any).getChildByName('edgeTooltip'));
  }

}
