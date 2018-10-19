import Point from './point';

export default class Line {
  private p1: Point;
  private p2: Point;

  constructor(p1: Point, p2: Point) {
    this.p1 = p1;
    this.p2 = p2;
  }

  public getAngelDegree() {
    return Math.atan2(this.p1.y - this.p2.y, this.p1.x - this.p2.x) * 180 / Math.PI;
  }

  public getAngel() {
    return Math.atan2(this.p1.y - this.p2.y, this.p1.x - this.p2.x);
  }

}
