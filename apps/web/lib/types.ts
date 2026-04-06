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
};
