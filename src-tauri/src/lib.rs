mod game;

use game::GameState;
use std::sync::Mutex;
use tauri::State;

struct AppState {
    game: Mutex<GameState>,
}

#[tauri::command]
fn new_game(state: State<AppState>, grid_width: i32, grid_height: i32) -> GameState {
    let game = GameState::new(grid_width, grid_height);
    let mut locked = state.game.lock().unwrap();
    *locked = game.clone();
    game
}

#[tauri::command]
fn change_direction(state: State<AppState>, direction: game::Direction) -> GameState {
    let mut locked = state.game.lock().unwrap();
    locked.set_direction(direction);
    locked.clone()
}

#[tauri::command]
fn tick(state: State<AppState>) -> GameState {
    let mut locked = state.game.lock().unwrap();
    locked.tick();
    locked.clone()
}

#[tauri::command]
fn get_state(state: State<AppState>) -> GameState {
    let locked = state.game.lock().unwrap();
    locked.clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_state = GameState::new(20, 20);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            game: Mutex::new(initial_state),
        })
        .invoke_handler(tauri::generate_handler![
            new_game,
            change_direction,
            tick,
            get_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
