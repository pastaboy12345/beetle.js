import { Scene } from './Scene';
import { EventEmitter } from './EventEmitter';
import { Input } from '../input/Input';

export class Engine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public events: EventEmitter = new EventEmitter();
  public input: Input;
  
  private currentScene: Scene | null = null;
  private lastTime: number = 0;
  private running: boolean = false;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = context;
    this.input = new Input(this.canvas);
  }

  start(initialScene: Scene): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.switchScene(initialScene);
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.input.destroy();
  }

  switchScene(newScene: Scene): void {
    if (this.currentScene) {
      this.currentScene.onExit();
    }
    this.currentScene = newScene;
    this.currentScene.engine = this;
    this.currentScene.onEnter();
  }

  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  private loop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Cap delta time to prevent huge jumps when tab is inactive
    if (dt > 0.1) dt = 0.1;

    this.update(dt);
    this.draw();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    if (this.currentScene) {
      this.currentScene.update(dt);
    }
    // Clear key presses after update frame
    this.input.clearFrame();
  }

  private draw(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.currentScene) {
      this.currentScene.draw(this.ctx);
    }
  }
}
