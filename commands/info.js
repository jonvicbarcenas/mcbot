// Info Commands - help, status, pos

module.exports = {
  registerCommands(handler) {
    const { bot, state } = handler;

    return {
      help: {
        description: 'Show available commands',
        usage: 'help',
        handler: () => showHelp(handler)
      },
      
      status: {
        description: 'Show bot status and statistics',
        usage: 'status',
        handler: () => handleStatus(handler)
      },
      
      pos: {
        description: 'Show current position',
        usage: 'pos',
        handler: () => handlePosition(handler)
      },
      
      eat: {
        description: 'Show auto-eat status or toggle on/off',
        usage: 'eat [on|off]',
        handler: (args) => handleAutoEat(handler, args)
      },
      
      home: {
        description: 'Return to home position',
        usage: 'home',
        handler: () => handleHome(handler)
      },
      
      sethome: {
        description: 'Set current position as home',
        usage: 'sethome',
        handler: () => handleSetHome(handler)
      }
    };
  }
};

function showHelp(handler) {
  handler.sendSafeMessage('Available commands:');
  
  const commandList = [];
  handler.commands.forEach((cmd, name) => {
    commandList.push(`${name} - ${cmd.description}`);
  });

  // Send in batches to avoid spam
  commandList.forEach(cmd => {
    handler.sendSafeMessage(cmd);
  });
}

function handleStatus(handler) {
  const snapshot = handler.state.getStateSnapshot();
  
  handler.sendSafeMessage(`Status: ${handler.state.mood}`);
  handler.sendSafeMessage(`Health: ${handler.bot.health}/20 Food: ${handler.bot.food}/20`);
  if (snapshot.task) {
    handler.sendSafeMessage(`Current task: ${snapshot.task.description}`);
  }
  handler.sendSafeMessage(`Logs chopped: ${snapshot.statistics.logsChopped}`);
  handler.sendSafeMessage(`Axes crafted: ${snapshot.statistics.axesCrafted}`);
  handler.sendSafeMessage(`Mobs killed: ${snapshot.statistics.mobsKilled}`);
  
  const uptimeSeconds = Math.floor(snapshot.uptime / 1000);
  handler.sendSafeMessage(`Uptime: ${uptimeSeconds}s`);
}

function handlePosition(handler) {
  const pos = handler.bot.entity.position;
  handler.bot.chat(`I am at ${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)}`);
}

function handleAutoEat(handler, args) {
  const config = require('../config');
  const mode = args[0] ? args[0].toLowerCase() : null;
  
  if (mode === 'on') {
    config.autoEat.enabled = true;
    handler.sendSafeMessage('Auto-eat enabled! I will eat when health or hunger is not full.');
  } else if (mode === 'off') {
    config.autoEat.enabled = false;
    handler.sendSafeMessage('Auto-eat disabled. I will not eat automatically.');
  } else {
    // Show status
    if (handler.autoEat) {
      const status = handler.autoEat.getStatus();
      handler.sendSafeMessage('=== Auto-Eat Status ===');
      handler.sendSafeMessage(`Enabled: ${status.enabled ? 'YES' : 'NO'}`);
      handler.sendSafeMessage(`Health: ${status.health}/20`);
      handler.sendSafeMessage(`Hunger: ${status.hunger}/20`);
      handler.sendSafeMessage(`Needs Food: ${status.needsFood ? 'YES' : 'NO'}`);
      handler.sendSafeMessage(`Has Food: ${status.hasFood ? 'YES' : 'NO'}`);
      handler.sendSafeMessage(`Currently Eating: ${status.isEating ? 'YES' : 'NO'}`);
      handler.sendSafeMessage('Usage: eat [on|off]');
    } else {
      handler.sendSafeMessage('Auto-eat system not initialized!');
    }
  }
}

async function handleHome(handler) {
  const config = require('../config');
  
  if (!config.home.position) {
    handler.sendSafeMessage('No home position set! Use "sethome" to set your home.');
    return;
  }
  
  const { x, y, z } = config.home.position;
  const distance = handler.bot.entity.position.distanceTo({ x, y, z });
  
  handler.bot.chat(`Going home to ${Math.floor(x)}, ${Math.floor(y)}, ${Math.floor(z)} (${distance.toFixed(1)} blocks)...`);
  
  const Lumberjack = require('../behaviors/lumberjack');
  const lumberjack = new Lumberjack(handler.bot, handler.state);
  const result = await lumberjack.returnHome();
  
  if (result.success) {
    handler.bot.chat(result.message);
  } else {
    handler.bot.chat('Could not reach home: ' + result.message);
  }
}

function handleSetHome(handler) {
  const config = require('../config');
  const dataManager = require('../utils/dataManager');
  const pos = handler.bot.entity.position;
  
  const homePos = {
    x: Math.floor(pos.x),
    y: Math.floor(pos.y),
    z: Math.floor(pos.z)
  };
  
  // Save to config (in-memory)
  config.home.position = homePos;
  
  // Save to data.json (persistent storage)
  const saved = dataManager.saveHomePosition(homePos.x, homePos.y, homePos.z);
  
  if (saved) {
    handler.bot.chat(`Home set to ${homePos.x}, ${homePos.y}, ${homePos.z}!`);
    console.log(`🏠 Home position set and saved to data.json: ${homePos.x}, ${homePos.y}, ${homePos.z}`);
  } else {
    handler.bot.chat(`Home set to ${homePos.x}, ${homePos.y}, ${homePos.z} (warning: failed to save to file)`);
    console.log(`⚠️  Home position set but failed to save to data.json`);
  }
}
