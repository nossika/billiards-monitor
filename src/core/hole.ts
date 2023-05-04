import type { Color, Length, Position } from '@/define/type';

class Hole {
  x: Position;
  y: Position;
  r: Length;
  color: Color;
  
  constructor({
    x,
    y,
    r,
    color = 'black',
  }: {
    x: Position;
    y: Position;
    r: Length;
    color?: Color;
  }) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.color = color;
  }
}

export default Hole;
