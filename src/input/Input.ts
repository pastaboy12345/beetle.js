import { Vector2 } from '../math/Vector2';

export class Input {
  private keysDown: Set<string> = new Set();
  private keysPressedThisFrame: Set<string> = new Set();
  private keysReleasedThisFrame: Set<string> = new Set();
  
  public mousePosition: Vector2 = new Vector2(0, 0);
  private mouseButtonsDown: Set<number> = new Set();
  private mouseButtonsPressedThisFrame: Set<number> = new Set();

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  // Keyboard helper functions
  isKeyDown(key: string): boolean {
    return this.keysDown.has(key.toLowerCase());
  }

  isKeyPressed(key: string): boolean {
    return this.keysPressedThisFrame.has(key.toLowerCase());
  }

  isKeyUp(key: string): boolean {
    return this.keysReleasedThisFrame.has(key.toLowerCase());
  }

  // Mouse helper functions
  isMouseButtonDown(button: number): boolean {
    return this.mouseButtonsDown.has(button);
  }

  isMouseButtonPressed(button: number): boolean {
    return this.mouseButtonsPressedThisFrame.has(button);
  }

  clearFrame(): void {
    this.keysPressedThisFrame.clear();
    this.keysReleasedThisFrame.clear();
    this.mouseButtonsPressedThisFrame.clear();
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    if (!this.keysDown.has(key)) {
      this.keysPressedThisFrame.add(key);
    }
    this.keysDown.add(key);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    this.keysDown.delete(key);
    this.keysReleasedThisFrame.add(key);
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePosition.x = e.clientX - rect.left;
    this.mousePosition.y = e.clientY - rect.top;
  };

  private handleMouseDown = (e: MouseEvent): void => {
    if (!this.mouseButtonsDown.has(e.button)) {
      this.mouseButtonsPressedThisFrame.add(e.button);
    }
    this.mouseButtonsDown.add(e.button);
  };

  private handleMouseUp = (e: MouseEvent): void => {
    this.mouseButtonsDown.delete(e.button);
  };
}
