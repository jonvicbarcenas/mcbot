// Lumberjack Behavior - Finding and chopping logs
const { goals } = require('mineflayer-pathfinder');
const config = require('../config');

class Lumberjack {
  constructor(bot, state) {
    this.bot = bot;
    this.state = state;
  }

  // Find the nearest log
  findNearestLog() {
    let nearestLog = null;
    let minDistance = Infinity;

    console.log(`🔍 Searching for logs within ${config.behavior.chopRadius} blocks...`);

    for (const logType of config.logTypes) {
      const block = this.bot.findBlock({
        matching: (block) => block.name === logType,
        maxDistance: config.behavior.chopRadius
      });

      if (block) {
        const distance = this.bot.entity.position.distanceTo(block.position);
        if (distance < minDistance) {
          minDistance = distance;
          nearestLog = block;
        }
      }
    }

    if (nearestLog) {
      console.log(`✅ Found ${nearestLog.name} at distance ${minDistance.toFixed(1)} blocks`);
    } else {
      console.log(`❌ No logs found within search radius`);
    }

    return nearestLog;
  }

  // Chop a specific log block
  async chopLog(logBlock) {
    if (!logBlock) {
      throw new Error('No log block provided');
    }

    this.state.setTask('chopping', `Chopping ${logBlock.name}`);
    this.state.setMood('working');

    try {
            // Equip best axe
            const inventory = require('../utils/inventory');
            await inventory.equipBestAxe(this.bot, this.state);
      
            console.log(`🚶 Navigating to ${logBlock.name} at ${logBlock.position.x.toFixed(0)}, ${logBlock.position.y.toFixed(0)}, ${logBlock.position.z.toFixed(0)}`);
      
            // Use smart navigation to get to the log
            const NavigationBehavior = require('./navigation');
            const navigation = new NavigationBehavior(this.bot, this.state);
            const goal = new goals.GoalNear(logBlock.position.x, logBlock.position.y, logBlock.position.z, 2);
            const navResult = await navigation.smartNavigate(goal);
      
            if (!navResult.success) {
              throw new Error(`Could not reach log: ${navResult.message}`);
            }
            
            console.log(`✅ Reached log, now digging...`);
            
            // Dig the log
            await this.bot.dig(logBlock);
            console.log('✅ Log broken, waiting for items to drop...');
      
            // Wait longer for items to drop and spawn
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Find nearby dropped items (logs)
            const droppedItems = Object.values(this.bot.entities).filter(entity => {
              if (entity.name === 'item' && entity.position) {
                const distance = this.bot.entity.position.distanceTo(entity.position);
                return distance < 10; // Within 10 blocks
              }
              return false;
            });
      
            console.log(`📦 Found ${droppedItems.length} dropped item(s) nearby`);
      
            // Move to collect each dropped item
            for (const itemEntity of droppedItems) {
              try {
                // Check if item still exists
                if (!itemEntity.position) {
                  console.log('⚠️  Item disappeared before collection');
                  continue;
                }
                
                const itemPos = itemEntity.position;
                const currentDistance = this.bot.entity.position.distanceTo(itemPos);
                
                console.log(`📍 Moving to collect item at distance ${currentDistance.toFixed(1)} blocks...`);
                
                // Use a closer range (1 block) to ensure pickup
                const goal = new goals.GoalNear(
                  Math.floor(itemPos.x),
                  Math.floor(itemPos.y),
                  Math.floor(itemPos.z),
                  1  // Get within 1 block
                );
                
                // Try to navigate to item with timeout
                try {
                  const itemTimeout = 8000; // 8 seconds for items
                  const itemNavPromise = this.bot.pathfinder.goto(goal);
                  const itemTimeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Item collection timeout')), itemTimeout)
                  );
      
                  await Promise.race([itemNavPromise, itemTimeoutPromise]);
                  
                  console.log('✅ Reached item location');
                  
                  // Wait longer for automatic pickup
                  await new Promise(resolve => setTimeout(resolve, 500));
                } catch (navError) {
                  console.log(`⚠️  Could not reach item: ${navError.message}`);
                  continue;
                }
              } catch (pickupError) {
                console.log(`⚠️  Error collecting item: ${pickupError.message}`);
                continue;
              }
            }
            
            console.log('✅ Item collection complete');
      
            // Update statistics
            this.state.incrementLogCount();
            this.state.memory.lastLogPosition = logBlock.position.clone();
      
            this.state.completeTask();
            
            return true;
          } catch (error) {
            this.state.cancelTask();
            
            // Provide helpful error messages
            if (error.message.includes('timeout')) {
              throw new Error(`Could not reach log - navigation timeout. Log may be behind doors or obstacles.`);
            } else if (error.message.includes('no path')) {
              throw new Error(`No path to log found. It may be unreachable or behind closed doors.`);
            } else {
              throw error;
            }
          }
        }
      
        // Check if bot has an axe, craft one if not
        async ensureHasAxe() {
          const hasAxe = this.bot.inventory.items().some(
            item => item.name.includes('_axe')
          );
      
          if (!hasAxe) {
            if (config.chat.announceActions) {
              this.bot.chat('No axe detected! Attempting to craft one first...');
            }
      
            const Crafting = require('./crafting');
            const crafter = new Crafting(this.bot, this.state);
            const craftResult = await crafter.craftAxe();
      
            if (!craftResult.success) {
              // Try to craft planks and sticks from logs in inventory
              const logs = this.bot.inventory.items().find(item => item.name.includes('_log'));
              
              if (logs) {
                if (config.chat.announceActions) {
                  this.bot.chat('Crafting planks and sticks first...');
                }
                
                await crafter.craftPlanks(8);
                await crafter.craftSticks(4);
                
                // Try crafting axe again
                const secondAttempt = await crafter.craftAxe();
                return secondAttempt;
              }
              
              return craftResult;
            }
      
            return craftResult;
          }
      
          return { success: true, message: 'Axe already available' };
        }
      
        // Main chopping routine
        // @param {boolean} returnHome - Whether to return home after chopping (default: true for single chops)
        async executeChop(returnHome = true) {
          // STEP 1: Ensure we have an axe (craft if needed)
          const axeCheck = await this.ensureHasAxe();
          
          if (!axeCheck.success) {
            this.state.cancelTask();
            return { 
              success: false, 
              message: 'Cannot chop: No axe and unable to craft one. Need wood or materials!' 
            };
          }
      
          // STEP 2: Find logs
          this.state.setTask('searching', 'Looking for logs');
          
          const logBlock = this.findNearestLog();
      
          if (!logBlock) {
            this.state.cancelTask();
            return { success: false, message: 'No logs found nearby!' };
          }
      
          if (config.chat.announceActions) {
            this.bot.chat(`Found ${logBlock.name} at ${logBlock.position}`);
          }
      
          // STEP 3: Chop the log
          try {
            await this.chopLog(logBlock);
            
            // STEP 4: Check if we need to craft a new axe after chopping
            const Crafting = require('./crafting');
            const crafter = new Crafting(this.bot, this.state);
            await crafter.checkAndCraftAxe();
      
            // Only return home if requested (single chop command)
            if (returnHome && config.home.enabled && config.home.returnAfterChop && config.home.position) {
              await this.returnHome();
            }
            
            return { 
              success: true, 
              message: 'Log chopped successfully!',
              logType: logBlock.name
            };
          } catch (error) {
            return { 
              success: false, 
              message: `Error: ${error.message}` 
            };
          }
        }
        
        // Return to home position using NavigationBehavior
        async returnHome() {
          if (!config.home.position) {
            console.log('⚠️  No home position set');
            return { success: false, message: 'No home position set' };
          }
          
          try {
            const { x, y, z } = config.home.position;
            const botPos = this.bot.entity.position;
            const distance = Math.sqrt(
              Math.pow(botPos.x - x, 2) + 
              Math.pow(botPos.y - y, 2) + 
              Math.pow(botPos.z - z, 2)
            );
            
            // Only navigate if not already at home
            if (distance > 5) {
              console.log(`🏠 Returning home to ${x}, ${y}, ${z} (${distance.toFixed(1)} blocks away)...`);
              console.log(`📍 Current position: ${botPos.x.toFixed(1)}, ${botPos.y.toFixed(1)}, ${botPos.z.toFixed(1)}`);
              
              if (config.chat.announceActions) {
                this.bot.chat('Returning home...');
              }
              
              // Use NavigationBehavior for proper pathfinding with door handling
              const NavigationBehavior = require('./navigation');
              const navigation = new NavigationBehavior(this.bot, this.state);
              
              console.log('🔄 Starting navigation to home...');
              const result = await navigation.goToPosition(x, y, z, 3);
              
              if (result.success) {
                console.log('✅ Arrived home!');
                if (config.chat.announceActions) {
                  this.bot.chat('Arrived home!');
                }
                return { success: true, message: 'Returned home' };
              } else {
                console.log('❌ Could not return home:', result.message);
                if (config.chat.announceActions) {
                  this.bot.chat(`Could not reach home: ${result.message}`);
                }
                return { success: false, message: result.message };
              }
            } else {
              console.log('✅ Already at home');
              return { success: true, message: 'Already at home' };
            }
          } catch (error) {
            console.error('❌ Error returning home:', error.message);
            console.error('Stack trace:', error.stack);
            
            // Reset state on error
            this.state.cancelTask();
            this.state.setMood('idle');
            
            if (config.chat.announceActions) {
              this.bot.chat('Error returning home!');
            }
            
            return { success: false, message: error.message };
          }
        }
      
        // Chop multiple logs in an area
        async chopArea(count = 10) {
          // Ensure we have an axe before starting
          const axeCheck = await this.ensureHasAxe();
          
          if (!axeCheck.success) {
            return { 
              success: false, 
              message: 'Cannot chop: No axe and unable to craft one!' 
            };
          }
      
          this.state.setMood('working');
          let chopped = 0;
      
          // Chop all logs WITHOUT returning home each time
          for (let i = 0; i < count; i++) {
            const result = await this.executeChop(false); // Pass false to skip home return
            
            if (!result.success) {
              break;
            }
            
            chopped++;
            
            // Small delay between chops
            await new Promise(resolve => setTimeout(resolve, 500));
          }
      
          this.state.setMood('idle');
          
          // Return home AFTER all logs are chopped
          if (chopped > 0 && config.home.enabled && config.home.returnAfterChop && config.home.position) {
            console.log(`✅ Finished chopping ${chopped} logs, returning home...`);
            await this.returnHome();
          }
          
          return {
            success: true,
            message: `Chopped ${chopped} logs`,
            count: chopped
          };
        }
      
        // Find and chop a full tree
        async chopTree(baseLog) {
          const logsToChop = [baseLog];
          const chopped = [];
      
          // Find all connected logs (tree trunk)
          const findConnectedLogs = (block) => {
            const radius = 2;
            for (let x = -radius; x <= radius; x++) {
              for (let y = 0; y <= 10; y++) {
                for (let z = -radius; z <= radius; z++) {
                  const pos = block.position.offset(x, y, z);
                  const checkBlock = this.bot.blockAt(pos);
                  
                  if (checkBlock && 
                      config.logTypes.includes(checkBlock.name) &&
                      !logsToChop.includes(checkBlock) &&
                      !chopped.includes(checkBlock)) {
                    logsToChop.push(checkBlock);
                  }
                }
              }
            }
          };
      
          findConnectedLogs(baseLog);
      
          // Chop all logs in the tree
          for (const log of logsToChop) {
            try {
              await this.chopLog(log);
              chopped.push(log);
            } catch (error) {
              console.error('Error chopping log:', error.message);
              break;
            }
          }
                return {
                  success: true,
                  message: `Chopped tree with ${chopped.length} logs`,
                  count: chopped.length
              };
            }
          }
          
          module.exports = Lumberjack;

    
