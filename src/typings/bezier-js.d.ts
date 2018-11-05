declare class Bezier {
  constructor(...args: any[]);
  public points: any;
  project(point: any): any;
  addEventListener(event: string, callback: any): any;
}

declare module 'bezier-js/lib/bezier' {
  export = Bezier;
}
