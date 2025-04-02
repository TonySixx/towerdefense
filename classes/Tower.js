// Tower Class
import { getCanvasCoords, distance } from '../utils.js';
import { towerTypes, TILE_SIZE, towerStatus } from '../constants.js';
import Projectile from './Projectile.js';

class Tower {
    constructor(gridX, gridY, type, level = 1) {
        this.gridX = gridX;
        this.gridY = gridY;
        const canvasCoords = getCanvasCoords(gridX, gridY);
        this.x = canvasCoords.x;
        this.y = canvasCoords.y;
        this.type = type;
        this.level = level; // Úroveň věže (1-3)
        
        // Speciální efekty
        this.visualEffects = {};

        // Načtení statistik podle úrovně
        this.loadLevelStats();

        // Stav věže
        this.isSelected = false;
        this.isUpgrading = false;
        this.isSelling = false;

        // Animation properties
        this.shootAnimTimer = 0;
        this.shootAnimDuration = 100; // ms
        this.angle = 0; // Angle towards target



        // Pro kritické zásahy (kulomet level 3)
        this.lastHitWasCritical = false;
        
        // Pro vylepšení, která potřebují další animace
        this.effectsTimers = {
            scopeAnimation: 0,
            laserBeamOpacity: 0
        };
        
        // Cooldown pro střelbu - inicializace na 0, aby věž mohla ihned střílet
        this.cooldown = 0;
        
        // Cíl pro střelbu
        this.target = null;
    }
    
    // Načtení statistik podle aktuální úrovně
    loadLevelStats() {
        // Získání konfigurace pro aktuální typ a level
        const levelData = towerTypes[this.type].levels[this.level - 1];
        
        // Nastavení základních vlastností
        this.stats = { ...levelData }; // Copy for potential modifications
        this.range = this.stats.range;
        this.damage = this.stats.damage;
        this.fireRate = this.stats.fireRate;
        this.projectileSpeed = this.stats.projectileSpeed;
        this.projectileColor = this.stats.projectileColor;
        this.projectileSize = this.stats.projectileSize;
        this.cost = this.stats.cost;
        this.sellValue = this.stats.sellValue;
        this.upgradePrice = this.stats.upgradePrice;
        
        // Speciální efekty a funkce pro daný level
        if (levelData.extraFeatures) {
            this.visualEffects = { ...levelData.extraFeatures };
        }
    }
    
    // Vylepšení věže na další úroveň
    upgrade() {
        // Kontrola, zda je možné věž upgradovat
        if (!this.canUpgrade()) {
            return false;
        }
        
        // Zvýšení úrovně
        this.level++;
        
        // Načtení nových statistik
        this.loadLevelStats();
        
        return true;
    }
    
    // Kontrola, zda je možné věž vylepšit
    canUpgrade() {
        // Maximální úroveň je 3
        if (this.level >= 3) {
            return false;
        }
        
        // Kontrola, zda je definována další úroveň
        return this.level < towerTypes[this.type].levels.length;
    }
    
    // Získání ceny upgradu
    getUpgradePrice() {
        return this.upgradePrice;
    }
    
    // Získání prodejní hodnoty
    getSellValue() {
        return this.sellValue;
    }
    
    // Nastavení stavu věže
    setSelected(isSelected) {
        this.isSelected = isSelected;
    }
    
    setUpgrading(isUpgrading) {
        this.isUpgrading = isUpgrading;
    }
    
    setSelling(isSelling) {
        this.isSelling = isSelling;
    }

    findTarget(enemies) {
        this.target = null;
        let closestDist = this.range + 1;

        // First try to find any target
        for (const enemy of enemies) {
            if (enemy.isDead) continue;
            const dist = distance(this.x, this.y, enemy.x, enemy.y);
            if (dist <= this.range && dist < closestDist) {
                this.target = enemy;
                closestDist = dist;
            }
        }

        // Keep targeting if still in range
        if (this.target && (this.target.isDead || distance(this.x, this.y, this.target.x, this.target.y) > this.range)) {
            this.target = null;
        }

        // Find new if needed
        if (!this.target) {
            closestDist = this.range + 1;
            for (const enemy of enemies) {
                if (enemy.isDead) continue;
                const dist = distance(this.x, this.y, enemy.x, enemy.y);
                if (dist <= this.range && dist < closestDist) {
                    this.target = enemy;
                    closestDist = dist;
                }
            }
        }
    }

    shoot(deltaTime, projectiles, createParticlesFn) {
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }

        // Update angle if target exists
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            this.angle = Math.atan2(dy, dx);
        }

        if (this.cooldown <= 0 && this.target && !this.target.isDead) {
            // Resetování příznaku kritického zásahu
            this.lastHitWasCritical = false;
            
            // Výpočet aktuálního poškození podle speciálních efektů
            let currentDamage = this.damage;
            
            // Critical hit pro kulomet level 3
            if (this.visualEffects.criticalChance && Math.random() < this.visualEffects.criticalChance) {
                currentDamage *= 2;
                this.lastHitWasCritical = true;
            }
            
            // Headshot pro odstřelovač level 3
            if (this.visualEffects.headshotChance && Math.random() < this.visualEffects.headshotChance) {
                currentDamage *= 3;
                this.lastHitWasCritical = true;
            }

            
            // Calculate spawn position at the tip of the gun based on angle
            const gunLength = TILE_SIZE * 0.4;
            const projStartX = this.x + Math.cos(this.angle) * gunLength;
            const projStartY = this.y + Math.sin(this.angle) * gunLength;
            
            // Střelba podle typu věže a úrovně
            if (this.visualEffects.doubleBarrel) {
                
            let specialEffects = {};
            if (this.lastHitWasCritical) {
              specialEffects = {
                isCritical: true,
              };
            }
                // Dvojitá hlaveň - střílí dva projektily současně
                const offset = 5; // Offset pro druhý projektil
                const offsetX = Math.cos(this.angle + Math.PI/2) * offset;
                const offsetY = Math.sin(this.angle + Math.PI/2) * offset;
                
                // První projektil
                projectiles.push(new Projectile(
                    projStartX + offsetX, 
                    projStartY + offsetY, 
                    this.target, 
                    currentDamage, 
                    this.projectileSpeed, 
                    this.projectileColor, 
                    this.projectileSize,
                    specialEffects
                ));
                
                // Druhý projektil
                projectiles.push(new Projectile(
                    projStartX - offsetX, 
                    projStartY - offsetY, 
                    this.target, 
                    currentDamage, 
                    this.projectileSpeed, 
                    this.projectileColor, 
                    this.projectileSize,
                    specialEffects
                ));
            } else if (this.visualEffects.dualBeam) {
                // Duální laser - střílí dva projektily za sebou rychle
                projectiles.push(new Projectile(
                    projStartX, projStartY, 
                    this.target, 
                    currentDamage, 
                    this.projectileSpeed, 
                    this.projectileColor, 
                    this.projectileSize,
                    this.visualEffects.burnEffect ? { burnDamage: 2, burnDuration: 2000 } : null
                ));
                
                // Druhý projektil bude vystřelen za 100ms
                setTimeout(() => {
                    if (this.target && !this.target.isDead) {
                        projectiles.push(new Projectile(
                            projStartX, projStartY, 
                            this.target, 
                            currentDamage * 0.5, 
                            this.projectileSpeed, 
                            this.projectileColor, 
                            this.projectileSize,
                            this.visualEffects.burnEffect ? { burnDamage: 1, burnDuration: 1000 } : null
                        ));
                    }
                }, 100);
            } else {
                // Standardní střelba
                // Build special effects object for the projectile
                let specialEffects = null;
                
                // Add burn effect if present
                if (this.visualEffects.burnEffect) {
                    specialEffects = specialEffects || {};
                    specialEffects.burnDamage = 2;
                    specialEffects.burnDuration = 2000;
                }
                
                // Add armor piercing if present
                if (this.visualEffects.armorPiercing) {
                    specialEffects = specialEffects || {};
                    specialEffects.armorPiercing = this.visualEffects.armorPiercing;
                }
                
                // Add critical hit properties if it was a critical hit
                if (this.lastHitWasCritical) {
                    specialEffects = specialEffects || {};
                    specialEffects.isCritical = true;
                    // Check if it was a headshot (sniper) or a normal critical (machine gun)
                    specialEffects.isHeadshot = this.visualEffects.headshotChance ? true : false;
                }
                
                // Add chain lightning effect if present
                if (this.visualEffects.chainLightning) {
                    specialEffects = specialEffects || {};
                    specialEffects.chainLightning = this.visualEffects.chainLightning;
                }
                
                // Add homing effect if present
                if (this.visualEffects.homingEffect) {
                    specialEffects = specialEffects || {};
                    specialEffects.homingEffect = this.visualEffects.homingEffect;
                }

                // Add freeze effect if present
                if (this.visualEffects.freezeEffect) {
                    specialEffects = specialEffects || {};
                    specialEffects.freezeEffect = this.visualEffects.freezeEffect;
                }

                if (this.visualEffects.pulsarAreaDamage) {
                    specialEffects = specialEffects || {};
                    specialEffects.pulsarAreaDamage = this.visualEffects.pulsarAreaDamage;
                }
                if (this.visualEffects.pulsarDebuff) {
                    specialEffects = specialEffects || {};
                    specialEffects.pulsarDebuff = this.visualEffects.pulsarDebuff;
                }
                
                projectiles.push(new Projectile(
                    projStartX, projStartY, 
                    this.target, 
                    currentDamage, 
                    this.projectileSpeed, 
                    this.projectileColor, 
                    this.projectileSize,
                    specialEffects
                ));
            }
            
            this.cooldown = this.fireRate;
            this.shootAnimTimer = this.shootAnimDuration; // Start shoot animation
            
            // Spuštění animace pro speciální efekty
            if (this.visualEffects.scope) {
                this.effectsTimers.scopeAnimation = 500; // Trvání animace zaměřovače
            }
            
            if (this.visualEffects.laserBeam) {
                this.effectsTimers.laserBeamOpacity = 300; // Trvání efektu laseru
            }

            // Muzzle flash particle effect - if provided
            if (createParticlesFn) {
                const particleCount = this.lastHitWasCritical ? 5 : 1;
                const particleColor = this.lastHitWasCritical ? '#ffea00' : this.projectileColor;
                createParticlesFn(projStartX, projStartY, particleColor, particleCount, 3, 200, 3);
            }
        }
    }

    update(deltaTime, enemies, projectiles, createParticlesFn) {
        if (this.shootAnimTimer > 0) {
            this.shootAnimTimer -= deltaTime;
        }
        
        // Aktualizace časovačů efektů
        for (const timerKey in this.effectsTimers) {
            if (this.effectsTimers[timerKey] > 0) {
                this.effectsTimers[timerKey] -= deltaTime;
            }
        }
        
        this.findTarget(enemies);
        this.shoot(deltaTime, projectiles, createParticlesFn);
    }

    draw(ctx, placingTower, selectedTowerType, mouseGridX, mouseGridY) {
        const baseRadius = TILE_SIZE * 0.4;
        const topRadius = TILE_SIZE * 0.3;
        const gunLength = TILE_SIZE * 0.45;
        const gunWidth = TILE_SIZE * 0.15;

        // Calculate recoil effect for shooting animation
        const shootOffset = this.shootAnimTimer > 0 
            ? Math.sin((this.shootAnimDuration - this.shootAnimTimer) / this.shootAnimDuration * Math.PI) * 3 
            : 0;

        ctx.save(); // Save context state
        ctx.translate(this.x, this.y); // Move origin to tower center
        ctx.rotate(this.angle + Math.PI / 2); // Rotate tower to face target (add PI/2 because 0 angle is right)

        // Base gradient
        const baseGrad = ctx.createLinearGradient(0, -baseRadius, 0, baseRadius);
        baseGrad.addColorStop(0, this.stats.colorTop); // Lighter top
        baseGrad.addColorStop(1, this.stats.colorBase); // Darker base

        // Metalický efekt pro vylepšené věže
        if (this.visualEffects.metallic) {
            // Přidání lesku pro metalický efekt
            baseGrad.addColorStop(0.3, this.stats.colorTop); // Světlejší pruh pro efekt lesku
            baseGrad.addColorStop(0.32, this.stats.colorBase);
            baseGrad.addColorStop(0.5, this.stats.colorBase);
            baseGrad.addColorStop(0.7, this.stats.colorTop); // Druhý světlejší pruh
            baseGrad.addColorStop(0.72, this.stats.colorBase);
        }

        // Base Circle
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333'; // Outline
        ctx.lineWidth = 1;
        ctx.stroke();

        // Vykreslení zaměřovače pro odstřelovače
        if (this.visualEffects.scope && this.effectsTimers.scopeAnimation > 0) {
            const scopeOpacity = this.effectsTimers.scopeAnimation / 500; // Průhlednost podle zbývajícího času
            ctx.strokeStyle = `rgba(0, 255, 0, ${scopeOpacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            // Horizontální čára zaměřovače
            ctx.moveTo(-baseRadius * 1.5, 0);
            ctx.lineTo(baseRadius * 1.5, 0);
            
            // Vertikální čára zaměřovače
            ctx.moveTo(0, -baseRadius * 1.5);
            ctx.lineTo(0, baseRadius * 1.5);
            
            // Kruhy zaměřovače
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, baseRadius * 0.7, 0, Math.PI * 2);
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, baseRadius * 1.2, 0, Math.PI * 2);
            
            ctx.stroke();
        }

        // Gun Barrel (rectangle) - Apply recoil offset and level-specific modifications
        if (this.visualEffects.doubleBarrel) {
            // Dvojitá hlaveň pro kulomet level 2 a 3
            const gunOffset = 5; // Offset mezi hlavněmi
            
            // První hlaveň
            ctx.fillStyle = this.stats.colorGun;
            ctx.fillRect(-gunWidth/2 - gunOffset, -topRadius - shootOffset, gunWidth, -gunLength);
            
            // Druhá hlaveň
            ctx.fillRect(-gunWidth/2 + gunOffset, -topRadius - shootOffset, gunWidth, -gunLength);
            
            // Konec hlavní
            ctx.fillStyle = this.stats.colorTop;
            ctx.fillRect(-gunWidth/2 - gunOffset - 1, -topRadius - shootOffset - gunLength - 2, gunWidth + 2, 4);
            ctx.fillRect(-gunWidth/2 + gunOffset - 1, -topRadius - shootOffset - gunLength - 2, gunWidth + 2, 4);
            
        } else {
            // Standardní nebo laserová hlaveň
            const gunX = -gunWidth / 2;
            const gunY = -topRadius - shootOffset; // Apply offset upwards relative to rotated tower
            
            ctx.fillStyle = this.stats.colorGun;
            ctx.fillRect(gunX, gunY, gunWidth, -gunLength); // Negative height to draw upwards

            // Barrel Tip / Detail
            ctx.fillStyle = this.stats.colorTop;
            ctx.fillRect(gunX - 1, gunY - gunLength - 2, gunWidth + 2, 4); // Small horizontal bar at the end
            
            // Speciální vykreslení pro laserovou věž
            if (this.visualEffects.laserBeam && this.effectsTimers.laserBeamOpacity > 0 && this.target) {
                ctx.restore(); // Restore context to original state
                
                // Vykreslení laserového paprsku
                const beamOpacity = this.effectsTimers.laserBeamOpacity / 300;
                const beamColor = this.projectileColor.replace('rgb', 'rgba').replace(')', `, ${beamOpacity})`);
                
                ctx.beginPath();
                ctx.moveTo(this.x + Math.cos(this.angle) * gunLength, this.y + Math.sin(this.angle) * gunLength);
                
                // Pokud máme cíl, paprsek směřuje k cíli
                if (this.target && !this.target.isDead) {
                    ctx.lineTo(this.target.x, this.target.y);
                } else {
                    // Jinak paprsek směřuje v aktuálním úhlu
                    const endX = this.x + Math.cos(this.angle) * this.range;
                    const endY = this.y + Math.sin(this.angle) * this.range;
                    ctx.lineTo(endX, endY);
                }
                
                ctx.strokeStyle = beamColor;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Zpět na saved context
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle + Math.PI / 2);
            }
        }

        // Special drawing for Pulsar tower
        if (this.type === 'pulsar') {
            // Draw energy core in the center
            const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 0.6);
            coreGradient.addColorStop(0, '#E040FB'); // Bright purple center
            coreGradient.addColorStop(0.7, '#9C27B0'); // Darker purple
            coreGradient.addColorStop(1, '#673AB7'); // Base purple
            
            // Create pulsating effect based on time
            const pulseScale = 0.8 + 0.2 * Math.sin(Date.now() / 500); // Subtle pulse
            
            ctx.beginPath();
            ctx.arc(0, 0, baseRadius * 0.6 * pulseScale, 0, Math.PI * 2);
            ctx.fillStyle = coreGradient;
            ctx.fill();
            
            // Draw energy particles orbiting the tower
            const particleCount = 4 + this.level * 2; // More particles at higher levels
            const time = Date.now() / 1000;
            
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2 + time * (i % 2 === 0 ? 1 : -1) * 0.5;
                const dist = baseRadius * (0.8 + 0.1 * Math.sin(time * 2 + i));
                
                const particleX = Math.cos(angle) * dist;
                const particleY = Math.sin(angle) * dist;
                
                ctx.beginPath();
                ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
                ctx.fillStyle = this.level === 3 ? '#D500F9' : '#E040FB';
                ctx.fill();
            }
            
            // Enhanced shooting effect for Pulsar
            if (this.shootAnimTimer > 0) {
                const energyBeamOpacity = this.shootAnimTimer / this.shootAnimDuration;
                ctx.strokeStyle = `rgba(224, 64, 251, ${energyBeamOpacity})`;
                ctx.lineWidth = 6 * energyBeamOpacity;
                ctx.beginPath();
                ctx.moveTo(0, -topRadius);
                ctx.lineTo(0, -topRadius - gunLength * 1.5);
                ctx.stroke();
                
                // Energy burst at the end of the beam
                const burstSize = (this.shootAnimDuration - this.shootAnimTimer) / this.shootAnimDuration * 10;
                ctx.beginPath();
                ctx.arc(0, -topRadius - gunLength * 1.5, burstSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(224, 64, 251, ${energyBeamOpacity * 0.7})`;
                ctx.fill();
            }
            
            // Level 3 special effect - energy field
            if (this.level === 3) {
                const fieldOpacity = 0.2 + 0.1 * Math.sin(Date.now() / 800);
                ctx.beginPath();
                ctx.arc(0, 0, baseRadius * 1.2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(224, 64, 251, ${fieldOpacity})`;
                ctx.fill();
                
                // Energy arcs around the tower
                const arcCount = 3;
                for (let i = 0; i < arcCount; i++) {
                    const startAngle = (i / arcCount) * Math.PI * 2 + Date.now() / 2000;
                    const endAngle = startAngle + Math.PI / 4;
                    
                    ctx.beginPath();
                    ctx.arc(0, 0, baseRadius * 1.3, startAngle, endAngle);
                    ctx.strokeStyle = `rgba(213, 0, 249, ${0.6 + 0.2 * Math.sin(Date.now() / 500 + i)})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        }
        
        ctx.restore(); // Restore context state (translation, rotation)

        // Vykreslení efektu úrovně
        this.drawLevelIndicator(ctx);
        
        // Vykreslení stavového kruhu (selection, upgrade, sell)
        this.drawStatusIndicator(ctx);

        // Draw range when placing or when selected
        if ((placingTower && selectedTowerType === this.type && mouseGridX === this.gridX && mouseGridY === this.gridY) ||
            this.isSelected) {
            ctx.strokeStyle = 'rgba(200, 200, 220, 0.3)'; // Light semi-transparent white
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); // Dashed line for range
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash
        }
    }
    
    // Nová metoda pro vykreslení indikátoru úrovně
    drawLevelIndicator(ctx) {
        const spacing = 1; // Větší mezera mezi hvězdičkami
        const starSize = 5; // Větší velikost hvězdiček
        const yOffset = this.y - TILE_SIZE * 0.5 - 8; // Posunutí výše nad věž
        
        // Výpočet celkové šířky všech hvězdiček a mezer mezi nimi
        const totalWidth = (this.level * starSize * 2) + ((this.level - 1) * spacing);
        const startX = this.x - totalWidth / 2 + starSize;
        
        // Animační hodnoty
        const time = Date.now() / 1000; // Čas v sekundách pro animaci
        const maxPulse = 0.1; // Maximální hodnota pulzování (10%)
        
        // Vykreslení hvězdiček podle úrovně věže
        for (let i = 0; i < this.level; i++) {
            const starX = startX + i * (starSize * 2 + spacing);
            
            // Různé pulzování pro každou hvězdičku pomocí sinu s fázovým posunem
            const pulse = 1 + Math.sin(time * 2 + i * 0.7) * maxPulse;
            const currentSize = starSize * pulse;
            
            // Stín pod hvězdičkou pro lepší kontrast
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            // Speciální efekt pro poslední úroveň (3)
            if (this.level === 3) {
                // Vnější záře
                const gradientGlow = ctx.createRadialGradient(
                    starX, yOffset, currentSize * 0.25,
                    starX, yOffset, currentSize * 1.25
                );
                gradientGlow.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
                gradientGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
                
                ctx.fillStyle = gradientGlow;
                ctx.beginPath();
                ctx.arc(starX, yOffset, currentSize * 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Barva hvězdičky - gradient pro lepší vzhled
            const gradient = ctx.createRadialGradient(
                starX, yOffset, 0,
                starX, yOffset, currentSize
            );
            gradient.addColorStop(0, '#ffffff'); // Bílý střed
            gradient.addColorStop(0.3, '#ffed7a'); // Světle žlutá
            gradient.addColorStop(1, '#ffd700'); // Zlatá
            
            ctx.fillStyle = gradient;
            
            // Vykreslení hvězdičky s 5 cípy
            ctx.beginPath();
            for (let j = 0; j < 5; j++) {
                // Vnější bod hvězdičky
                const outerAngle = (Math.PI * 2 * j) / 5 - Math.PI / 2;
                const outerX = starX + Math.cos(outerAngle) * currentSize;
                const outerY = yOffset + Math.sin(outerAngle) * currentSize;
                
                if (j === 0) {
                    ctx.moveTo(outerX, outerY);
                } else {
                    ctx.lineTo(outerX, outerY);
                }
                
                // Vnitřní bod hvězdičky (mezi dvěma vnějšími body)
                const innerAngle = (Math.PI * 2 * j + Math.PI / 5) / 5 - Math.PI / 2;
                const innerX = starX + Math.cos(innerAngle) * (currentSize * 0.4);
                const innerY = yOffset + Math.sin(innerAngle) * (currentSize * 0.4);
                
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.fill();
            
            // Resetování stínu pro další vykreslení
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Přidání malého odrazu světla pro 3D efekt
            if (this.level === 3) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.arc(starX - currentSize * 0.3, yOffset - currentSize * 0.3, currentSize * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Nová metoda pro vykreslení stavového indikátoru
    drawStatusIndicator(ctx) {
        let statusConfig = null;
        
        if (this.isSelected) {
            statusConfig = towerStatus.selected;
        } else if (this.isUpgrading) {
            statusConfig = towerStatus.upgrading;
        } else if (this.isSelling) {
            statusConfig = towerStatus.selling;
        }
        
        // Pokud máme aktivní stav, vykreslíme indikátor
        if (statusConfig) {
            ctx.strokeStyle = statusConfig.color;
            ctx.lineWidth = statusConfig.width;
            ctx.setLineDash(statusConfig.lineStyle);
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, TILE_SIZE * 0.5, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.setLineDash([]);
        }
    }
}

export default Tower; 