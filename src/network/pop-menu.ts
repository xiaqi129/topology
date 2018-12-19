import * as _ from 'lodash';
import * as Viewport from 'pixi-viewport';

/**
 * @license
 * Copyright Cisco Inc. All Rights Reserved.
 *
 * Author: gsp-dalian-ued@cisco.com
 */

export class PopMenu {
  public menuOnAction: any;
  private menu: HTMLElement;
  private isVisible: boolean;
  private menuClass: string | null;
  private menuItems: [] = [];
  private domId: string;
  private container: Viewport;
  constructor(domRegex: string, app: any) {
    this.domId = domRegex;
    this.container = app.getContainer();
    this.menu = this.createMenu();
    this.isVisible = true;
    this.menuItems = [];
    this.menuClass = null;
  }

  public createMenu() {
    const menu = document.createElement('DIV');
    menu.style.zIndex = '100000';
    menu.style.position = 'absolute';
    menu.style.background = '#FFFFFF';
    menu.style.width = 'auto';
    menu.style.height = 'auto';
    menu.style.border = '1px solid #CCCCCC;';
    menu.setAttribute('style', 'position:absolute;background:#FFFFFF;width:auto;height:auto;border:1px solid #CCCCCC;-moz-box-shadow: 5px 5px 2px #888;-webkit-box-shadow: 5px 5px 2px #888;box-shadow: 5px 5px 2px #888;-webkit-border-radius: 4px;-moz-border-radius: 4px;border-radius: 4px;');
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
      if (!this.menu) {
        this.createMenu();
      } else {
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
              let element;
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
          network.appendChild(this.menu);
          this.disableContextMenu(network);
          this.menu.style.display = 'block';
          this.menu.style.left = `${event.data.global.x}px`;
          this.menu.style.top = `${event.data.global.y}px`;
          network.addEventListener('click', () => {
            this.hideMenu();
          });
          this.container.on('wheel', () => {
            this.hideMenu();
          });
        }
      }
    } else {
      this.hideMenu();
    }
  }

  public disableContextMenu(html: HTMLElement) {
    if (html) {
      html.addEventListener('contextmenu', (e: any) => {
        e.preventDefault();
      });
    }
  }

  public setMenuItems(menuItems: any) {
    this.menuItems = menuItems;
  }
}