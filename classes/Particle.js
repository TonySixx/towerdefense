// Particle Class for Visual Effects
class Particle {
    constructor(x, y, color, size, speed, life, isGoldCoin = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * size + 2; // Random size variation
        this.initialLife = life;
        this.life = life; // Lifespan in milliseconds
        this.vx = (Math.random() - 0.5) * speed; // Random velocity x
        this.vy = (Math.random() - 0.5) * speed; // Random velocity y
        this.gravity = 0.05; // Slight downward pull
        this.alpha = 1;
        this.isGoldCoin = isGoldCoin; // Special flag for gold coin particles
        this.rotation = Math.random() * Math.PI * 2; // Random starting rotation
        this.rotationSpeed = (Math.random() - 0.5) * 0.2; // Random rotation speed
    }

    update(deltaTime) {
        this.life -= deltaTime;
        if (this.life <= 0) return;

        this.x += this.vx * (deltaTime / 16); // Normalize speed slightly
        this.y += this.vy * (deltaTime / 16);
        
        if (!this.isGoldCoin) {
            this.vy += this.gravity; // Apply gravity only to regular particles
        } else {
            // For gold coins, have a slightly different behavior
            this.vy += this.gravity * 0.5; // Less gravity
            this.rotation += this.rotationSpeed * (deltaTime / 16); // Rotation for coins
        }
        
        this.alpha = Math.max(0, this.life / this.initialLife); // Fade out
        this.size *= 0.98; // Shrink slightly
    }

    draw(ctx) {
        if (this.life <= 0 || this.size < 1) return;
        ctx.globalAlpha = this.alpha;
        
        if (this.isGoldCoin) {
            // Draw gold coin
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            // Gold circle
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Coin edge highlight
            ctx.strokeStyle = '#fff7d6'; // Light gold
            ctx.lineWidth = this.size * 0.2;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            
            // Dollar sign or other symbol
            ctx.fillStyle = '#fff7d6';
            ctx.font = `bold ${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 0);
            
            ctx.restore();
        } else {
            // Draw regular particle
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0, this.size), 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1.0; // Reset alpha
    }

    // Static method to create gold coin particles
    static createGoldCoins(gameState, x, y, count = 5) {
        const goldColors = ['#ffd700', '#f0c040', '#e6b422', '#d4af37'];
        
        for (let i = 0; i < count; i++) {
            const color = goldColors[Math.floor(Math.random() * goldColors.length)];
            const coinSize = 5 + Math.random() * 3;
            const life = 800 + Math.random() * 400;
            
            // Create particles with lower gravity and less horizontal movement
            const p = new Particle(x, y, color, coinSize, 2, life, true);
            p.vy = -2 - Math.random() * 2; // More upward movement
            p.vx = (Math.random() - 0.5) * 2; // Less horizontal spread
            
            gameState.particles.push(p);
        }
    }
}

export default Particle; 