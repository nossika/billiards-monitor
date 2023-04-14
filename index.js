class Ball {
    constructor({ x, y, r = 10, m = Math.pow(r, 2), vx = 0, vy = 0, color = 'black', cue = false, }) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.m = m;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.cue = cue;
    }
    update(frames = 1) {
        for (let i = 0; i < frames; i += 1) {
            this.x += this.vx;
            this.y += this.vy;
        }
    }
    render(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
    collideEdgeMaybe(top, left, bottom, right) {
        if ((this.x - this.r < left && this.vx < 0) || (this.x + this.r > right && this.vx > 0)) {
            this.collideEdge('x');
            return true;
        }
        if ((this.y - this.r < top && this.vy < 0) || (this.y + this.r > bottom && this.vy > 0)) {
            this.collideEdge('y');
            return true;
        }
        return false;
    }
    collideEdge(edge) {
        if (edge === 'x') {
            this.vx = -this.vx;
        }
        else if (edge === 'y') {
            this.vy = -this.vy;
        }
    }
    collideBallMaybe(target) {
        if (Math.pow(this.r + target.r, 2) < Math.pow(this.x - target.x, 2) + Math.pow(this.y - target.y, 2)) {
            return false;
        }
        this.collideBall(target);
        return true;
    }
    collideBall(target) {
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
        if (selfVelocityOnCollide - targetVelocityOnCollide >= 0)
            return;
        // --- 碰撞后 ---
        // 自身球在碰撞方向上的速度
        const selfVelecityOnCollideAfter = Ball.velocityAfterCollide(selfVelocityOnCollide, targetVelocityOnCollide, this.m, target.m);
        // 自身球在碰撞方向上的速度向量
        const selfVelecityVectorOnCollideAfter = collideVector.normalize().scaleBy(selfVelecityOnCollideAfter);
        // 自身球的速度向量
        const selfMergeVelocityVector = selfVelocityVectorOnCollideVertical.add(selfVelecityVectorOnCollideAfter);
        // 更新自身球碰撞后的速度信息
        this.vx = selfMergeVelocityVector.x;
        this.vy = selfMergeVelocityVector.y;
        // 目标球在碰撞方向上的速度
        const targetVelecityOnCollideAfter = Ball.velocityAfterCollide(targetVelocityOnCollide, selfVelocityOnCollide, target.m, this.m);
        // 目标球在碰撞方向上的速度向量
        const targetVelecityVectorOnCollideAfter = collideVector.normalize().scaleBy(targetVelecityOnCollideAfter);
        // 目标球的速度向量
        const targetMergeVelocityVector = targetVelocityVectorOnCollideVertical.add(targetVelecityVectorOnCollideAfter);
        // 更新目标球碰撞后的速度信息
        target.vx = targetMergeVelocityVector.x;
        target.vy = targetMergeVelocityVector.y;
    }
    static velocityAfterCollide(v, targetV, m, targetM) {
        // 由动量守恒公式 & 动能守恒公式推导
        return ((v * (m - targetM)) + (2 * targetM * targetV)) / (m + targetM);
    }
    get isStatic() {
        return this.vx === 0 && this.vy === 0;
    }
}
class Vector2D {
    constructor(x, y) {
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
    add(v) {
        return new Vector2D(this.x + v.x, this.y + v.y);
    }
    // 按比例缩放
    scaleBy(scale = 1) {
        return new Vector2D(this.x * scale, this.y * scale);
    }
    // 逆时针旋转
    rotate(angle) {
        const radian = angle * Math.PI / 180;
        return new Vector2D(this.x * Math.cos(radian) - this.y * Math.sin(radian), this.x * Math.sin(radian) + this.y * Math.cos(radian));
    }
    // 和另一向量的点积
    dotProduct(v) {
        return this.x * v.x + this.y * v.y;
    }
    // 在另一向量上的投影
    projectOn(v) {
        const on = v.normalize();
        return on.scaleBy(this.dotProduct(on));
    }
    // 是否和另一向量完全同向
    isSameDirection(v) {
        return util.isEqual(this.normalize().dotProduct(v.normalize()), 1);
    }
}
const util = {
    isEqual(a, b) {
        return Math.abs(a - b) < Number.EPSILON;
    },
    formatNum(num, min = 0.001) {
        return Math.abs(num) < min ? 0 : num;
    },
};
class Table {
    constructor({ width, height, scrollFriction = 0.01, edgeElastic = 0.9, renderNextFrame = window.requestAnimationFrame.bind(window), }) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.balls = new Set();
        this.width = canvas.width;
        this.height = canvas.height;
        this.isPause = false;
        this.edgeElastic = edgeElastic;
        this.scrollDepletionRate = 1 - scrollFriction;
        this.renderNextFrame = renderNextFrame;
    }
    mount(container) {
        container.appendChild(this.canvas);
    }
    addBall(...balls) {
        balls.forEach(ball => this.balls.add(ball));
    }
    remove(ball) {
        return this.balls.delete(ball);
    }
    pause() {
        this.isPause = true;
    }
    resume() {
        this.isPause = false;
        this.go();
    }
    go(onStop) {
        if (table.isStatic || table.isPause) {
            onStop === null || onStop === void 0 ? void 0 : onStop();
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
            scrollDepletionRate: this.scrollDepletionRate,
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
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        // 必须先完成全部位置更新，再判断碰撞
        for (const ball of this.balls) {
            ball.update();
            ball.vx = util.formatNum(ball.vx * this.scrollDepletionRate);
            ball.vy = util.formatNum(ball.vy * this.scrollDepletionRate);
        }
        const collidedBalls = new Set();
        // 判断碰撞
        for (const ball of this.balls) {
            ball.collideEdgeMaybe(0, 0, this.height, this.width);
            for (const otherBall of this.balls) {
                if (ball === otherBall)
                    continue;
                // 只考虑二球碰撞的场景，碰撞完的球本轮不再处理
                if (collidedBalls.has(ball) || collidedBalls.has(otherBall))
                    continue;
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
const canvas = document.querySelector('#canvas');
const table = new Table({
    width: 800,
    height: 600,
});
table.canvas.style.backgroundColor = 'olivedrab';
table.mount(document.body);
table.addBall(new Ball({ color: 'red', x: 200, y: 200, vy: -1, vx: 2, r: 8 }), new Ball({ color: 'blue', x: 50, y: 50, vy: 2, r: 15 }), new Ball({ color: 'blue', x: 250, y: 50, vy: 2, r: 15 }), new Ball({ color: 'cyan', x: 50, y: 150, vy: -1 }), new Ball({ color: 'cyan', x: 250, y: 150, vy: 1 }), new Ball({ color: 'black', x: 150, y: 150, vy: -3, vx: 0, m: 2000 }), new Ball({ color: 'white', x: 150, y: 50, vy: 0, r: 20, cue: true }));
table.go(() => {
    console.log('stop');
    table.cueBall.vx = 5;
    table.cueBall.vy = 5;
    table.go();
});
window.table = table;
console.log(table);
