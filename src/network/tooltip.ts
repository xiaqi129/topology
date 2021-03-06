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
    // padding: '5px 20px',
    fontSize: '12px',
    // userSelect: 'none',
  };
  private domRegex: string | undefined;
  constructor(domRegex: string | undefined) {
    this.domRegex = domRegex;
  }

  public addTooltip(ele: CommonElement, content: string, style?: any) {
    let isEnterTooltip = false;
    ele.on('mouseover', (event: any) => {
      isEnterTooltip = false;
      this.tooltipOn(content, style);
      this.tooltipMove(event);
      const tooltip = document.getElementById('tooltip');
      if (tooltip) {
        tooltip.onmouseover = () => {
          isEnterTooltip = true;
        };
        tooltip.onmouseleave = () => {
          this.clearTooltip();
        };
      }
    });
    ele.on('mouseout', (event: any) => {
      setTimeout(
        () => {
          if (!isEnterTooltip) {
            this.clearTooltip();
          }
        },
        100,
      );
    });
  }

  public setTooltipDisplay(isDisplay: boolean) {
    if (isDisplay) {
      Tooltip.commonStyles.display = 'block';
    } else {
      Tooltip.commonStyles.display = 'none';
    }
  }

  public clearTooltip() {
    if (this.domRegex) {
      const network = document.getElementById(this.domRegex);
      const tooltip = document.getElementById('tooltip');
      if (network && tooltip) {
        network.removeChild(tooltip);
      }
    }
  }

  private tooltipOn(content: string, customStyle?: any) {
    this.clearTooltip();
    const tooltipContent = content;
    _.extend(Tooltip.commonStyles, customStyle);
    this.createTooltip(tooltipContent, Tooltip.commonStyles);
  }

  private createTooltip(content: string, styles: any) {
    const popMenu = document.getElementById('pop-menu');
    if (!popMenu || popMenu.style.display === 'none') {
      if (this.domRegex) {
        const network = document.getElementById(this.domRegex);
        if (network) {
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
      }
    }
  }

  private tooltipMove(event: any) {
    if (this.domRegex) {
      const tooltip = document.getElementById('tooltip');
      const wrapper = document.getElementById(this.domRegex);
      if (wrapper && tooltip) {
        const top = wrapper.getBoundingClientRect().top;
        const left = wrapper.getBoundingClientRect().left;
        const networkHeight = wrapper.offsetHeight + top;
        const networkWidth = wrapper.offsetWidth + left;
        const x = event.data.global.x + left;
        const y = event.data.global.y + top;
        const tooltipHeight = tooltip.offsetHeight;
        const tooltipWidth = tooltip.offsetWidth;
        if (networkWidth - x > tooltipWidth) {
          tooltip.style.left = `${x + 40}px`;
        } else {
          tooltip.style.left = `${x - tooltipWidth - 40}px`;
        }
        if (networkHeight - y > tooltipHeight + 20) {
          tooltip.style.top = `${y - 20}px`;
        } else {
          tooltip.style.top = `${y - tooltipHeight + 20}px`;
        }
      }
    }
  }

}
