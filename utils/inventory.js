// Inventory Management Utilities - Basic Functions Only
// NOTE: Armor management now handled by mineflayer-armor-manager plugin
// Weapon functions moved to utils/weapons.js
// Tool functions moved to utils/tools.js

// Re-export weapon and tool functions for backward compatibility
const weapons = require('./weapons');
const tools = require('./tools');

// List inventory contents
function listInventory(bot) {
  const items = bot.inventory.items();

  if (items.length === 0) {
    return { success: true, items: [], message: 'Inventory is empty!' };
  }

  const itemCounts = {};

  items.forEach(item => {
    if (itemCounts[item.name]) {
      itemCounts[item.name] += item.count;
    } else {
      itemCounts[item.name] = item.count;
    }
  });

  return { 
    success: true, 
    items: itemCounts,
    total: items.length
  };
}

// Find specific item in inventory
function findItem(bot, itemName) {
  const item = bot.inventory.items().find(i => i.name === itemName);
  
  if (item) {
    return { 
      success: true, 
      item: {
        name: item.name,
        count: item.count,
        slot: item.slot
      }
    };
  }

  return { success: false, message: `${itemName} not found in inventory` };
}

// Count items of a specific type
function countItems(bot, itemName) {
  const items = bot.inventory.items().filter(i => i.name === itemName);
  const total = items.reduce((sum, item) => sum + item.count, 0);
  
  return { 
    success: true, 
    count: total,
    stacks: items.length
  };
}

// Toss items from inventory
async function tossItem(bot, itemName, count = 1) {
  const item = bot.inventory.items().find(i => i.name === itemName);
  
  if (!item) {
    return { success: false, message: `${itemName} not found` };
  }

  try {
    await bot.toss(item.type, null, count);
    return { 
      success: true, 
      message: `Tossed ${count} ${itemName}` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error tossing item: ${error.message}` 
    };
  }
}

// Check if inventory is full
function isInventoryFull(bot) {
  const emptySlots = bot.inventory.emptySlotCount();
  return {
    full: emptySlots === 0,
    emptySlots: emptySlots,
    totalSlots: 36
  };
}

// Get inventory summary with categories
function getInventorySummary(bot, state) {
  state.updateInventory(bot);
  
  return {
    logs: state.inventory.logs,
    planks: state.inventory.planks,
    sticks: state.inventory.sticks,
    axes: state.inventory.axes,
    tools: state.inventory.tools,
    emptySlots: bot.inventory.emptySlotCount()
  };
}

// Export all functions including re-exported weapon and tool functions
module.exports = {
  // Basic inventory functions
  listInventory,
  findItem,
  countItems,
  tossItem,
  isInventoryFull,
  getInventorySummary,
  
  // Re-export weapon functions for backward compatibility
  equipBestWeapon: weapons.equipBestWeapon,
  getWeaponStatus: weapons.getWeaponStatus,
  getWeaponDamage: weapons.getWeaponDamage,
  listWeapons: weapons.listWeapons,
  
  // Re-export tool functions for backward compatibility
  equipBestAxe: tools.equipBestAxe,
  equipBestTool: tools.equipBestTool,
  equipBestToolType: tools.equipBestToolType,
  getToolEfficiency: tools.getToolEfficiency,
  listTools: tools.listTools
};
