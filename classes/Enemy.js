// Enemy Class
import { getCanvasCoords, lerpColor } from '../utils.js';
import { TILE_SIZE } from '../constants.js';
import { gameState, updateUI } from '../gameLogic.js';
import { enemyTypes, bossTypes } from '../enemyTypes.js';

class Enemy {
    constructor(waveNum, healthModifier = 1.0, enemyType = 'standard', isBoss = false) {
        // Určení typu nepřítele
        this.enemyType = enemyType;
        this.isBoss = isBoss;
        
        // Získání konfigurace podle typu
        const enemyConfig = isBoss ? bossTypes[enemyType] : enemyTypes[enemyType] || enemyTypes.standard;
        
        // Nastavení základních vlastností
        this.pathIndex = 0;
        const startPos = getCanvasCoords(gameState.currentPath[0].x, gameState.currentPath[0].y);
        this.x = startPos.x;
        this.y = startPos.y;
        
        // Nastavení životů na základě typu nepřítele a čísla vlny
        this.baseHealth = 60; // Základní hodnota životů
        this.healthGrowth = 1.22; // Růst životů s každou vlnou
        this.maxHealth = Math.floor(
            this.baseHealth * 
            Math.pow(this.healthGrowth, waveNum - 1) * 
            healthModifier * 
            enemyConfig.healthModifier
        );
        this.health = this.maxHealth;
        
        // Nastavení rychlosti na základě typu nepřítele a čísla vlny
        this.speed = (60 + (waveNum * 2.5)) * enemyConfig.speedModifier;
        
        // Nastavení odměny za zabití
        this.value = Math.ceil((5 + waveNum) * enemyConfig.valueModifier);
        
        // Nastavení velikosti podle typu nepřítele
        this.size = (TILE_SIZE * 0.35 + Math.random() * 3) * enemyConfig.sizeModifier;
        
        // Nastavení barev podle typu nepřítele
        this.color = enemyConfig.color;
        this.darkerColor = enemyConfig.darkerColor;
        
        // Stav nepřítele
        this.isDead = false;
        this.reachedEnd = false;
        this.processed = false;
        
        // Efekt pulzace
        this.pulseTimer = Math.random() * 1000;
        this.pulseSpeed = 800 + Math.random() * 400; // ms na cyklus
        
        // Freeze effect properties
        this.slowFactor = 1.0; // No slow by default (1.0 = normal speed)
        this.slowDuration = 0; // No slow duration by default
        this.isFrozen = false; // Tracker for freeze visual effect
        
        // Damage amplifier effect for Pulsar tower
        this.damageAmplifier = {
            factor: 1.0, // Default is no amplification
            duration: 0   // No duration by default
        };
        
        // Speciální efekty pro bossy
        if (this.isBoss) {
            // Bossy mají silnější pulzaci
            this.pulseIntensity = 0.15; // 3x silnější než běžní nepřátelé
            // Bossy mají také efekt rotace koruny
            this.crownRotation = 0;
            this.crownRotationSpeed = 0.5 + Math.random() * 0.5; // Rychlost rotace
            // Bossy mají efekt záře
            this.glowSize = this.size * 1.2;
            this.glowOpacity = 0.5;
        } else {
            // Běžné nastavení pulzace pro běžné nepřátele
            this.pulseIntensity = 0.05;
        }
    }

    move(deltaTime) {
        if (this.isDead || this.reachedEnd) return;

        // Update slow effect duration
        if (this.slowDuration > 0) {
            this.slowDuration -= deltaTime;
            if (this.slowDuration <= 0) {
                // Reset slow effect when duration expires
                this.slowFactor = 1.0;
                this.isFrozen = false;
            }
        }

        // Get next path point
        const targetPathPointIndex = this.pathIndex + 1;
        
        // Check if reached end of path
        if (targetPathPointIndex >= gameState.currentPath.length) {
            this.reachedEnd = true;
            this.isDead = true;
            // Damage and game-over check handled by gameLogic.js
            return;
        }

        // Get target position
        const targetGridPos = gameState.currentPath[targetPathPointIndex];
        const targetCanvasPos = getCanvasCoords(targetGridPos.x, targetGridPos.y);
        
        // Calculate direction and distance to next point
        const dx = targetCanvasPos.x - this.x;
        const dy = targetCanvasPos.y - this.y;
        const distToTarget = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate movement for this frame - Apply slow factor
        const moveDistance = this.speed * this.slowFactor * (deltaTime / 1000);

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
        
        // Aktualizace rotace koruny pro bossy
        if (this.isBoss) {
            this.crownRotation += this.crownRotationSpeed * (deltaTime / 1000);
            // Zajistíme, aby úhel byl vždy v rozmezí 0-360
            this.crownRotation = this.crownRotation % (2 * Math.PI);
        }
    }

    takeDamage(amount, onDeath = null) {
        // Apply damage amplifier if active
        let modifiedAmount = amount;
        if (this.damageAmplifier && this.damageAmplifier.factor > 1.0 && this.damageAmplifier.duration > 0) {
            modifiedAmount = Math.round(amount * this.damageAmplifier.factor);
        }
        
        this.health -= modifiedAmount;
        if (this.health <= 0 && !this.isDead) {
            this.isDead = true;
            
            // Immediately award money on death
            gameState.money += this.value;
            updateUI(); // Update UI to show new money amount
            
            // Call callback function if provided (for visual effects)
            if (onDeath) {
                onDeath(this.x, this.y, this.value);
            }
            
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

        // Pulsation effect - používáme pulseIntensity podle typu nepřítele
        const pulseFactor = 1.0 + Math.sin(this.pulseTimer / this.pulseSpeed * Math.PI * 2) * this.pulseIntensity;
        const currentSize = this.size * pulseFactor;
        
        // Draw damage amplifier effect if active (Pulsar debuff)
        if (this.damageAmplifier && this.damageAmplifier.factor > 1.0 && this.damageAmplifier.duration > 0) {
            // Add purple glow effect around enemy
            const amplifierGlow = ctx.createRadialGradient(
                this.x, this.y, currentSize * 0.8,
                this.x, this.y, currentSize * 1.4
            );
            
            amplifierGlow.addColorStop(0, 'rgba(224, 64, 251, 0.5)'); // Purple glow
            amplifierGlow.addColorStop(1, 'rgba(224, 64, 251, 0)');
            
            ctx.fillStyle = amplifierGlow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentSize * 1.4, 0, Math.PI * 2);
            ctx.fill();
            
            // Pulsating energy particles
            const particleCount = 4;
            const particleSize = currentSize * 0.2;
            const pulseRatio = 0.5 + 0.5 * Math.sin(Date.now() / 300);
            
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2 + (this.pulseTimer / 800);
                const dist = currentSize * (1.1 + 0.1 * pulseRatio);
                const offsetX = Math.cos(angle) * dist;
                const offsetY = Math.sin(angle) * dist;
                
                ctx.fillStyle = 'rgba(224, 64, 251, ' + (0.4 + 0.3 * pulseRatio) + ')';
                ctx.beginPath();
                ctx.arc(this.x + offsetX, this.y + offsetY, particleSize * pulseRatio, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw freeze effect if enemy is slowed
        if (this.isFrozen) {
            // Add frost/ice effect around enemy
            const freezeGlow = ctx.createRadialGradient(
                this.x, this.y, currentSize * 0.8,
                this.x, this.y, currentSize * 1.4
            );
            
            freezeGlow.addColorStop(0, 'rgba(100, 200, 255, 0.7)');
            freezeGlow.addColorStop(1, 'rgba(100, 200, 255, 0)');
            
            ctx.fillStyle = freezeGlow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentSize * 1.4, 0, Math.PI * 2);
            ctx.fill();
            
            // Ice crystal effect
            const crystalCount = 6;
            const crystalSize = currentSize * 0.3;
            for (let i = 0; i < crystalCount; i++) {
                const angle = (i / crystalCount) * Math.PI * 2 + (this.pulseTimer / 1000);
                const offsetX = Math.cos(angle) * currentSize * 0.8;
                const offsetY = Math.sin(angle) * currentSize * 0.8;
                
                ctx.fillStyle = 'rgba(200, 240, 255, 0.6)';
                ctx.beginPath();
                ctx.moveTo(this.x + offsetX, this.y + offsetY - crystalSize);
                ctx.lineTo(this.x + offsetX + crystalSize/2, this.y + offsetY);
                ctx.lineTo(this.x + offsetX, this.y + offsetY + crystalSize);
                ctx.lineTo(this.x + offsetX - crystalSize/2, this.y + offsetY);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        // Speciální efekt záře pro bossy
        if (this.isBoss) {
            // Glow effect (záře) pro bossy
            const glowSize = this.glowSize * (1.0 + Math.sin(this.pulseTimer / this.pulseSpeed * Math.PI * 2) * 0.1);
            const glowGradient = ctx.createRadialGradient(
                this.x, this.y, currentSize * 0.5,
                this.x, this.y, glowSize
            );
            
            // Záře má stejnou barvu jako nepřítel, ale s průhledností
            glowGradient.addColorStop(0, this.color.replace(')', ', ' + this.glowOpacity + ')').replace('rgb', 'rgba'));
            glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }

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
        
        // Vykreslení speciálních prvků pro bossy
        if (this.isBoss) {
            this.drawBossFeatures(ctx, currentSize);
        }

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
        
        // Pro bossy přidáme štítek s názvem
        if (this.isBoss) {
            this.drawBossLabel(ctx, currentSize);
        }
    }
    
    // Nová metoda pro vykreslení speciálních prvků bossů
    drawBossFeatures(ctx, currentSize) {
        // Uložení aktuálního stavu kontextu
        ctx.save();
        
        // 1. Vykreslení koruny
        // Transformace kontextu pro rotaci koruny
        ctx.translate(this.x, this.y - currentSize);
        ctx.rotate(this.crownRotation);
        
        // Vykreslení koruny
        const crownWidth = currentSize * 0.8;
        const crownHeight = currentSize * 0.5;
        const crownX = -crownWidth / 2;
        const crownY = -crownHeight * 1.2;
        
        // Pozadí koruny
        ctx.fillStyle = '#ffd700'; // Zlatá barva
        ctx.beginPath();
        ctx.moveTo(crownX, crownY + crownHeight);
        ctx.lineTo(crownX + crownWidth * 0.2, crownY + crownHeight * 0.3);
        ctx.lineTo(crownX + crownWidth * 0.4, crownY + crownHeight);
        ctx.lineTo(crownX + crownWidth * 0.6, crownY + crownHeight * 0.3);
        ctx.lineTo(crownX + crownWidth * 0.8, crownY + crownHeight);
        ctx.lineTo(crownX + crownWidth, crownY + crownHeight * 0.3);
        ctx.lineTo(crownX + crownWidth, crownY + crownHeight);
        ctx.closePath();
        ctx.fill();
        
        // Okraj koruny
        ctx.strokeStyle = '#b8860b'; // Tmavší zlatá barva
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Body koruny - trojúhelníky
        ctx.fillStyle = '#ff5555'; // Červené body koruny
        for (let i = 0; i < 3; i++) {
            const pointX = crownX + crownWidth * (0.25 + i * 0.25);
            const pointY = crownY + crownHeight * 0.3;
            
            ctx.beginPath();
            ctx.arc(pointX, pointY, crownWidth * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Obnovení původního stavu kontextu
        ctx.restore();
        
        // 2. Přidání stínu pod bosse
        // Stín pod bossem pro zdůraznění
        ctx.beginPath();
        const shadowGradient = ctx.createRadialGradient(
            this.x, this.y + currentSize * 0.8, 0,
            this.x, this.y + currentSize * 0.8, currentSize * 1.5
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = shadowGradient;
        ctx.ellipse(this.x, this.y + currentSize * 0.8, currentSize * 1.5, currentSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Nová metoda pro vykreslení štítku s názvem bosse
    drawBossLabel(ctx, currentSize) {
        // Získání názvu bosse
        const bossConfig = bossTypes[this.enemyType];
        const bossName = bossConfig ? bossConfig.name : "BOSS";
        
        // Nastavení fontu a měření šířky textu
        ctx.font = 'bold 14px Arial';
        const textWidth = ctx.measureText(bossName).width;
        
        // Vykreslení pozadí štítku
        const padding = 4;
        const labelX = this.x - textWidth / 2 - padding;
        const labelY = this.y - currentSize - 20;
        const labelWidth = textWidth + padding * 2;
        const labelHeight = 20;
        const radius = 4; // Radius pro zaoblené rohy
        
        // Pozadí štítku s průhledností - implementace zaoblených rohů
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        
        // Místo ctx.roundRect použijeme vlastní implementaci zaoblených rohů
        // Kreslení po směru hodinových ručiček začínajícím od levého horního rohu
        // Levý horní roh
        ctx.moveTo(labelX + radius, labelY);
        // Horní hrana
        ctx.lineTo(labelX + labelWidth - radius, labelY);
        // Pravý horní roh
        ctx.arcTo(labelX + labelWidth, labelY, labelX + labelWidth, labelY + radius, radius);
        // Pravá hrana
        ctx.lineTo(labelX + labelWidth, labelY + labelHeight - radius);
        // Pravý dolní roh
        ctx.arcTo(labelX + labelWidth, labelY + labelHeight, labelX + labelWidth - radius, labelY + labelHeight, radius);
        // Dolní hrana
        ctx.lineTo(labelX + radius, labelY + labelHeight);
        // Levý dolní roh
        ctx.arcTo(labelX, labelY + labelHeight, labelX, labelY + labelHeight - radius, radius);
        // Levá hrana
        ctx.lineTo(labelX, labelY + radius);
        // Levý horní roh (dokončení)
        ctx.arcTo(labelX, labelY, labelX + radius, labelY, radius);
        
        ctx.closePath();
        ctx.fill();
        
        // Okraj štítku
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Vykreslení textu
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bossName, this.x, labelY + labelHeight / 2);
    }

    // New method to apply slow effect
    applySlowEffect(factor, duration) {
        // Only apply if the new slow is stronger or the current one is about to expire
        if (factor < this.slowFactor || this.slowDuration < 500) {
            this.slowFactor = factor;
            this.slowDuration = duration;
            this.isFrozen = true;
        }
    }

    update(deltaTime) {
        // Update pulse animation
        this.pulseTimer += deltaTime;
        
        // Update slow effect duration
        if (this.slowDuration > 0) {
            this.slowDuration -= deltaTime;
            if (this.slowDuration <= 0) {
                // Reset slow effect when duration expires
                this.slowFactor = 1.0;
                this.isFrozen = false;
            }
        }
        
        // Update damage amplifier duration
        if (this.damageAmplifier && this.damageAmplifier.duration > 0) {
            this.damageAmplifier.duration -= deltaTime;
            if (this.damageAmplifier.duration <= 0) {
                // Reset damage amplifier when duration expires
                this.damageAmplifier.factor = 1.0;
            }
        }
        
        this.move(deltaTime);
    }
}

export default Enemy; 