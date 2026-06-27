import { Vector2 } from '../math/Vector2';

export class Node {
  public position: Vector2 = new Vector2(0, 0);
  public scale: Vector2 = new Vector2(1, 1);
  public rotation: number = 0; // in radians
  public active: boolean = true;
  public visible: boolean = true;
  public parent: Node | null = null;
  public children: Node[] = [];
  public name: string;

  constructor(name: string = 'Node') {
    this.name = name;
  }

  addChild(child: Node): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    child.parent = this;
    this.children.push(child);
  }

  removeChild(child: Node): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      child.parent = null;
      this.children.splice(index, 1);
    }
  }

  getGlobalPosition(): Vector2 {
    if (!this.parent) {
      return this.position.clone();
    }
    // Simple matrix transformation mock or hierarchy addition:
    // For 2D games, we combine parent translation, scale, and rotation.
    // To keep it simple but functional for the demo, let's support translation & scale:
    const parentPos = this.parent.getGlobalPosition();
    const parentScale = this.parent.scale;
    
    // Rotated translation is a bit more math, but standard linear algebra:
    const cos = Math.cos(this.parent.rotation);
    const sin = Math.sin(this.parent.rotation);
    
    const localScaledX = this.position.x * parentScale.x;
    const localScaledY = this.position.y * parentScale.y;
    
    const worldX = parentPos.x + (localScaledX * cos - localScaledY * sin);
    const worldY = parentPos.y + (localScaledX * sin + localScaledY * cos);
    
    return new Vector2(worldX, worldY);
  }

  getGlobalScale(): Vector2 {
    if (!this.parent) {
      return this.scale.clone();
    }
    const parentScale = this.parent.getGlobalScale();
    return new Vector2(this.scale.x * parentScale.x, this.scale.y * parentScale.y);
  }

  getGlobalRotation(): number {
    if (!this.parent) {
      return this.rotation;
    }
    return this.rotation + this.parent.getGlobalRotation();
  }

  update(dt: number): void {
    if (!this.active) return;
    // Update self (to be overridden)
    this.onUpdate(dt);
    // Update children
    for (const child of this.children) {
      child.update(dt);
    }
  }

  onUpdate(_dt: number): void {
    // Override in subclasses
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || !this.active) return;

    ctx.save();
    // Apply local transforms
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale.x, this.scale.y);

    // Draw self
    this.onDraw(ctx);

    // Draw children
    for (const child of this.children) {
      child.draw(ctx);
    }

    ctx.restore();
  }

  onDraw(_ctx: CanvasRenderingContext2D): void {
    // Override in subclasses
  }
}
