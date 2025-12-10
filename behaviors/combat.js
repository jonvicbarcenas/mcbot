// Combat Behavior - Self-defense against hostile mobs
const { goals } = require('mineflayer-pathfinder');
const Vec3 = require('vec3').Vec3;
const dataManager = require('../utils/dataManager');

class CombatBehavior {
  constructor(bot, state, config) {
    this.bot = bot;
    this.state = state;
    this.config = config;
    this.currentTarget = null;
    this.inCombat = false;
    this.lastAttackTime = 0;
    this.retreating = false;
    
    // List of hostile mobs
    this.hostileMobs = [
      'zombie', 'skeleton', 'spider', 'creeper', 'enderman',
      'witch', 'slime', 'phantom', 'drowned', 'husk',
      'stray', 'cave_spider', 'silverfish', 'endermite',
      'blaze', 'ghast', 'magma_cube', 'wither_skeleton',
      'piglin', 'hoglin', 'zoglin', 'pillager', 'vindicator',
      'evoker', 'ravager', 'vex', 'guardian', 'elder_guardian',
      'shulker', 'warden', 'wither', 'ender_dragon'
    ];
  }

  // Scan for nearby hostile mobs
  findNearestHostile() {
    if (!this.bot.entity) return null;
    
    const entities = Object.values(this.bot.entities);
    let nearestHostile = null;
    let minDistance = this.config.behavior.combatRadius;

    for (const entity of entities) {
      if (!entity || entity === this.bot.entity) continue;
      
      const entityName = entity.name ? entity.name.toLowerCase() : '';
      const isHostile = this.hostileMobs.some(mob => entityName.includes(mob));
      
      if (isHostile) {
        const distance = this.bot.entity.position.distanceTo(entity.position);
        if (distance < minDistance) {
          minDistance = distance;
          nearestHostile = entity;
        }
      }
    }

    return nearestHostile;
  }

  // Get best weapon from inventory
  getBestWeapon(ranged = false) {
    const items = this.bot.inventory.items();
    
    if (ranged && this.config.combat.useBow) {
      // Check for bow and arrows
      const bow = items.find(item => item.name === 'bow');
      const arrows = items.find(item => item.name === 'arrow');
      if (bow && arrows) {
        return bow;
      }
    }

    // Find best melee weapon
    for (const weaponName of this.config.combat.weaponPriority) {
      const weapon = items.find(item => item.name === weaponName);
      if (weapon) {
        return weapon;
      }
    }

    // Fallback to any tool or hand
    return null;
  }

  // Equip the best weapon
  async equipBestWeapon(ranged = false) {
    const weapon = this.getBestWeapon(ranged);
    
    if (weapon && this.bot.heldItem !== weapon) {
      try {
        await this.bot.equip(weapon, 'hand');
        console.log(`⚔️  Equipped ${weapon.name} for combat`);
        return true;
      } catch (err) {
        console.error('Failed to equip weapon:', err.message);
        return false;
      }
    }
    
    return weapon !== null;
  }

  // Check if bot should retreat
  shouldRetreat() {
    return this.bot.health <= this.config.behavior.retreatHealth;
  }

  // Retreat from combat
  async retreat() {
    if (this.retreating || !this.currentTarget) return;
    
    this.retreating = true;
    console.log('🏃 Health low! Retreating from combat...');
    
    try {
      // Calculate retreat position (opposite direction from target)
      const botPos = this.bot.entity.position;
      const targetPos = this.currentTarget.position;
      const direction = botPos.minus(targetPos).normalize();
      const retreatPos = botPos.offset(direction.x * 20, 0, direction.z * 20);
      
      // Try to pathfind to retreat position
      await this.bot.pathfinder.goto(new goals.GoalNear(retreatPos.x, retreatPos.y, retreatPos.z, 1));
      
      this.currentTarget = null;
      this.inCombat = false;
    } catch (err) {
      console.error('Retreat failed:', err.message);
    } finally {
      this.retreating = false;
    }
  }

  // Attack with melee weapon
  async meleeAttack(target) {
    try {
      const distance = this.bot.entity.position.distanceTo(target.position);
      
      // Move closer if too far
      if (distance > this.config.behavior.attackRange) {
        const goal = new goals.GoalFollow(target, this.config.behavior.attackRange - 0.5);
        this.bot.pathfinder.setGoal(goal, true);
      } else {
        this.bot.pathfinder.setGoal(null);
      }
      
      // Attack with cooldown
      const now = Date.now();
      if (now - this.lastAttackTime > 600) { // Attack cooldown
        await this.bot.attack(target);
        this.lastAttackTime = now;
        
        // Face the target
        await this.bot.lookAt(target.position.offset(0, target.height * 0.8, 0));
      }
    } catch (err) {
      if (!err.message.includes('attack')) {
        console.error('Melee attack error:', err.message);
      }
    }
  }

  // Attack with bow
  async bowAttack(target) {
    try {
      const bow = this.getBestWeapon(true);
      if (!bow) {
        // No bow available, switch to melee
        await this.meleeAttack(target);
        return;
      }

      await this.bot.equip(bow, 'hand');
      
      // Look at target
      await this.bot.lookAt(target.position.offset(0, target.height * 0.8, 0));
      
      // Charge and shoot bow
      const now = Date.now();
      if (now - this.lastAttackTime > 1000) {
        this.bot.activateItem(); // Start charging bow
        await this.bot.waitForTicks(20); // Wait ~1 second for full charge
        this.bot.deactivateItem(); // Release arrow
        this.lastAttackTime = now;
      }
    } catch (err) {
      console.error('Bow attack error:', err.message);
      // Fallback to melee
      await this.meleeAttack(target);
    }
  }

  // Main combat loop
  async engage(target) {
    if (!target || !target.isValid) {
      this.currentTarget = null;
      this.inCombat = false;
      return;
    }

    this.currentTarget = target;
    this.inCombat = true;

    // Check if should retreat
    if (this.shouldRetreat()) {
      await this.retreat();
      return;
    }

    const distance = this.bot.entity.position.distanceTo(target.position);
    
    // Use bow for long range if available
    if (distance > this.config.behavior.attackRange * 2 && this.config.combat.useBow) {
      await this.equipBestWeapon(true); // Try to equip bow
      await this.bowAttack(target);
    } else {
      // Use melee weapon
      await this.equipBestWeapon(false);
      await this.meleeAttack(target);
    }
  }

  // Stop combat
  stopCombat() {
    this.currentTarget = null;
    this.inCombat = false;
    this.bot.pathfinder.setGoal(null);
    console.log('✅ Combat ended');
  }

  // Check and engage in combat if needed
  async defendSelf() {
    // Skip if auto-defend is disabled
    if (!dataManager.loadAutoAttack()) return false;
    
    // Skip if already retreating
    if (this.retreating) return true;
    
    // Find nearest hostile
    const hostile = this.findNearestHostile();
    
    if (hostile) {
      // New threat detected
      if (!this.inCombat || this.currentTarget !== hostile) {
        const mobName = hostile.name || hostile.displayName || 'Unknown mob';
        console.log(`⚠️  Hostile detected: ${mobName} at ${hostile.position.distanceTo(this.bot.entity.position).toFixed(1)} blocks`);
        this.state.setMood('combat');
        this.state.setTask('combat', `Fighting ${mobName}`);
      }
      
      await this.engage(hostile);
      return true;
    } else if (this.inCombat) {
      // No more hostiles, end combat
      this.stopCombat();
      this.state.setMood('idle');
      this.state.completeTask();
    }
    
    return false;
  }

  // Get combat status
  getStatus() {
    if (!this.inCombat) {
      return 'Not in combat';
    }
    
    const targetName = this.currentTarget?.name || 'Unknown';
    const distance = this.currentTarget 
      ? this.bot.entity.position.distanceTo(this.currentTarget.position).toFixed(1)
      : 'N/A';
    
    return `Fighting ${targetName} (${distance}m away) | Health: ${this.bot.health}/20`;
  }
}

module.exports = CombatBehavior;
