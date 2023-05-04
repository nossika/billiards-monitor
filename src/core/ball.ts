import type { Color, Elastic, Mass, Position, Radius, Velocity } from '@/define/type';
import util from '@/util';
import Hole from './hole';
import Vector2D from './vector';

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

export default Ball;
