# Headless Backend Reference

This crate is an optional reference backend for the hybrid template.

It is intentionally not required by the main web/native runtime path.

## What It Does

- runs a minimal headless Bevy app loop
- keeps authoritative in-memory profile/session state in Bevy resources
- exposes a small HTTP contract for local development

## Endpoints

- `GET /health`
- `GET /snapshot`
- `GET /profiles`
- `GET /profiles/:slot_id`
- `PUT /profiles/:slot_id`
- `GET /sessions`
- `POST /sessions`
- `PATCH /sessions/:session_id`

## Run It

```bash
cargo run --manifest-path server/headless_runtime/Cargo.toml
```

or

```bash
pnpm backend:dev
```

Default address:

```text
http://127.0.0.1:8787
```

Override the port with `HEADLESS_BACKEND_PORT`.

## Why It Exists

Use this crate when you want to evolve from:

- local-first save/session state in the shell

to:

- cloud save
- room/session orchestration
- a headless authority path for multiplayer or remote persistence

It is a reference path, not a mandatory dependency.
