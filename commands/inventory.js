// Inventory Commands - inv, weapons, tools, equipweapon, equiptool

module.exports = {
  registerCommands(handler) {
    const { bot, sendSafeMessage } = handler;

    return {
      inv: {
        description: 'List inventory contents',
        usage: 'inv',
        handler: () => handleInventory(handler)
      },
      
      weapon: {
        description: 'Show current weapon status',
        usage: 'weapon',
        handler: () => handleWeaponStatus(handler)
      },
      
      equipweapon: {
        description: 'Equip best available weapon',
        usage: 'equipweapon',
        handler: () => handleEquipWeapon(handler)
      },
      
      equiptool: {
        description: 'Equip best tool of type',
        usage: 'equiptool <pickaxe|axe|shovel|hoe>',
        handler: (args) => handleEquipTool(handler, args)
      },
      
      weapons: {
        description: 'List all weapons in inventory',
        usage: 'weapons',
        handler: () => handleListWeapons(handler)
      },
      
      tools: {
        description: 'List all tools in inventory',
        usage: 'tools',
        handler: () => handleListTools(handler)
      }
    };
  }
};

function handleInventory(handler) {
  const inventory = require('../utils/inventory');
  const result = inventory.listInventory(handler.bot);

  if (result.items && Object.keys(result.items).length > 0) {
    handler.sendSafeMessage('Inventory:');
    for (const [name, count] of Object.entries(result.items)) {
      handler.sendSafeMessage(`${name}: ${count}`);
    }
  } else {
    handler.sendSafeMessage(result.message);
  }
}

function handleWeaponStatus(handler) {
  const inventory = require('../utils/inventory');
  const status = inventory.getWeaponStatus(handler.bot);
  
  handler.sendSafeMessage('=== Weapon/Tool Status ===');
  handler.sendSafeMessage(`Holding: ${status.holding}`);
  
  if (status.type === 'weapon') {
    handler.sendSafeMessage(`Type: Weapon`);
    handler.sendSafeMessage(`Damage: ${status.damage} attack damage`);
  } else if (status.type === 'tool') {
    handler.sendSafeMessage(`Type: Tool`);
    handler.sendSafeMessage(`Efficiency: ${status.efficiency}`);
  } else if (status.type === 'none') {
    handler.sendSafeMessage(`Type: Empty hand`);
    handler.sendSafeMessage(`Damage: 1 (fist)`);
  } else {
    handler.sendSafeMessage(`Type: Other item`);
  }
}

async function handleEquipWeapon(handler) {
  const inventory = require('../utils/inventory');
  
  handler.bot.chat('Equipping best weapon...');
  const result = await inventory.equipBestWeapon(handler.bot);
  
  if (result.success) {
    if (!result.alreadyEquipped) {
      handler.bot.chat(result.message);
    } else {
      handler.bot.chat(result.message);
    }
  } else {
    handler.bot.chat(result.message);
  }
}

async function handleEquipTool(handler, args) {
  const inventory = require('../utils/inventory');
  
  if (args.length === 0) {
    handler.bot.chat('Usage: equiptool <pickaxe|axe|shovel|hoe>');
    return;
  }
  
  const toolType = args[0].toLowerCase();
  const validTypes = ['pickaxe', 'axe', 'shovel', 'hoe'];
  
  if (!validTypes.includes(toolType)) {
    handler.bot.chat('Invalid tool type! Use: pickaxe, axe, shovel, or hoe');
    return;
  }
  
  handler.bot.chat(`Equipping best ${toolType}...`);
  const result = await inventory.equipBestToolType(handler.bot, toolType);
  handler.bot.chat(result.message);
}

function handleListWeapons(handler) {
  const inventory = require('../utils/inventory');
  const result = inventory.listWeapons(handler.bot);
  
  if (result.count === 0) {
    handler.sendSafeMessage('No weapons in inventory!');
    return;
  }
  
  handler.sendSafeMessage('=== Weapons in Inventory ===');
  result.weapons.forEach(weapon => {
    handler.sendSafeMessage(`${weapon.name} (${weapon.damage} damage) x${weapon.count}`);
  });
}

function handleListTools(handler) {
  const inventory = require('../utils/inventory');
  const result = inventory.listTools(handler.bot);
  
  if (result.count === 0) {
    handler.sendSafeMessage('No tools in inventory!');
    return;
  }
  
  handler.sendSafeMessage('=== Tools in Inventory ===');
  result.tools.forEach(tool => {
    handler.sendSafeMessage(`${tool.name} (efficiency: ${tool.efficiency}) x${tool.count}`);
  });
}
