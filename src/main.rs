// disable console on windows for release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bevy_hybrid_game::build_native_app;

fn main() {
    build_native_app().run();
}
