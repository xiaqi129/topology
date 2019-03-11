export interface ILab {
  x: number;
  y: number;
  name: string;
  width: number;
  height: number;
}

export interface IAnc {
  x: number;
  y: number;
  r: number;
}

export class Labeler {
  private lab: ILab[] = [];
  private anc: IAnc[] = [];
  private w = 1; // box width
  private h = 1; // box width
  private labeler = {};
  private maxMove = 5.0;
  private maxAngle = 0.5;
  private acc = 0;
  private rej = 0;
  // weights
  private wLen = 0.2; // leader line length
  private wInter = 1.0; // leader line intersection
  private wLab2 = 30.0; // label-label overlap
  private wLabAnc = 30.0; // label-anchor overlap
  private wOrient = 3.0; // orientation bias

  // booleans for user defined functions
  private userEnergy = false;
  private userSchedule = false;

  private userDefinedEnergy: any;
  private userDefinedSchedule: any;

  public label(labelArray: []) {
    // users insert label positions
    if (!arguments.length) {
      return this.lab;
    }
    this.lab = labelArray;
    return this.labeler;
  }

  public anchor(anchorArray: []) {
    // users insert anchor positions
    if (!arguments.length) {
      return this.anc;
    }
    this.anc = anchorArray;
    return this.labeler;
  }

  public width(width: number) {
    // users insert graph width
    if (!arguments.length) {
      return this.w;
    }
    this.w = width;
    return this.labeler;
  }

  public height(height: number) {
    // users insert graph height
    if (!arguments.length) {
      return this.h;
    }
    this.h = height;
    return this.labeler;
  }

  public altEnergy(x: any) {
    // user defined energy
    if (!arguments.length) {
      return null;
    }
    this.userDefinedEnergy = x;
    this.userEnergy = true;
    return this.labeler;
  }

  public altSchedule(x: any) {
    // user defined cooling_schedule
    if (!arguments.length) {
      return null;
    }
    this.userDefinedSchedule = x;
    this.userSchedule = true;
    return this.labeler;
  }

  public energy(index: number) {
    // energy function, tailored for label placement
    let ener = 0;
    let dx = this.lab[index].x - this.anc[index].x;
    let dy = this.anc[index].y - this.lab[index].y;
    const m = this.lab.length;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let overlap = true;
    const amount = 0;
    const theta = 0;

    // penalty for length of leader line
    if (dist > 0) ener += dist * this.wLen;

    // label orientation bias
    dx /= dist;
    dy /= dist;
    if (dx > 0 && dy > 0) {
      ener += 0 * this.wOrient;
    } else if (dx < 0 && dy > 0) {
      ener += 1 * this.wOrient;
    } else if (dx < 0 && dy < 0) {
      ener += 2 * this.wOrient;
    } else { ener += 3 * this.wOrient; }

    const x21 = this.lab[index].x;
    const y21 = this.lab[index].y - this.lab[index].height + 2.0;
    const x22 = this.lab[index].x + this.lab[index].width;
    const y22 = this.lab[index].y + 2.0;
    let x11;
    let x12;
    let y11;
    let y12;
    let xOverlap;
    let yOverlap;
    let overlapArea;

    // tslint:disable-next-line:no-increment-decrement
    for (let i = 0; i < m; i++) {
      if (i !== index) {

        // penalty for intersection of leader lines
        overlap = this.intersect(this.anc[index].x, this.lab[index].x, this.anc[i].x, this.lab[i].x, this.anc[index].y, this.lab[index].y, this.anc[i].y, this.lab[i].y);
        if (overlap) ener += this.wInter;
        // penalty for label-label overlap
        x11 = this.lab[i].x;
        y11 = this.lab[i].y - this.lab[i].height + 2.0;
        x12 = this.lab[i].x + this.lab[i].width;
        y12 = this.lab[i].y + 2.0;
        xOverlap = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21));
        yOverlap = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));
        overlapArea = xOverlap * yOverlap;
        ener += (overlapArea * this.wLab2);
      }

      // penalty for label-anchor overlap
      x11 = this.anc[i].x - this.anc[i].r;
      y11 = this.anc[i].y - this.anc[i].r;
      x12 = this.anc[i].x + this.anc[i].r;
      y12 = this.anc[i].y + this.anc[i].r;
      xOverlap = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21));
      yOverlap = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));
      overlapArea = xOverlap * yOverlap;
      ener += (overlapArea * this.wLabAnc);

    }
    return ener;
  }

  public intersect(x1: number, x2: number, x3: number, x4: number, y1: number, y2: number, y3: number, y4: number) {
    let mua;
    let mub;
    let denom;
    let numera;
    let numerb;

    denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    numera = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
    numerb = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

    /* Is the intersection along the the segments */
    mua = numera / denom;
    mub = numerb / denom;
    if (!(mua < 0 || mua > 1 || mub < 0 || mub > 1)) {
      return true;
    }
    return false;
  }

  public mcmove(currT: number) {
    // Monte Carlo translation move

    // select a random label
    const i = Math.floor(Math.random() * this.lab.length);

    // save old coordinates
    const xOld = this.lab[i].x;
    const yOld = this.lab[i].y;

    // old energy
    let oldEnergy;
    if (this.userEnergy) {
      oldEnergy = this.userDefinedEnergy(i, this.lab, this.anc);
    } else { oldEnergy = this.energy(i); }

    // random translation
    this.lab[i].x += (Math.random() - 0.5) * this.maxMove;
    this.lab[i].y += (Math.random() - 0.5) * this.maxMove;

    // hard wall boundaries
    if (this.lab[i].x > this.w) this.lab[i].x = xOld;
    if (this.lab[i].x < 0) this.lab[i].x = xOld;
    if (this.lab[i].y > this.h) this.lab[i].y = yOld;
    if (this.lab[i].y < 0) this.lab[i].y = yOld;

    // new energy
    let newEnergy;
    if (this.userEnergy) {
      newEnergy = this.userDefinedEnergy(i, this.lab, this.anc);
    } else { newEnergy = this.energy(i); }

    // delta E
    const deltaEnergy = newEnergy - oldEnergy;

    if (Math.random() < Math.exp(-deltaEnergy / currT)) {
      this.acc += 1;
    } else {
      // move back to old coordinates
      this.lab[i].x = xOld;
      this.lab[i].y = yOld;
      this.rej += 1;
    }
  }

  public mcrotate(currT: number) {
    // Monte Carlo rotation move

    // select a random label
    const i = Math.floor(Math.random() * this.lab.length);

    // save old coordinates
    const xOld = this.lab[i].x;
    const yOld = this.lab[i].y;

    // old energy
    let oldEnergy;
    if (this.userEnergy) {
      oldEnergy = this.userDefinedEnergy(i, this.lab, this.anc);
    } else { oldEnergy = this.energy(i); }

    // random angle
    const angle = (Math.random() - 0.5) * this.maxAngle;

    const s = Math.sin(angle);
    const c = Math.cos(angle);

    // translate label (relative to anchor at origin):
    this.lab[i].x -= this.anc[i].x;
    this.lab[i].y -= this.anc[i].y;

    // rotate label
    const xNew = this.lab[i].x * c - this.lab[i].y * s;
    const yNew = this.lab[i].x * s + this.lab[i].y * c;

    // translate label back
    this.lab[i].x = xNew + this.anc[i].x;
    this.lab[i].y = yNew + this.anc[i].y;

    // hard wall boundaries
    if (this.lab[i].x > this.w) this.lab[i].x = xOld;
    if (this.lab[i].x < 0) this.lab[i].x = xOld;
    if (this.lab[i].y > this.h) this.lab[i].y = yOld;
    if (this.lab[i].y < 0) this.lab[i].y = yOld;

    // new energy
    let newEnergy;
    if (this.userEnergy) {
      newEnergy = this.userDefinedEnergy(i, this.lab, this.anc);
    } else { newEnergy = this.energy(i); }

    // delta E
    const deltaEnergy = newEnergy - oldEnergy;

    if (Math.random() < Math.exp(-deltaEnergy / currT)) {
      this.acc += 1;
    } else {
      // move back to old coordinates
      this.lab[i].x = xOld;
      this.lab[i].y = yOld;
      this.rej += 1;
    }
  }

  public cooling_schedule(currT: number, initialT: number, nsweeps: number) {
    // linear cooling
    return (currT - (initialT / nsweeps));
  }

  public start(nsweeps: number) {
    // main simulated annealing function
    const m = this.lab.length;
    let currT = 1.0;
    const initialT = 1.0;

    // tslint:disable-next-line:no-increment-decrement
    for (let i = 0; i < nsweeps; i++) {
      // tslint:disable-next-line:no-increment-decrement
      for (let j = 0; j < m; j++) {
        if (Math.random() < 0.5) {
          this.mcmove(currT);
        } else { this.mcrotate(currT); }
      }
      currT = this.cooling_schedule(currT, initialT, nsweeps);
    }
    return this.lab;
  }
}
