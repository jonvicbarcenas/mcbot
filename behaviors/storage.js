// Storage Behavior - Depositing items into chests
const { goals } = require('mineflayer-pathfinder');
const Vec3 = require('vec3').Vec3;

class Storage {
  constructor(bot, state, config) {
    this.bot = bot;
    this.state = state;
    this.config = config;
  }

  // Find nearest chest near a specific location
  findNearestChest(location, radius, excludePositions = []) {
    console.log(`🔍 Searching for chest near ${location.x}, ${location.y}, ${location.z} within ${radius} blocks...`);
    
    const mcData = require('minecraft-data')(this.bot.version);
    const chestId = mcData.blocksByName.chest?.id;
    
    if (!chestId) {
      console.log('❌ Chest block type not found in registry');
      return null;
    }

    // Find all chest blocks near the location
    const chestPositions = this.bot.findBlocks({
      matching: chestId,
      maxDistance: 128,
      count: 100,
      point: new Vec3(location.x, location.y, location.z)
    });

    if (chestPositions.length === 0) {
      console.log('❌ No chests found');
      return null;
    }

    console.log(`📦 Found ${chestPositions.length} chest(s)`);

    // Filter chests within radius of the target location
    let nearestChest = null;
    let minDistance = Infinity;

    for (const pos of chestPositions) {
      // Skip excluded chests
      const isExcluded = excludePositions.some(excludePos => 
        excludePos.x === pos.x && excludePos.y === pos.y && excludePos.z === pos.z
      );
      
      if (isExcluded) {
        continue;
      }

      const distance = pos.distanceTo(new Vec3(location.x, location.y, location.z));
      if (distance <= radius && distance < minDistance) {
        const block = this.bot.blockAt(pos);
        if (block && block.name === 'chest') {
          minDistance = distance;
          nearestChest = block;
        }
      }
    }

    if (nearestChest) {
      console.log(`✅ Found chest at ${nearestChest.position} (${minDistance.toFixed(1)} blocks from target)`);
    } else {
      console.log(`❌ No chest found within ${radius} blocks of target location`);
    }

    return nearestChest;
  }

  // Count specific item in inventory
  countItem(itemName) {
    const items = this.bot.inventory.items();
    let count = 0;
    
    for (const item of items) {
      if (item.name === itemName) {
        count += item.count;
      }
    }
    
    return count;
  }

  // Check if chest has enough space for items
  async checkChestSpace(chestWindow, itemName, itemCount) {
    // Count empty slots in chest
    let emptySlots = 0;
    const containerSlots = chestWindow.containerSlots();
    
    for (const slot of containerSlots) {
      if (!slot || slot.type === -1) {
        emptySlots++;
      } else if (slot.name === itemName) {
        // Check if this stack can hold more items
        const maxStackSize = slot.stackSize || 64;
        if (slot.count < maxStackSize) {
          // Partial stack that can accept more items
          emptySlots += (maxStackSize - slot.count) / maxStackSize;
        }
      }
    }
    
    // Rough estimate: assume each slot can hold 64 items
    const estimatedCapacity = emptySlots * 64;
    return estimatedCapacity >= itemCount;
  }

  // Deposit items into chest
  async depositItems(chest, itemName) {
    if (!chest) {
      throw new Error('No chest provided');
    }

    this.state.setTask('depositing', `Depositing ${itemName}`);
    this.state.setMood('working');

    try {
      console.log(`🚶 Navigating to chest at ${chest.position.x}, ${chest.position.y}, ${chest.position.z}`);

      const NavigationBehavior = require('./navigation');
      const navigation = new NavigationBehavior(this.bot, this.state);
      const goal = new goals.GoalNear(chest.position.x, chest.position.y, chest.position.z, 2);
      const navResult = await navigation.smartNavigate(goal);

      if (!navResult.success) {
        throw new Error(`Could not reach chest: ${navResult.message}`);
      }

      console.log(`✅ Reached chest, opening...`);

      // Open the chest
      const chestBlock = this.bot.blockAt(chest.position);
      const chestWindow = await this.bot.openContainer(chestBlock);

      console.log(`📦 Chest opened, depositing ${itemName}...`);

      // Find all items matching the name and deposit them
      const items = this.bot.inventory.items();
      let totalDeposited = 0;
      let depositFailed = false;

      for (const item of items) {
        if (item.name === itemName) {
          try {
            await chestWindow.deposit(item.type, null, item.count);
            totalDeposited += item.count;
            console.log(`✅ Deposited ${item.count} ${itemName}`);
          } catch (error) {
            console.log(`⚠️ Failed to deposit ${item.count} ${itemName}: ${error.message}`);
            depositFailed = true;
            break;
          }
        }
      }

      // Close the chest
      chestWindow.close();
      
      if (depositFailed && totalDeposited === 0) {
        // Chest is full, throw error to trigger finding another chest
        this.state.cancelTask();
        throw new Error('Chest is full');
      }

      console.log(`✅ Deposited total of ${totalDeposited} ${itemName} into chest`);

      this.state.completeTask();

      return {
        success: true,
        deposited: totalDeposited,
        partial: depositFailed
      };
    } catch (error) {
      this.state.cancelTask();
      throw error;
    }
  }

  // Main deposit routine
  async executeDeposit(itemName, threshold) {
    const count = this.countItem(itemName);
    
    console.log(`📊 Current ${itemName} count: ${count}/${threshold}`);

    if (count < threshold) {
      return { success: false, message: `Not enough ${itemName} to deposit (${count}/${threshold})` };
    }

    // Navigate to chest location and find chest
    const chestLocation = this.config.behavior.chestLocation;
    const excludedChests = [];
    const maxAttempts = 5; // Try up to 5 different chests
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`🔍 Chest search attempt ${attempt}/${maxAttempts}...`);

      const chest = this.findNearestChest(chestLocation, this.config.behavior.chestSearchRadius, excludedChests);

      if (!chest) {
        if (excludedChests.length > 0) {
          return { success: false, message: `All nearby chests are full! Tried ${excludedChests.length} chest(s).` };
        } else {
          return { success: false, message: 'No chest found near target location!' };
        }
      }

      try {
        const result = await this.depositItems(chest, itemName);
        
        // Check if we still have items to deposit
        const remainingCount = this.countItem(itemName);
        
        if (remainingCount > 0 && result.partial) {
          // Chest became full, but we have more items
          console.log(`⚠️ Chest is full. ${remainingCount} ${itemName} remaining. Finding another chest...`);
          excludedChests.push(chest.position);
          continue;
        }
        
        return {
          success: true,
          message: `Deposited ${result.deposited} ${itemName} into chest!`
        };
      } catch (error) {
        if (error.message.includes('full')) {
          console.log(`⚠️ Chest at ${chest.position.x}, ${chest.position.y}, ${chest.position.z} is full. Trying another...`);
          excludedChests.push(chest.position);
          continue;
        }
        
        return {
          success: false,
          message: `Error: ${error.message}`
        };
      }
    }

    return { 
      success: false, 
      message: `Could not deposit all items after ${maxAttempts} attempts.` 
    };
  }
}

module.exports = Storage;
