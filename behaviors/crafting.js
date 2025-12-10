// Crafting Behavior - Crafting axes and managing crafting tables
const Vec3 = require('vec3');
const config = require('../config');

class Crafting {
  constructor(bot, state) {
    this.bot = bot;
    this.state = state;
  }

  // Craft a crafting table from planks
  async craftCraftingTable() {
    const planks = this.bot.inventory.items().find(
      item => item.name.includes('_planks')
    );

    if (!planks || planks.count < 4) {
      return { success: false, message: 'Need 4 planks to craft a crafting table!' };
    }

    const mcData = require('minecraft-data')(this.bot.version);
    const craftingTableItem = mcData.itemsByName['crafting_table'];

    if (!craftingTableItem) {
      return { success: false, message: 'Cannot find crafting table recipe!' };
    }

    const recipes = this.bot.recipesFor(craftingTableItem.id, null, 1, null);

    if (!recipes || recipes.length === 0) {
      return { success: false, message: 'No crafting table recipe available!' };
    }

    try {
      if (config.chat.announceActions) {
        this.bot.chat('Crafting a crafting table...');
      }

      // Crafting table can be crafted in inventory (2x2 grid)
      await this.bot.craft(recipes[0], 1, null);

      if (config.chat.announceActions) {
        this.bot.chat('Crafted a crafting table!');
      }

      return { success: true, message: 'Crafted crafting table!' };
    } catch (error) {
      console.error('Error crafting crafting table:', error);
      return { success: false, message: error.message };
    }
  }

  // Find or place a crafting table
  async findOrPlaceCraftingTable() {
    // Look for nearby crafting table
    let craftingTable = this.bot.findBlock({
      matching: (block) => block.name === 'crafting_table',
      maxDistance: 64
    });

    if (craftingTable) {
      const distance = this.bot.entity.position.distanceTo(craftingTable.position);
      console.log(`Found crafting table ${distance.toFixed(1)} blocks away at ${craftingTable.position}`);
      
      if (config.chat.announceActions) {
        this.bot.chat(`Using crafting table ${distance.toFixed(1)} blocks away`);
      }
      
      this.state.rememberLocation('lastCraftingTable', craftingTable.position);
      return craftingTable;
    }
    
    console.log('No crafting table found within 64 blocks');

    // Check memory for last known crafting table
    if (this.state.memory.lastCraftingTable) {
      const block = this.bot.blockAt(this.state.memory.lastCraftingTable);
      if (block && block.name === 'crafting_table') {
        return block;
      }
    }

    // Try to place a crafting table from inventory
    let craftingTableItem = this.bot.inventory.items().find(
      item => item.name === 'crafting_table'
    );

    // If no crafting table in inventory, try to craft one
    if (!craftingTableItem) {
      const craftResult = await this.craftCraftingTable();
      if (craftResult.success) {
        craftingTableItem = this.bot.inventory.items().find(
          item => item.name === 'crafting_table'
        );
      }
    }

    if (craftingTableItem) {
      try {
        const referenceBlock = this.bot.blockAt(
          this.bot.entity.position.offset(0, -1, 0)
        );
        
        if (referenceBlock) {
          await this.bot.equip(craftingTableItem, 'hand');
          await this.bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));

          if (config.chat.announceActions) {
            this.bot.chat('Placed crafting table!');
          }

          // Find the placed table
          craftingTable = this.bot.findBlock({
            matching: (block) => block.name === 'crafting_table',
            maxDistance: 4
          });

          if (craftingTable) {
            this.state.rememberLocation('lastCraftingTable', craftingTable.position);
          }

          return craftingTable;
        }
      } catch (error) {
        console.error('Error placing crafting table:', error.message);
      }
    }

    return null;
  }

  // Craft an axe
  async craftAxe() {
    this.state.setTask('crafting', 'Attempting to craft an axe');
    this.state.setMood('crafting');

    const mcData = require('minecraft-data')(this.bot.version);

    // Scan inventory for materials
    const items = this.bot.inventory.items();
    const planks = items.filter(i => i.name.includes('_planks'));
    const sticks = items.filter(i => i.name === 'stick');
    const totalPlanks = planks.reduce((sum, i) => sum + i.count, 0);
    const totalSticks = sticks.reduce((sum, i) => sum + i.count, 0);
    
    console.log('=== Crafting Axe - Inventory Scan ===');
    console.log(`Planks: ${totalPlanks} (${planks.map(p => `${p.name}:${p.count}`).join(', ') || 'none'})`);
    console.log(`Sticks: ${totalSticks}`);
    
    // Don't announce inventory in chat - too spammy
    // if (config.chat.announceActions) {
    //   this.bot.chat(`Inventory: ${totalPlanks} planks, ${totalSticks} sticks`);
    // }

    // Try to craft axes starting from simplest (wooden) to best
    // Reverse the priority list so we start with wooden_axe
    const craftingOrder = [...config.crafting.axePriority].reverse();
    
    // Find or place crafting table FIRST - axes need a crafting table to get recipes
    const craftingTable = await this.findOrPlaceCraftingTable();
    if (!craftingTable) {
      this.state.cancelTask();
      this.state.setMood('idle');
      const message = `Cannot craft axe: No crafting table available!`;
      if (config.chat.announceActions) {
        this.bot.chat(message);
      }
      return { success: false, message: message };
    }
    
    console.log(`Using crafting table at ${craftingTable.position}`);
    
    for (const axeName of craftingOrder) {
      const itemData = mcData.itemsByName[axeName];
      
      if (!itemData) {
        console.log(`Item data not found for ${axeName}`);
        continue;
      }

      // Pass the crafting table to recipesFor so it can find 3x3 recipes
      const recipes = this.bot.recipesFor(itemData.id, null, 1, craftingTable);

      if (recipes && recipes.length > 0) {
        const recipe = recipes[0];
        
        console.log(`Found recipe for ${axeName}, requiresTable: ${recipe.requiresTable}`);

        // Don't announce each attempt - too spammy
        // if (config.chat.announceActions) {
        //   this.bot.chat(`Trying to craft ${axeName}...`);
        // }

        try {
          // Navigate to crafting table before crafting (already found above)
          const distance = this.bot.entity.position.distanceTo(craftingTable.position);
          if (distance > 4) {
            console.log(`Navigating to crafting table (${distance.toFixed(1)} blocks away)...`);
            if (config.chat.announceActions) {
              this.bot.chat(`Moving to crafting table...`);
            }
            
            const { goals } = require('mineflayer-pathfinder');
            const goal = new goals.GoalBlock(craftingTable.position.x, craftingTable.position.y, craftingTable.position.z);
            
            try {
              await this.bot.pathfinder.goto(goal);
            } catch (navError) {
              console.error('Navigation to crafting table failed:', navError.message);
              if (config.chat.announceActions) {
                this.bot.chat('Cannot reach crafting table!');
              }
              continue;
            }
          }
          
          // Craft using the crafting table
          await this.bot.craft(recipe, 1, craftingTable);

          // Update state
          this.state.incrementAxeCount();
          this.state.completeTask();

          if (config.chat.announceActions) {
            this.bot.chat(`Successfully crafted ${axeName}!`);
          }

          // Equip the new axe
          const inventory = require('../utils/inventory');
          await inventory.equipBestAxe(this.bot, this.state);

          this.state.setMood('idle');
          
          return { 
            success: true, 
            message: `Crafted ${axeName}!`,
            item: axeName
          };
        } catch (error) {
          console.error(`Error crafting ${axeName}:`, error.message);
          if (config.chat.announceActions) {
            this.bot.chat(`Failed to craft ${axeName}: ${error.message}`);
          }
          continue;
        }
      } else {
        console.log(`No recipe found for ${axeName} - materials needed: 3 planks + 2 sticks`);
        console.log(`Have: ${totalPlanks} planks, ${totalSticks} sticks`);
        // Don't announce each failure - too spammy
        // if (config.chat.announceActions) {
        //   this.bot.chat(`Cannot craft ${axeName}: need 3 planks (have ${totalPlanks}) + 2 sticks (have ${totalSticks})`);
        // }
      }
    }

    this.state.cancelTask();
    this.state.setMood('idle');
    
    const message = `Cannot craft any axe! Have: ${totalPlanks} planks, ${totalSticks} sticks. Need: 3 planks + 2 sticks + crafting table`;
    
    if (config.chat.announceActions) {
      this.bot.chat(message);
    }
    
    return { 
      success: false, 
      message: message
    };
  }

  // Check if we have an axe, if not try to craft one
  async checkAndCraftAxe() {
    const hasAxe = this.bot.inventory.items().some(
      item => item.name.includes('_axe')
    );

    if (!hasAxe && config.crafting.autoCraftAxe) {
      if (config.chat.announceActions) {
        this.bot.chat('No axe in inventory. Attempting to craft one...');
      }
      return await this.craftAxe();
    }

    return { success: true, message: 'Axe already available' };
  }

  // Craft planks from logs
  async craftPlanks(count = 64) {
    const logs = this.bot.inventory.items().find(
      item => item.name.includes('_log')
    );

    if (!logs) {
      return { success: false, message: 'No logs in inventory!' };
    }

    this.state.setTask('crafting', 'Crafting planks from logs');

    const mcData = require('minecraft-data')(this.bot.version);
    const plankName = logs.name.replace('_log', '_planks');
    const plankItem = mcData.itemsByName[plankName];

    if (!plankItem) {
      this.state.cancelTask();
      return { success: false, message: 'Cannot find plank recipe!' };
    }

    const recipes = this.bot.recipesFor(plankItem.id, null, 1, null);
    
    if (!recipes || recipes.length === 0) {
      this.state.cancelTask();
      return { success: false, message: 'No plank recipe available!' };
    }
    
    const recipe = recipes[0];

    try {
      // Calculate how many to craft (each log = 4 planks)
      const logsToUse = Math.min(Math.ceil(count / 4), logs.count);
      const craftCount = logsToUse * 4;
      
      if (config.chat.announceActions) {
        this.bot.chat(`Crafting ${craftCount} planks from ${logsToUse} logs...`);
      }
      
      await this.bot.craft(recipe, craftCount, null);
      
      this.state.completeTask();
      
      if (config.chat.announceActions) {
        this.bot.chat(`Crafted ${craftCount} planks!`);
      }
      
      return { 
        success: true, 
        message: `Crafted ${craftCount} planks!`,
        count: craftCount
      };
    } catch (error) {
      this.state.cancelTask();
      console.error('Error crafting planks:', error);
      return { success: false, message: error.message };
    }
  }

  // Craft sticks from planks
  async craftSticks(count = 64) {
    const planks = this.bot.inventory.items().find(
      item => item.name.includes('_planks')
    );

    if (!planks) {
      return { success: false, message: 'No planks in inventory!' };
    }

    this.state.setTask('crafting', 'Crafting sticks from planks');

    const mcData = require('minecraft-data')(this.bot.version);
    const stickItem = mcData.itemsByName['stick'];

    if (!stickItem) {
      this.state.cancelTask();
      return { success: false, message: 'Cannot find stick recipe!' };
    }

    const recipes = this.bot.recipesFor(stickItem.id, null, 1, null);
    
    if (!recipes || recipes.length === 0) {
      this.state.cancelTask();
      return { success: false, message: 'No stick recipe available!' };
    }
    
    const recipe = recipes[0];

    try {
      // Calculate how many to craft (2 planks = 4 sticks)
      const planksToUse = Math.min(Math.ceil(count / 4) * 2, planks.count);
      const craftCount = Math.floor(planksToUse / 2) * 4;
      
      if (config.chat.announceActions) {
        this.bot.chat(`Crafting ${craftCount} sticks from ${planksToUse} planks...`);
      }
      
      await this.bot.craft(recipe, craftCount, null);
      
      this.state.completeTask();
      
      if (config.chat.announceActions) {
        this.bot.chat(`Crafted ${craftCount} sticks!`);
      }
      
      return { 
        success: true, 
        message: `Crafted ${craftCount} sticks!`,
        count: craftCount
      };
    } catch (error) {
      this.state.cancelTask();
      console.error('Error crafting sticks:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = Crafting;
