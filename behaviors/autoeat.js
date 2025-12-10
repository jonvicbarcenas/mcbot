// Auto-Eat Behavior - Automatically eat food when health or hunger is not full

class AutoEat {
  constructor(bot, state, config) {
    this.bot = bot;
    this.state = state;
    this.config = config;
    this.isEating = false;
    this.lastAttempt = 0;
  }

  // Food priority list (best to worst)
  getFoodPriority() {
    return [
      // Golden foods (best saturation)
      'golden_apple',
      'enchanted_golden_apple',
      'golden_carrot',
      
      // Cooked meats (high nutrition)
      'cooked_beef',
      'cooked_porkchop',
      'cooked_mutton',
      'cooked_chicken',
      'cooked_rabbit',
      'cooked_salmon',
      'cooked_cod',
      
      // Bread and baked goods
      'bread',
      'baked_potato',
      'pumpkin_pie',
      'cake',
      
      // Raw meats (if desperate)
      'beef',
      'porkchop',
      'mutton',
      'chicken',
      'rabbit',
      'salmon',
      'cod',
      
      // Vegetables and fruits
      'carrot',
      'potato',
      'beetroot',
      'apple',
      'melon_slice',
      'sweet_berries',
      'glow_berries',
      
      // Other edibles
      'cookie',
      'mushroom_stew',
      'rabbit_stew',
      'beetroot_soup',
      'suspicious_stew',
      'honey_bottle',
      
      // Least preferred
      'rotten_flesh',
      'spider_eye',
      'poisonous_potato'
    ];
  }

  // Check if bot needs to eat
  needsFood() {
    // Don't eat if already eating
    if (this.isEating) return false;
    
    // Eat if health is not full
    if (this.bot.health < 20) return true;
    
    // Eat if hunger is not full
    if (this.bot.food < 20) return true;
    
    return false;
  }

  // Find best food in inventory
  findBestFood() {
    const inventory = this.bot.inventory.items();
    const foodPriority = this.getFoodPriority();
    
    // Try to find food in priority order
    for (const foodName of foodPriority) {
      const food = inventory.find(item => item.name === foodName);
      if (food) {
        return food;
      }
    }
    
    return null;
  }

  // Eat food
  async eat() {
    // Prevent multiple simultaneous eat attempts
    const now = Date.now();
    if (now - this.lastAttempt < 2000) return;
    this.lastAttempt = now;
    
    if (!this.needsFood()) return;
    
    const food = this.findBestFood();
    if (!food) {
      console.log('⚠️  No food in inventory!');
      return;
    }
    
    try {
      this.isEating = true;
      console.log(`🍖 Eating ${food.name} (Health: ${this.bot.health}/20, Hunger: ${this.bot.food}/20)`);
      
      await this.bot.equip(food, 'hand');
      await this.bot.consume();
      
      console.log(`✅ Finished eating (Health: ${this.bot.health}/20, Hunger: ${this.bot.food}/20)`);
    } catch (error) {
      console.error('Error eating:', error.message);
    } finally {
      this.isEating = false;
    }
  }

  // Check and eat if needed
  async checkAndEat() {
    if (!this.config.autoEat.enabled) return;
    
    try {
      if (this.needsFood()) {
        await this.eat();
      }
    } catch (error) {
      // Silently handle errors to prevent spam
    }
  }

  // Get current status
  getStatus() {
    return {
      enabled: this.config.autoEat.enabled,
      health: this.bot.health,
      hunger: this.bot.food,
      needsFood: this.needsFood(),
      isEating: this.isEating,
      hasFood: this.findBestFood() !== null
    };
  }
}

module.exports = AutoEat;
