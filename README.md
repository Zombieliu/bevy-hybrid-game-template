# Bevy Hybrid Game Template

Reusable game starter for teams that want one Rust gameplay/runtime crate shared
across:

- native Bevy builds
- `Next.js` product shell / launcher / HUD
- `Bevy WASM` embedded into a web or PWA surface

## What It Is

This template is opinionated about ownership boundaries:

- `React / Next.js` owns product UI, launcher flows, PWA shell, account UI, and overlays
- `Bevy` owns the canvas runtime
- the same Rust crate powers both native and web targets

The web build targets static export, so the shell can be deployed to GitHub
Pages, Netlify, Cloudflare Pages, or any other static host after `pnpm build`.

If you plan to publish this repo as your own GitHub template, follow the rename
and packaging checklist in [`TEMPLATE_SETUP.md`](./TEMPLATE_SETUP.md).

## Why This Template

Use this when you want:

- a browser-first game shell without giving up native builds
- React-owned menus and product UX around a Bevy runtime
- one reusable runtime bootstrap instead of separate native and web app setup
- a visible starter scene that proves the runtime is alive on first launch

If you only need a pure Bevy web build with no React/PWA shell, use a simpler
web-first setup elsewhere. This repo is specifically for `Next.js + embedded
Bevy runtime`.

## What You Get

- native Bevy runner with `cargo run`
- `wasm-pack` build path for the Bevy runtime
- `Next.js` app shell in [`apps/web`](./apps/web)
- shared Rust bootstrap for both native and web entrypoints
- a visible starter scene that proves the runtime is live on first launch
- minimal shell-to-runtime bridge:
  - boot status sink
  - runtime event sink
  - runtime session config
  - virtual input forwarding
- mobile/release packaging scaffolding from the original Bevy template

## Quick Start

### Prerequisites

- `rustup`
- `wasm-pack`
- `node >= 20`
- `pnpm`

### Run native

```bash
cargo run
```

or

```bash
pnpm native
```

### Run web shell

```bash
pnpm install
pnpm dev
```

This will:

1. build the Rust runtime to `apps/web/public/bevy-runtime/pkg`
2. start the Next.js shell in `apps/web`

Then open:

- `http://127.0.0.1:3000`

The starter slice should boot into a visible arena with a movable player marker.

### Build web shell

```bash
pnpm build
```

Static output is written to `apps/web/out`.

If you deploy under a subpath, set `NEXT_PUBLIC_BASE_PATH=/your-path` before
`pnpm build`. The GitHub Pages workflow does this automatically for project
pages repos.

### Build only the wasm runtime

```bash
pnpm runtime:build:dev
pnpm runtime:build:release
```

## Shared Runtime Bootstrap

Both native and web now use the same app bootstrap in
[`src/runtime_app.rs`](./src/runtime_app.rs).

- native uses `build_native_app()`
- web uses `build_web_app(RuntimeConfig)`
- both share the same `GamePlugin`, starter scene, asset loading, and runtime config surface

This is the part you keep if you want the template to stay commercially reusable:
your platform shell changes, but the gameplay/runtime crate and startup contract stay the same.

## Starter Scene

The default visible slice now lives in [`src/starter_scene.rs`](./src/starter_scene.rs).

- it creates the default camera
- it spawns a simple arena/backdrop and a visible player marker
- it gives you a clean place to swap in your own board, map, or combat slice later

If you start a real project, replace the starter scene plugin first, not the web bridge.

## Use As GitHub Template

1. Push this repo to your GitHub account
2. Open `Settings -> General`
3. Enable `Template repository`
4. Use GitHub's `Use this template` flow for each new project

When you create a new game from this template, start with
[`TEMPLATE_SETUP.md`](./TEMPLATE_SETUP.md) before changing gameplay code.

## Repository Shape

- [`src`](./src)
  shared Rust game/runtime code used by native and web
- [`src/runtime_app.rs`](./src/runtime_app.rs)
  shared native/web app bootstrap and window setup
- [`src/starter_scene.rs`](./src/starter_scene.rs)
  generic visible runtime starter slice
- [`apps/web`](./apps/web)
  Next.js shell that dynamically imports the generated wasm package
- [`scripts/build-bevy-runtime.sh`](./scripts/build-bevy-runtime.sh)
  `wasm-pack` wrapper that writes into the web app's public runtime directory and mirrors runtime assets
- [`assets`](./assets)
  shared runtime assets
- [`build`](./build)
  native packaging assets from the original template

## When To Keep This Template

Use this template when your game needs:

- a browser-first product shell
- React-owned menus or HUD
- native builds that still share the same gameplay/runtime crate

## CI And Deployment

- GitHub CI now validates both the Rust crate and the web shell
- GitHub Pages deployment uses the exported `apps/web/out` artifact
- GitHub release web artifacts zip the same exported static site

## Updating the icons
 1. Replace `build/macos/icon_1024x1024.png` with a `1024` times `1024` pixel png icon and run `create_icns.sh` or `create_icns_linux.sh` if you use linux (make sure to run the script inside the `build/macos` directory) - _Note: `create_icns.sh` requires a mac, and `create_icns_linux.sh` requires imagemagick and png2icns_
 2. Replace `build/windows/icon.ico` (used for windows executable and as favicon for the web-builds)
    * You can create an `.ico` file for windows by following these steps:
       1. Open `macos/AppIcon.iconset/icon_256x256.png` in [Gimp](https://www.gimp.org/downloads/)
       2. Select the `File > Export As` menu item.
       3. Change the file extension to `.ico` (or click `Select File Type (By Extension)` and select `Microsoft Windows Icon`)
       4. Save as `build/windows/icon.ico`
 3. Replace `build/android/res/mipmap-mdpi/icon.png` with `macos/AppIcon.iconset/icon_256x256.png`, but rename it to `icon.png`

## Deploy mobile platforms

For general info on mobile support, you can take a look at [one of my blog posts about mobile development with Bevy][mobile_dev_with_bevy_2] which is relevant to the current setup.

## Android

Currently, `cargo-apk` is used to run the development app. But APKs can no longer be published in the store and `cargo-apk` cannot produce the required AAB. This is why there is setup for two android related tools. In [`mobile/Cargo.toml`](./mobile/Cargo.toml), the `package.metadata.android` section configures `cargo-apk` while [`mobile/manifest.yaml`](./mobile/manifest.yaml) configures a custom fork of `xbuild` which is used in the `release-android-google-play` workflow to create an AAB.

There is a [post about how to set up the android release workflow][workflow_bevy_android] on my blog.

## iOS

The setup is pretty much what Bevy does for the mobile example.

There is a [post about how to set up the iOS release workflow][workflow_bevy_ios] on my blog.

## Removing mobile platforms

If you don't want to target Android or iOS, you can just delete the `/mobile`, `/build/android`, and `/build/ios` directories.
Then delete the `[workspace]` section from `Cargo.toml`.

## Development environments

## Nix Support

nixgl is only used on non-NixOS Linux systems;
when running there we need to use the `--impure` flag:

```
nix develop --impure
```

If using nixgl, then .e.g. `gl cargo run`, other use
`cargo` as usual.

## Getting started with Bevy

You should check out the Bevy website for [links to resources][bevy-learn] and the [Bevy Cheat Book] for a bunch of helpful documentation and examples. I can also recommend the [official Bevy Discord server][bevy-discord] for keeping up to date with the development and getting help from other Bevy users.

## Known issues

Audio in web-builds can have issues in some browsers. This seems to be a general performance issue and not due to the audio itself (see [bevy_kira_audio/#9][firefox-sound-issue]).

## License

This project is licensed under [CC0 1.0 Universal](LICENSE) except some content of `assets` and the Bevy icons in the `build` directory (see [Credits](credits/CREDITS.md)). Go crazy and feel free to show me whatever you build with this ([@nikl_me][nikl-twitter] / [@nikl_me@mastodon.online][nikl-mastodon] ).

[bevy]: https://bevyengine.org/
[bevy-learn]: https://bevyengine.org/learn/
[bevy-discord]: https://discord.gg/bevy
[nikl-twitter]: https://twitter.com/nikl_me
[nikl-mastodon]: https://mastodon.online/@nikl_me
[firefox-sound-issue]: https://github.com/NiklasEi/bevy_kira_audio/issues/9
[Bevy Cheat Book]: https://bevy-cheatbook.github.io/introduction.html
[trunk]: https://trunkrs.dev/
[android-instructions]: https://github.com/bevyengine/bevy/blob/latest/examples/README.md#setup
[ios-instructions]: https://github.com/bevyengine/bevy/blob/latest/examples/README.md#setup-1
[mobile_dev_with_bevy_2]: https://www.nikl.me/blog/2023/notes_on_mobile_development_with_bevy_2/
[workflow_bevy_android]: https://www.nikl.me/blog/2023/github_workflow_to_publish_android_app/
[workflow_bevy_ios]: https://www.nikl.me/blog/2023/github_workflow_to_publish_ios_app/
