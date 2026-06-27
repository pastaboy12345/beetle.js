import { Scene, SpriteNode, TextNode, Vector2, ParticleEmitter, Tween } from '@beetle/index';

export class Coin extends SpriteNode {
  private bobTween: Tween | null = null;
  public isBonus: boolean = false;

  constructor(name: string = 'Coin') {
    super(name);
    this.size.set(16, 16);
    this.color = '#eab308';
  }

  startBobbing(): void {
    // Bob the coin up and down continuously
    this.bobTween = Tween.to(
      this.position,
      { y: this.position.y - 8 },
      0.6 + Math.random() * 0.4,
      {
        easing: 'easeInOutQuad',
        repeat: -1,
        yoyo: true,
      }
    );
  }

  destroy(): void {
    if (this.bobTween) {
      this.bobTween.cancel();
    }
  }
}

export class Player extends SpriteNode {
  public speed: number = 250;
  private squishTween: Tween | null = null;
  private lastDirX: number = 0;
  private lastDirY: number = 0;

  constructor() {
    super('Player');
    this.size.set(30, 30);
    this.color = '#3b82f6';
  }

  onUpdate(dt: number): void {
    const scene = this.parent as any;
    const engine = scene?.engine;
    const input = engine?.input;
    if (!input) return;

    const move = new Vector2(0, 0);

    if (input.isKeyDown('a') || input.isKeyDown('arrowleft')) move.x -= 1;
    if (input.isKeyDown('d') || input.isKeyDown('arrowright')) move.x += 1;
    if (input.isKeyDown('w') || input.isKeyDown('arrowup')) move.y -= 1;
    if (input.isKeyDown('s') || input.isKeyDown('arrowdown')) move.y += 1;

    if (move.length() > 0) {
      move.normalize().scale(this.speed * dt);
      this.position.add(move);

      // Squish animation when changing horizontal/vertical directions
      const dirX = Math.sign(move.x);
      const dirY = Math.sign(move.y);
      if ((dirX !== 0 && dirX !== this.lastDirX) || (dirY !== 0 && dirY !== this.lastDirY)) {
        this.lastDirX = dirX;
        this.lastDirY = dirY;
        this.squish();
      }
    } else {
      this.lastDirX = 0;
      this.lastDirY = 0;
    }

    // World bounds boundary constraints (2000x1500 world)
    const margin = 20;
    const worldW = 2000;
    const worldH = 1500;
    this.position.x = Math.max(margin, Math.min(worldW - margin, this.position.x));
    this.position.y = Math.max(margin, Math.min(worldH - margin, this.position.y));
  }

  private squish(): void {
    if (this.squishTween) {
      this.squishTween.cancel();
    }
    // Perform a squash-and-stretch scale effect
    this.scale.set(1.25, 0.75);
    this.squishTween = Tween.to(this.scale, { x: 1, y: 1 }, 0.25, {
      easing: 'easeOutBack',
    });
  }
}

export class DemoGameScene extends Scene {
  private player!: Player;
  private coins: Coin[] = [];
  public score: number = 0;
  
  // UI nodes (static/un-transformed relative to camera)
  private scoreTextNode!: TextNode;
  private bonusTimerTextNode!: TextNode;
  private bonusTimeLeft: number = 8.0;

  onEnter(): void {
    // 1. Setup Camera
    this.engine.camera.follow(this.player, 0.1);
    this.engine.camera.zoom = 1.0;

    // 2. Add static UI text (we add them as children, but we'll update their position in onUpdate relative to camera)
    const title = new TextNode('Title', 'Beetle.js World Explorer');
    title.font = 'bold 20px "Space Grotesk", sans-serif';
    title.color = '#a855f7';
    this.addChild(title);

    this.scoreTextNode = new TextNode('ScoreText', 'Coins Collected: 0');
    this.scoreTextNode.font = '16px "Space Grotesk", sans-serif';
    this.scoreTextNode.color = '#e2e8f0';
    this.addChild(this.scoreTextNode);

    this.bonusTimerTextNode = new TextNode('BonusTimerText', 'Next Bonus Coin: 8.0s');
    this.bonusTimerTextNode.font = '16px "Space Grotesk", sans-serif';
    this.bonusTimerTextNode.color = '#fbbf24';
    this.addChild(this.bonusTimerTextNode);

    const instructions = new TextNode('Instructions', 'WASD/Arrows to Move. Explore the 2000x1500 world!');
    instructions.font = '14px sans-serif';
    instructions.color = '#64748b';
    this.addChild(instructions);

    // 3. Spawn Player
    this.player = new Player();
    this.player.position.set(1000, 750); // Start in middle of the 2000x1500 world
    this.addChild(this.player);

    // Update camera target after player is created
    this.engine.camera.follow(this.player, 0.1);
    this.engine.camera.position.set(1000, 750);

    // 4. Spawn initial coins
    this.spawnCoins(15);

    // 5. Setup bonus coin timer
    this.engine.timers.every(8.0, () => {
      this.spawnBonusCoin();
      this.bonusTimeLeft = 8.0;
    });

    // 6. Setup save/load event handlers
    this.engine.events.on('load-game', (saveData: any) => {
      this.score = saveData.score || 0;
      this.player.position.set(saveData.playerPos.x, saveData.playerPos.y);
      this.scoreTextNode.text = `Coins Collected: ${this.score}`;
      
      // Clear old coins
      this.coins.forEach(c => {
        c.destroy();
        this.removeChild(c);
      });
      this.coins = [];
      this.spawnCoins(15);
    });

    this.engine.events.on('request-save-data', () => {
      this.engine.events.emit('game-save-data', {
        score: this.score,
        playerPos: { x: this.player.position.x, y: this.player.position.y }
      });
    });
  }

  private spawnCoins(count: number): void {
    for (let i = 0; i < count; i++) {
      const coin = new Coin(`Coin_${Date.now()}_${i}`);
      let px = Math.random() * 1900 + 50;
      let py = Math.random() * 1400 + 50;
      while (new Vector2(px, py).distance(this.player.position) < 150) {
        px = Math.random() * 1900 + 50;
        py = Math.random() * 1400 + 50;
      }
      coin.position.set(px, py);
      this.addChild(coin);
      coin.startBobbing();
      this.coins.push(coin);
    }
  }

  private spawnBonusCoin(): void {
    const coin = new Coin(`BonusCoin_${Date.now()}`);
    coin.isBonus = true;
    coin.size.set(24, 24); // Larger!
    coin.color = '#fbbf24'; // Brighter gold!
    
    // Spawn near the player but not right on top
    const angle = Math.random() * Math.PI * 2;
    const dist = 200 + Math.random() * 200;
    let px = this.player.position.x + Math.cos(angle) * dist;
    let py = this.player.position.y + Math.sin(angle) * dist;
    
    // Clamp to world
    px = Math.max(50, Math.min(1950, px));
    py = Math.max(50, Math.min(1450, py));

    coin.position.set(px, py);
    this.addChild(coin);
    coin.startBobbing();
    this.coins.push(coin);
  }

  onUpdate(dt: number): void {
    super.onUpdate(dt);

    // Update bonus timer countdown
    this.bonusTimeLeft = Math.max(0, this.bonusTimeLeft - dt);
    this.bonusTimerTextNode.text = `Next Bonus Coin: ${this.bonusTimeLeft.toFixed(1)}s`;

    // Keep UI nodes positioned relative to the camera view so they stay on screen
    const camPos = this.engine.camera.position;
    const zoom = this.engine.camera.zoom;
    const halfW = (this.engine.canvas.width / 2) / zoom;
    const halfH = (this.engine.canvas.height / 2) / zoom;

    // Place UI elements based on camera's view bounding box
    const uiLeft = camPos.x - halfW + 20 / zoom;
    const uiTop = camPos.y - halfH + 20 / zoom;
    const uiBottom = camPos.y + halfH - 20 / zoom;

    // Update UI node transforms
    const childTitle = this.children.find(c => c.name === 'Title');
    if (childTitle) childTitle.position.set(uiLeft, uiTop);

    this.scoreTextNode.position.set(uiLeft, uiTop + 30 / zoom);
    this.bonusTimerTextNode.position.set(uiLeft, uiTop + 55 / zoom);

    const childInstructions = this.children.find(c => c.name === 'Instructions');
    if (childInstructions) childInstructions.position.set(uiLeft, uiBottom);

    // Check collisions
    const playerBounds = this.player.getBounds();

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (playerBounds.intersects(coin.getBounds())) {
        // 1. Remove coin node and cancel its tweens
        coin.destroy();
        this.removeChild(coin);
        this.coins.splice(i, 1);

        // 2. Adjust score
        const points = coin.isBonus ? 5 : 1;
        this.score += points;
        this.scoreTextNode.text = `Coins Collected: ${this.score}`;
        this.engine.events.emit('score-changed', this.score);

        // 3. Create Particle Explosion
        const particleColor = coin.isBonus ? '#fbbf24' : '#eab308';
        const particleCount = coin.isBonus ? 25 : 12;
        const emitter = new ParticleEmitter('CoinSparkle', {
          maxParticles: 50,
          colors: [particleColor, '#fef08a', '#ca8a04'],
          speed: [70, 160],
          lifetime: [0.4, 0.8],
          sizeRange: [3, 7],
          endSizeScale: 0.1,
          fadeOut: true,
          gravity: new Vector2(0, 150),
        });
        emitter.position.copy(coin.position);
        this.addChild(emitter);
        emitter.emit(particleCount);

        // Remove emitter from scene graph after particles die
        this.engine.timers.after(1.0, () => {
          this.removeChild(emitter);
        });

        // 4. Trigger Camera Shake
        const shakeIntensity = coin.isBonus ? 10 : 5;
        this.engine.camera.shake(shakeIntensity, 0.2);

        // 5. Play sound effect placeholder
        this.engine.audio.playSFX('pickup', { pitchVariation: 0.15 });

        // 6. Respawn standard coin if collected
        if (!coin.isBonus) {
          this.spawnCoins(1);
        }

        // 7. Check achievements
        if (this.score >= 1 && this.score < 5) {
          this.engine.events.emit('achievement-unlocked', {
            id: 'first-steps',
            title: 'First Steps',
            description: 'You collected your very first coin in Beetle.js!'
          });
        }
        if (this.score >= 10) {
          this.engine.events.emit('achievement-unlocked', {
            id: 'gold-hoarder',
            title: 'Gold Hoarder',
            description: 'Collected 10 coins! Excellent movement skills.'
          });
        }
      }
    }
  }

  onDraw(ctx: CanvasRenderingContext2D): void {
    // Draw background boundary stroke
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, 2000, 1500);

    // Draw coordinate grids
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    const gridSpacing = 100;
    for (let x = gridSpacing; x < 2000; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1500);
      ctx.stroke();
    }
    for (let y = gridSpacing; y < 1500; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(2000, y);
      ctx.stroke();
    }
  }
}
