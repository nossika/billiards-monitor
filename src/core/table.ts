import type { Color, Elastic, Friction, Length, Position } from '@/define/type';
import util from '@/util';
import Ball from './ball';
import Hole from './hole';
import Renderer from './renderer';
import Vector2D from './vector';


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
  private rounds: number = 0;

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
    this.rounds = 0;
  }

  start(events?: {
    onClear?: (rounds: number) => void;
    onCueBallFall?: () => void;
    onStrike?: (x: Position, y: Position) => void;
    onReady?: (balls: Set<Ball>, rounds: number) => void;
  }) {
    if (!this.cueBall) {
      throw new Error('can not start without a cue ball');
    }
    this.go(() => events?.onReady?.(this.balls, this.rounds));
    this.onClick(async (data) => {
      if (!this.status.isStatic) return;
  
      await events?.onStrike?.(data.relativeX, data.relativeY);

      this.rounds += 1;

      this.strikeBall(
        new Vector2D(data.relativeX / 8, data.relativeY / 8), 
        this.cueBall,
        async () => {
          await events?.onReady?.(this.balls, this.rounds);
        },
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
    this.renderNextFrame(async () => {
      this.render();

      if (this.isStatic) {
        await onStop?.();
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
      this.handleFallInHoles();
      this.handleCollideEdge();
      this.handleCollideBalls();
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

  private handleFallInHoles() {
    for (const ball of this.balls) {
      for (const hole of this.holes) {
        const isFallIn = ball.fallInHoleMaybe(hole);
        if (isFallIn) {
          this.removeBall(ball);
        }
      }
    }
  }

  private handleCollideEdge() {
    for (const ball of this.balls) {
      ball.collideEdgeMaybe({ top: 0, left: 0, bottom: this.height, right: this.width, edgeElastic: this.edgeElastic });
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

export default Table;
