use rand::Rng;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Direction {
    Up,
    Down,
    Left,
    Right,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub snake: Vec<Point>,
    pub food: Point,
    pub direction: Direction,
    pub score: u32,
    pub game_over: bool,
    pub grid_width: i32,
    pub grid_height: i32,
}

impl GameState {
    pub fn new(grid_width: i32, grid_height: i32) -> Self {
        let start_x = grid_width / 2;
        let start_y = grid_height / 2;
        let snake = vec![
            Point { x: start_x, y: start_y },
            Point { x: start_x - 1, y: start_y },
            Point { x: start_x - 2, y: start_y },
        ];

        let mut rng = rand::thread_rng();
        let mut food = Point {
            x: rng.gen_range(0..grid_width),
            y: rng.gen_range(0..grid_height),
        };
        while snake.contains(&food) {
            food = Point {
                x: rng.gen_range(0..grid_width),
                y: rng.gen_range(0..grid_height),
            };
        }

        GameState {
            snake,
            food,
            direction: Direction::Right,
            score: 0,
            game_over: false,
            grid_width,
            grid_height,
        }
    }

    pub fn set_direction(&mut self, new_dir: Direction) {
        let opposite = match (self.direction, new_dir) {
            (Direction::Up, Direction::Down) => true,
            (Direction::Down, Direction::Up) => true,
            (Direction::Left, Direction::Right) => true,
            (Direction::Right, Direction::Left) => true,
            _ => false,
        };
        if !opposite && self.direction != new_dir {
            self.direction = new_dir;
        }
    }

    pub fn tick(&mut self) {
        if self.game_over {
            return;
        }

        let head = self.snake[0];
        let new_head = match self.direction {
            Direction::Up => Point { x: head.x, y: head.y - 1 },
            Direction::Down => Point { x: head.x, y: head.y + 1 },
            Direction::Left => Point { x: head.x - 1, y: head.y },
            Direction::Right => Point { x: head.x + 1, y: head.y },
        };

        let wrapped_head = Point {
            x: (new_head.x + self.grid_width) % self.grid_width,
            y: (new_head.y + self.grid_height) % self.grid_height,
        };

        if self.snake.contains(&wrapped_head) {
            self.game_over = true;
            return;
        }

        self.snake.insert(0, wrapped_head);

        if wrapped_head == self.food {
            self.score += 10;
            self.spawn_food();
        } else {
            self.snake.pop();
        }
    }

    fn spawn_food(&mut self) {
        let mut rng = rand::thread_rng();
        let mut food = Point {
            x: rng.gen_range(0..self.grid_width),
            y: rng.gen_range(0..self.grid_height),
        };
        while self.snake.contains(&food) {
            food = Point {
                x: rng.gen_range(0..self.grid_width),
                y: rng.gen_range(0..self.grid_height),
            };
        }
        self.food = food;
    }
}
