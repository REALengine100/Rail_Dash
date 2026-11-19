import { HudSnapshot } from "../game/runnerEngine";

export interface HudCallbacks {
  onRestart: () => void;
  onToggleMute: () => boolean;
}

export class HudOverlay {
  private root: HTMLDivElement;
  private scoreEl: HTMLSpanElement;
  private coinsEl: HTMLSpanElement;
  private muteBtn: HTMLButtonElement;
  private gameOverModal: HTMLDivElement;
  private finalScoreEl: HTMLParagraphElement;
  private finalCoinsEl: HTMLParagraphElement;

  constructor(container: HTMLElement, callbacks: HudCallbacks) {
    this.root = document.createElement("div");
    this.root.style.position = "fixed";
    this.root.style.inset = "0";
    this.root.style.pointerEvents = "none";
    this.root.style.fontFamily = "system-ui, -apple-system, sans-serif";
    this.root.style.color = "#f8fafc";
    this.root.style.zIndex = "10";

    const topBar = document.createElement("div");
    topBar.style.display = "flex";
    topBar.style.justifyContent = "space-between";
    topBar.style.alignItems = "center";
    topBar.style.padding = "14px 16px";

    const statsBox = document.createElement("div");
    statsBox.style.display = "flex";
    statsBox.style.gap = "10px";

    const scoreBadge = document.createElement("div");
    scoreBadge.style.background = "rgba(15, 23, 42, 0.75)";
    scoreBadge.style.border = "1px solid rgba(148, 163, 184, 0.25)";
    scoreBadge.style.borderRadius = "12px";
    scoreBadge.style.padding = "8px 12px";
    scoreBadge.style.fontWeight = "700";
    scoreBadge.innerHTML = `SCORE: `;
    this.scoreEl = document.createElement("span");
    this.scoreEl.textContent = "0";
    scoreBadge.appendChild(this.scoreEl);

    const coinBadge = document.createElement("div");
    coinBadge.style.background = "rgba(15, 23, 42, 0.75)";
    coinBadge.style.border = "1px solid rgba(250, 204, 21, 0.35)";
    coinBadge.style.borderRadius = "12px";
    coinBadge.style.padding = "8px 12px";
    coinBadge.style.fontWeight = "700";
    coinBadge.style.color = "#fde047";
    coinBadge.innerHTML = `COINS: `;
    this.coinsEl = document.createElement("span");
    this.coinsEl.textContent = "0";
    coinBadge.appendChild(this.coinsEl);

    statsBox.appendChild(scoreBadge);
    statsBox.appendChild(coinBadge);

    this.muteBtn = document.createElement("button");
    this.muteBtn.type = "button";
    this.muteBtn.textContent = "SOUND: ON";
    this.muteBtn.style.pointerEvents = "auto";
    this.muteBtn.style.background = "rgba(30, 41, 59, 0.85)";
    this.muteBtn.style.color = "#f8fafc";
    this.muteBtn.style.border = "1px solid rgba(148, 163, 184, 0.35)";
    this.muteBtn.style.borderRadius = "12px";
    this.muteBtn.style.padding = "8px 12px";
    this.muteBtn.style.fontWeight = "700";
    this.muteBtn.style.cursor = "pointer";
    this.muteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isMuted = callbacks.onToggleMute();
      this.muteBtn.textContent = isMuted ? "SOUND: OFF" : "SOUND: ON";
    });

    topBar.appendChild(statsBox);
    topBar.appendChild(this.muteBtn);
    this.root.appendChild(topBar);

    this.gameOverModal = document.createElement("div");
    this.gameOverModal.style.position = "fixed";
    this.gameOverModal.style.inset = "0";
    this.gameOverModal.style.display = "none";
    this.gameOverModal.style.flexDirection = "column";
    this.gameOverModal.style.alignItems = "center";
    this.gameOverModal.style.justifyContent = "center";
    this.gameOverModal.style.background = "rgba(2, 6, 23, 0.72)";
    this.gameOverModal.style.pointerEvents = "auto";

    const card = document.createElement("div");
    card.style.background = "#1e293b";
    card.style.border = "1px solid rgba(148, 163, 184, 0.25)";
    card.style.borderRadius = "18px";
    card.style.padding = "24px 28px";
    card.style.textAlign = "center";
    card.style.minWidth = "240px";

    const title = document.createElement("h2");
    title.textContent = "GAME OVER";
    title.style.margin = "0 0 12px 0";
    title.style.color = "#f87171";

    this.finalScoreEl = document.createElement("p");
    this.finalScoreEl.style.margin = "6px 0";
    this.finalScoreEl.style.fontSize = "16px";

    this.finalCoinsEl = document.createElement("p");
    this.finalCoinsEl.style.margin = "6px 0 18px 0";
    this.finalCoinsEl.style.fontSize = "16px";
    this.finalCoinsEl.style.color = "#fde047";

    const restartBtn = document.createElement("button");
    restartBtn.type = "button";
    restartBtn.textContent = "PLAY AGAIN";
    restartBtn.style.background = "#22c55e";
    restartBtn.style.color = "#052e16";
    restartBtn.style.border = "none";
    restartBtn.style.borderRadius = "12px";
    restartBtn.style.padding = "12px 22px";
    restartBtn.style.fontSize = "15px";
    restartBtn.style.fontWeight = "800";
    restartBtn.style.cursor = "pointer";
    restartBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      callbacks.onRestart();
    });

    card.appendChild(title);
    card.appendChild(this.finalScoreEl);
    card.appendChild(this.finalCoinsEl);
    card.appendChild(restartBtn);
    this.gameOverModal.appendChild(card);
    this.root.appendChild(this.gameOverModal);

    container.appendChild(this.root);
  }

  public update(hud: HudSnapshot): void {
    this.scoreEl.textContent = String(hud.score);
    this.coinsEl.textContent = String(hud.coins);

    if (hud.state === "gameover") {
      this.finalScoreEl.textContent = `Final Score: ${hud.score}`;
      this.finalCoinsEl.textContent = `Coins Collected: ${hud.coins}`;
      this.gameOverModal.style.display = "flex";
    } else {
      this.gameOverModal.style.display = "none";
    }
  }

  public dispose(): void {
    this.root.remove();
  }
}
