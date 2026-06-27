import { Node } from './Node';
import { Vector2 } from '../math/Vector2';
import { Rect } from '../math/Rect';

export class SpriteNode extends Node {
  public size: Vector2 = new Vector2(32, 32);
  public color: string = '#ffffff';
  public image: HTMLImageElement | null = null;
  public anchor: Vector2 = new Vector2(0.5, 0.5); // Center by default

  constructor(name: string = 'SpriteNode') {
    super(name);
  }

  getBounds(): Rect {
    const globalPos = this.getGlobalPosition();
    const globalScale = this.getGlobalScale();
    const w = this.size.x * globalScale.x;
    const h = this.size.y * globalScale.y;
    
    // Offset by anchor
    const x = globalPos.x - w * this.anchor.x;
    const y = globalPos.y - h * this.anchor.y;
    
    return new Rect(x, y, w, h);
  }

  onDraw(ctx: CanvasRenderingContext2D): void {
    const offsetX = -this.size.x * this.anchor.x;
    const offsetY = -this.size.y * this.anchor.y;

    if (this.image && this.image.complete) {
      ctx.drawImage(this.image, offsetX, offsetY, this.size.x, this.size.y);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(offsetX, offsetY, this.size.x, this.size.y);
    }
  }
}
