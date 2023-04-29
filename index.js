class Ball {
    constructor({ x, y, r = 10, m = Math.pow(r, 2), vx = 0, vy = 0, color = 'black', elastic = 1, }) {
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
    collideEdgeMaybe(d) {
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
    collideBallMaybe(target) {
        if (Math.pow((this.r + target.r), 2) <= Math.pow((this.x - target.x), 2) + Math.pow((this.y - target.y), 2)) {
            return false;
        }
        this.collideBall(target);
        return true;
    }
    collideEdge(edge, edgeElastic) {
        if (edge === 'x') {
            this.vx = -this.vx * Math.min(edgeElastic, this.elastic);
        }
        else if (edge === 'y') {
            this.vy = -this.vy * Math.min(edgeElastic, this.elastic);
        }
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
        if (!this.length)
            return this;
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
        // 多次计算处理会放大误差，允许一个比 Number.EPSILON 更大的误差范围来判断相等
        return Math.abs(a - b) < (Number.EPSILON * 100);
    },
    formatNum(num, min = 0.001) {
        return Math.abs(num) < min ? 0 : num;
    },
    create2DCanvas(props) {
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
    constructor(ctx, size) {
        this.ctx = ctx;
        this.x = size.x;
        this.y = size.y;
        this.w = size.w;
        this.h = size.h;
    }
    clear() {
        this.ctx.clearRect(this.x, this.y, this.w, this.h);
    }
    fill(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(this.x, this.y, this.w, this.h);
    }
    renderBall(x, y, r, color = 'black') {
        const { ctx } = this;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    renderStick(x, y, targetX, targetY, color = 'black') {
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
    renderBorder(border, color = 'gray') {
        const { ctx } = this;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.w, border);
        ctx.fillRect(this.x, this.y, border, this.h);
        ctx.fillRect(this.x, this.y + this.h - border, this.w, border);
        ctx.fillRect(this.x + this.w - border, this.y, border, this.h);
    }
}
class Table {
    constructor({ width, height, border = 10, scrollFriction = 0.01, edgeElastic = 0.9, renderNextFrame = window.requestAnimationFrame.bind(window), styles, }) {
        this.balls = new Set();
        const containerWidth = width + border * 2;
        const containerHeight = height + border * 2;
        const container = document.createElement('div');
        Object.assign(container.style, styles === null || styles === void 0 ? void 0 : styles.containerStyle);
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
    mount(node) {
        node.appendChild(this.container);
        return this;
    }
    init({ cueBall, balls = [], }) {
        this.cueBall = cueBall;
        this.addBall(cueBall);
        this.addBall(...balls);
    }
    start() {
        if (!this.cueBall) {
            throw new Error('can not start before table.init()');
        }
        this.go();
        this.onClick((data) => {
            if (!this.status.isStatic)
                return;
            console.log(`strike!!! x: ${data.relativeX}, y:${data.relativeY}`);
            this.strikeBall(new Vector2D(data.relativeX / 10, data.relativeY / 10), this.cueBall, () => console.log('done'));
        });
        this.onMousemove((data) => {
            var _a;
            if (!this.status.isStatic)
                return;
            this.renderer.controlRenderer.clear();
            this.renderer.controlRenderer.renderStick(data.ballX, data.ballY, data.targetX, data.targetY, (_a = this.styles) === null || _a === void 0 ? void 0 : _a.stickColor);
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
    go(onStop) {
        this.renderNextFrame(() => {
            this.render();
            if (table.isStatic) {
                onStop === null || onStop === void 0 ? void 0 : onStop();
                return;
            }
            this.go(onStop);
        });
    }
    addBall(...balls) {
        balls.forEach(ball => this.balls.add(ball));
    }
    strikeBall(v, ball = this.cueBall, onStop) {
        if (!ball)
            return;
        ball.vx = v.x;
        ball.vy = v.y;
        this.go(onStop);
    }
    onClick(onClick, relativeBall = this.cueBall) {
        return this.container.addEventListener('click', (e) => {
            const targetX = e.offsetX;
            const targetY = e.offsetY;
            const ballX = relativeBall === null || relativeBall === void 0 ? void 0 : relativeBall.x;
            const ballY = relativeBall === null || relativeBall === void 0 ? void 0 : relativeBall.y;
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
    onMousemove(onMove, relativeBall = this.cueBall) {
        return this.container.addEventListener('mousemove', (e) => {
            const targetX = e.offsetX;
            const targetY = e.offsetY;
            const ballX = relativeBall === null || relativeBall === void 0 ? void 0 : relativeBall.x;
            const ballY = relativeBall === null || relativeBall === void 0 ? void 0 : relativeBall.y;
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
    get isStatic() {
        for (const ball of this.balls) {
            if (!ball.isStatic) {
                return false;
            }
        }
        return true;
    }
    render() {
        var _a;
        const maxRenderSteps = this.getMaxRenderSteps();
        for (let step = 0; step < maxRenderSteps; step += 1) {
            this.updateBalls(1 / maxRenderSteps);
            this.handleCollideBalls();
        }
        this.tableRenderer.clear();
        this.tableRenderer.fill((_a = this.styles) === null || _a === void 0 ? void 0 : _a.tableColor);
        this.renderBalls();
        this.renderBorder();
    }
    // 计算此帧需要分成多少段处理，以避免速度过快的小球穿过其他球，越多段可以使碰撞更接近真实，但也意味着更多计算量
    getMaxRenderSteps() {
        let maxRenderSteps = 1;
        for (const ball of this.balls) {
            const vMerge = Math.sqrt(Math.pow(ball.vx, 2) + Math.pow(ball.vy, 2));
            maxRenderSteps = Math.max(maxRenderSteps, Math.ceil(vMerge / (ball.r / 5)));
        }
        return maxRenderSteps;
    }
    updateBalls(scale = 1) {
        for (const ball of this.balls) {
            ball.update(scale);
            const v = new Vector2D(ball.vx, ball.vy);
            const vAfter = v.normalize().scaleBy(Math.max(v.length - this.scrollFriction, 0));
            ball.vx = vAfter.x;
            ball.vy = vAfter.y;
        }
    }
    handleCollideBalls() {
        const collidedBalls = new Set();
        for (const ball of this.balls) {
            ball.collideEdgeMaybe({ top: 0, left: 0, bottom: this.height, right: this.width, edgeElastic: this.edgeElastic });
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
        }
    }
    renderBalls() {
        for (const ball of this.balls) {
            this.renderer.tableRenderer.renderBall(ball.x, ball.y, ball.r, ball.color);
        }
    }
    renderBorder() {
        var _a;
        this.renderer.tableRenderer.renderBorder(this.border, (_a = this.styles) === null || _a === void 0 ? void 0 : _a.borderColor);
    }
}
// --- test code ---
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
});
table.start();
