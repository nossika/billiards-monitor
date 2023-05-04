import type { Length, Position } from '@/define/type';

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

export default util;
