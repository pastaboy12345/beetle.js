import { describe, expect, it } from 'vitest';
import { Node } from '../src/scene/Node';

describe('Scene Graph Node', () => {
  it('should support adding and removing children', () => {
    const parent = new Node('Parent');
    const child = new Node('Child');

    parent.addChild(child);
    expect(parent.children.length).toBe(1);
    expect(child.parent).toBe(parent);

    parent.removeChild(child);
    expect(parent.children.length).toBe(0);
    expect(child.parent).toBeNull();
  });

  it('should calculate global positions recursively', () => {
    const parent = new Node('Parent');
    parent.position.set(100, 200);

    const child = new Node('Child');
    child.position.set(10, 20);
    parent.addChild(child);

    // Global position of parent is its position
    expect(parent.getGlobalPosition().x).toBe(100);
    expect(parent.getGlobalPosition().y).toBe(200);

    // Child relative position adds up
    expect(child.getGlobalPosition().x).toBe(110);
    expect(child.getGlobalPosition().y).toBe(220);
  });

  it('should support global scale multiplication', () => {
    const parent = new Node('Parent');
    parent.scale.set(2, 3);

    const child = new Node('Child');
    child.scale.set(0.5, 2);
    parent.addChild(child);

    const globalScale = child.getGlobalScale();
    expect(globalScale.x).toBe(1);
    expect(globalScale.y).toBe(6);
  });
});
