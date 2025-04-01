// Tower Class
import { getCanvasCoords, distance } from '../utils.js';
import { towerTypes, TILE_SIZE } from '../constants.js';
import Projectile from './Projectile.js';

class Tower {
    constructor(gridX, gridY, type) {
        this.gridX = gridX;
        this.gridY = gridY;
        const canvasCoords = getCanvasCoords(gridX, gridY);
        this.x = canvasCoords.x;
        this.y = canvasCoords.y;
        this.type = type;
        this.stats = { ...towerTypes[type] }; // Copy for potential modifications
        this.range = this.stats.range;
        this.damage = this.stats.damage;
        this.fireRate = this.stats.fireRate;
        this.cooldown = 0;
        this.target = null;
        this.projectileSpeed = this.stats.projectileSpeed;
        this.projectileColor = this.stats.projectileColor;
        this.projectileSize = this.stats.projectileSize;

        // Animation properties
        this.shootAnimTimer = 0;
        this.shootAnimDuration = 100; // ms
        this.angle = 0; // Angle towards target
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
            // Calculate spawn position at the tip of the gun based on angle
            const gunLength = TILE_SIZE * 0.4;
            const projStartX = this.x + Math.cos(this.angle) * gunLength;
            const projStartY = this.y + Math.sin(this.angle) * gunLength;

            projectiles.push(new Projectile(
                projStartX, projStartY, 
                this.target, 
                this.damage, 
                this.projectileSpeed, 
                this.projectileColor, 
                this.projectileSize
            ));
            
            this.cooldown = this.fireRate;
            this.shootAnimTimer = this.shootAnimDuration; // Start shoot animation

            // Muzzle flash particle effect - if provided
            if (createParticlesFn) {
                createParticlesFn(projStartX, projStartY, this.projectileColor, 1, 3, 200, 3);
            }
        }
    }

    update(deltaTime, enemies, projectiles, createParticlesFn) {
        if (this.shootAnimTimer > 0) {
            this.shootAnimTimer -= deltaTime;
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

        // Base Circle
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333'; // Outline
        ctx.lineWidth = 1;
        ctx.stroke();

        // Gun Barrel (rectangle) - Apply recoil offset
        const gunX = -gunWidth / 2;
        const gunY = -topRadius - shootOffset; // Apply offset upwards relative to rotated tower

        ctx.fillStyle = this.stats.colorGun;
        ctx.fillRect(gunX, gunY, gunWidth, -gunLength); // Negative height to draw upwards

        // Barrel Tip / Detail
        ctx.fillStyle = this.stats.colorTop;
        ctx.fillRect(gunX - 1, gunY - gunLength - 2, gunWidth + 2, 4); // Small horizontal bar at the end

        ctx.restore(); // Restore context state (translation, rotation)

        // Draw range when placing
        if (placingTower && selectedTowerType === this.type && mouseGridX === this.gridX && mouseGridY === this.gridY) {
            ctx.strokeStyle = 'rgba(200, 200, 220, 0.3)'; // Light semi-transparent white
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); // Dashed line for range
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash
        }
    }
}

export default Tower; 