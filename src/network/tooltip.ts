import * as _ from 'lodash';
import { CommonElement } from './common-element';
import { Edge } from './edge';
import { Node } from './node';

export class Tooltip {

  public commonStyles = {
    display: 'block',
    position: 'fixed',
    backgroundColor: 'black',
    color: 'white',
    padding: '5px 20px',
    fontSize: '12px',
    userSelect: 'none',
  };

  public addTooltip(ele: CommonElement, content?: string) {
    if (ele instanceof Node) {
      ele.addEventListener('mouseover', (event: any) => {
        this.nodeTooltipOn(event, content || ele.getUID());
      });
    } else if (ele instanceof Edge) {
      ele.addEventListener('mouseover', (event: any) => {
        this.edgeTooltipOn(
          event, content ||
          `${ele.startNode.id}  >>>>  ${ele.endNode.id}`);
      });
    }
    ele.addEventListener('mouseout', this.tooltipOff);
    ele.addEventListener('mousemove', this.tooltipMove);
  }

  public setTooltipDisplay(isDisplay: any) {
    if (isDisplay) {
      this.commonStyles.display = 'block';
    } else {
      this.commonStyles.display = 'none';
    }
  }

  public tooltipOff() {
    const network = document.getElementById('network');
    const tooltip = document.getElementById('tooltip');
    if (network && tooltip) {
      network.removeChild(tooltip);
    }
  }

  private nodeTooltipOn(event: any, content?: string, customStyle?: any) {
    const tooltipContent = content || 'node tooltip';
    const tooltipStyles: any = {};
    _.assign(tooltipStyles, this.commonStyles, customStyle);
    this.createTooltip(tooltipContent, tooltipStyles);
  }

  private edgeTooltipOn(event: any, content?: string, customStyle?: any) {

    const tooltipContent = content || 'edge tooltip';
    const tooltipStyles: any = {};
    _.assign(tooltipStyles, this.commonStyles, customStyle);
    this.createTooltip(tooltipContent, tooltipStyles);
  }

  private createTooltip(content: any, styles: any) {
    const network = document.getElementById('network');
    const tooltip = document.createElement('div');
    const text = document.createTextNode(content);
    tooltip.id = 'tooltip';
    _.each(styles, (v: any, k: any) => {
      tooltip.style[k] = v;
    });
    tooltip.appendChild(text);
    if (network) {
      network.appendChild(tooltip);
    }
  }

  private tooltipMove(event: any) {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
      tooltip.style.left = `${event.data.originalEvent.clientX + 20}px`;
      tooltip.style.top = `${event.data.originalEvent.clientY + 20}px`;
    }
  }

}
