// Particle Class for Visual Effects
class Particle {
    constructor(x, y, color, size, speed, life) {
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
    }

    update(deltaTime) {
        this.life -= deltaTime;
        if (this.life <= 0) return;

        this.x += this.vx * (deltaTime / 16); // Normalize speed slightly
        this.y += this.vy * (deltaTime / 16);
        this.vy += this.gravity; // Apply gravity
        this.alpha = Math.max(0, this.life / this.initialLife); // Fade out
        this.size *= 0.98; // Shrink slightly
    }

    draw(ctx) {
        if (this.life <= 0 || this.size < 1) return;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0, this.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset alpha
    }
}

export default Particle; 