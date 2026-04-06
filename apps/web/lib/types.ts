export type RuntimeBootPhase =
  | "idle"
  | "loading-module"
  | "initializing-wasm"
  | "binding-status-sink"
  | "starting-runtime"
  | "runtime-entered"
  | "app-created"
  | "plugins-configured"
  | "running"
  | "scene-ready"
  | "error";

export type RuntimeBootConfig = {
  playerName: string;
  touchControls: boolean;
};

export type VirtualInputState = {
  x: number;
  y: number;
};

export type RuntimeBootRecord = {
  id: number;
  phase: RuntimeBootPhase;
  message: string;
  source: "shell" | "runtime";
  timestamp: number;
};

export type RuntimeProjection = {
  ready: boolean;
  touchControls: boolean;
  player: {
    name: string;
    x: number;
    y: number;
  } | null;
  slice: {
    objective: string;
    status: string;
    score: number;
    captured: number;
    total: number;
    round: number;
    completed: boolean;
  };
};

export type RuntimeSnapshot = {
  boot: {
    current: RuntimeBootRecord;
    history: RuntimeBootRecord[];
  };
  bootConfig: RuntimeBootConfig;
  world: RuntimeProjection;
  input: VirtualInputState;
  runtimeActive: boolean;
};

export type RuntimeProfile = {
  version: 1;
  preferredPlayerName: string;
  preferredTouchControls: boolean;
  runsLaunched: number;
  bestScore: number;
  bestRound: number;
  lastScore: number;
  lastRound: number;
  lastCaptured: number;
  updatedAt: string | null;
};

export type UiIntent =
  | {
      type: "runtime.boot";
      config?: RuntimeBootConfig;
    }
  | {
      type: "runtime.boot-config.patch";
      patch: Partial<RuntimeBootConfig>;
    }
  | {
      type: "runtime.virtual-input.set";
      input: VirtualInputState;
    };

export type RuntimeEvent =
  | {
      type: "bridge.ready";
      snapshot: RuntimeSnapshot;
    }
  | {
      type: "runtime.ready";
      projection: RuntimeProjection;
      snapshot: RuntimeSnapshot;
    }
  | {
      type: "runtime.boot-status.changed";
      record: RuntimeBootRecord;
      snapshot: RuntimeSnapshot;
    }
  | {
      type: "runtime.snapshot.changed";
      reason: "boot-config" | "boot-status" | "input" | "world";
      snapshot: RuntimeSnapshot;
    };

export type RuntimeAdapterEventPayload = {
  origin: "runtime";
  type: "runtime.ready" | "runtime.projection.changed";
  projection: RuntimeProjection;
};

export const DEFAULT_RUNTIME_BOOT_CONFIG: RuntimeBootConfig = {
  playerName: "Pilot",
  touchControls: true,
};

export const DEFAULT_VIRTUAL_INPUT_STATE: VirtualInputState = {
  x: 0,
  y: 0,
};

export const DEFAULT_RUNTIME_PROJECTION: RuntimeProjection = {
  ready: false,
  touchControls: true,
  player: null,
  slice: {
    objective: "Secure each uplink pad once per sweep.",
    status: "Waiting for runtime handoff.",
    score: 0,
    captured: 0,
    total: 4,
    round: 1,
    completed: false,
  },
};

export const DEFAULT_RUNTIME_PROFILE: RuntimeProfile = {
  version: 1,
  preferredPlayerName: DEFAULT_RUNTIME_BOOT_CONFIG.playerName,
  preferredTouchControls: DEFAULT_RUNTIME_BOOT_CONFIG.touchControls,
  runsLaunched: 0,
  bestScore: 0,
  bestRound: 0,
  lastScore: 0,
  lastRound: 0,
  lastCaptured: 0,
  updatedAt: null,
};
