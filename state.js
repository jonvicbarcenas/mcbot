// Bot State Management
class BotState {
  constructor() {
    this.currentTask = null;        // Current task being executed
    this.mood = 'idle';              // idle, working, exploring, following
    this.target = null;              // Current target (block, entity, etc)
    this.owner = null;               // Player the bot is following/obeying
    this.inventory = {
      logs: 0,
      planks: 0,
      sticks: 0,
      axes: [],
      tools: []
    };
    this.statistics = {
      logsChopped: 0,
      axesCrafted: 0,
      distanceTraveled: 0,
      tasksCompleted: 0,
      mobsKilled: 0,
      deaths: 0,
      startTime: Date.now()
    };
    this.goals = [];                 // Queue of goals to accomplish
    this.memory = {
      lastLogPosition: null,
      lastCraftingTable: null,
      knownPlayers: new Map(),
      visitedAreas: []
    };
  }

  // Task management
  setTask(task, description) {
    this.currentTask = {
      name: task,
      description: description,
      startTime: Date.now()
    };
  }

  completeTask() {
    if (this.currentTask) {
      this.statistics.tasksCompleted++;
      this.currentTask = null;
    }
  }

  cancelTask() {
    this.currentTask = null;
  }

  isIdle() {
    return this.currentTask === null && this.mood === 'idle';
  }

  // Mood management
  setMood(mood) {
    const validMoods = ['idle', 'working', 'exploring', 'following', 'crafting', 'gathering', 'combat'];
    if (validMoods.includes(mood)) {
      this.mood = mood;
    }
  }

  // Inventory tracking
  updateInventory(bot) {
    const items = bot.inventory.items();
    
    // Count logs
    this.inventory.logs = items
      .filter(item => item.name.includes('_log'))
      .reduce((sum, item) => sum + item.count, 0);
    
    // Count planks
    this.inventory.planks = items
      .filter(item => item.name.includes('_planks'))
      .reduce((sum, item) => sum + item.count, 0);
    
    // Count sticks
    const sticks = items.find(item => item.name === 'stick');
    this.inventory.sticks = sticks ? sticks.count : 0;
    
    // List axes
    this.inventory.axes = items
      .filter(item => item.name.includes('_axe'))
      .map(item => ({ name: item.name, count: item.count, slot: item.slot }));
    
    // List other tools
    this.inventory.tools = items
      .filter(item => 
        item.name.includes('_pickaxe') || 
        item.name.includes('_shovel') || 
        item.name.includes('_hoe') ||
        item.name.includes('_sword')
      )
      .map(item => ({ name: item.name, count: item.count, slot: item.slot }));
  }

  // Statistics
  incrementLogCount() {
    this.statistics.logsChopped++;
  }

  incrementAxeCount() {
    this.statistics.axesCrafted++;
  }

  incrementMobKills() {
    this.statistics.mobsKilled++;
  }

  incrementDeaths() {
    this.statistics.deaths++;
  }

  getUptime() {
    return Date.now() - this.statistics.startTime;
  }

  // Memory functions
  rememberPlayer(username, entity) {
    this.memory.knownPlayers.set(username, {
      lastSeen: Date.now(),
      position: entity.position.clone(),
      friendly: true
    });
  }

  rememberLocation(type, position) {
    this.memory[type] = position.clone();
  }

  // Goal management
  addGoal(goal, priority = 0) {
    this.goals.push({ goal, priority, addedAt: Date.now() });
    this.goals.sort((a, b) => b.priority - a.priority);
  }

  getNextGoal() {
    return this.goals.shift();
  }

  clearGoals() {
    this.goals = [];
  }

  // Export state for logging/debugging
  getStateSnapshot() {
    return {
      task: this.currentTask,
      mood: this.mood,
      inventory: this.inventory,
      statistics: this.statistics,
      goalsCount: this.goals.length,
      uptime: this.getUptime()
    };
  }
}

module.exports = BotState;
