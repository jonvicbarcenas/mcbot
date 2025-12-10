// Main Bot Entry Point
const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const armorManager = require('mineflayer-armor-manager');

// Load modules
const config = require('./config');
const BotState = require('./state');
const ChatHandler = require('./utils/chat');
const CombatBehavior = require('./behaviors/combat');
const AutoEat = require('./behaviors/autoeat');

console.log('='.repeat(50));
console.log('🤖 Minecraft AI Bot v2.0');
console.log('='.repeat(50));

// Create the bot
const bot = mineflayer.createBot({
  host: config.server.host,
  port: config.server.port,
  username: config.bot.username,
  version: config.server.version,
  // Uncomment if authentication is needed
  // auth: config.bot.auth,
  // password: config.bot.password
});

// Initialize bot state
const state = new BotState();

// Load plugins
bot.loadPlugin(pathfinder);
bot.loadPlugin(armorManager);
bot.loadPlugin(require('mineflayer-collectblock').plugin);

// Initialize chat handler and combat behavior
let chatHandler;
let combatBehavior;
let autoEat;
let farmer;

// Bot event handlers
bot.once('spawn', () => {
  console.log('✅ Bot has spawned!');
  console.log(`📍 Position: ${bot.entity.position}`);
  
  // Load home position from data.json
  const dataManager = require('./utils/dataManager');
  const homePosition = dataManager.loadHomePosition();
  if (homePosition) {
    config.home.position = homePosition;
    console.log(`🏠 Home position loaded: ${homePosition.x}, ${homePosition.y}, ${homePosition.z}`);
  } else {
    console.log('⚠️  No home position set. Use "sethome" command to set home.');
  }
  
  // Set up pathfinder movements - Baritone-style door handling
  const mcData = require('minecraft-data')(bot.version);
  const defaultMove = new Movements(bot, mcData);
  
  // Basic movement configuration
  defaultMove.canOpenDoors = true;
  defaultMove.allowParkour = true;
  defaultMove.allowSprinting = true;
  defaultMove.canDig = false; // Don't break blocks
  defaultMove.dontCreateFlow = true;
  defaultMove.allow1by1towers = false;
  defaultMove.scafoldingBlocks = ['dirt', 'cobblestone', 'planks'];
  defaultMove.allowEntityDetection = true;
  defaultMove.openable
  
  // Get all door block IDs
  const doorBlocks = Object.keys(mcData.blocksByName)
    .filter(name => (name.includes('door') || name.includes('gate')) && !name.includes('trapdoor'))
    .map(name => mcData.blocksByName[name].id);

  console.log(`door near me ids: ${doorBlocks}`);
  
  // Add doors to the openable set
  for (const doorId of doorBlocks) {
    defaultMove.openable.add(doorId);
  }
  
  defaultMove.replaceables.add(mcData.blocksByName['air'].id);
  
  console.log(`🚪 Found ${doorBlocks.length} door/gate types`);
  
  // Store door blocks globally
  bot.doorBlocks = doorBlocks;
  
  // Set the movements - this makes pathfinder automatically handle doors
  bot.pathfinder.setMovements(defaultMove);
  
  console.log('🚪 Pathfinder configured with Baritone-style door handling');
  
  // Initialize chat handler after spawn
  chatHandler = new ChatHandler(bot, state);
  
  // Initialize combat behavior
  combatBehavior = new CombatBehavior(bot, state, config);
  
  // Initialize auto-eat behavior
  autoEat = new AutoEat(bot, state, config);
  
  // Initialize farmer behavior
  const Farmer = require('./behaviors/farmer');
  farmer = new Farmer(bot, state);
  
  // Make behaviors accessible from chat handler
  chatHandler.combatBehavior = combatBehavior;
  chatHandler.autoEat = autoEat;
  
  console.log('⚔️  Combat system initialized');
  console.log('🍖 Auto-eat system initialized');
  
  // Auto-equip best armor and weapon on spawn
  setTimeout(async () => {
    try {
      // Auto-equip armor using armor manager plugin
      if (config.armor.autoEquip) {
        await bot.armorManager.equipAll();
        console.log('🛡️  Armor manager equipped best available armor');
      }
      
      // Auto-equip weapon
      if (config.combat.autoEquipWeapon) {
        const inventory = require('./utils/inventory');
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between equipping
        const weaponResult = await inventory.equipBestWeapon(bot);
        if (weaponResult.success && !weaponResult.alreadyEquipped) {
          console.log('⚔️  Auto-equipped weapon:', weaponResult.message);
        }
      }
    } catch (error) {
      console.error('Error auto-equipping items:', error.message);
    }
  }, 1000); // Wait 1 second after spawn for inventory to load
  
  console.log('🎮 Bot is ready! Type "help" in chat to see available commands.');
  console.log('='.repeat(50));
  
  // Update inventory on spawn
  state.updateInventory(bot);
  
  console.log('🔔 Armor manager will automatically equip best armor');
});

bot.on('login', () => {
  console.log(`🔗 Connected to ${config.server.host}:${config.server.port}`);
  console.log(`👤 Username: ${config.bot.username}`);
});

bot.on('chat', async (username, message) => {
  if (chatHandler) {
    await chatHandler.handleMessage(username, message);
  }
});

bot.on('error', (err) => {
  console.error('❌ Bot error:', err);
});

bot.on('kicked', (reason) => {
  console.log('⚠️  Bot was kicked:', reason);
});

bot.on('end', () => {
  console.log('🔌 Bot disconnected');
  console.log('='.repeat(50));
  
  // Show final statistics
  const snapshot = state.getStateSnapshot();
  console.log('Final Statistics:');
  console.log(`  Logs chopped: ${snapshot.statistics.logsChopped}`);
  console.log(`  Axes crafted: ${snapshot.statistics.axesCrafted}`);
  console.log(`  Mobs killed: ${snapshot.statistics.mobsKilled}`);
  console.log(`  Deaths: ${snapshot.statistics.deaths}`);
  console.log(`  Tasks completed: ${snapshot.statistics.tasksCompleted}`);
  console.log(`  Uptime: ${Math.floor(snapshot.uptime / 1000)}s`);
});

// Track mob kills
bot.on('entityDead', (entity) => {
  if (combatBehavior && combatBehavior.currentTarget === entity) {
    const mobName = entity.name || entity.displayName || 'mob';
    console.log(`💀 Killed ${mobName}`);
    state.incrementMobKills();
    combatBehavior.currentTarget = null;
  }
});

// Track bot deaths
bot.on('death', () => {
  console.log('💀 Bot died!');
  state.incrementDeaths();
  if (combatBehavior) {
    combatBehavior.stopCombat();
  }
});


// Auto-equip armor and weapon after respawn
bot.on('respawn', () => {
  console.log('🔄 Bot respawned!');
  
  // Auto-equip best armor and weapon after respawn
  setTimeout(async () => {
    try {
      // Auto-equip armor using armor manager plugin
      if (config.armor.autoEquip) {
        await bot.armorManager.equipAll();
        console.log('🛡️  Armor manager equipped best available armor after respawn');
      }
      
      // Auto-equip weapon
      if (config.combat.autoEquipWeapon) {
        const inventory = require('./utils/inventory');
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between equipping
        const weaponResult = await inventory.equipBestWeapon(bot);
        if (weaponResult.success && !weaponResult.alreadyEquipped) {
          console.log('⚔️  Auto-equipped weapon after respawn:', weaponResult.message);
        }
      }
    } catch (error) {
      console.error('Error auto-equipping items after respawn:', error.message);
    }
  }, 2000); // Wait 2 seconds after respawn for inventory to load
});

// Periodic inventory update
setInterval(() => {
  if (bot.entity) {
    state.updateInventory(bot);
  }
}, 5000);

// Combat monitoring - check for hostiles every 500ms
setInterval(async () => {
  if (bot.entity && combatBehavior) {
    try {
      await combatBehavior.defendSelf();
    } catch (err) {
      // Silently handle combat errors to prevent spam
      if (config.chat.enableLogging) {
        console.error('Combat error:', err.message);
      }
    }
  }
}, 500);

// Auto-eat monitoring - check if need to eat based on config interval
setInterval(async () => {
  if (bot.entity && autoEat) {
    try {
      await autoEat.checkAndEat();
    } catch (err) {
      // Silently handle eating errors to prevent spam
      if (config.chat.enableLogging) {
        console.error('Auto-eat error:', err.message);
      }
    }
  }
}, config.autoEat.checkInterval);

// Auto-farm monitoring - check for sugarcane based on config interval
let farmingInProgress = false;
setInterval(async () => {
  if (bot.entity && !farmingInProgress && farmer) {
    try {
      const dataManager = require('./utils/dataManager');
      const autoFarmEnabled = dataManager.loadAutoFarm();
      
      if (!autoFarmEnabled) return;
      
      // Check if bot is busy with other tasks
      const currentTask = state.getStateSnapshot().task;
      if (currentTask && currentTask.type === 'combat') {
        // Don't farm during combat
        return;
      }
      
      // Check for sugarcane using the persistent farmer instance
      const sugarcane = farmer.findNearestSugarcane();
      if (sugarcane) {
        farmingInProgress = true;
        console.log('🌾 Auto-farm: Mature sugarcane detected, harvesting...');
        const result = await farmer.executeHarvest();
        console.log('🌾 Auto-farm: Harvest completed, result:', result);
        farmingInProgress = false;
        console.log('🌾 Auto-farm: Ready for next scan in', config.behavior.farmCheckInterval / 1000, 'seconds');
      } else {
        console.log('🌾 Auto-farm: No mature sugarcane found, will check again in', config.behavior.farmCheckInterval / 1000, 'seconds');
      }
    } catch (err) {
      farmingInProgress = false;
      console.error('Auto-farm error:', err.message, err.stack);
    }
  } else {
    if (!bot.entity) console.log('🌾 Auto-farm: Bot not spawned');
    if (farmingInProgress) console.log('🌾 Auto-farm: Farming in progress, skipping...');
    if (!farmer) console.log('🌾 Auto-farm: Farmer not initialized');
  }
}, config.behavior.farmCheckInterval);

// Periodic state logging
setInterval(() => {
  if (bot.entity && config.chat.enableLogging) {
    const snapshot = state.getStateSnapshot();
    console.log(`[State] Mood: ${snapshot.mood}, Task: ${snapshot.task ? snapshot.task.description : 'none'}`);
  }
}, 30000);

console.log('🚀 Starting Minecraft Lumberjack Bot...');
console.log(`🌐 Connecting to ${config.server.host}:${config.server.port}`);
console.log('='.repeat(50));
