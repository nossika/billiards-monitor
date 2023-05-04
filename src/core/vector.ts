import type { Angle, Position } from '@/define/type';
import util from '@/util';

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

export default Vector2D;
