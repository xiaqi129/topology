import * as _ from 'lodash';
import { CommonAction } from './common-action';
import { Edge } from './edge';
import { Group } from './group';
import { Node } from './node';

/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

export class PopMenu {
  public menuOnAction!: (id: string) => void;
  private menu: HTMLElement;
  private isVisible: boolean;
  private menuClass: string | null;
  private menuItems: [] = [];
  private domId: string;
  private container: PIXI.Container;
  private action: CommonAction;
  constructor(domRegex: string, app: any, action: CommonAction) {
    this.domId = domRegex;
    this.container = app.getContainer();
    this.menu = this.createMenu();
    this.isVisible = true;
    this.menuItems = [];
    this.menuClass = null;
    this.action = action;
  }

  public createMenu() {
    const menu = document.createElement('DIV');
    menu.id = 'pop-menu';
    menu.style.zIndex = '100000';
    menu.style.border = '1px solid #CCCCCC;';
    menu.setAttribute('style', 'position:fixed;background:#FFFFFF;width:auto;height:auto;border:1px solid #CCCCCC;-moz-box-shadow: 5px 5px 2px #888;-webkit-box-shadow: 5px 5px 2px #888;box-shadow: 5px 5px 2px #888;-webkit-border-radius: 4px;-moz-border-radius: 4px;border-radius: 4px;');
    return menu;
  }

  public setClass(className: string) {
    this.menuClass = className;
  }

  public getMenu() {
    return this.menu;
  }

  public hideMenu() {
    if (this.menu) {
      this.menu.style.display = 'none';
    }
  }

  public showMenu(event: any) {
    if (this.isVisible) {
      const network = document.getElementById(this.domId);
      const idList: any = [];
      this.highlightElement(event);
      _.each(this.menuItems, (menu: any) => {
        idList.push(menu.id);
      });
      let menuItemsStr: any;
      if (this.menuItems) {
        menuItemsStr = `${idList.join('#$%')}#$%`;
      } else {
        this.menu.style.display = 'none';
        return true;
      }
      this.menu.innerHTML = '';
      const ul = document.createElement('UL');
      let li;
      let a;
      ul.setAttribute('style', 'list-style:none;margin:0px;padding:0px;');
      if (this.menuClass) {
        ul.setAttribute('class', `ul${this.menuClass}`);
      }
      this.menu.appendChild(ul);
      _.each(this.menuItems, (menu: any) => {
        if (menuItemsStr.indexOf(`${menu.id}#$%`) !== -1) {
          a = document.createElement('A');
          a.id = menu.id;
          a.innerHTML = menu.label;
          a.setAttribute('style', 'cursor:pointer;text-decoration:none;line-height:25px;' +
            'white-space:nowrap;display:block;margin:5px 15px;color:#000000;');
          if (this.menuClass) {
            a.setAttribute('class', `a${this.menuClass}`);
          }
          li = document.createElement('LI');
          li.setAttribute('style', 'line-height:22px;white-space:nowrap;margin:0px;');
          if (this.menuClass) {
            li.setAttribute('class', `li${this.menuClass}`);
          }
          li.appendChild(a);
          a.addEventListener('mouseover', (e) => {
            const evt = e ? e : event;
            let element: any;
            if (evt.srcElement) {
              element = evt.srcElement;
            } else if (evt.target) {
              element = evt.target;
            }
            const parent = element.parentNode;
            parent.style.background = '#0088cc';
            element.style.color = '#FFFFFF';
            element.style.fontWeight = 'bold';
          });
          a.addEventListener('mouseout', (e) => {
            const evt = e ? e : event;
            let element;
            if (evt.srcElement) {
              element = evt.srcElement;
            } else if (evt.target) {
              element = evt.target;
            }
            const parent = element.parentNode;
            parent.style.background = '#FFFFFF';
            element.style.color = '#000000';
            element.style.fontWeight = 'normal';
          });
          if (this.menuOnAction) {
            a.addEventListener('click', (e) => {
              const evt = e ? e : event;
              let element;
              if (evt.srcElement) {
                element = evt.srcElement;
              } else if (evt.target) {
                element = evt.target;
              }
              this.menuOnAction(element.id);
              this.menu.style.display = 'none';
            });
          }
          ul.appendChild(li);
        }
        a = null;
      });
      if (network) {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
          network.removeChild(tooltip);
        }
        network.appendChild(this.menu);
        const top = network.getBoundingClientRect().top;
        const left = network.getBoundingClientRect().left;
        const networkHeight = network.offsetHeight + top;
        const networkWidth = network.offsetWidth + left;
        const x = event.data.global.x + left;
        const y = event.data.global.y + top;
        this.menu.style.display = 'block';
        const menuHeight = this.menu.offsetHeight;
        const menuWidth = this.menu.offsetWidth;
        if (networkWidth - x > menuWidth) {
          this.menu.style.left = `${x + 20}px`;
        } else {
          this.menu.style.left = `${x - menuWidth - 20}px`;
        }
        if (networkHeight - y > menuHeight + 20) {
          this.menu.style.top = `${y - 20}px`;
        } else {
          if (y - menuHeight > 0) {
            this.menu.style.top = `${(y - menuHeight + 20)}px`;
          } else {
            this.menu.style.top = `${top + 20}px`;
          }
        }
        network.addEventListener('click', () => {
          this.hideMenu();
        });
        network.addEventListener('wheel', () => {
          this.hideMenu();
        });
      }
    } else {
      this.hideMenu();
    }
  }

  public setMenuItems(menuItems: any) {
    this.menuItems = menuItems;
  }

  private highlightElement(event: any) {
    let selectElement;
    if (event.target instanceof Edge) {
      selectElement = event.target;
    } else {
      selectElement = event.target.parent;
    }
    const selectedNodes = this.action.getSelectNodes();
    const selectGroups = this.action.getSelectGroups();
    if (selectElement instanceof Node) {
      if (selectedNodes.length < 2) {
        this.action.removeHighLight();
        this.action.setSelectNodes(selectElement);
      } else {
        this.action.setSelectNodes(selectElement);
      }
    } else if (selectElement instanceof Edge) {
      this.action.removeHighLight();
      this.action.setSelectEdge(selectElement);
      selectElement.selectOn();
    } else if (selectElement instanceof Group) {
      if (selectGroups.length < 2) {
        this.action.removeHighLight();
        this.action.setSelectGroups(selectElement);
      } else {
        this.action.setSelectGroups(selectElement);
      }
    }
  }
}
