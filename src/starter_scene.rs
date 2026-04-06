use crate::GameState;
use crate::loading::TextureAssets;
use crate::player::Player;
use bevy::prelude::*;

pub struct StarterScenePlugin;

#[derive(Resource, Clone, Debug)]
pub struct StarterSceneConfig {
    pub arena_size: Vec2,
    pub player_size: Vec2,
    pub beacon_positions: [Vec2; 4],
}

impl Default for StarterSceneConfig {
    fn default() -> Self {
        Self {
            arena_size: Vec2::new(1280.0, 720.0),
            player_size: Vec2::splat(96.0),
            beacon_positions: [
                Vec2::new(-420.0, -220.0),
                Vec2::new(420.0, -220.0),
                Vec2::new(-420.0, 220.0),
                Vec2::new(420.0, 220.0),
            ],
        }
    }
}

impl Plugin for StarterScenePlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<StarterSceneConfig>()
            .add_systems(OnEnter(GameState::Playing), spawn_starter_scene);
    }
}

fn spawn_starter_scene(
    mut commands: Commands,
    scene: Res<StarterSceneConfig>,
    textures: Res<TextureAssets>,
) {
    commands.spawn((Camera2d, Name::new("RuntimeCamera")));

    commands.spawn((
        Sprite::from_color(
            Color::linear_rgba(0.06, 0.11, 0.15, 0.92),
            scene.arena_size,
        ),
        Transform::from_translation(Vec3::new(0.0, 0.0, -10.0)),
        Name::new("ArenaBackdrop"),
    ));

    commands.spawn((
        Sprite::from_color(
            Color::linear_rgba(0.39, 0.87, 0.78, 0.15),
            Vec2::new(scene.arena_size.x - 128.0, 4.0),
        ),
        Transform::from_translation(Vec3::new(0.0, 0.0, -8.0)),
        Name::new("CenterLine"),
    ));

    commands.spawn((
        Sprite::from_color(
            Color::linear_rgba(0.40, 0.78, 0.92, 0.12),
            Vec2::new(scene.arena_size.x - 64.0, scene.arena_size.y - 64.0),
        ),
        Transform::from_translation(Vec3::new(0.0, 0.0, -9.0)),
        Name::new("ArenaFrame"),
    ));

    for beacon in scene.beacon_positions {
        commands.spawn((
            Sprite::from_color(
                Color::linear_rgba(0.55, 0.88, 0.78, 0.20),
                Vec2::new(120.0, 120.0),
            ),
            Transform::from_translation(beacon.extend(-5.0)),
            Name::new("BeaconPad"),
        ));
    }

    commands
        .spawn((
            Sprite::from_color(
                Color::linear_rgba(0.74, 0.89, 0.56, 0.95),
                scene.player_size,
            ),
            Transform::from_translation(Vec3::new(0.0, 0.0, 1.0)),
            Player,
            Name::new("Player"),
        ))
        .with_children(|parent| {
            parent.spawn((
                Sprite::from_image(textures.bevy.clone()),
                Transform::from_scale(Vec3::splat(0.24)).with_translation(Vec3::new(0.0, 0.0, 1.0)),
                Name::new("PlayerMark"),
            ));
        });
}
