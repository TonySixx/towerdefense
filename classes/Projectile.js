// Projectile Class
import { distance } from '../utils.js';
import Particle from './Particle.js';

class Projectile {
    constructor(startX, startY, targetEnemy, damage, speed, color, size) {
        this.x = startX;
        this.y = startY;
        this.target = targetEnemy;
        this.damage = damage;
        this.speed = speed * 10; // Speed multiplier
        this.color = color;
        this.size = size;
        this.toRemove = false;
        // For trail effect
        this.trail = [];
        this.trailLength = 5;
    }

    move(deltaTime) {
        // Add current position to trail
        this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
        if (this.trail.length > this.trailLength) {
            this.trail.shift(); // Remove oldest point
        }
        
        // Update alpha for trail fade
        for (let i = 0; i < this.trail.length; i++) {
            this.trail[i].alpha = (i + 1) / this.trailLength;
        }

        if (this.toRemove || !this.target || this.target.isDead || this.target.reachedEnd) {
            // If target is lost, mark for removal
            this.toRemove = true;
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const moveDistance = this.speed * (deltaTime / 1000);

        // Use a slightly larger hit radius based on target size
        const hitRadius = (this.target.size || 16) * 0.8;

        if (dist <= moveDistance || dist < hitRadius) { // Adjusted hit condition
            this.hitTarget();
        } else {
            this.x += (dx / dist) * moveDistance;
            this.y += (dy / dist) * moveDistance;
        }
    }

    hitTarget() {
        if (!this.toRemove && this.target && !this.target.isDead) {
            this.target.takeDamage(this.damage);
            this.toRemove = true;
            
            // Note: createParticles will be implemented in gameLogic.js
            // This is just a placeholder to show intent
            // createParticles(this.x, this.y, this.color, 5, 3, 300, this.size * 0.8);
        }
    }

    draw(ctx) {
        // Draw trail first (older points are more transparent)
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            ctx.globalAlpha = point.alpha * 0.5; // Make trail semi-transparent
            ctx.fillStyle = this.color;
            ctx.beginPath();
            // Trail points shrink
            ctx.arc(point.x, point.y, this.size * point.alpha * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0; // Reset alpha for main projectile

        // Draw main projectile
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Add a brighter core/outline
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

export default Projectile; 