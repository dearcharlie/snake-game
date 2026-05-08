import { SnakeGame, type Direction } from "./game";

let game: SnakeGame | null = null;
let started = false;

function init() {
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;

  game = new SnakeGame(canvas);

  document.getElementById("btn-new-game")?.addEventListener("click", async () => {
    started = true;
    const btn = document.getElementById("btn-pause");
    if (btn) btn.textContent = "Pause";
    await game?.start();
  });

  document.getElementById("btn-pause")?.addEventListener("click", () => {
    if (!started) return;
    game?.pause();
  });

  // Touch controls
  document.querySelectorAll(".touch-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!started || !game?.isRunning()) return;
      const dir = (e.currentTarget as HTMLElement).dataset.dir as Direction;
      if (dir) game?.changeDirection(dir);
    });
  });

  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    if (!started || !game?.isRunning()) return;
    const keyMap: Record<string, Direction> = {
      ArrowUp: "Up",
      ArrowDown: "Down",
      ArrowLeft: "Left",
      ArrowRight: "Right",
      w: "Up",
      s: "Down",
      a: "Left",
      d: "Right",
      W: "Up",
      S: "Down",
      A: "Left",
      D: "Right",
    };
    const dir = keyMap[e.key];
    if (dir) {
      e.preventDefault();
      game?.changeDirection(dir);
    }
  });

  // Swipe support for mobile
  let touchStartX = 0;
  let touchStartY = 0;

  canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  canvas.addEventListener("touchend", (e) => {
    if (!started || !game?.isRunning()) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

    let dir: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? "Right" : "Left";
    } else {
      dir = dy > 0 ? "Down" : "Up";
    }
    game?.changeDirection(dir);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
