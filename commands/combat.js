// Combat Commands - defend, combat, attack, retreat

const config = require('../config');
const dataManager = require('../utils/dataManager');

module.exports = {
  registerCommands(handler) {
    const { bot, state, sendSafeMessage } = handler;

    return {
      defend: {
        description: 'Toggle auto-defend mode',
        usage: 'defend [on|off]',
        handler: (args) => handleDefend(handler, args)
      },
      
      combat: {
        description: 'Show combat status',
        usage: 'combat',
        handler: () => handleCombatStatus(handler)
      },
      
      attack: {
        description: 'Attack nearest hostile mob',
        usage: 'attack',
        handler: () => handleAttack(handler)
      },
      
      retreat: {
        description: 'Retreat from combat',
        usage: 'retreat',
        handler: () => handleRetreat(handler)
      }
    };
  }
};

function handleDefend(handler, args) {
  const mode = args[0] ? args[0].toLowerCase() : null;
  
  if (mode === 'on') {
    dataManager.saveAutoAttack(true);
    handler.sendSafeMessage('Auto-defend enabled! I will fight monsters automatically.');
  } else if (mode === 'off') {
    dataManager.saveAutoAttack(false);
    handler.sendSafeMessage('Auto-defend disabled. I will not attack monsters.');
  } else {
    const status = dataManager.loadAutoAttack() ? 'enabled' : 'disabled';
    handler.sendSafeMessage(`Auto-defend is currently ${status}`);
    handler.sendSafeMessage('Usage: defend [on|off]');
  }
}

function handleCombatStatus(handler) {
  const snapshot = handler.state.getStateSnapshot();
  
  handler.sendSafeMessage('=== Combat Status ===');
  handler.sendSafeMessage(`Health: ${handler.bot.health}/20`);
  handler.sendSafeMessage(`Food: ${handler.bot.food}/20`);
  handler.sendSafeMessage(`Auto-defend: ${dataManager.loadAutoAttack() ? 'ON' : 'OFF'}`);
  handler.sendSafeMessage(`Mobs killed: ${snapshot.statistics.mobsKilled}`);
  handler.sendSafeMessage(`Deaths: ${snapshot.statistics.deaths}`);
  
  // Check for nearby hostiles
  const entities = Object.values(handler.bot.entities);
  const hostileMobs = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman'];
  const nearbyHostiles = entities.filter(entity => {
    if (!entity || entity === handler.bot.entity) return false;
    const name = entity.name ? entity.name.toLowerCase() : '';
    const isHostile = hostileMobs.some(mob => name.includes(mob));
    if (!isHostile) return false;
    const distance = handler.bot.entity.position.distanceTo(entity.position);
    return distance <= config.behavior.combatRadius;
  });

  if (nearbyHostiles.length > 0) {
    handler.sendSafeMessage(`⚠️  ${nearbyHostiles.length} hostile mob(s) nearby!`);
  } else {
    handler.sendSafeMessage('No threats detected');
  }
}

async function handleAttack(handler) {
  if (!handler.combatBehavior) {
    handler.sendSafeMessage('Combat system not initialized!');
    return;
  }
  
  const hostile = handler.combatBehavior.findNearestHostile();
  
  if (hostile) {
    const mobName = hostile.name || hostile.displayName || 'mob';
    handler.sendSafeMessage(`Attacking ${mobName}!`);
    await handler.combatBehavior.engage(hostile);
  } else {
    handler.sendSafeMessage('No hostile mobs nearby to attack!');
  }
}

async function handleRetreat(handler) {
  if (!handler.combatBehavior) {
    handler.sendSafeMessage('Combat system not initialized!');
    return;
  }
  
  if (handler.combatBehavior.currentTarget) {
    handler.sendSafeMessage('Retreating from combat!');
    await handler.combatBehavior.retreat();
  } else {
    handler.sendSafeMessage('Not currently in combat.');
  }
}
