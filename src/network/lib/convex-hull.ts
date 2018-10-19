import Point from './point';

export default class ConvexHullGrahamScan {
  private anchorPoint?: Point;
  private reverse = false;
  private points: Point[] = [];
  // constructor() { }

  public findPolarAngle(a: Point | undefined, b: Point | undefined) {
    const ONE_RADIAN = 57.295779513082;
    // var deltaX, deltaY;

    // if the points are undefined, return a zero difference angle.
    if (!a || !b) return 0;

    const deltaX = (b.x - a.x);
    const deltaY = (b.y - a.y);

    if (deltaX === 0 && deltaY === 0) {
      return 0;
    }

    let angle = Math.atan2(deltaY, deltaX) * ONE_RADIAN;

    if (this.reverse) {
      if (angle <= 0) {
        angle += 360;
      }
    } else {
      if (angle >= 0) {
        angle += 360;
      }
    }
    return angle;
  }

  public addPoints(points: number[][]) {
    points.forEach((point) => {
      this.addPoint(point[0], point[1]);
    });
  }

  public addPoint(x: number, y: number) {
    // Check for a new anchor
    const newAnchor =
      (this.anchorPoint === undefined) ||
      (this.anchorPoint.y > y) ||
      (this.anchorPoint.y === y && this.anchorPoint.x > x);

    if (newAnchor) {
      if (this.anchorPoint !== undefined) {
        const point = new Point(this.anchorPoint.x, this.anchorPoint.y);
        this.points.push(point);
      }
      this.anchorPoint = new Point(x, y);
    } else {
      this.points.push(new Point(x, y));
    }
  }

  public sortPoints() {

    return this.points.sort(((a: any, b: any) => {
      const polarA = this.findPolarAngle(this.anchorPoint, a);
      const polarB = this.findPolarAngle(this.anchorPoint, b);

      if (polarA < polarB) {
        return -1;
      }
      if (polarA > polarB) {
        return 1;
      }

      return 0;
    }).bind(this));
  }

  public checkPoints(p0: Point, p1: Point, p2: Point) {
    let difAngle: any;
    const cwAngle = this.findPolarAngle(p0, p1);
    const ccwAngle = this.findPolarAngle(p0, p2);

    if (cwAngle > ccwAngle) {

      difAngle = cwAngle - ccwAngle;

      return !(difAngle > 180);

    }
    if (cwAngle < ccwAngle) {

      difAngle = ccwAngle - cwAngle;

      return (difAngle > 180);

    }

    return true;
  }

  public getHull() {
    let hullPoints = [];
    let points: any;
    let pointsLength;

    this.reverse = this.points.every((point) => {
      return (point.x < 0 && point.y < 0);
    });

    points = this.sortPoints();
    pointsLength = points.length;

    // If there are less than 3 points, joining these points creates a correct hull.
    if (pointsLength < 3) {
      points.unshift(this.anchorPoint);
      return points;
    }

    // move first two points to output array
    hullPoints.push(points.shift(), points.shift());

    // scan is repeated until no concave points are present.
    while (true) {
      let p0: Point;
      let p1: Point;
      let p2: Point;

      hullPoints.push(points.shift());

      p0 = hullPoints[hullPoints.length - 3];
      p1 = hullPoints[hullPoints.length - 2];
      p2 = hullPoints[hullPoints.length - 1];

      if (this.checkPoints(p0, p1, p2)) {
        hullPoints.splice(hullPoints.length - 2, 1);
      }

      if (points.length === 0) {
        if (pointsLength === hullPoints.length) {
          // check for duplicate anchorPoint edge-case,
          // if not found, add the anchorpoint as the first item.
          const ap = this.anchorPoint;
          // remove any udefined elements in the hullPoints array.
          hullPoints = hullPoints.filter(p => !!p);
          if (!hullPoints.some((p) => {
            if (ap) {
              return (p.x === ap.x && p.y === ap.y);
            }
            return false;
          })) {
            hullPoints.unshift(this.anchorPoint);
          }
          return hullPoints;
        }
        points = hullPoints;
        pointsLength = points.length;
        hullPoints = [];
        hullPoints.push(points.shift(), points.shift());
      }
    }
  }

}
