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
    this.createTooltip(tooltipContent, tooltipStyles);
  }

  private edgeTooltipOn(event: any, content?: string, customStyle?: any) {
    const tooltipContent = content || 'edge tooltip';
    const tooltipStyles: any = {};
    _.assign(tooltipStyles, Tooltip.commonStyles, customStyle);
    this.createTooltip(tooltipContent, tooltipStyles);
  }

  private createTooltip(content: string, styles: any) {
    const network = document.getElementsByTagName('body')[0];
    const tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    _.each(styles, (v: any, k: any) => {
      tooltip.style[k] = v;
    });
    if (network) {
      network.appendChild(tooltip);
    }
    tooltip.innerHTML = content;
  }

  private tooltipMove(event: any) {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
      tooltip.style.left = `${event.data.originalEvent.clientX + 20}px`;
      tooltip.style.top = `${event.data.originalEvent.clientY + 20}px`;
    }
  }

}
