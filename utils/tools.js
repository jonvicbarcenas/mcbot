// Tool Management Utilities
const config = require('../config');

// Get tool efficiency for ranking
function getToolEfficiency(toolName) {
  // Efficiency/speed multipliers based on Minecraft tool stats
  const efficiencyValues = {
    // Pickaxes
    'netherite_pickaxe': 9,
    'diamond_pickaxe': 8,
    'iron_pickaxe': 6,
    'stone_pickaxe': 4,
    'golden_pickaxe': 12, // Fast but low durability
    'wooden_pickaxe': 2,
    
    // Axes (for chopping wood)
    'netherite_axe': 9,
    'diamond_axe': 8,
    'iron_axe': 6,
    'stone_axe': 4,
    'golden_axe': 12,
    'wooden_axe': 2,
    
    // Shovels
    'netherite_shovel': 9,
    'diamond_shovel': 8,
    'iron_shovel': 6,
    'stone_shovel': 4,
    'golden_shovel': 12,
    'wooden_shovel': 2,
    
    // Hoes
    'netherite_hoe': 9,
    'diamond_hoe': 8,
    'iron_hoe': 6,
    'stone_hoe': 4,
    'golden_hoe': 12,
    'wooden_hoe': 2,
  };
  
  return efficiencyValues[toolName] || 1;
}

// Equip the best available axe
async function equipBestAxe(bot, state) {
  for (const axeType of config.crafting.axePriority) {
    const axe = bot.inventory.items().find(item => item.name === axeType);
    
    if (axe) {
      await bot.equip(axe, 'hand');
      console.log(`Equipped ${axeType}`);
      return { success: true, item: axeType };
    }
  }

  console.log('No axe available in inventory');
  return { success: false, message: 'No axe available' };
}

// Equip best tool for a specific block type
async function equipBestTool(bot, blockType) {
  // Get the best tool for this block
  const tool = bot.pathfinder.bestHarvestTool(bot.blockAt(blockType));
  
  if (tool) {
    await bot.equip(tool, 'hand');
    return { success: true, item: tool.name };
  }

  return { success: false, message: 'No suitable tool' };
}

// Equip best tool of a specific type
async function equipBestToolType(bot, toolType) {
  try {
    const items = bot.inventory.items();
    let tools = [];
    
    // Filter tools by type
    if (toolType === 'pickaxe') {
      tools = items.filter(item => item.name.includes('_pickaxe'));
    } else if (toolType === 'axe') {
      tools = items.filter(item => item.name.includes('_axe'));
    } else if (toolType === 'shovel') {
      tools = items.filter(item => item.name.includes('_shovel'));
    } else if (toolType === 'hoe') {
      tools = items.filter(item => item.name.includes('_hoe'));
    } else {
      return {
        success: false,
        message: `Unknown tool type: ${toolType}`
      };
    }
    
    if (tools.length === 0) {
      return {
        success: false,
        message: `No ${toolType} found in inventory`
      };
    }
    
    // Sort by efficiency (best first)
    tools.sort((a, b) => getToolEfficiency(b.name) - getToolEfficiency(a.name));
    
    const bestTool = tools[0];
    await bot.equip(bestTool, 'hand');
    console.log(`✅ Equipped ${bestTool.name} (efficiency: ${getToolEfficiency(bestTool.name)})`);
    
    return {
      success: true,
      tool: bestTool.name,
      efficiency: getToolEfficiency(bestTool.name),
      message: `Equipped ${bestTool.name}`
    };
    
  } catch (error) {
    console.error(`Error equipping ${toolType}:`, error.message);
    return {
      success: false,
      message: `Failed to equip ${toolType}: ${error.message}`
    };
  }
}

// List all tools in inventory
function listTools(bot) {
  const items = bot.inventory.items();
  const tools = items.filter(item => {
    return item.name.includes('_pickaxe') || 
           item.name.includes('_axe') || 
           item.name.includes('_shovel') || 
           item.name.includes('_hoe');
  });
  
  const toolList = tools.map(tool => ({
    name: tool.name,
    efficiency: getToolEfficiency(tool.name),
    count: tool.count
  }));
  
  // Sort by efficiency
  toolList.sort((a, b) => b.efficiency - a.efficiency);
  
  return {
    success: true,
    tools: toolList,
    count: toolList.length
  };
}

module.exports = {
  equipBestAxe,
  equipBestTool,
  equipBestToolType,
  getToolEfficiency,
  listTools
};
