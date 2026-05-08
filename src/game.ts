import { invoke } from "@tauri-apps/api/core";

export interface Point {
  x: number;
  y: number;
}

export type Direction = "Up" | "Down" | "Left" | "Right";

export interface GameState {
  snake: Point[];
  food: Point;
  direction: Direction;
  score: number;
  game_over: boolean;
  grid_width: number;
  grid_height: number;
}

const GRID_SIZE = 20;
const INITIAL_INTERVAL = 150;
const MIN_INTERVAL = 60;
const SPEED_INCREMENT = 2;

export class SnakeGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 0;
  private intervalId: number | null = null;
  private running = false;
  private speed: number = INITIAL_INTERVAL;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }

  private resize() {
    const maxW = Math.min(window.innerWidth - 32, 400);
    const maxH = Math.min(window.innerHeight - 320, 400);
    const size = Math.min(maxW, maxH);
    this.canvas.width = size;
    this.canvas.height = size;
    this.cellSize = Math.floor(size / GRID_SIZE);
  }

  private calculateSpeed(): number {
    return Math.max(MIN_INTERVAL, INITIAL_INTERVAL - SPEED_INCREMENT);
  }

  async start(): Promise<void> {
    await invoke("new_game", {
      gridWidth: GRID_SIZE,
      gridHeight: GRID_SIZE,
    });
    this.speed = INITIAL_INTERVAL;
    this.running = true;
    this.gameLoop();
  }

  async pause(): Promise<void> {
    this.running = !this.running;
    if (this.running) {
      this.gameLoop();
    }
    this.updatePauseButton();
  }

  isRunning(): boolean {
    return this.running;
  }

  private updatePauseButton() {
    const btn = document.getElementById("btn-pause");
    if (btn) {
      btn.textContent = this.running ? "Pause" : "Resume";
    }
  }

  private gameLoop() {
    if (!this.running) {
      if (this.intervalId !== null) {
        clearTimeout(this.intervalId);
        this.intervalId = null;
      }
      return;
    }

    this.tick();
    this.intervalId = window.setTimeout(() => this.gameLoop(), this.speed);
  }

  private async tick() {
    try {
      const state = await invoke<GameState>("tick");
      this.render(state);

      if (state.game_over) {
        this.running = false;
        this.updatePauseButton();
        this.drawGameOver();
      } else {
        this.speed = this.calculateSpeed();
      }
    } catch (e) {
      console.error("Tick error:", e);
    }
  }

  async changeDirection(dir: Direction) {
    try {
      await invoke("change_direction", { direction: dir });
    } catch (e) {
      console.error("Direction error:", e);
    }
  }

  private drawRoundRect(x: number, y: number, w: number, h: number, r: number) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  private render(state: GameState) {
    const { ctx, canvas, cellSize } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (subtle)
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw food
    const fx = state.food.x * cellSize + cellSize / 2;
    const fy = state.food.y * cellSize + cellSize / 2;
    ctx.fillStyle = "#ff4444";
    ctx.beginPath();
    ctx.arc(fx, fy, cellSize / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    // Glow
    ctx.shadowColor = "#ff4444";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw snake
    state.snake.forEach((seg, i) => {
      const sx = seg.x * cellSize + 1;
      const sy = seg.y * cellSize + 1;
      const s = cellSize - 2;
      const r = i === 0 ? 6 : 4;

      if (i === 0) {
        ctx.fillStyle = "#00ff88";
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 8;
      } else {
        const g = Math.max(80, 255 - i * 8);
        ctx.fillStyle = `rgb(0, ${g}, 100)`;
        ctx.shadowBlur = 0;
      }

      this.drawRoundRect(sx, sy, s, s, r);
      ctx.fill();

      // Eyes on head
      if (i === 0) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000";
        const eyeSize = Math.max(2, cellSize / 8);
        let ex1 = sx + cellSize * 0.3;
        let ey1 = sy + cellSize * 0.3;
        let ex2 = sx + cellSize * 0.7;
        let ey2 = sy + cellSize * 0.3;

        switch (state.direction) {
          case "Up":
            ex1 = sx + cellSize * 0.3; ey1 = sy + cellSize * 0.25;
            ex2 = sx + cellSize * 0.7; ey2 = sy + cellSize * 0.25;
            break;
          case "Down":
            ex1 = sx + cellSize * 0.3; ey1 = sy + cellSize * 0.75;
            ex2 = sx + cellSize * 0.7; ey2 = sy + cellSize * 0.75;
            break;
          case "Left":
            ex1 = sx + cellSize * 0.2; ey1 = sy + cellSize * 0.3;
            ex2 = sx + cellSize * 0.2; ey2 = sy + cellSize * 0.7;
            break;
          case "Right":
            ex1 = sx + cellSize * 0.8; ey1 = sy + cellSize * 0.3;
            ex2 = sx + cellSize * 0.8; ey2 = sy + cellSize * 0.7;
            break;
        }

        ctx.beginPath();
        ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.shadowBlur = 0;

    // Update score
    const scoreEl = document.getElementById("score-value");
    if (scoreEl) {
      scoreEl.textContent = state.score.toString();
    }
  }

  private drawGameOver() {
    const { ctx, canvas } = this;
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff4444";
    ctx.font = `bold ${Math.min(40, canvas.width / 8)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);

    ctx.fillStyle = "#ccc";
    ctx.font = `${Math.min(18, canvas.width / 18)}px sans-serif`;
    ctx.fillText("Press New Game to restart", canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = "start";
  }

  destroy() {
    if (this.intervalId !== null) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }
}
