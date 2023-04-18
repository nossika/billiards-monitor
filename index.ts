type Position = number; // 坐标 x, y
type Velocity = number; // 速度 vx, vy
type Mass = number; // 质量 m
type Radius = number; // 半径 r
type Color = string; // 颜色，如 #aabbcc
type Angle = number; // 角度，范围 0 - 360
type Friction = number; // 摩擦系数，>= 0，越小表示摩擦力越小
type Elastic = number; // 弹性，范围 0 - 1，越大表示弹性越好

class Ball {
  x: Position;
  y: Position;
  r: Radius;
  m: Mass;
  vx: Velocity;
  vy: Velocity;
  color: Color;
  cue: boolean;
  elastic: Elastic;

  constructor({
    x,
    y,
    r = 10,
    m = r ** 2,
    vx = 0,
    vy = 0,
    color = 'black',
    cue = false,
    elastic = 1,
  }: {
    x: Position;
    y: Position;
    r?: Radius;
    m?: Mass;
    vx?: Velocity;
    vy?: Velocity;
    color?: Color;
    cue?: boolean;
    elastic?: Elastic;
  }) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.m = m;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.cue = cue;
    this.elastic = elastic;
  }

  update(frames = 1) {
    for (let i = 0; i < frames; i += 1) {
      this.x += this.vx;
      this.y += this.vy;
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }

  collideEdgeMaybe(top: Position, left: Position, bottom: Position, right: Position, edgeElastic: Elastic) {
    if ((this.x - this.r < left && this.vx < 0) || (this.x + this.r > right && this.vx > 0)) {
      this.collideEdge('x', edgeElastic);
      return true;
    }

    if ((this.y - this.r < top && this.vy < 0) || (this.y + this.r > bottom && this.vy > 0)) {
      this.collideEdge('y', edgeElastic);
      return true;
    }

    return false;
  }

  private collideEdge(edge: 'x' | 'y', edgeElastic: Elastic) {
    if (edge === 'x') {
      this.vx = -this.vx * Math.min(edgeElastic, this.elastic);
    } else if (edge === 'y') {
      this.vy = -this.vy * Math.min(edgeElastic, this.elastic);
    }
  }

  collideBallMaybe(target: Ball) {
    if (Math.pow(this.r + target.r, 2) < Math.pow(this.x - target.x, 2) + Math.pow(this.y - target.y, 2)) {
      return false;
    }

    this.collideBall(target);

    return true;
  }

  private collideBall(target: Ball) {
    // 碰撞方向的向量
    const collideVector = new Vector2D(this.x - target.x, this.y - target.y).normalize();
    // 碰撞垂直方向的向量
    const collideVerticalVector = collideVector.rotate(90).normalize();

    // --- 碰撞前 ---
    // 自身球速度向量
    const selfVelocityVector = new Vector2D(this.vx, this.vy);
    // 自身球在碰撞方向上的速度向量
    const selfVelocityVectorOnCollide = selfVelocityVector.projectOn(collideVector);
    // 自身球在碰撞垂直方向上的速度向量
    const selfVelocityVectorOnCollideVertical = selfVelocityVector.projectOn(collideVerticalVector);
    // 自身球在碰撞方向上的球速
    const selfVelocityOnCollide = selfVelocityVectorOnCollide.isSameDirection(collideVector) ? selfVelocityVectorOnCollide.length : -selfVelocityVectorOnCollide.length;

    // 目标球速度向量
    const targetVelecityVector = new Vector2D(target.vx, target.vy);
    // 目标球在碰撞方向上的速度向量
    const targetVelecityVectorOnCollide = targetVelecityVector.projectOn(collideVector);
    // 目标球在碰撞垂直方向上的速度向量
    const targetVelocityVectorOnCollideVertical = targetVelecityVector.projectOn(collideVerticalVector);
    // 目标球在碰撞方向上的球速
    const targetVelocityOnCollide = targetVelecityVectorOnCollide.isSameDirection(collideVector) ? targetVelecityVectorOnCollide.length : -targetVelecityVectorOnCollide.length;

    // 如果两球没有相向运动，不做碰撞处理
    if (selfVelocityOnCollide - targetVelocityOnCollide >= 0) return;

    // --- 碰撞后 ---
    // 两球的弹性取小
    const elasticMin = Math.min(this.elastic, target.elastic);
    // 自身球在碰撞方向上的速度
    const selfVelecityOnCollideAfter = Ball.velocityAfterCollide(selfVelocityOnCollide, targetVelocityOnCollide, this.m, target.m);
    // 自身球在碰撞方向上的速度向量
    const selfVelecityVectorOnCollideAfter = collideVector.normalize().scaleBy(selfVelecityOnCollideAfter);
    // 自身球的速度向量
    const selfMergeVelocityVector = selfVelocityVectorOnCollideVertical.add(selfVelecityVectorOnCollideAfter);
    // 更新自身球碰撞后的速度信息
    this.vx = selfMergeVelocityVector.x * elasticMin;
    this.vy = selfMergeVelocityVector.y * elasticMin;

    // 目标球在碰撞方向上的速度
    const targetVelecityOnCollideAfter = Ball.velocityAfterCollide(targetVelocityOnCollide, selfVelocityOnCollide, target.m, this.m);
    // 目标球在碰撞方向上的速度向量
    const targetVelecityVectorOnCollideAfter = collideVector.normalize().scaleBy(targetVelecityOnCollideAfter);
    // 目标球的速度向量
    const targetMergeVelocityVector = targetVelocityVectorOnCollideVertical.add(targetVelecityVectorOnCollideAfter);
    // 更新目标球碰撞后的速度信息
    target.vx = targetMergeVelocityVector.x * elasticMin;
    target.vy = targetMergeVelocityVector.y * elasticMin;
  }

  static velocityAfterCollide(v: Velocity, targetV: Velocity, m: Mass, targetM: Mass) {
    // 由动量守恒公式 & 动能守恒公式推导
    return ((v * (m - targetM)) + (2 * targetM * targetV)) / (m + targetM);
  }

  get isStatic() {
    return this.vx === 0 && this.vy === 0;
  }
}

class Vector2D {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get length() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  // 按长度归一化
  normalize() {
    return this.scaleBy(1 / this.length);
  }

  add(v: Vector2D) {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  // 按比例缩放
  scaleBy(scale = 1) {
    return new Vector2D(this.x * scale, this.y * scale);
  }

  // 逆时针旋转
  rotate(angle: Angle) {
    const radian = angle * Math.PI / 180;
    return new Vector2D(
      this.x * Math.cos(radian) - this.y * Math.sin(radian),
      this.x * Math.sin(radian) + this.y * Math.cos(radian),
    );
  }

  // 和另一向量的点积
  dotProduct(v: Vector2D) {
    return this.x * v.x + this.y * v.y;
  }

  // 在另一向量上的投影
  projectOn(v: Vector2D) {
    const on = v.normalize();
    return on.scaleBy(this.dotProduct(on));
  }

  // 是否和另一向量完全同向
  isSameDirection(v: Vector2D) {
    return util.isEqual(this.normalize().dotProduct(v.normalize()), 1);
  }
}

const util = {
  isEqual(a: number, b: number) {
    return Math.abs(a - b) < Number.EPSILON;
  },
  formatNum(num: number, min = 0.001) {
    return Math.abs(num) < min ? 0 : num;
  },
};

class Table {
  canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private balls: Set<Ball>;
  private width: number;
  private height: number;
  private scrollFriction: Friction;
  private edgeElastic: Elastic;
  private isPause: boolean;
  private renderNextFrame: (render: () => void) => void;

  constructor({
    width,
    height,
    scrollFriction = 0.01,
    edgeElastic = 0.9,
    renderNextFrame = window.requestAnimationFrame.bind(window),
  }: {
    width: number,
    height: number,
    scrollFriction?: Friction,
    edgeElastic?: Elastic,
    renderNextFrame?: (render: () => void) => void,
  }) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.balls = new Set();
    this.width = canvas.width;
    this.height = canvas.height;
    this.isPause = false;
    this.scrollFriction = scrollFriction;
    this.edgeElastic = edgeElastic;
    this.renderNextFrame = renderNextFrame;
  }

  mount(container: HTMLElement) {
    container.appendChild(this.canvas);
  }

  addBall(...balls: Ball[]) {
    balls.forEach(ball => this.balls.add(ball));
  }

  remove(ball: Ball) {
    return this.balls.delete(ball);
  }

  pause() {
    this.isPause = true;
  }

  resume() {
    this.isPause = false;
    this.go();
  }

  go(onStop?: () => void) {
    if (table.isStatic || table.isPause) {
      onStop?.();
      return;
    }

    this.renderNextFrame(() => {
      this.render();
      this.go(onStop);
    });
  }

  get config() {
    return {
      width: this.width,
      height: this.height,
      scrollFriction: this.scrollFriction,
      edgeElastic: this.edgeElastic,
    };
  }

  get cueBall() {
    for (const ball of this.balls) {
      if (ball.cue) {
        return ball;
      }
    }

    return null;
  }

  get isStatic() {
    for (const ball of this.balls) {
      if (!ball.isStatic) {
        return false;
      }
    }

    return true;
  }

  private render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 必须先完成全部位置更新，再判断碰撞
    for (const ball of this.balls) {
      ball.update();

      if (Math.abs(ball.vx) > this.scrollFriction) {
        ball.vx = ball.vx > 0 ? ball.vx - this.scrollFriction : ball.vx + this.scrollFriction;
      }

      ball.vx = util.formatNum(ball.vx, this.scrollFriction);
      
      if (Math.abs(ball.vy) > this.scrollFriction) {
        ball.vy = ball.vy > 0 ? ball.vy - this.scrollFriction : ball.vy + this.scrollFriction;
      }

      ball.vy = util.formatNum(ball.vy, this.scrollFriction);
    }

    const collidedBalls = new Set();

    // 判断碰撞
    for (const ball of this.balls) {
      ball.collideEdgeMaybe(0, 0, this.height, this.width, this.edgeElastic);

      for (const otherBall of this.balls) {
        if (ball === otherBall) continue;
        // 只考虑二球碰撞的场景，碰撞完的球本轮不再处理
        if (collidedBalls.has(ball) || collidedBalls.has(otherBall)) continue;

        const isCollided = ball.collideBallMaybe(otherBall);
        if (isCollided) {
          collidedBalls.add(ball);
          collidedBalls.add(otherBall);
        }
      }

      ball.render(this.ctx);
    }
  }
}

// --- test code ---

const canvas = document.querySelector('#canvas') as HTMLCanvasElement;

const table = new Table({
  width: 800,
  height: 600,
});

table.canvas.style.backgroundColor = 'olivedrab';
table.mount(document.body);

table.addBall(
  new Ball({ color: 'red', x: 200, y: 200, vy: -1, vx: 2, r: 8 }),
  new Ball({ color: 'blue', x: 50, y: 50, vy: 2, r: 15 }),
  new Ball({ color: 'blue', x: 250, y: 50, vy: 2, r: 15 }),
  new Ball({ color: 'cyan', x: 50, y: 150, vy: -1 }),
  new Ball({ color: 'cyan', x: 250, y: 150, vy: 1 }),
  new Ball({ color: 'black', x: 150, y: 150, vy: -3, vx: 0, m: 2000 }),
  new Ball({ color: 'white', x: 150, y: 50, vy: 0, r: 20, cue: true }),
);

table.go(() => {
  console.log('stop');

  table.cueBall.vx = 8;
  table.cueBall.vy = 8;
  table.go();
});

(window as any).table = table;
console.log(table);
