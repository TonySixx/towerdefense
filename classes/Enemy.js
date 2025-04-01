// Enemy Class
import { getCanvasCoords, lerpColor } from '../utils.js';
import { path } from '../constants.js';
import { TILE_SIZE } from '../constants.js';

class Enemy {
    constructor(waveNum) {
        this.pathIndex = 0;
        const startPos = getCanvasCoords(path[0].x, path[0].y);
        this.x = startPos.x;
        this.y = startPos.y;
        this.baseHealth = 60; // Base health value
        this.healthGrowth = 1.22; // Health growth per wave
        this.maxHealth = Math.floor(this.baseHealth * Math.pow(this.healthGrowth, waveNum - 1));
        this.health = this.maxHealth;
        this.speed = 60 + (waveNum * 2.5); // Speed in pixels per second
        this.value = 5 + waveNum; // Money rewarded when killed
        this.size = TILE_SIZE * 0.35 + Math.random() * 3; // Size with variation
        this.color = '#e56b6f'; // Base color (reddish)
        this.darkerColor = '#b54d4f'; // Darker color for gradient/low health
        this.isDead = false;
        this.reachedEnd = false;
        // Pulsation effect
        this.pulseTimer = Math.random() * 1000;
        this.pulseSpeed = 800 + Math.random() * 400; // ms per cycle
    }

    move(deltaTime) {
        if (this.isDead || this.reachedEnd) return;

        // Get next path point
        const targetPathPointIndex = this.pathIndex + 1;
        
        // Check if reached end of path
        if (targetPathPointIndex >= path.length) {
            this.reachedEnd = true;
            this.isDead = true;
            // Damage and game-over check handled by gameLogic.js
            return;
        }

        // Get target position
        const targetGridPos = path[targetPathPointIndex];
        const targetCanvasPos = getCanvasCoords(targetGridPos.x, targetGridPos.y);
        
        // Calculate direction and distance to next point
        const dx = targetCanvasPos.x - this.x;
        const dy = targetCanvasPos.y - this.y;
        const distToTarget = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate movement for this frame
        const moveDistance = this.speed * (deltaTime / 1000);

        // Check if reached next path point
        if (distToTarget <= moveDistance) {
            this.x = targetCanvasPos.x;
            this.y = targetCanvasPos.y;
            this.pathIndex++;
        } else {
            // Move towards next point
            this.x += (dx / distToTarget) * moveDistance;
            this.y += (dy / distToTarget) * moveDistance;
        }

        // Update pulse timer for visual effect
        this.pulseTimer += deltaTime;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0 && !this.isDead) {
            this.isDead = true;
            // Money reward handled by gameLogic.js
            
            // Death explosion particles handled by gameLogic.js
            // createParticles(this.x, this.y, this.color, 15, 4, 500, this.size * 0.5);
        } else if (!this.isDead) {
            // Hit particle effect handled by gameLogic.js
            // createParticles(this.x + (Math.random()-0.5)*this.size, this.y + (Math.random()-0.5)*this.size, '#ffffff', 1, 2, 150, 2);
        }
    }

    draw(ctx) {
        if (this.isDead) return;

        const healthPercent = this.health / this.maxHealth;

        // Pulsation effect
        const pulseFactor = 1.0 + Math.sin(this.pulseTimer / this.pulseSpeed * Math.PI * 2) * 0.05;
        const currentSize = this.size * pulseFactor;

        // Gradient based on health
        const grad = ctx.createRadialGradient(this.x, this.y, currentSize * 0.1, this.x, this.y, currentSize);
        const midColor = lerpColor(this.darkerColor, this.color, healthPercent); // Interpolate color based on health
        grad.addColorStop(0, this.color); // Center color (lighter)
        grad.addColorStop(1, midColor); // Outer color (darker with less health)

        // Draw enemy body
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        // Add outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Health bar
        const healthBarWidth = Math.max(15, this.size * 1.2);
        const healthBarHeight = 4;
        const healthBarX = this.x - healthBarWidth / 2;
        const healthBarY = this.y - currentSize - healthBarHeight - 3;
        const currentHealthWidth = healthBarWidth * healthPercent;

        // Health bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // Health bar fill with gradient
        const healthGrad = ctx.createLinearGradient(healthBarX, healthBarY, healthBarX + healthBarWidth, healthBarY);
        healthGrad.addColorStop(0, '#f44336'); // Red (low health)
        healthGrad.addColorStop(0.5, '#ffeb3b'); // Yellow (mid health)
        healthGrad.addColorStop(1, '#4caf50'); // Green (full health)
        ctx.fillStyle = healthGrad;
        ctx.fillRect(healthBarX, healthBarY, Math.max(0, currentHealthWidth), healthBarHeight);
        
        // Health bar border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    }
}

export default Enemy; 