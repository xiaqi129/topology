declare class Bezier {
  public split: any;
  public get: any;
  constructor(...args: any[]);
}

declare module 'bezier-js/lib/bezier' {
  export = Bezier;
}
