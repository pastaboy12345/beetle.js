import { Scene, SpriteNode, TextNode, Vector2 } from '@beetle/index';

export class Coin extends SpriteNode {
  constructor(name: string = 'Coin') {
    super(name);
    this.size.set(16, 16);
    this.color = '#eab308'; // Gold color
  }
}

export class Player extends SpriteNode {
  public speed: number = 200;

  constructor() {
    super('Player');
    this.size.set(30, 30);
    this.color = '#3b82f6'; // Bright blue
  }

  onUpdate(dt: number): void {
    const input = (this.parent?.parent as any)?.engine?.input; // Access input via engine
    if (!input) return;

    const move = new Vector2(0, 0);

    if (input.isKeyDown('a') || input.isKeyDown('arrowleft')) move.x -= 1;
    if (input.isKeyDown('d') || input.isKeyDown('arrowright')) move.x += 1;
    if (input.isKeyDown('w') || input.isKeyDown('arrowup')) move.y -= 1;
    if (input.isKeyDown('s') || input.isKeyDown('arrowdown')) move.y += 1;

    if (move.length() > 0) {
      move.normalize().scale(this.speed * dt);
      this.position.add(move);
    }

    // Keep player within bounds
    const margin = 20;
    this.position.x = Math.max(margin, Math.min(800 - margin, this.position.x));
    this.position.y = Math.max(margin, Math.min(600 - margin, this.position.y));
  }
}

export class DemoGameScene extends Scene {
  private player!: Player;
  private coins: Coin[] = [];
  public score: number = 0;
  private scoreTextNode!: TextNode;

  onEnter(): void {
    // Add custom text title node
    const title = new TextNode('Title', 'Beetle.js Demo Game');
    title.position.set(20, 20);
    title.font = 'bold 20px "Space Grotesk", sans-serif';
    title.color = '#a855f7';
    this.addChild(title);

    // Score display node
    this.scoreTextNode = new TextNode('ScoreText', 'Coins Collected: 0');
    this.scoreTextNode.position.set(20, 50);
    this.scoreTextNode.font = '16px "Space Grotesk", sans-serif';
    this.scoreTextNode.color = '#e2e8f0';
    this.addChild(this.scoreTextNode);

    // Instructions display node
    const instructions = new TextNode('Instructions', 'Use WASD or Arrows to Move. Collect Gold Coins!');
    instructions.position.set(20, 560);
    instructions.font = '14px sans-serif';
    instructions.color = '#64748b';
    this.addChild(instructions);

    // Add Player
    this.player = new Player();
    this.player.position.set(400, 300);
    this.addChild(this.player);

    // Spawn initial coins
    this.spawnCoins(5);

    // Register listener for load-save commands from React
    this.engine.events.on('load-game', (saveData: any) => {
      this.score = saveData.score || 0;
      this.player.position.set(saveData.playerPos.x, saveData.playerPos.y);
      this.scoreTextNode.text = `Coins Collected: ${this.score}`;
      
      // Respawn coins with new layout or clear existing
      this.coins.forEach(c => this.removeChild(c));
      this.coins = [];
      this.spawnCoins(5);
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
      // Keep away from player start
      let px = Math.random() * 700 + 50;
      let py = Math.random() * 500 + 50;
      while (new Vector2(px, py).distance(this.player.position) < 100) {
        px = Math.random() * 700 + 50;
        py = Math.random() * 500 + 50;
      }
      coin.position.set(px, py);
      this.addChild(coin);
      this.coins.push(coin);
    }
  }

  onUpdate(dt: number): void {
    super.onUpdate(dt);

    const playerBounds = this.player.getBounds();

    // Check coin collection collisions
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (playerBounds.intersects(coin.getBounds())) {
        // Collect coin
        this.removeChild(coin);
        this.coins.splice(i, 1);
        this.score += 1;
        this.scoreTextNode.text = `Coins Collected: ${this.score}`;
        
        // Notify React overlay UI of score update
        this.engine.events.emit('score-changed', this.score);

        // Spawn a replacement coin
        this.spawnCoins(1);

        // Trigger Achievement unlocks at certain scores
        if (this.score === 1) {
          this.engine.events.emit('achievement-unlocked', {
            id: 'first-steps',
            title: 'First Steps',
            description: 'You collected your very first coin in Beetle.js!'
          });
        } else if (this.score === 10) {
          this.engine.events.emit('achievement-unlocked', {
            id: 'gold-hoarder',
            title: 'Gold Hoarder',
            description: 'Collected 10 coins! Excellent movement skills.'
          });
        }
      }
    }
  }
}
