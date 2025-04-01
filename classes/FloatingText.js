// FloatingText Class for displaying rewards and messages
class FloatingText {
    constructor(x, y, text, color = '#ffd700', size = 28, lifespan = 2000) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size; // Increased default size
        this.initialLife = lifespan;
        this.life = lifespan;
        this.vy = -0.8; // Even slower upward movement
        this.alpha = 1;
        this.fontFamily = 'Arial, sans-serif';
        this.fontWeight = 'bold';
        this.pulseTimer = 0; // For pulsing effect
        this.glowIntensity = 1; // For glow effect
    }

    update(deltaTime) {
        this.life -= deltaTime;
        if (this.life <= 0) return;

        this.y += this.vy * (deltaTime / 16); // Move upward
        this.alpha = Math.max(0, this.life / this.initialLife); // Fade out
        this.pulseTimer += deltaTime * 0.01; // Update pulse timer
        
        // Adjust glow intensity based on pulse
        this.glowIntensity = 0.7 + Math.sin(this.pulseTimer * 2) * 0.3;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        
        ctx.globalAlpha = this.alpha;
        
        // Calculate pulse size effect with more pronounced pulsing
        const pulse = 1 + Math.sin(this.pulseTimer) * 0.15;
        const currentSize = this.size * pulse;
        
        ctx.font = `${this.fontWeight} ${currentSize}px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Multiple shadows for stronger glow effect
        const glowColor = this.color === '#ffd700' ? 'rgba(255, 230, 120, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        
        // Draw multiple layers of shadow/glow
        for (let i = 0; i < 3; i++) {
            const intensity = (3 - i) * 3 * this.glowIntensity;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = intensity * 4;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw colored glow
            ctx.fillStyle = glowColor;
            ctx.fillText(this.text, this.x, this.y);
        }
        
        // Draw dark outline for contrast
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'black';
        ctx.strokeText(this.text, this.x, this.y);
        
        // Draw main text on top
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        
        // Reset context properties
        ctx.globalAlpha = 1.0;
    }
}

export default FloatingText; 