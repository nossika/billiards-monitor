import type { Color, Length, Position, Radius } from '@/define/type';
import Vector2D from './vector';

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

export default Renderer;
