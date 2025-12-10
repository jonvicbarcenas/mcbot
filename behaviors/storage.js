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
  findNearestChest(location, radius) {
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

      for (const item of items) {
        if (item.name === itemName) {
          await chestWindow.deposit(item.type, null, item.count);
          totalDeposited += item.count;
          console.log(`✅ Deposited ${item.count} ${itemName}`);
        }
      }

      // Close the chest
      chestWindow.close();
      
      console.log(`✅ Deposited total of ${totalDeposited} ${itemName} into chest`);

      this.state.completeTask();

      return {
        success: true,
        deposited: totalDeposited
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
    const chest = this.findNearestChest(chestLocation, this.config.behavior.chestSearchRadius);

    if (!chest) {
      return { success: false, message: 'No chest found near target location!' };
    }

    try {
      const result = await this.depositItems(chest, itemName);
      return {
        success: true,
        message: `Deposited ${result.deposited} ${itemName} into chest!`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }
}

module.exports = Storage;
