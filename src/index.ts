type Position = number; // 坐标 x, y
type Length = number; // 长度
type Velocity = number; // 速度 vx, vy
type Mass = number; // 质量 m
type Radius = number; // 半径 r
type Color = string; // 颜色，如 #aabbcc
type Angle = number; // 角度，范围 0 - 360
type Friction = number; // 摩擦系数，>= 0，越小表示摩擦力越小
type Elastic = number; // 弹性，范围 0 - 1，越大表示弹性越好

class Ball {
  x: Position; // x 坐标
  y: Position; // y 坐标
  r: Radius; // 半径
  m: Mass; // 质量
  vx: Velocity; // x 速度
  vy: Velocity; // y 速度
  color: Color; // 颜色
  elastic: Elastic; // 弹性

  constructor({
    x,
    y,
    r = 10,
    m = r ** 2,
    vx = 0,
    vy = 0,
    color = 'black',
    elastic = 1,
  }: {
    x: Position;
    y: Position;
    r?: Radius;
    m?: Mass;
    vx?: Velocity;
    vy?: Velocity;
    color?: Color;
    elastic?: Elastic;
  }) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.m = m;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.elastic = elastic;
  }

  update(scale = 1) {
    this.x += this.vx * scale;
    this.y += this.vy * scale;
  }

  collideEdgeMaybe(d: { top: Position, left: Position, bottom: Position, right: Position, edgeElastic: Elastic }) {
    if ((this.x - this.r < d.left && this.vx < 0) || (this.x + this.r > d.right && this.vx > 0)) {
      this.collideEdge('x', d.edgeElastic);
      return true;
    }

    if ((this.y - this.r < d.top && this.vy < 0) || (this.y + this.r > d.bottom && this.vy > 0)) {
      this.collideEdge('y', d.edgeElastic);
      return true;
    }

    return false;
  }

  collideBallMaybe(target: Ball) {
    if (this.r + target.r <= util.distance(this.x, this.y, target.x, target.y)) {
      return false;
    }

    this.collideBall(target);

    return true;
  }

  fallInHoleMaybe(hole: Hole) {
    // 如果球大于洞，则必定不会落入
    if (hole.r < this.r) return false;

    const distance = util.distance(this.x, this.y, hole.x, hole.y);

    // 无论运动静止，球整体位于洞内，视为落入
    if (distance < hole.r - this.r) return true;

    // 静止时，球心在洞内，视为落入
    if (!this.vx && !this.vy && distance < hole.r) return true;

    return false;
  }

  private collideEdge(edge: 'x' | 'y', edgeElastic: Elastic) {
    if (edge === 'x') {
      this.vx = -this.vx * Math.min(edgeElastic, this.elastic);
    } else if (edge === 'y') {
      this.vy = -this.vy * Math.min(edgeElastic, this.elastic);
    }
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
  x: Position;
  y: Position;

  constructor(x: Position, y: Position) {
    this.x = x;
    this.y = y;
  }

  get length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  // 按长度归一化
  normalize() {
    if (!this.length) return this;
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
  isEqual(a: number, b: number): boolean {
    // 多次计算处理会放大误差，允许一个比 Number.EPSILON 更大的误差范围来判断相等
    return Math.abs(a - b) < (Number.EPSILON * 100);
  },
  formatNum(num: number, min = 0.001): number {
    return Math.abs(num) < min ? 0 : num;
  },
  distance(x1: Position, y1: Position, x2: Position, y2: Position): Length {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  },
  create2DCanvas(props: {
    container: HTMLElement;
    width: Length;
    height: Length;
    origin?: [Position, Position];
    style?: Partial<CSSStyleDeclaration>;
  }): CanvasRenderingContext2D {
    const { container, width, height, origin, style } = props;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    Object.assign(canvas.style, style);
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (origin) {
      ctx.translate(origin[0], origin[1]);
    }
    return ctx;
  },
};

class Renderer {
  private ctx: CanvasRenderingContext2D;
  private x: Position;
  private y: Position;
  private w: Length;
  private h: Length;

  constructor(ctx: CanvasRenderingContext2D, size: {
    x: Position;
    y: Position;
    w: Length;
    h: Length;
  }) {
    this.ctx = ctx;
    this.x = size.x;
    this.y = size.y;
    this.w = size.w;
    this.h = size.h;
  }

  clear() {
    this.ctx.clearRect(this.x, this.y, this.w, this.h);
  }

  fill(color: Color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.x, this.y, this.w, this.h);
  }

  renderBall(x: Position, y: Position, r: Radius, color: Color = 'black') {
    const { ctx } = this;

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  renderStick(x: Position, y: Position, targetX: Position, targetY: Position, color: Color = 'black') {
    const { ctx } = this;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(targetX, targetY);
    ctx.closePath();
    ctx.setLineDash([5, 10]);
    ctx.strokeStyle = color;
    ctx.stroke();

    const targetVector = new Vector2D(targetX - x, targetY - y);
    const stickVector = targetVector.rotate(180).normalize();
    const stickLengthVector = stickVector.scaleBy(50);
    const stickMarginVector = stickVector.scaleBy(targetVector.length / 3);

    ctx.beginPath();
    ctx.moveTo(x + stickMarginVector.x, y + stickMarginVector.y);
    ctx.lineTo(x + stickMarginVector.x + stickLengthVector.x, y + stickMarginVector.y + stickLengthVector.y);
    ctx.closePath();
    ctx.setLineDash([]);
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  renderBorder(border: Length, color: Color = 'gray') {
    const { ctx } = this;

    ctx.fillStyle = color;
    ctx.fillRect(this.x, this.y, this.w, border);
    ctx.fillRect(this.x, this.y, border, this.h);
    ctx.fillRect(this.x, this.y + this.h - border, this.w, border);
    ctx.fillRect(this.x + this.w - border, this.y, border, this.h);
  }

  renderHole(x: Position, y: Position, r: Length, color: Color = 'black') {
    const { ctx } = this;

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

interface TableStyles {
  containerStyle?: Partial<CSSStyleDeclaration>;
  borderColor?: Color;
  stickColor?: Color;
  tableColor?: Color;
}

class Table {
  cueBall?: Ball | undefined; // 主球
  private parentNode: HTMLElement;
  private container: HTMLElement;
  private tableRenderer: Renderer;
  private controlRenderer: Renderer;
  private balls: Set<Ball> = new Set();
  private holes: Set<Hole> = new Set();
  private width: Length;
  private height: Length;
  private border: Length;
  private scrollFriction: Friction;
  private edgeElastic: Elastic;
  private renderNextFrame: (render: () => void) => void; // 每帧渲染时机
  private styles?: TableStyles;

  constructor({
    width,
    height,
    border = 10,
    scrollFriction = 0.01,
    edgeElastic = 0.9,
    renderNextFrame = window.requestAnimationFrame.bind(window),
    styles,
  }: {
    width: Length;
    height: Length;
    border?: Length;
    scrollFriction?: Friction;
    edgeElastic?: Elastic;
    renderNextFrame?: (render: () => void) => void;
    styles?: TableStyles;
  }) {
    const containerWidth = width + border * 2;
    const containerHeight = height + border * 2;
    const container = document.createElement('div');
    Object.assign(container.style, styles?.containerStyle);
    container.style.width = `${containerWidth}px`;
    container.style.height = `${containerHeight}px`;
    container.style.position = 'relative';
    this.container = container;

    const tableCtx = util.create2DCanvas({
      container,
      width: containerWidth,
      height: containerHeight,
      origin: [border, border],
    });
    this.tableRenderer = new Renderer(tableCtx, {
      x: -border,
      y: -border,
      w: containerWidth,
      h: containerHeight,
    });

    const controlCtx = util.create2DCanvas({
      container,
      width: containerWidth,
      height: containerHeight,
      origin: [border, border],
      style: {
        position: 'absolute',
        top: '0',
        left: '0',
      },
    });
    this.controlRenderer = new Renderer(controlCtx, {
      x: -border,
      y: -border,
      w: containerWidth,
      h: containerHeight,
    });

    this.width = width;
    this.height = height;
    this.border = border;
    this.scrollFriction = scrollFriction;
    this.edgeElastic = edgeElastic;
    this.renderNextFrame = renderNextFrame;
    this.styles = styles;
  }

  mount(node: HTMLElement) {
    node.appendChild(this.container);
    this.parentNode = node;
    return this;
  }

  unmount() {
    this.parentNode?.removeChild(this.container);
  }

  init({
    cueBall,
    balls = [],
    holes = [],
  }: {
    cueBall: Ball,
    balls?: Ball[],
    holes?: Hole[],
  }) {
    this.balls = new Set();
    this.holes = new Set();
    this.cueBall = cueBall;
    this.addBall(cueBall);
    this.addBall(...balls);
    this.addHole(...holes);
  }

  start(events?: {
    onClear?: () => void;
    onCueBallFall?: () => void;
  }) {
    if (!this.cueBall) {
      throw new Error('can not start without a cue ball');
    }
    this.go();
    this.onClick((data) => {
      if (!this.status.isStatic) return;
      console.log(`strike!!! x: ${data.relativeX}, y:${data.relativeY}`);

      const onDone = () => {
        if (!this.balls.has(this.cueBall)) {
          events?.onCueBallFall?.();
          return;
        }

        if (this.balls.size <= 1) {
          events?.onClear?.();
          return;
        }

        console.log('done');
      };

      this.strikeBall(
        new Vector2D(data.relativeX / 10, data.relativeY / 10), 
        this.cueBall,
        onDone,
      );
    });
    
    this.onMousemove((data) => {
      if (!this.status.isStatic) return;
      this.renderer.controlRenderer.clear();
      this.renderer.controlRenderer.renderStick(data.ballX, data.ballY, data.targetX, data.targetY, this.styles?.stickColor);
    });
  }

  get config() {
    return {
      width: this.width,
      height: this.height,
      border: this.border,
      scrollFriction: this.scrollFriction,
      edgeElastic: this.edgeElastic,
      styles: this.styles,
    };
  }

  get status() {
    return {
      isStatic: this.isStatic,
    };
  }

  get renderer() {
    return {
      tableRenderer: this.tableRenderer,
      controlRenderer: this.controlRenderer,
    };
  }

  private go(onStop?: () => void) {
    this.renderNextFrame(() => {
      this.render();

      if (this.isStatic) {
        onStop?.();
        return;
      }
      this.go(onStop);
    });
  }

  private addBall(...balls: Ball[]) {
    balls.forEach(ball => this.balls.add(ball));
  }

  private removeBall(ball: Ball) {
    return this.balls.delete(ball);
  }

  private strikeBall(v: Vector2D, ball: Ball = this.cueBall, onStop?: () => void) {
    if (!ball) return;
    ball.vx = v.x;
    ball.vy = v.y;
    this.go(onStop);
  }

  private addHole(...holes: Hole[]) {
    holes.forEach(hole => this.holes.add(hole));
  }

  private onClick(onClick: (data: {
    targetX: Position;
    targetY: Position;
    ballX: Position;
    ballY: Position;
    relativeX: Position;
    relativeY: Position;
  }) => void, relativeBall: Ball = this.cueBall) {
    return this.container.addEventListener('click', (e) => {
      const targetX = e.offsetX;
      const targetY = e.offsetY;

      const ballX = relativeBall?.x;
      const ballY = relativeBall?.y;

      const relativeX = targetX - ballX;
      const relativeY = targetY - ballY;

      onClick({
        targetX,
        targetY,
        ballX,
        ballY,
        relativeX,
        relativeY,
      });
    });
  }

  private onMousemove(onMove: (data: {
    targetX: Position;
    targetY: Position;
    ballX: Position;
    ballY: Position;
    relativeX: Position;
    relativeY: Position;
  }) => void, relativeBall: Ball = this.cueBall) {
    return this.container.addEventListener('mousemove', (e) => {
      const targetX = e.offsetX;
      const targetY = e.offsetY;

      const ballX = relativeBall?.x;
      const ballY = relativeBall?.y;

      const relativeX = targetX - ballX;
      const relativeY = targetY - ballY;

      onMove({
        targetX,
        targetY,
        ballX,
        ballY,
        relativeX,
        relativeY,
      });
    });
  }

  private get isStatic() {
    for (const ball of this.balls) {
      if (!ball.isStatic) {
        return false;
      }
    }

    return true;
  }

  private render() {
    const maxRenderSteps = this.getMaxRenderSteps();

    for (let step = 0; step < maxRenderSteps; step += 1) {
      this.updateBalls(1 / maxRenderSteps);
      this.handleCollideBalls();
      this.HandleFallInHoles();
    }

    this.tableRenderer.clear();
    this.tableRenderer.fill(this.styles?.tableColor);
    this.renderBorder();
    this.renderHoles();
    this.renderBalls();
  }

  // 计算此帧需要分成多少段处理，以避免速度过快的小球穿过其他球，越多段可以使碰撞更接近真实，但也意味着更多计算量
  private getMaxRenderSteps() {
    let maxRenderSteps = 1;
    for (const ball of this.balls) {
      const vMerge = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
      maxRenderSteps = Math.max(maxRenderSteps, Math.ceil(vMerge / (ball.r / 5)));
    }

    return maxRenderSteps;
  }

  private updateBalls(scale = 1) {
    for (const ball of this.balls) {
      ball.update(scale);

      const v = new Vector2D(ball.vx, ball.vy);
      const vAfter = v.normalize().scaleBy(Math.max(v.length - this.scrollFriction, 0));

      ball.vx = vAfter.x;
      ball.vy = vAfter.y;
    }
  }

  private handleCollideBalls() {
    const collidedBalls = new Set();

    for (const ball of this.balls) {
      ball.collideEdgeMaybe({ top: 0, left: 0, bottom: this.height, right: this.width, edgeElastic: this.edgeElastic });

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
    }
  }

  private HandleFallInHoles() {
    for (const ball of this.balls) {
      for (const hole of this.holes) {
        const isFallIn = ball.fallInHoleMaybe(hole);
        if (isFallIn) {
          this.removeBall(ball);
        }
      }
    }
  }

  private renderBalls() {
    for (const ball of this.balls) {
      this.renderer.tableRenderer.renderBall(ball.x, ball.y, ball.r, ball.color);
    }
  }

  private renderBorder() {
    this.renderer.tableRenderer.renderBorder(this.border, this.styles?.borderColor);
  }

  private renderHoles() {
    for (const hole of this.holes) {
      this.renderer.tableRenderer.renderHole(hole.x, hole.y, hole.r, hole.color);
    }
  }
}

class Hole {
  x: Position;
  y: Position;
  r: Length;
  color: Color;
  
  constructor(x: Position, y: Position, r: Length, color: Color = 'black') {
    this.x = x;
    this.y = y;
    this.r = r;
    this.color = color;
  }
}

// --- test code ---
const startGame = () => {
  const table = new Table({
    width: 254 * 3,
    height: 127 * 3,
    styles: {
      tableColor: 'olivedrab',
      borderColor: 'green',
    }
  }).mount(document.body);

  table.init({
    cueBall: new Ball({ color: 'white', x: 150, y: 50, vx: 10, vy: 10 }),
    balls: [
      new Ball({ x: 300, y: 200 }),
      new Ball({ x: 300, y: 220 }),
      new Ball({ x: 300, y: 240 }),
      new Ball({ x: 300, y: 260 }),
    ],
    holes: [
      new Hole(100, 100, 30, '#333'),
    ],
  });
  
  table.start({
    onClear() {
      alert('win');
      table.unmount();
      startGame();
    },
    onCueBallFall() {
      alert('lose');
      table.unmount();
      startGame();
    },
  });
}

startGame();
