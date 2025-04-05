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
        this.baseTrailLength = 5; // Base trail length
        this.trailLength = Math.max(2, Math.round(this.baseTrailLength * gameState.projectileQuality)); // Adjust based on quality
        this.trail = [];
        
        // Speciální efekty projektilu
        this.specialEffects = specialEffects;
        
        // Vizuální modifikace pro speciální efekty
        if (specialEffects) {
            // Burn efekt - delší trail
            if (specialEffects.burnDamage) {
                this.baseTrailLength = 8;
                this.trailLength = Math.max(2, Math.round(this.baseTrailLength * gameState.projectileQuality));
                this.burnColor = '#ff5252'; // Červená barva pro burn efekt
            }
            
            // Armor piercing - větší projektil
            if (specialEffects.armorPiercing) {
                this.size = size * 1.2; // O 20% větší projektil
            }
            
            // For critical hits and headshots
            if (specialEffects.isCritical) {
                this.size = size * 1.3; // 30% larger projectile
                this.baseTrailLength = 8;
                this.trailLength = Math.max(2, Math.round(this.baseTrailLength * gameState.projectileQuality));
                this.isCritical = true;
                this.criticalColor = specialEffects.isHeadshot ? '#ff5500' : '#ffea00'; // Orange for headshot, yellow for critical
                this.criticalType = specialEffects.isHeadshot ? 'headshot' : 'critical';
            }
            
            // Chain lightning effect - longer trail
            if (specialEffects.chainLightning) {
                this.baseTrailLength = 12; // Extra long trail for electric effect
                this.trailLength = Math.max(2, Math.round(this.baseTrailLength * gameState.projectileQuality));
            }
            
            // Homing effect - initialize tracking angle
            if (specialEffects.homingEffect) {
                this.currentAngle = null; // Will be initialized on first move
            }
            
            // Freeze effect - ice particles
            if (specialEffects.freezeEffect) {
                this.baseTrailLength = 8; // Longer trail for ice effect
                this.trailLength = Math.max(2, Math.round(this.baseTrailLength * gameState.projectileQuality));
                this.freezeColor = '#80D8FF'; // Light blue for freeze effect
            }
            
            // Explosive rounds effect - explosive damage area
            if (specialEffects.explosiveRounds) {
                this.explosiveRounds = true;
                this.explosiveRadius = specialEffects.explosiveRounds.radius;
                this.explosiveDamageFactor = specialEffects.explosiveRounds.damageFactor;
                this.baseTrailLength = 8; // Longer trail for explosive effect
                this.trailLength = Math.max(2, Math.round(this.baseTrailLength * gameState.projectileQuality));
            }
            
            // Devastating blows effect - enhanced visuals for critical explosions
            if (specialEffects.devastatingBlows) {
                this.devastatingBlows = true;
            }
            
            // Pulsar area damage effect - apply area damage
            if (specialEffects.pulsarAreaDamage) {
                this.pulsarAreaDamage = true;
            }
            
            // Pulsar debuff effect - apply enemy debuff
            if (specialEffects.pulsarDebuff) {
                this.pulsarDebuff = true;
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
                // Display critical hit or headshot text
                if (this.specialEffects.isCritical) {
                    const isHeadshot = this.specialEffects.isHeadshot;
                    createFloatingText(
                        this.target.x,
                        this.target.y - this.target.size * 1.5,
                        isHeadshot ? 'HEADSHOT! x3' : 'CRITICAL! x2',
                        isHeadshot ? '#ff5500' : '#ffea00', // Orange for headshot, yellow for critical
                        isHeadshot ? 20 : 18, // Headshot is larger
                        1500
                    );
                }
                
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
                
                // Freeze effect - apply slow to target
                if (this.specialEffects.freezeEffect) {
                    this.applyFreezeEffect();
                }
                
                // Explosive rounds effect - apply area damage
                if (this.specialEffects.explosiveRounds) {
                    this.applyExplosiveRounds();
                }
                
                // Pulsar area damage effect - apply area damage
                if (this.specialEffects.pulsarAreaDamage) {
                    this.applyPulsarAreaDamage();
                }
                
                // Pulsar debuff effect - apply enemy debuff
                if (this.specialEffects.pulsarDebuff) {
                    this.applyPulsarDebuff();
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

    // Apply freeze effect to target and nearby enemies
    applyFreezeEffect() {
        if (!this.target || this.target.isDead) return;
        
        const freezeConfig = this.specialEffects.freezeEffect;
        const freezeFactor = freezeConfig.freezeFactor;
        const freezeDuration = freezeConfig.freezeDuration;
        
        // Apply slow effect to the target
        this.target.applySlowEffect(freezeFactor, freezeDuration);
        
        // Create freeze visual effect (ice particles)
        createParticles(
            this.target.x, 
            this.target.y, 
            this.freezeColor || '#80D8FF', 
            10, // Number of particles
            2,  // Speed 
            freezeDuration * 0.3, // Duration
            this.target.size * 0.3 // Size
        );
        
        // Create floating text indicator
        createFloatingText(
            this.target.x, 
            this.target.y - this.target.size, 
            `SLOWED ${Math.round((1-freezeFactor)*100)}%`, 
            '#40C4FF', // Blue color
            12, // Size
            1000 // Duration
        );
        
        // Check if we have area freeze effect (level 3)
        if (freezeConfig.areaFreeze) {
            const areaConfig = freezeConfig.areaFreeze;
            const areaRange = areaConfig.range;
            const areaFreezeFactor = areaConfig.freezeFactor;
            const areaFreezeDuration = areaConfig.freezeDuration;
            
            // Find nearby enemies within range
            const nearbyEnemies = gameState.enemies.filter(enemy => 
                !enemy.isDead && 
                enemy !== this.target && 
                distance(this.target.x, this.target.y, enemy.x, enemy.y) <= areaRange
            );
            
            // Apply area freeze effect to nearby enemies
            for (const enemy of nearbyEnemies) {
                enemy.applySlowEffect(areaFreezeFactor, areaFreezeDuration);
                
                // Create smaller visual effect for area freeze
                createParticles(
                    enemy.x, 
                    enemy.y, 
                    '#B3E5FC', // Lighter blue for area effect
                    5, // Fewer particles
                    1, // Slower
                    areaFreezeDuration * 0.2, // Shorter duration
                    enemy.size * 0.2 // Smaller size
                );
                
                // Create floating text indicator
                createFloatingText(
                    enemy.x, 
                    enemy.y - enemy.size, 
                    `SLOWED ${Math.round((1-areaFreezeFactor)*100)}%`, 
                    '#81D4FA', // Lighter blue color
                    10, // Smaller size
                    800 // Shorter duration
                );
            }
        }
    }

    // Apply explosive rounds effect - area damage at impact point
    applyExplosiveRounds() {
        if (!this.target || this.target.isDead) return;
        
        // Získání parametrů výbuchu
        const radius = this.explosiveRadius;
        const damageFactor = this.explosiveDamageFactor;
        
        // Hledání nepřátel v okolí výbuchu
        const nearbyEnemies = gameState.enemies.filter(enemy => 
            !enemy.isDead && 
            enemy !== this.target && // Ignorujeme hlavní cíl, ten už poškození dostal
            distance(this.target.x, this.target.y, enemy.x, enemy.y) <= radius
        );
        
        // Aplikace plošného poškození všem nepřátelům v okolí
        for (const enemy of nearbyEnemies) {
            // Čím blíže ke středu výbuchu, tím větší poškození
            const dist = distance(this.target.x, this.target.y, enemy.x, enemy.y);
            const distanceFactor = 1 - dist / radius;
            const areaDamage = Math.round(this.damage * damageFactor * distanceFactor);
            
            // Aplikace poškození
            enemy.takeDamage(areaDamage);
            
            // Vizuální efekt - číslo udávající poškození
            createFloatingText(
                enemy.x, 
                enemy.y - enemy.size, 
                `${areaDamage} 💥`, 
                '#FF5722', // Oranžová barva pro výbuch
                16, 
                1000
            );
        }
        
        // Vizuální efekt výbuchu
        const explosionSize = this.devastatingBlows && this.specialEffects.isCritical ? 1.5 : 1.0;
        const particleCount = this.devastatingBlows && this.specialEffects.isCritical ? 20 : 12;
        const explosionColor = this.devastatingBlows && this.specialEffects.isCritical ? '#FF3D00' : '#FF5722';
        
        // Efekt výbuchu pomocí částic
        createParticles(
            this.target.x, 
            this.target.y, 
            explosionColor, 
            particleCount, 
            5, 
            400, 
            radius * 0.1 * explosionSize
        );
        
        // Druhý set částic pro větší efekt
        createParticles(
            this.target.x, 
            this.target.y, 
            '#FFA726', // Světlejší oranžová pro kontrast
            particleCount / 2, 
            3, 
            300, 
            radius * 0.05 * explosionSize
        );
        
        // Vizuální efekt kruhu výbuchu
        this.createExplosionRing(this.target, radius);
    }
    
    // Create visual effect for explosion radius
    createExplosionRing(source, radius) {
        // Create expanding ring using the same technique as pulsar effect
        const steps = 6;
        
        for (let i = 1; i <= steps; i++) {
            setTimeout(() => {
                if (gameState.state === 'game_over' || gameState.state === 'victory') return;
                
                const currentRadius = (radius * i) / steps;
                const opacity = 1 - (i / steps);
                
                // Create particles around the circumference
                const particleCount = Math.floor(currentRadius / 4);
                const angleStep = (Math.PI * 2) / particleCount;
                
                for (let j = 0; j < particleCount; j++) {
                    const angle = j * angleStep;
                    const x = source.x + Math.cos(angle) * currentRadius;
                    const y = source.y + Math.sin(angle) * currentRadius;
                    
                    // Create particle for the ring effect
                    if (Math.random() > 0.5) { // Only create some particles for a more chaotic look
                        createParticles(
                            x, y, 
                            i % 2 === 0 ? '#FF5722' : '#FFA726', // Alternate colors
                            1, // Single particle at each point
                            0.5, // Low speed
                            200, // Short lifespan
                            2 * opacity // Size decreases with opacity
                        );
                    }
                }
            }, i * 40); // Stagger the rings
        }
    }
    
    // Apply pulsar area damage to nearby enemies
    applyPulsarAreaDamage() {
        if (!this.target || this.target.isDead) return;
        
        const areaConfig = this.specialEffects.pulsarAreaDamage;
        const areaRange = areaConfig.range;
        const damageFactor = areaConfig.damageFactor;
        
        // Find nearby enemies
        const nearbyEnemies = gameState.enemies.filter(enemy => 
            !enemy.isDead && 
            enemy !== this.target && 
            distance(this.target.x, this.target.y, enemy.x, enemy.y) <= areaRange
        );
        
        // Apply area damage
        for (const enemy of nearbyEnemies) {
            // Calculate damage for this enemy
            const areaDamage = Math.round(this.damage * damageFactor);
            
            // Apply damage
            enemy.takeDamage(areaDamage);
            
            // Visual effect - purple damage number
            createFloatingText(
                enemy.x, 
                enemy.y - enemy.size, 
                `${areaDamage} ✨`, 
                '#E040FB', // Bright purple
                16, 
                1000
            );
        }
        
        // Create visual effect for area damage
        this.createPulsarAreaEffect(this.target, areaRange);
    }
    
    // Apply pulsar debuff to the target
    applyPulsarDebuff() {
        if (!this.target || this.target.isDead) return;
        
        const debuffConfig = this.specialEffects.pulsarDebuff;
        
        // Apply debuff to target
        this.target.applySlowEffect(debuffConfig.slowFactor, debuffConfig.duration);
        
        // Store damage amplifier info on the target
        this.target.damageAmplifier = {
            factor: debuffConfig.damageAmplifier,
            duration: debuffConfig.duration
        };
        
        // Visual indicator of debuff application
        createFloatingText(
            this.target.x, 
            this.target.y - this.target.size * 1.5, 
            'WEAKENED!', 
            '#E040FB', // Bright purple
            16, 
            1500
        );
        
        // Create visual effect
        createParticles(
            this.target.x, 
            this.target.y, 
            '#E040FB', // Bright purple
            15, // Number of particles
            3,  // Speed 
            debuffConfig.duration * 0.3, // Duration
            this.target.size * 0.4 // Size
        );
    }
    
    // Create visual effect for pulsar area damage
    createPulsarAreaEffect(source, radius) {
        // Create expanding ring
        const steps = 10;
        const center = { x: source.x, y: source.y };
        
        for (let i = 1; i <= steps; i++) {
            setTimeout(() => {
                if (gameState.state === 'game_over' || gameState.state === 'victory') return;
                
                const currentRadius = (radius * i) / steps;
                const opacity = 1 - (i / steps);
                
                // Create particles around the circumference
                const particleCount = Math.floor(currentRadius / 5);
                const angleStep = (Math.PI * 2) / particleCount;
                
                for (let j = 0; j < particleCount; j++) {
                    const angle = j * angleStep;
                    const x = center.x + Math.cos(angle) * currentRadius;
                    const y = center.y + Math.sin(angle) * currentRadius;
                    
                    // Create particle for the ring effect
                    createParticles(
                        x, y, 
                        '#E040FB', // Bright purple
                        1, // Single particle at each point
                        0.1, // Very low speed (almost stationary)
                        300, // Short lifespan
                        3 * opacity // Size decreases with opacity
                    );
                }
            }, i * 50); // Stagger the rings
        }
    }

    draw(ctx) {
        // Check if toRemove flag is set
        if (this.toRemove) return;
        
        // Choose the appropriate drawing method based on special effects
        if (this.specialEffects) {
            if (this.specialEffects.chainLightning) {
                this.drawRailgunEffect(ctx);
                return;
            } else if (this.specialEffects.burnDamage) {
                this.drawBurnEffect(ctx);
                return;
            } else if (this.specialEffects.freezeEffect) {
                this.drawFreezeEffect(ctx);
                return;
            } else if (this.specialEffects.explosiveRounds) {
                this.drawExplosiveEffect(ctx);
                return;
            } else if (this.specialEffects.armorPiercing) {
                this.drawArmorPiercingEffect(ctx);
                return;
            } else if (this.specialEffects.isCritical) {
                this.drawCriticalEffect(ctx);
                return;
            } else if (this.specialEffects.pulsarAreaDamage) {
                this.drawPulsarEffect(ctx);
                return;
            }
        }
        
        // Standard projectile drawing if no special effects
        this.drawStandard(ctx);
    }
    
    // Draw method for railgun projectiles
    drawRailgunEffect(ctx) {
        const quality = gameState.projectileQuality;
        
        // Draw a longer, more electric trail
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = point.alpha * 0.7;
            
            if (quality > 0.5) {
                // Higher quality: Electric gradient
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
            } else {
                // Lower quality: Simple blue circle
                ctx.globalAlpha = alpha;
                ctx.fillStyle = `rgba(0, 160, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(point.x, point.y, this.size * point.alpha, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw main projectile with appropriate quality
        if (quality > 0.5) {
            // Higher quality: Full electric effect
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
        } else {
            // Lower quality: Simplified rendering
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'rgba(0, 200, 255, 1)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
            ctx.fill();
            
            if (quality > 0.3) {
                // Medium quality: Add simple core
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Standardní vykreslení projektilu
    drawStandard(ctx) {
        const quality = gameState.projectileQuality;
        
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

        // Add a brighter core/outline - skip at very low quality
        if (quality > 0.3) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
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

    // Draw icy effect
    drawFreezeEffect(ctx) {
        // Draw trail with ice colors
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = point.alpha * 0.7;
            
            // Ice gradient
            const gradient = ctx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, this.size * point.alpha * 1.2
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`); // White core
            gradient.addColorStop(0.5, `rgba(100, 200, 255, ${alpha})`); // Light blue middle
            gradient.addColorStop(1, `rgba(0, 120, 220, 0)`); // Fade to transparent
            
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.size * point.alpha * 1.2, 0, Math.PI * 2);
            ctx.fill(); 
        }
        
        // Draw main projectile with ice effect
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 1.5
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // White center
        gradient.addColorStop(0.4, 'rgba(100, 200, 255, 0.8)'); // Light blue middle
        gradient.addColorStop(1, 'rgba(0, 120, 220, 0)'); // Fade to transparent
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Add ice crystal core
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        
        // Draw hexagon for crystal shape
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const x = this.x + Math.cos(angle) * this.size * 0.7;
            const y = this.y + Math.sin(angle) * this.size * 0.7;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
    }

    // Draw pulsar energy projectile
    drawPulsarEffect(ctx) {
        // Draw trail with energy pulse effect
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = point.alpha * 0.8;
            
            // Energy pulse gradient
            const gradient = ctx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, this.size * point.alpha * 1.5
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`); // White core
            gradient.addColorStop(0.5, `rgba(224, 64, 251, ${alpha * 0.7})`); // Purple middle
            gradient.addColorStop(1, `rgba(103, 58, 183, 0)`); // Transparent outer
            
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.size * point.alpha * 1.5, 0, Math.PI * 2);
            ctx.fill(); 
        }
        
        // Draw main projectile with energy pulse effect
        const pulseScale = 0.8 + 0.2 * Math.sin(Date.now() / 100); // Pulsating effect
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 2 * pulseScale
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); // Bright white center
        gradient.addColorStop(0.3, 'rgba(224, 64, 251, 0.8)'); // Bright purple middle
        gradient.addColorStop(1, 'rgba(103, 58, 183, 0)'); // Transparent outer
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2 * pulseScale, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner bright core
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Energy particles
        const particleCount = 4;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + Date.now() / 200;
            const distance = this.size * 1.2;
            const particleX = this.x + Math.cos(angle) * distance;
            const particleY = this.y + Math.sin(angle) * distance;
            
            ctx.fillStyle = 'rgba(224, 64, 251, 0.7)';
            ctx.beginPath();
            ctx.arc(particleX, particleY, this.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Add new method to draw critical hit projectile
    drawCriticalEffect(ctx) {
        // Draw trail with critical colors
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = point.alpha * 0.8;
            
            // Critical gradient
            const gradient = ctx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, this.size * point.alpha * 1.4
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`); // White core
            gradient.addColorStop(0.3, `${this.criticalColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba')}`); // Critical color middle
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)'); // Fade to transparent
            
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.size * point.alpha * 1.4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw main projectile with glowing effect
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // White center
        gradient.addColorStop(0.3, this.criticalColor); // Critical color middle
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)'); // Fade to transparent
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add bright core
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Add pulsing ring for extra effect
        const ringSize = this.size * (1.5 + Math.sin(Date.now() * 0.01) * 0.3);
        ctx.strokeStyle = this.criticalColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, ringSize, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw method for explosive projectiles
    drawExplosiveEffect(ctx) {
        const quality = gameState.projectileQuality;
        
        // Draw the trail first (underneath the projectile)
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = point.alpha * 0.8;
            
            if (quality > 0.5) {
                // High quality: Fiery gradient for trail
                const gradient = ctx.createRadialGradient(
                    point.x, point.y, 0,
                    point.x, point.y, this.size * point.alpha
                );
                gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha * 0.8})`); // Bright yellow core
                gradient.addColorStop(0.5, `rgba(255, 120, 0, ${alpha * 0.6})`); // Orange middle
                gradient.addColorStop(1, `rgba(255, 0, 0, 0)`); // Fade to transparent red
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(point.x, point.y, this.size * point.alpha, 0, Math.PI * 2);
                ctx.fill();
                
                // Add glowing particles randomly to the trail - only at high quality
                if (quality > 0.7 && Math.random() > 0.7) {
                    const particleSize = this.size * 0.3 * point.alpha;
                    const offsetX = (Math.random() - 0.5) * this.size * 1.5;
                    const offsetY = (Math.random() - 0.5) * this.size * 1.5;
                    
                    ctx.fillStyle = `rgba(255, 165, 0, ${alpha * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(point.x + offsetX, point.y + offsetY, particleSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Lower quality: Simple orange circles
                ctx.fillStyle = `rgba(255, 120, 0, ${alpha * 0.7})`;
                ctx.beginPath();
                ctx.arc(point.x, point.y, this.size * point.alpha * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw the projectile with appropriate quality
        if (quality > 0.5) {
            // Higher quality: Full explosive appearance
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size * 1.5
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); // Bright center
            gradient.addColorStop(0.3, 'rgba(255, 255, 0, 0.8)'); // Yellow
            gradient.addColorStop(0.7, 'rgba(255, 120, 0, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)'); // Fade to transparent red
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Core of the projectile
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a pulsating effect for devastating blows - only at high quality
            if (quality > 0.7 && this.devastatingBlows && this.specialEffects.isCritical) {
                const pulseSize = (Math.sin(Date.now() / 100) + 1) * 0.3 + 0.7; // 0.7 to 1.3
                
                // Outer glow for devastating projectiles
                const outerGradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.size * 2.5 * pulseSize
                );
                outerGradient.addColorStop(0, 'rgba(255, 120, 0, 0)');
                outerGradient.addColorStop(0.7, 'rgba(255, 60, 0, 0.3)');
                outerGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                
                ctx.fillStyle = outerGradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2.5 * pulseSize, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Lower quality: Simple orange projectile
            ctx.fillStyle = 'rgba(255, 120, 0, 0.9)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
            ctx.fill();
            
            // Simple core at medium quality
            if (quality > 0.3) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

export default Projectile; 