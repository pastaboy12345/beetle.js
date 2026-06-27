import { Node } from './Node';

export class TextNode extends Node {
  public text: string = '';
  public font: string = '16px sans-serif';
  public color: string = '#ffffff';
  public align: CanvasTextAlign = 'left';
  public baseline: CanvasTextBaseline = 'top';

  constructor(name: string = 'TextNode', text: string = '') {
    super(name);
    this.text = text;
  }

  onDraw(ctx: CanvasRenderingContext2D): void {
    ctx.font = this.font;
    ctx.fillStyle = this.color;
    ctx.textAlign = this.align;
    ctx.textBaseline = this.baseline;
    ctx.fillText(this.text, 0, 0);
  }
}
