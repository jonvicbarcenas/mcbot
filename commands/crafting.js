// Crafting Commands - craftaxe, craftplanks, craftsticks, crafttable, findtable, debug

module.exports = {
  registerCommands(handler) {
    const { bot, sendSafeMessage } = handler;

    return {
      craftaxe: {
        description: 'Craft an axe if materials available',
        usage: 'craftaxe',
        handler: () => handleCraftAxe(handler)
      },
      
      craftplanks: {
        description: 'Craft planks from logs',
        usage: 'craftplanks',
        handler: () => handleCraftPlanks(handler)
      },
      
      craftsticks: {
        description: 'Craft sticks from planks',
        usage: 'craftsticks',
        handler: () => handleCraftSticks(handler)
      },
      
      crafttable: {
        description: 'Craft a crafting table',
        usage: 'crafttable',
        handler: () => handleCraftTable(handler)
      },
      
      findtable: {
        description: 'Find nearby crafting table',
        usage: 'findtable',
        handler: () => handleFindTable(handler)
      },
      
      debug: {
        description: 'Show debug info for crafting',
        usage: 'debug',
        handler: () => handleDebug(handler)
      }
    };
  }
};

async function handleCraftAxe(handler) {
  const Crafting = require('../behaviors/crafting');
  const crafting = new Crafting(handler.bot, handler.state);

  handler.bot.chat('Attempting to craft an axe...');
  const result = await crafting.craftAxe();
  handler.bot.chat(result.message);
}

async function handleCraftPlanks(handler) {
  const Crafting = require('../behaviors/crafting');
  const crafting = new Crafting(handler.bot, handler.state);

  handler.bot.chat('Crafting planks from logs...');
  const result = await crafting.craftPlanks(8);
  handler.bot.chat(result.message);
}

async function handleCraftSticks(handler) {
  const Crafting = require('../behaviors/crafting');
  const crafting = new Crafting(handler.bot, handler.state);

  handler.bot.chat('Crafting sticks from planks...');
  const result = await crafting.craftSticks(4);
  handler.bot.chat(result.message);
}

async function handleCraftTable(handler) {
  const Crafting = require('../behaviors/crafting');
  const crafting = new Crafting(handler.bot, handler.state);

  handler.bot.chat('Attempting to craft a crafting table...');
  const result = await crafting.craftCraftingTable();
  handler.bot.chat(result.message);
}

function handleFindTable(handler) {
  const craftingTable = handler.bot.findBlock({
    matching: (block) => block.name === 'crafting_table',
    maxDistance: 64
  });

  if (craftingTable) {
    const pos = craftingTable.position;
    const distance = handler.bot.entity.position.distanceTo(pos);
    handler.sendSafeMessage(`Found crafting table at ${pos.x}, ${pos.y}, ${pos.z}`);
    handler.sendSafeMessage(`Distance: ${distance.toFixed(1)} blocks`);
  } else {
    handler.sendSafeMessage('No crafting table found within 64 blocks!');
  }
}

function handleDebug(handler) {
  const items = handler.bot.inventory.items();
  
  // Count resources
  const logs = items.filter(i => i.name.includes('_log'));
  const planks = items.filter(i => i.name.includes('_planks'));
  const sticks = items.filter(i => i.name === 'stick');
  const axes = items.filter(i => i.name.includes('_axe'));
  const tables = items.filter(i => i.name === 'crafting_table');

  const totalLogs = logs.reduce((sum, i) => sum + i.count, 0);
  const totalPlanks = planks.reduce((sum, i) => sum + i.count, 0);
  const totalSticks = sticks.reduce((sum, i) => sum + i.count, 0);
  const totalAxes = axes.length;
  const totalTables = tables.reduce((sum, i) => sum + i.count, 0);

  handler.sendSafeMessage('=== Debug Info ===');
  handler.sendSafeMessage(`Logs: ${totalLogs}, Planks: ${totalPlanks}, Sticks: ${totalSticks}`);
  handler.sendSafeMessage(`Axes: ${totalAxes}, Tables: ${totalTables}`);
  
  // Check if can craft
  const canCraftPlanks = totalLogs > 0;
  const canCraftSticks = totalPlanks >= 2;
  const canCraftTable = totalPlanks >= 4;
  const canCraftAxe = totalPlanks >= 3 && totalSticks >= 2;

  handler.sendSafeMessage(`Can craft: Planks=${canCraftPlanks}, Sticks=${canCraftSticks}, Table=${canCraftTable}, Axe=${canCraftAxe}`);
  
  // Find nearby crafting table
  const nearbyTable = handler.bot.findBlock({
    matching: (block) => block.name === 'crafting_table',
    maxDistance: 32
  });
  
  if (nearbyTable) {
    const distance = handler.bot.entity.position.distanceTo(nearbyTable.position);
    handler.sendSafeMessage(`Crafting table found ${distance.toFixed(1)} blocks away!`);
  } else {
    handler.sendSafeMessage('No crafting table found nearby');
  }
}
