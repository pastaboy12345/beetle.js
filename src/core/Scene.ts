import { Node } from '../scene/Node';
import { Engine } from './Engine';

export class Scene extends Node {
  public engine!: Engine;

  constructor(name: string = 'Scene') {
    super(name);
  }

  // Lifecycle methods
  onEnter(): void {}
  onExit(): void {}
}
