import Ball from '@/core/ball';
import Hole from '@/core/hole';
import Table from '@/core/table';

const startGame = () => {
  const table = new Table({
    width: 762,
    height: 381,
    border: 10,
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
      new Hole({ x: 0, y: 0, r: 36, color: '#333' }),
      new Hole({ x: 0, y: 381, r: 36, color: '#333' }),
      new Hole({ x: 762, y: 0, r: 36, color: '#333' }),
      new Hole({ x: 762, y: 381, r: 36, color: '#333' }),
    ],
  });
  
  console.log('start a new game~');

  table.start({
    onStrike(x, y) {
      console.log(`strike!!! x: ${x}, y: ${y}`);
    },
    onReady(balls, rounds) {
      if (!balls.has(table.cueBall)) {
        alert('lose...');
        table.unmount();
        startGame();
        return;
      }

      if (balls.size <= 1) {
        alert(`win!!! cost rounds: ${rounds}`);
        table.unmount();
        startGame();
        return;
      }

      console.log(`remain balls: ${balls.size - 1}, rounds: ${rounds}`);
    },
  });
}

startGame();
