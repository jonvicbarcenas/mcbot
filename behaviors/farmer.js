// Farmer Behavior - Finding and harvesting crops
const { goals } = require('mineflayer-pathfinder');
const config = require('../config');

class Farmer {
  constructor(bot, state) {
    this.bot = bot;
    this.state = state;
    this.recentlyHarvested = new Map(); // Track recently harvested positions
  }

  // Check if a position was recently harvested
  isRecentlyHarvested(position) {
    const key = `${position.x},${position.y},${position.z}`;
    const harvestTime = this.recentlyHarvested.get(key);
    
    if (!harvestTime) return false;
    
    // Consider "recently harvested" if less than 30 seconds ago
    const timeSince = Date.now() - harvestTime;
    if (timeSince > 30000) {
      this.recentlyHarvested.delete(key);
      return false;
    }
    
    return true;
  }

  // Mark a position as recently harvested
  markAsHarvested(position) {
    const key = `${position.x},${position.y},${position.z}`;
    this.recentlyHarvested.set(key, Date.now());
  }

  // Find the nearest sugarcane to harvest
  findNearestSugarcane() {
    let nearestSugarcane = null;
    let minDistance = Infinity;

    console.log(`🔍 Searching for sugarcane within ${config.behavior.farmRadius} blocks...`);

    // First, find all sugarcane blocks (matching by block type ID)
    const sugarcaneBlockType = this.bot.registry.blocksByName.sugar_cane;
    if (!sugarcaneBlockType) {
        console.log(`❌ Sugar cane block type not found in registry`);
        return null;
    }

    const sugarcanePositions = this.bot.findBlocks({
        matching: sugarcaneBlockType.id,
        maxDistance: config.behavior.farmRadius,
        count: 200
    });

    if (sugarcanePositions.length === 0) {
        console.log(`❌ No sugarcane found within search radius`);
        return null;
    }

    // Filter for mature sugarcane (has at least 2 blocks high) and not recently harvested
    const matureSugarcane = [];
    for (const pos of sugarcanePositions) {
        const block = this.bot.blockAt(pos);
        if (block && block.name === 'sugar_cane') {
            // Skip if recently harvested
            if (this.isRecentlyHarvested(block.position)) {
                continue;
            }
            
            const blockUp = this.bot.blockAt(pos.offset(0, 1, 0));
            if (blockUp && blockUp.name === 'sugar_cane') {
                matureSugarcane.push(block);
            }
        }
    }

    if (matureSugarcane.length === 0) {
        console.log(`❌ No mature sugarcane found within search radius`);
        return null;
    }

    // Find the nearest mature sugarcane
    for (const block of matureSugarcane) {
      const distance = this.bot.entity.position.distanceTo(block.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestSugarcane = block;
      }
    }

    if (nearestSugarcane) {
      console.log(`✅ Found sugarcane at distance ${minDistance.toFixed(1)} blocks`);
    }

    return nearestSugarcane;
  }

  // Find multiple mature sugarcane plants to harvest (batch processing)
  findMultipleSugarcane(maxCount = 10) {
    console.log(`🔍 Searching for up to ${maxCount} sugarcane within ${config.behavior.farmRadius} blocks...`);

    // First, find all sugarcane blocks (matching by block type ID)
    const sugarcaneBlockType = this.bot.registry.blocksByName.sugar_cane;
    if (!sugarcaneBlockType) {
        console.log(`❌ Sugar cane block type not found in registry`);
        return [];
    }

    const sugarcanePositions = this.bot.findBlocks({
        matching: sugarcaneBlockType.id,
        maxDistance: config.behavior.farmRadius,
        count: 200
    });

    if (sugarcanePositions.length === 0) {
        console.log(`❌ No sugarcane found within search radius`);
        return [];
    }

    // Filter for mature sugarcane (has at least 2 blocks high) and not recently harvested
    const matureSugarcane = [];
    for (const pos of sugarcanePositions) {
        const block = this.bot.blockAt(pos);
        if (block && block.name === 'sugar_cane') {
            // Skip if recently harvested
            if (this.isRecentlyHarvested(block.position)) {
                continue;
            }
            
            const blockUp = this.bot.blockAt(pos.offset(0, 1, 0));
            if (blockUp && blockUp.name === 'sugar_cane') {
                matureSugarcane.push(block);
            }
        }
    }

    if (matureSugarcane.length === 0) {
        console.log(`❌ No mature sugarcane found within search radius`);
        return [];
    }

    // Sort by distance from bot
    matureSugarcane.sort((a, b) => {
      const distA = this.bot.entity.position.distanceTo(a.position);
      const distB = this.bot.entity.position.distanceTo(b.position);
      return distA - distB;
    });

    // Return up to maxCount sugarcane
    const selectedSugarcane = matureSugarcane.slice(0, maxCount);
    console.log(`✅ Found ${selectedSugarcane.length} mature sugarcane to harvest`);

    return selectedSugarcane;
  }

  // Harvest a specific sugarcane block
  async harvestSugarcane(sugarcaneBlock) {
    if (!sugarcaneBlock) {
      throw new Error('No sugarcane block provided');
    }

    this.state.setTask('harvesting', `Harvesting sugarcane`);
    this.state.setMood('working');

    try {
        console.log(`🚶 Navigating to sugarcane at ${sugarcaneBlock.position.x.toFixed(0)}, ${sugarcaneBlock.position.y.toFixed(0)}, ${sugarcaneBlock.position.z.toFixed(0)}`);

        const NavigationBehavior = require('./navigation');
        const navigation = new NavigationBehavior(this.bot, this.state);
        const goal = new goals.GoalNear(sugarcaneBlock.position.x, sugarcaneBlock.position.y, sugarcaneBlock.position.z, 2);
        const navResult = await navigation.smartNavigate(goal);

        if (!navResult.success) {
          throw new Error(`Could not reach sugarcane: ${navResult.message}`);
        }

        console.log(`✅ Reached sugarcane, now harvesting...`);

        // Find and break all sugarcane blocks above the base
        let blocksHarvested = 0;
        for (let yOffset = 1; yOffset <= 3; yOffset++) {
          const blockToCheck = this.bot.blockAt(sugarcaneBlock.position.offset(0, yOffset, 0));
          if (blockToCheck && blockToCheck.name === 'sugar_cane') {
            await this.bot.dig(blockToCheck);
            blocksHarvested++;
            // Small delay between breaks
            await new Promise(resolve => setTimeout(resolve, 200));
          } else {
            break; // Stop when we hit non-sugarcane
          }
        }

        console.log(`✅ Harvested ${blocksHarvested} sugarcane block(s), waiting for items to drop...`);

        // Mark this location as recently harvested
        this.markAsHarvested(sugarcaneBlock.position);

        // Wait for items to drop and settle
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Collect dropped sugarcane items
        await this.collectDroppedItems(sugarcaneBlock.position);

        this.state.completeTask();

        return true;
      } catch (error) {
        this.state.cancelTask();
        throw error;
      }
    }

  // Collect dropped items near a location using collectblock plugin
  async collectDroppedItems(position) {
    try {
      console.log('🔍 Looking for dropped sugarcane items...');
      
      // Get the sugarcane item type from registry
      const mcData = require('minecraft-data')(this.bot.version);
      const sugarcaneItem = mcData.itemsByName['sugar_cane'];
      
      if (!sugarcaneItem) {
        console.log('⚠️  Sugar cane item type not found');
        return;
      }

      // Find all nearby dropped sugarcane items
      const droppedSugarcane = Object.values(this.bot.entities).filter(entity => {
        if (!entity || entity.name !== 'item') return false;
        
        // Check if it's a sugarcane item
        if (entity.metadata && entity.metadata[8]) {
          const itemData = entity.metadata[8];
          if (itemData.itemId === sugarcaneItem.id) {
            const distance = entity.position.distanceTo(position);
            return distance <= 16; // Search within 16 blocks
          }
        }
        
        return false;
      });

      if (droppedSugarcane.length === 0) {
        console.log('No dropped sugarcane found nearby');
        return;
      }

      console.log(`📦 Found ${droppedSugarcane.length} dropped sugarcane item(s), collecting...`);

      // Use collectblock plugin to collect each item
      for (const itemEntity of droppedSugarcane) {
        if (!itemEntity.isValid) continue;

        try {
          // Use the collectblock plugin's collect method
          await this.bot.collectBlock.collect(itemEntity, { ignoreNoPath: true });
          console.log('✅ Collected sugarcane item');
        } catch (err) {
          console.log(`⚠️  Could not collect item: ${err.message}`);
        }
      }

      console.log('✅ Finished collecting items');
    } catch (error) {
      console.log(`⚠️  Error collecting items: ${error.message}`);
    }
  }

    // Main harvesting routine
    async executeHarvest() {
      this.state.setTask('searching', 'Looking for sugarcane');

      // Find multiple sugarcane plants to harvest (batch processing)
      const sugarcaneBlocks = this.findMultipleSugarcane(10);

      if (sugarcaneBlocks.length === 0) {
        this.state.cancelTask();
        return { success: false, message: 'No mature sugarcane found nearby!' };
      }

      try {
        let totalHarvested = 0;

        // Harvest each sugarcane in the batch
        for (let i = 0; i < sugarcaneBlocks.length; i++) {
          const sugarcaneBlock = sugarcaneBlocks[i];
          console.log(`🌾 Harvesting sugarcane ${i + 1}/${sugarcaneBlocks.length}...`);
          
          try {
            await this.harvestSugarcane(sugarcaneBlock);
            totalHarvested++;
          } catch (error) {
            console.log(`⚠️ Failed to harvest sugarcane at ${sugarcaneBlock.position}: ${error.message}`);
            // Continue with next sugarcane even if one fails
          }
        }

        console.log(`✅ Batch complete! Harvested ${totalHarvested}/${sugarcaneBlocks.length} sugarcane`);

        // Check if we need to deposit sugarcane
        await this.checkAndDeposit();

        return {
          success: true,
          message: `Harvested ${totalHarvested} sugarcane!`
        };
      } catch (error) {
        return {
          success: false,
          message: `Error: ${error.message}`
        };
      }
    }

    // Check sugarcane count and deposit if needed
    async checkAndDeposit() {
      const config = require('../config');
      const threshold = config.behavior.sugarcaneDepositThreshold;
      
      // Count sugarcane in inventory
      const items = this.bot.inventory.items();
      let sugarcaneCount = 0;
      
      for (const item of items) {
        if (item.name === 'sugar_cane') {
          sugarcaneCount += item.count;
        }
      }

      console.log(`📊 Sugarcane in inventory: ${sugarcaneCount}/${threshold}`);

      if (sugarcaneCount >= threshold) {
        console.log(`📦 Sugarcane threshold reached! Depositing to chest...`);
        
        const Storage = require('./storage');
        const storage = new Storage(this.bot, this.state, config);
        
        const result = await storage.executeDeposit('sugar_cane', threshold);
        console.log(`📦 Deposit result: ${result.message}`);
      }
    }
}

module.exports = Farmer;
