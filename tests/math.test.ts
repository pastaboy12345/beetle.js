import { describe, expect, it } from 'vitest';
import { Vector2 } from '../src/math/Vector2';
import { Rect } from '../src/math/Rect';

describe('Vector2', () => {
  it('should initialize with default parameters', () => {
    const v = new Vector2();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('should correctly support addition and scaling', () => {
    const v1 = new Vector2(1, 2);
    const v2 = new Vector2(3, 4);
    
    v1.add(v2);
    expect(v1.x).toBe(4);
    expect(v1.y).toBe(6);

    v1.scale(2);
    expect(v1.x).toBe(8);
    expect(v1.y).toBe(12);
  });

  it('should calculate distance correctly', () => {
    const v1 = new Vector2(0, 0);
    const v2 = new Vector2(3, 4);
    expect(v1.distance(v2)).toBe(5);
  });
});

describe('Rect', () => {
  it('should verify contains point logic', () => {
    const r = new Rect(10, 10, 100, 100);
    expect(r.contains(new Vector2(50, 50))).toBe(true);
    expect(r.contains(new Vector2(5, 5))).toBe(false);
  });

  it('should verify intersections', () => {
    const r1 = new Rect(0, 0, 50, 50);
    const r2 = new Rect(40, 40, 50, 50);
    const r3 = new Rect(100, 100, 10, 10);
    
    expect(r1.intersects(r2)).toBe(true);
    expect(r1.intersects(r3)).toBe(false);
  });
});
