"use client";

import { useEffect, useRef, useState } from "react";
import {
  clearStoredProfile,
  exportRuntimeProfile,
  importRuntimeProfile,
  loadStoredProfile,
  profileToBootConfig,
  saveStoredProfile,
  sanitizeRuntimeProfile,
} from "@/lib/profile-store";
import {
  bootRuntimeBridge,
  dispatchUiIntent,
  getRuntimeSnapshot,
  sanitizeRuntimeBootConfig,
  subscribeRuntimeEvents,
} from "@/lib/web-bridge";
import {
  DEFAULT_RUNTIME_PROFILE,
} from "@/lib/types";
import type {
  RuntimeBootConfig,
  RuntimeBootRecord,
  RuntimeProfile,
  RuntimeSnapshot,
} from "@/lib/types";

const STORAGE_KEY = "bevy-hybrid-game-template.launcher.v1";

type ControlKey = "up" | "down" | "left" | "right";

type ControlState = Record<ControlKey, boolean>;

const DEFAULT_CONTROL_STATE: ControlState = {
  up: false,
  down: false,
  left: false,
  right: false,
};

export function GameShell() {
  const [clientReady, setClientReady] = useState(false);
  const [runtimeSnapshot, setRuntimeSnapshot] =
    useState<RuntimeSnapshot>(getRuntimeSnapshot);
  const [controls, setControls] = useState<ControlState>(DEFAULT_CONTROL_STATE);
  const [profile, setProfile] = useState<RuntimeProfile>(DEFAULT_RUNTIME_PROFILE);
  const [profileDraft, setProfileDraft] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const lastSceneReadyEventId = useRef<number | null>(null);

  useEffect(() => {
    const storedProfile = loadStoredProfile();
    setProfile(storedProfile);

    const initialConfig = readStoredBootConfig(storedProfile);
    setRuntimeSnapshot(
      bootRuntimeBridge({
        initialConfig,
      }),
    );
    setClientReady(true);

    const unsubscribe = subscribeRuntimeEvents((event) => {
      setRuntimeSnapshot(event.snapshot);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(runtimeSnapshot.bootConfig),
      );
    } catch {}
  }, [runtimeSnapshot.bootConfig]);

  useEffect(() => {
    setProfile((current) => {
      const next = sanitizeRuntimeProfile({
        ...current,
        preferredPlayerName: runtimeSnapshot.bootConfig.playerName,
        preferredTouchControls: runtimeSnapshot.bootConfig.touchControls,
        updatedAt: new Date().toISOString(),
      });

      saveStoredProfile(next);
      return next;
    });
  }, [runtimeSnapshot.bootConfig.playerName, runtimeSnapshot.bootConfig.touchControls]);

  useEffect(() => {
    const currentBoot = runtimeSnapshot.boot.current;

    if (
      currentBoot.phase !== "scene-ready" ||
      currentBoot.id === lastSceneReadyEventId.current
    ) {
      return;
    }

    lastSceneReadyEventId.current = currentBoot.id;

    setProfile((current) => {
      const next = sanitizeRuntimeProfile({
        ...current,
        runsLaunched: current.runsLaunched + 1,
        updatedAt: new Date().toISOString(),
      });
      saveStoredProfile(next);
      return next;
    });
  }, [runtimeSnapshot.boot.current]);

  useEffect(() => {
    if (!runtimeSnapshot.world.ready) {
      return;
    }

    setProfile((current) => {
      const next = sanitizeRuntimeProfile({
        ...current,
        lastScore: runtimeSnapshot.world.slice.score,
        lastRound: runtimeSnapshot.world.slice.round,
        lastCaptured: runtimeSnapshot.world.slice.captured,
        bestScore: Math.max(current.bestScore, runtimeSnapshot.world.slice.score),
        bestRound: Math.max(current.bestRound, runtimeSnapshot.world.slice.round),
        updatedAt: new Date().toISOString(),
      });

      if (profilesEqual(current, next)) {
        return current;
      }

      saveStoredProfile(next);
      return next;
    });
  }, [
    runtimeSnapshot.world.ready,
    runtimeSnapshot.world.slice.score,
    runtimeSnapshot.world.slice.round,
    runtimeSnapshot.world.slice.captured,
  ]);

  useEffect(() => {
    void dispatchUiIntent({
      type: "runtime.virtual-input.set",
      input: {
        x: Number(controls.right) - Number(controls.left),
        y: Number(controls.up) - Number(controls.down),
      },
    });
  }, [controls]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const control = controlKeyFromKeyboard(event.key);

      if (!control) {
        return;
      }

      event.preventDefault();
      setControlPressed(control, true);
    }

    function handleKeyUp(event: KeyboardEvent) {
      const control = controlKeyFromKeyboard(event.key);

      if (!control) {
        return;
      }

      event.preventDefault();
      setControlPressed(control, false);
    }

    function releaseControls() {
      setControls((current) =>
        Object.values(current).some(Boolean) ? DEFAULT_CONTROL_STATE : current,
      );
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", releaseControls);
    window.addEventListener("pagehide", releaseControls);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", releaseControls);
      window.removeEventListener("pagehide", releaseControls);
    };
  }, []);

  function setLauncherConfig<K extends keyof RuntimeBootConfig>(
    key: K,
    value: RuntimeBootConfig[K],
  ) {
    void dispatchUiIntent({
      type: "runtime.boot-config.patch",
      patch: {
        [key]: value,
      },
    });
  }

  function setControlPressed(control: ControlKey, pressed: boolean) {
    setControls((current) =>
      current[control] === pressed
        ? current
        : {
            ...current,
            [control]: pressed,
          },
    );
  }

  function handleLaunch() {
    void dispatchUiIntent({
      type: "runtime.boot",
    });
  }

  async function handleCopyProfile() {
    const raw = exportRuntimeProfile(profile);
    setProfileDraft(raw);

    try {
      await navigator.clipboard.writeText(raw);
      setProfileMessage("Profile JSON copied to clipboard.");
    } catch {
      setProfileMessage("Profile JSON prepared below. Copy manually if needed.");
    }
  }

  function handleImportProfile() {
    try {
      const imported = importRuntimeProfile(profileDraft);
      const next = sanitizeRuntimeProfile({
        ...imported,
        updatedAt: new Date().toISOString(),
      });

      setProfile(next);
      saveStoredProfile(next);
      setProfileMessage("Profile imported from JSON.");
      void dispatchUiIntent({
        type: "runtime.boot-config.patch",
        patch: profileToBootConfig(next),
      });
    } catch {
      setProfileMessage("Profile import failed. Check the JSON payload.");
    }
  }

  function handleResetProfile() {
    const next = sanitizeRuntimeProfile({
      updatedAt: new Date().toISOString(),
    });

    setProfile(next);
    clearStoredProfile();
    saveStoredProfile(next);
    setProfileDraft("");
    setProfileMessage("Profile reset to template defaults.");
    void dispatchUiIntent({
      type: "runtime.boot-config.patch",
      patch: profileToBootConfig(next),
    });
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div>
          <div className="eyebrow">Template</div>
          <h1 className="title">Next.js + Bevy WASM</h1>
          <p className="muted">
            React owns the shell. Bevy owns the canvas runtime. Native still uses
            the same Rust crate.
          </p>
        </div>

        <section className="panel">
          <label className="label">
            Player Name
            <input
              type="text"
              value={runtimeSnapshot.bootConfig.playerName}
              onChange={(event) =>
                setLauncherConfig("playerName", event.target.value)
              }
              maxLength={16}
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={runtimeSnapshot.bootConfig.touchControls}
              onChange={(event) =>
                setLauncherConfig("touchControls", event.target.checked)
              }
            />
            Touch HUD enabled
          </label>

          <button className="button" onClick={handleLaunch} disabled={!clientReady}>
            Launch Runtime
          </button>
        </section>

        <section className="panel">
          <div className="eyebrow">Status</div>
          <div>{renderBootRecord(runtimeSnapshot.boot.current)}</div>
          <div className="muted">
            Controls: WASD / arrow keys, or the touch pad on the right.
          </div>
          <div className="muted">
            Runtime active: {runtimeSnapshot.runtimeActive ? "yes" : "no"}
          </div>
          <div className="muted">
            Player: {runtimeSnapshot.world.player?.name ?? runtimeSnapshot.bootConfig.playerName}
          </div>
          <div className="muted">
            Position:{" "}
            {runtimeSnapshot.world.player
              ? `${runtimeSnapshot.world.player.x.toFixed(1)}, ${runtimeSnapshot.world.player.y.toFixed(1)}`
              : "waiting"}
          </div>
          <div className="muted">
            Objective: {runtimeSnapshot.world.slice.objective}
          </div>
          <div className="muted">
            Slice status: {runtimeSnapshot.world.slice.status}
          </div>
        </section>

        <section className="panel">
          <div className="eyebrow">Starter Slice</div>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-label">Score</span>
              <strong>{runtimeSnapshot.world.slice.score}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Loop</span>
              <strong>{runtimeSnapshot.world.slice.round}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Uplinks</span>
              <strong>
                {runtimeSnapshot.world.slice.captured}/{runtimeSnapshot.world.slice.total}
              </strong>
            </div>
          </div>
          <div className="muted">
            {runtimeSnapshot.world.slice.completed
              ? "Sweep complete. Resetting loop."
              : "Capture each uplink pad to drive shell-visible state."}
          </div>
        </section>

        <section className="panel">
          <div className="eyebrow">Profile Save</div>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-label">Runs</span>
              <strong>{profile.runsLaunched}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Best Score</span>
              <strong>{profile.bestScore}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Best Loop</span>
              <strong>{profile.bestRound}</strong>
            </div>
          </div>
          <div className="muted">
            Last run: {profile.lastScore} score, loop {profile.lastRound}, uplinks{" "}
            {profile.lastCaptured}
          </div>
          <div className="muted">
            {profile.updatedAt
              ? `Updated ${new Date(profile.updatedAt).toLocaleString()}`
              : "No persisted profile yet."}
          </div>
          <div className="action-row">
            <button className="button secondary" onClick={() => void handleCopyProfile()}>
              Copy Save JSON
            </button>
            <button className="button secondary" onClick={handleImportProfile}>
              Load Save JSON
            </button>
            <button className="button secondary" onClick={handleResetProfile}>
              Reset Save
            </button>
          </div>
          <label className="label">
            Profile JSON
            <textarea
              className="profile-textarea"
              value={profileDraft}
              onChange={(event) => setProfileDraft(event.target.value)}
              placeholder="Exported profile JSON appears here. Paste a profile payload to import."
              rows={8}
            />
          </label>
          {profileMessage ? <div className="muted">{profileMessage}</div> : null}
        </section>

        <section className="panel">
          <div className="eyebrow">Boot History</div>
          <ol className="history">
            {[...runtimeSnapshot.boot.history].reverse().map((record) => (
              <li key={record.id}>{renderBootRecord(record)}</li>
            ))}
          </ol>
        </section>
      </aside>

      <section className="canvas-area">
        <div className="canvas-frame">
          <canvas id="bevy-runtime-canvas" />
          <div className="hud">
            <div className="hud-card">
              <div className="eyebrow">Projection</div>
              <div>{runtimeSnapshot.world.ready ? "ready" : "booting"}</div>
            </div>

            <div className="hud-card objective-card">
              <div className="eyebrow">Live Slice</div>
              <div className="objective-title">
                {runtimeSnapshot.world.slice.captured}/{runtimeSnapshot.world.slice.total} uplinks
              </div>
              <div className="muted">{runtimeSnapshot.world.slice.status}</div>
            </div>

            {runtimeSnapshot.bootConfig.touchControls ? (
              <div className="touch-card">
                <div className="eyebrow">Touch Controls</div>
                <div className="touch-grid">
                  <button
                    className="touch-button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      setControlPressed("up", true);
                    }}
                    onPointerUp={() => setControlPressed("up", false)}
                    onPointerCancel={() => setControlPressed("up", false)}
                    onPointerLeave={() => setControlPressed("up", false)}
                  >
                    Up
                  </button>
                  <button
                    className="touch-button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      setControlPressed("left", true);
                    }}
                    onPointerUp={() => setControlPressed("left", false)}
                    onPointerCancel={() => setControlPressed("left", false)}
                    onPointerLeave={() => setControlPressed("left", false)}
                  >
                    Left
                  </button>
                  <button
                    className="touch-button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      setControlPressed("right", true);
                    }}
                    onPointerUp={() => setControlPressed("right", false)}
                    onPointerCancel={() => setControlPressed("right", false)}
                    onPointerLeave={() => setControlPressed("right", false)}
                  >
                    Right
                  </button>
                  <button
                    className="touch-button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      setControlPressed("down", true);
                    }}
                    onPointerUp={() => setControlPressed("down", false)}
                    onPointerCancel={() => setControlPressed("down", false)}
                    onPointerLeave={() => setControlPressed("down", false)}
                  >
                    Down
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function readStoredBootConfig(profile: RuntimeProfile): Partial<RuntimeBootConfig> | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return profileToBootConfig(profile);
    }

    return sanitizeRuntimeBootConfig(JSON.parse(raw));
  } catch {
    return profileToBootConfig(profile);
  }
}

function controlKeyFromKeyboard(key: string): ControlKey | null {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      return "up";
    case "ArrowDown":
    case "s":
    case "S":
      return "down";
    case "ArrowLeft":
    case "a":
    case "A":
      return "left";
    case "ArrowRight":
    case "d":
    case "D":
      return "right";
    default:
      return null;
  }
}

function renderBootRecord(record: RuntimeBootRecord) {
  return `${record.phase} · ${record.message}`;
}

function profilesEqual(left: RuntimeProfile, right: RuntimeProfile) {
  return (
    left.version === right.version &&
    left.preferredPlayerName === right.preferredPlayerName &&
    left.preferredTouchControls === right.preferredTouchControls &&
    left.runsLaunched === right.runsLaunched &&
    left.bestScore === right.bestScore &&
    left.bestRound === right.bestRound &&
    left.lastScore === right.lastScore &&
    left.lastRound === right.lastRound &&
    left.lastCaptured === right.lastCaptured &&
    left.updatedAt === right.updatedAt
  );
}
