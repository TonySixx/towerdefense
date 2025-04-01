// Projectile Class
import { distance } from '../utils.js';
import Particle from './Particle.js';
import { createParticles, createFloatingText, gameState } from '../gameLogic.js';
import { triggerScreenFlash } from '../renderers.js';

class Projectile {
    constructor(startX, startY, targetEnemy, damage, speed, color, size, specialEffects = null) {
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
        
        // Speciální efekty projektilu
        this.specialEffects = specialEffects;
        
        // Vizuální modifikace pro speciální efekty
        if (specialEffects) {
            // Burn efekt - delší trail
            if (specialEffects.burnDamage) {
                this.trailLength = 8;
                this.burnColor = '#ff5252'; // Červená barva pro burn efekt
            }
            
            // Armor piercing - větší projektil
            if (specialEffects.armorPiercing) {
                this.size = size * 1.2; // O 20% větší projektil
            }
            
            // Chain lightning effect - longer trail
            if (specialEffects.chainLightning) {
                this.trailLength = 12; // Extra long trail for electric effect
            }
            
            // Homing effect - initialize tracking angle
            if (specialEffects.homingEffect) {
                this.currentAngle = null; // Will be initialized on first move
            }
        }
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
            // Direction vector toward target
            let dirX = dx / dist;
            let dirY = dy / dist;
            
            // Apply homing effect if available
            if (this.specialEffects && this.specialEffects.homingEffect) {
                const strength = this.specialEffects.homingEffect.trackingStrength;
                
                // Initialize current angle on first frame
                if (!this.currentAngle) {
                    this.currentAngle = Math.atan2(dirY, dirX);
                }
                
                // Get current direction vector
                let currentDirX = Math.cos(this.currentAngle);
                let currentDirY = Math.sin(this.currentAngle);
                
                // Interpolate between current direction and ideal direction
                dirX = currentDirX * (1 - strength) + dirX * strength;
                dirY = currentDirY * (1 - strength) + dirY * strength;
                
                // Normalize
                const dirMag = Math.sqrt(dirX * dirX + dirY * dirY);
                dirX /= dirMag;
                dirY /= dirMag;
                
                // Update current angle
                this.currentAngle = Math.atan2(dirY, dirX);
            }
            
            this.x += dirX * moveDistance;
            this.y += dirY * moveDistance;
        }
    }

    hitTarget() {
        if (!this.toRemove && this.target && !this.target.isDead) {
            // Výpočet poškození se speciálními efekty
            let finalDamage = this.damage;
            
            // Aplikace efektů při zásahu
            if (this.specialEffects) {
                // Armor piercing - ignoruje část armor nepřítele
                if (this.specialEffects.armorPiercing) {
                    // Případná implementace armor systému
                    // Pro budoucí vylepšení
                }
                
                // Burn efekt - vytvoří vizuální efekt hoření
                if (this.specialEffects.burnDamage && this.specialEffects.burnDuration) {
                    this.applyBurnEffect();
                }
                
                // Chain lightning effect - apply before target is damaged
                if (this.specialEffects.chainLightning) {
                    this.applyChainLightning();
                }
            }
            
            // Pass onDeath callback to display floating money text
            this.target.takeDamage(finalDamage, (x, y, value) => {
                // Create death explosion particles
                createParticles(x, y, this.target.color, 15, 4, 500, this.target.size * 0.5);
                
                // Create gold coin effect
                Particle.createGoldCoins(gameState, x, y, 6 + Math.floor(value / 3));
                
                // Create floating money text - larger size, vibrant gold color and longer duration
                createFloatingText(
                    x, 
                    y - this.target.size - 5, 
                    `+${value}`, 
                    '#ffdf00', // More vibrant gold color
                    20, // Larger text size
                    3000 // Longer duration
                );
                
                // Trigger more noticeable gold screen flash
                triggerScreenFlash(`rgba(255, 215, 0, 0.15)`, 0.15);
            });
            
            this.toRemove = true;
        }
    }
    
    // Apply chain lightning effect to nearby enemies
    applyChainLightning() {
        if (!this.target || this.target.isDead) return;
        
        const chainConfig = this.specialEffects.chainLightning;
        const chainRange = chainConfig.range;
        const chainDamage = chainConfig.damage;
        const maxTargets = chainConfig.targets;
        
        // Find nearby enemies for chain effect
        const nearbyEnemies = gameState.enemies.filter(enemy => 
            !enemy.isDead && 
            enemy !== this.target && 
            distance(this.target.x, this.target.y, enemy.x, enemy.y) <= chainRange
        );
        
        // Sort by distance
        nearbyEnemies.sort((a, b) => {
            const distA = distance(this.target.x, this.target.y, a.x, a.y);
            const distB = distance(this.target.x, this.target.y, b.x, b.y);
            return distA - distB;
        });
        
        // Get closest enemies up to max targets
        const chainTargets = nearbyEnemies.slice(0, maxTargets);
        
        // Apply chain effect to targets
        for (const enemy of chainTargets) {
            // Apply damage
            enemy.takeDamage(chainDamage);
            
            // Visual effects
            createFloatingText(
                enemy.x, 
                enemy.y - enemy.size, 
                `${chainDamage} ⚡`, 
                '#00E5FF', // Electric blue
                16, 
                1000
            );
            
            // Create lightning effect
            this.createLightningEffect(this.target, enemy);
        }
    }
    
    // Create visual lightning effect between two points
    createLightningEffect(source, target) {
        // Create lightning path from source to target
        const steps = 5;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        
        // Create lightning path with random offsets
        for (let i = 0; i <= steps; i++) {
            // Calculate point position with zigzag effect
            const t = i / steps;
            const pointX = source.x + dx * t + (Math.random() - 0.5) * 20 * (i > 0 && i < steps);
            const pointY = source.y + dy * t + (Math.random() - 0.5) * 20 * (i > 0 && i < steps);
            
            // Create particles at each point
            createParticles(
                pointX,
                pointY,
                '#00E5FF', // Electric blue
                3, // Fewer particles per point
                3,
                200,
                2
            );
        }
    }
    
    // Nová metoda pro aplikaci burn efektu
    applyBurnEffect() {
        if (!this.target || this.target.isDead) return;
        
        // Vytvoření efektu hoření pomocí částic
        createParticles(
            this.target.x, 
            this.target.y, 
            this.burnColor || '#ff5252', 
            8, // Počet částic
            3, // Rychlost
            this.specialEffects.burnDuration, // Trvání
            this.target.size * 0.4 // Velikost
        );
        
        // Vytvoření plovoucího textu pro burn damage
        createFloatingText(
            this.target.x, 
            this.target.y - this.target.size - 10, 
            `${this.specialEffects.burnDamage} 🔥`, 
            '#ff5252', 
            16, 
            1500
        );
        
        // Aplikace burn damage po čase
        let burnTicks = 4; // Počet ticků burn efektu
        let tickDamage = this.specialEffects.burnDamage / burnTicks;
        let tickInterval = this.specialEffects.burnDuration / burnTicks;
        
        // Funkce pro aplikaci burn damage v čase
        const applyBurnDamage = () => {
            if (this.target && !this.target.isDead && !this.target.reachedEnd) {
                this.target.takeDamage(tickDamage);
                
                // Vytvoření malého efektu hoření
                createParticles(
                    this.target.x + (Math.random() - 0.5) * this.target.size,
                    this.target.y + (Math.random() - 0.5) * this.target.size,
                    '#ff5252',
                    3,
                    2,
                    500,
                    2
                );
                
                burnTicks--;
                if (burnTicks > 0) {
                    setTimeout(applyBurnDamage, tickInterval);
                }
            }
        };
        
        // Spuštění první iterace burn damage po čase
        setTimeout(applyBurnDamage, tickInterval);
    }

    draw(ctx) {
        // Speciální vykreslení pro burn efekt
        if (this.specialEffects && this.specialEffects.burnDamage) {
            this.drawBurnEffect(ctx);
        } else if (this.specialEffects && this.specialEffects.armorPiercing) {
            this.drawArmorPiercingEffect(ctx);
        } else if (this.specialEffects && (this.specialEffects.chainLightning || this.specialEffects.homingEffect)) {
            this.drawRailgunEffect(ctx);
        } else {
            // Standardní vykreslení
            this.drawStandard(ctx);
        }
    }
    
    // Draw method for railgun projectiles
    drawRailgunEffect(ctx) {
        // Draw a longer, more electric trail
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = point.alpha * 0.7;
            
            // Electric gradient
            const gradient = ctx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, this.size * point.alpha * 1.5
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`); // White core
            gradient.addColorStop(0.5, `rgba(0, 229, 255, ${alpha * 0.8})`); // Cyan middle
            gradient.addColorStop(1, `rgba(0, 128, 255, 0)`); // Fade to transparent
            
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.size * point.alpha * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw main projectile with electric effect
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // White center
        gradient.addColorStop(0.4, 'rgba(0, 229, 255, 0.8)'); // Cyan middle
        gradient.addColorStop(1, 'rgba(0, 128, 255, 0)'); // Fade to transparent
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add electric core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Standardní vykreslení projektilu
    drawStandard(ctx) {
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
    
    // Vykreslení burn efektu
    drawBurnEffect(ctx) {
        // Draw trail with fire colors
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = point.alpha * 0.7;
            
            // Fire gradient
            const gradient = ctx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, this.size * point.alpha * 1.2
            );
            gradient.addColorStop(0, `rgba(255, 255, 100, ${alpha})`); // Yellow core
            gradient.addColorStop(0.5, `rgba(255, 80, 80, ${alpha})`); // Red middle
            gradient.addColorStop(1, `rgba(180, 0, 0, 0)`); // Transparent outer
            
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.size * point.alpha * 1.2, 0, Math.PI * 2);
            ctx.fill(); 
        }
        
        // Draw main projectile
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 1.5
        );
        gradient.addColorStop(0, 'rgba(255, 255, 200, 1)'); // Bright yellow center
        gradient.addColorStop(0.6, 'rgba(255, 80, 0, 0.8)'); // Orange middle
        gradient.addColorStop(1, 'rgba(180, 0, 0, 0)'); // Transparent outer
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright core
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Vykreslení armor piercing efektu
    drawArmorPiercingEffect(ctx) {
        // Draw trail with blue pierce colors
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            ctx.globalAlpha = point.alpha * 0.6;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            // Trail points are elongated for penetration effect
            ctx.ellipse(
                point.x, 
                point.y, 
                this.size * point.alpha, 
                this.size * point.alpha * 2, 
                Math.atan2(this.y - point.y, this.x - point.x), 
                0, 
                Math.PI * 2
            );
            ctx.fill(); 
        }
        ctx.globalAlpha = 1.0;

        // Draw main projectile - elongated
        const angle = Math.atan2(this.target ? this.target.y - this.y : 0, this.target ? this.target.x - this.x : 1);
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size, this.size * 2, angle, 0, Math.PI * 2);
        ctx.fill();

        // Add a metallic sheen
        ctx.fillStyle = 'rgba(220, 220, 255, 0.8)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size * 0.4, this.size * 0.8, angle, 0, Math.PI * 2);
        ctx.fill();
    }
}

export default Projectile; 