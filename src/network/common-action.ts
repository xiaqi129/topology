import { Application } from './application';

export class CommonAction {
  private mouseMoveList: any = [];
  private app: Application;
  constructor(app: any) {
    this.app = app;
  }

  public setZoom(num: number, event?: any) {
    const appContainer = this.app.getContainer();
    const scale = appContainer.scale;
    if (event) {
      const zoom = (event.deltaY < 0 ? 1 : -1) * num;
      if (scale.x + zoom > 0.3 && scale.x + zoom < 3) {
        this.setMouseList(event.clientX, event.clientY);
        const beforeWheel = this.mouseMoveList[0];
        const afterWheel = this.mouseMoveList[1];
        const scaleChange = scale.x + zoom - 1;
        let offsetX = 0;
        let offsetY = 0;
        if (beforeWheel && afterWheel) {
          const wheelX = (afterWheel.x - beforeWheel.x) * (scaleChange - zoom);
          const wheelY = (afterWheel.y - beforeWheel.y) * (scaleChange - zoom);
          offsetX = -(event.clientX * scaleChange) + wheelX;
          offsetY = -(event.clientY * scaleChange) + wheelY;
        } else {
          offsetX = -(event.clientX * scaleChange);
          offsetY = -(event.clientY * scaleChange);
        }
        appContainer.setTransform(offsetX, offsetY, scale.x + zoom, scale.y + zoom, 0, 0, 0, 0, 0);
      }
    } else {
      if (scale.x + num > 0.3 && scale.x + num < 3) {
        appContainer.setTransform(0, 0, scale.x + num, scale.y + num, 0, 0, 0, 0, 0);
      }
    }
  }

  public setMouseList(cx: number, cy: number) {
    if (this.mouseMoveList.length < 2) {
      this.mouseMoveList.push({ x:cx, y:cy });
    } else {
      if (cx !== this.mouseMoveList[1].x && Math.abs(cx - this.mouseMoveList[1].x) > 50) {
        this.mouseMoveList.shift();
        this.mouseMoveList.push({ x:cx, y:cy });
      }
    }
  }

  public zoomOver() {
    const appContainer = this.app.getContainer();
    const wrapperContainr = this.app.getWrapperBoundings();
    const containerWidth = appContainer.width;
    const containerHeight = appContainer.height;
    const scaleX = wrapperContainr[0] / containerWidth;
    const scaleY = wrapperContainr[1] / containerHeight;
    const scale = scaleX > scaleY ? scaleY : scaleX;
    appContainer.setTransform(0, 0, scale, scale, 0, 0, 0, 0, 0);
  }
}
