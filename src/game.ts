import Ball from '@/core/ball';
import Hole from '@/core/hole';
import Table from '@/core/table';

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
    onStrike(x, y) {
      console.log(`strike!!! x: ${x} , y: ${y}`);
    },
    onReady(balls: Set<Ball>) {
      console.log(`remain balls: ${balls.size - 1}`);
    },
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
