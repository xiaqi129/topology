import * as _ from 'lodash';
import { CommonElement } from './common-element';
import { Edge } from './edge';
import { Node } from './node';

export class Tooltip {

  public static commonStyles = {
    display: 'block',
    position: 'fixed',
    backgroundColor: 'black',
    color: 'white',
    padding: '5px 20px',
    fontSize: '12px',
    userSelect: 'none',
  };

  public addTooltip(ele: CommonElement, content?: string, style?: any) {
    if (ele instanceof Node) {
      ele.addEventListener('mouseover', (event: any) => {
        this.nodeTooltipOn(event, content, style);
      });
    } else if (ele instanceof Edge) {
      ele.addEventListener('mouseover', (event: any) => {
        this.edgeTooltipOn(event, content, style);
      });
    }
    ele.addEventListener('mouseout', (event: any) => {
      this.tooltipOff(event);
    });
    ele.addEventListener('mousemove', (event: any) => {
      this.tooltipMove(event);
    });
  }

  public setTooltipDisplay(isDisplay: any) {
    if (isDisplay) {
      Tooltip.commonStyles.display = 'block';
    } else {
      Tooltip.commonStyles.display = 'none';
    }
  }

  public tooltipOff(event?: any) {
    this.clearTooltip();
  }

  public clearTooltip() {
    const network = document.getElementsByTagName('body')[0];
    const tooltip = document.getElementById('tooltip');
    if (network && tooltip) {
      network.removeChild(tooltip);
    }
  }

  private nodeTooltipOn(event: any, content?: string, customStyle?: any) {
    const tooltipContent = content || 'node tooltip';
    const tooltipStyles: any = {};
    _.assign(tooltipStyles, Tooltip.commonStyles, customStyle);
    this.createTooltip(event, tooltipContent, tooltipStyles);
  }

  private edgeTooltipOn(event: any, content?: string, customStyle?: any) {
    const tooltipContent = content || 'edge tooltip';
    const tooltipStyles: any = {};
    _.assign(tooltipStyles, Tooltip.commonStyles, customStyle);
    this.createTooltip(event, tooltipContent, tooltipStyles);
  }

  private createTooltip(event: any, content: string, styles: any) {
    const network = document.getElementsByTagName('body')[0];
    const tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    _.each(styles, (v: any, k: any) => {
      tooltip.style[k] = v;
    });
    tooltip.innerHTML = content;
    if (network) {
      network.appendChild(tooltip);
    }
  }

  private tooltipMove(event: any) {
    const tooltip = document.getElementById('tooltip');
    const network = document.getElementsByTagName('body')[0];
    if (tooltip && network) {
      const networkHeight = network.clientHeight;
      const networkWidth = network.clientWidth;
      const y = event.data.global.y + 30;
      const x = event.data.global.x + 40;
      const tooltipHeight = tooltip.clientHeight + 5;
      const tooltipWidth = tooltip.clientWidth + 5;
      if (networkWidth - x > tooltipWidth) {
        tooltip.style.left = `${x}px`;
      } else {
        tooltip.style.left = `${(x - tooltipWidth)}px`;
      }
      if (networkHeight - y > tooltipHeight) {
        tooltip.style.top = `${y}px`;
      } else {
        tooltip.style.top = `${(y - tooltipHeight)}px`;
      }
    }
  }

}
