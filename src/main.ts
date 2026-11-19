import { SoundEngine } from "./audio/soundEngine";
import { RunnerEngine } from "./game/runnerEngine";
import { HudOverlay } from "./ui/hudOverlay";

const container = document.getElementById("app");
if (!container) {
  throw new Error("#app container not found");
}

const sound = new SoundEngine();
let engine: RunnerEngine | null = null;

const hud = new HudOverlay(container, {
  onRestart: () => {
    engine?.restart();
  },
  onToggleMute: () => {
    sound.muted = !sound.muted;
    return sound.muted;
  },
});

engine = new RunnerEngine(container, sound, (snapshot) => {
  hud.update(snapshot);
});
