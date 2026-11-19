export type MoveAction = "left" | "right" | "jump" | "slide";

export class InputController {
  private startX = 0;
  private startY = 0;
  private readonly swipeThreshold = 35;
  private onAction: (action: MoveAction) => void;

  constructor(target: HTMLElement, onAction: (action: MoveAction) => void) {
    this.onAction = onAction;
    this.bindEvents(target);
  }

  private handlePointerDown = (e: PointerEvent) => {
    this.startX = e.clientX;
    this.startY = e.clientY;
  };

  private handlePointerUp = (e: PointerEvent) => {
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) < this.swipeThreshold) {
      return;
    }

    if (absX > absY) {
      this.onAction(dx > 0 ? "right" : "left");
    } else {
      this.onAction(dy > 0 ? "slide" : "jump");
    }
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        this.onAction("left");
        break;
      case "ArrowRight":
      case "d":
      case "D":
        this.onAction("right");
        break;
      case "ArrowUp":
      case "w":
      case "W":
      case " ":
        this.onAction("jump");
        break;
      case "ArrowDown":
      case "s":
      case "S":
        this.onAction("slide");
        break;
    }
  };

  private bindEvents(target: HTMLElement) {
    target.addEventListener("pointerdown", this.handlePointerDown);
    target.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("keydown", this.handleKeyDown);
  }

  public dispose(target: HTMLElement) {
    target.removeEventListener("pointerdown", this.handlePointerDown);
    target.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("keydown", this.handleKeyDown);
  }
}
