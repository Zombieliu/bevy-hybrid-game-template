# Template Setup Checklist

Use this after creating a new repo from the template.

## 1. Rename Runtime Identity

- Update the root crate name in `Cargo.toml`
- Update `use bevy_hybrid_game::...` imports in `src/main.rs` and `mobile/src/lib.rs`
- Update release executable names in `.github/workflows/release.yaml`
- Update Android package / apk labels in `mobile/Cargo.toml` and `mobile/manifest.yaml`
- Update macOS bundle strings in `build/macos/src/Game.app/Contents/Info.plist`
- Update Windows installer metadata in `build/windows/installer/Package.wxs`

## 2. Replace Template Branding

- Update the browser metadata in `apps/web/app/layout.tsx`
- Update the shell copy in `apps/web/components/game-shell.tsx`
- Replace app icons in `build/` and `mobile/ios-src/Assets.xcassets/`
- Replace the default starter scene in `src/starter_scene.rs`

## 3. Set Repo Metadata

- Add your GitHub repo URL to `Cargo.toml`
- Update `LICENSE` if you do not want to keep `CC0-1.0`
- Rewrite the first section of `README.md` for your game or studio

## 4. Verify Both Targets

```bash
pnpm install
pnpm dev
pnpm build
cargo run
```

## 5. Enable GitHub Template Mode

After pushing to your personal GitHub repo:

1. Open `Settings`
2. Open `General`
3. Enable `Template repository`

That gives you the standard GitHub "Use this template" flow for future projects.
