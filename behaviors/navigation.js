// Navigation Behavior - Advanced pathfinding with AI
const { goals } = require('mineflayer-pathfinder');
const config = require('../config');

class NavigationBehavior {
  constructor(bot, state) {
    this.bot = bot;
    this.state = state;
    this.isFollowing = false;
    this.followTarget = null;
    this.followInterval = null;
    this.lastPosition = null;
    this.pathAttempts = 0;
    this.maxPathAttempts = 3;
  }

  /**
   * Navigate to a specific player's position
   * @param {string} username - The player to navigate to
   * @returns {Object} Result with success status and message
   */
  async goToPlayer(username) {
    try {
      // Find the player
      const player = this.bot.players[username];
      if (!player || !player.entity) {
        return {
          success: false,
          message: `Cannot find player ${username}!`
        };
      }

      const targetPos = player.entity.position;
      this.state.setMood('following');
      this.state.setTask('navigate', `Going to ${username}`);

      console.log(`🚶 Navigating to ${username} at ${targetPos.x.toFixed(0)}, ${targetPos.y.toFixed(0)}, ${targetPos.z.toFixed(0)}`);

      // Create goal with some distance to avoid getting too close
      const goal = new goals.GoalNear(targetPos.x, targetPos.y, targetPos.z, 2);

      // Navigate to player
      await this.bot.pathfinder.goto(goal);

      this.state.completeTask();
      this.state.setMood('idle');

      console.log(`✅ Reached ${username}`);
      return {
        success: true,
        message: `Reached ${username}!`
      };

    } catch (error) {
      this.state.cancelTask();
      this.state.setMood('idle');

      console.error('Navigation error:', error.message);

      // Try to handle specific errors
      if (error.message.includes('too far')) {
        return {
          success: false,
          message: 'Target is too far away!'
        };
      } else if (error.message.includes('no path')) {
        return {
          success: false,
          message: 'Cannot find a path to target!'
        };
      }

      return {
        success: false,
        message: `Navigation failed: ${error.message}`
      };
    }
  }

  /**
   * Navigate to specific coordinates with retry logic and stuck detection
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} range - How close to get (default: 2)
   * @returns {Object} Result with success status and message
   */
  async goToPosition(x, y, z, range = 2) {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      attempt++;
      
      try {
        this.state.setMood('exploring');
        this.state.setTask('navigate', `Going to ${x}, ${y}, ${z} (attempt ${attempt}/${maxRetries})`);

        console.log(`🚶 Navigating to ${x.toFixed(0)}, ${y.toFixed(0)}, ${z.toFixed(0)} (attempt ${attempt}/${maxRetries})`);

        // Vary the range for different attempts to find alternative paths
        const adjustedRange = range + (attempt - 1) * 2; // Increase acceptable range on retries
        
        // Create goal
        const goal = new goals.GoalNear(x, y, z, adjustedRange);

        // Track bot position to detect if stuck
        let lastPos = this.bot.entity.position.clone();
        let stuckCount = 0;
        const stuckCheckInterval = 3000; // Check every 3 seconds
        
        // Setup stuck detection
        const stuckChecker = setInterval(async () => {
          const currentPos = this.bot.entity.position;
          const moved = Math.sqrt(
            Math.pow(currentPos.x - lastPos.x, 2) +
            Math.pow(currentPos.y - lastPos.y, 2) +
            Math.pow(currentPos.z - lastPos.z, 2)
          );
          
          if (moved < 1) {
            // Bot hasn't moved more than 1 block in 3 seconds
            stuckCount++;
            console.log(`⚠️  Bot appears stuck (${stuckCount * 3}s without progress)`);
            await this._handleDoors(); // Try to open doors if stuck
            
            if (stuckCount >= 3) {
              // Stuck for 9 seconds, cancel this attempt
              console.log('🛑 Bot stuck, canceling navigation attempt...');
              this.bot.pathfinder.setGoal(null);
              clearInterval(stuckChecker);
            }
          } else {
            stuckCount = 0;
          }
          
          lastPos = currentPos.clone();
        }, stuckCheckInterval);

        // Navigate to position with timeout
        const timeout = 60000; // 1 minute per attempt
        const navigationPromise = this.bot.pathfinder.goto(goal);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Navigation timeout')), timeout)
        );

        await Promise.race([navigationPromise, timeoutPromise]);

        // Clear stuck detection
        clearInterval(stuckChecker);

        this.state.completeTask();
        this.state.setMood('idle');

        const currentPos = this.bot.entity.position;
        const distance = Math.sqrt(
          Math.pow(currentPos.x - x, 2) +
          Math.pow(currentPos.y - y, 2) +
          Math.pow(currentPos.z - z, 2)
        );

        console.log(`✅ Reached destination (${distance.toFixed(1)} blocks away)`);
        return {
          success: true,
          message: `Reached destination! (${distance.toFixed(1)} blocks away)`
        };

      } catch (error) {
        
        console.error(`❌ Navigation attempt ${attempt} failed: ${error.message}`);

        // If this was the last attempt, give up
        if (attempt >= maxRetries) {
          this.state.cancelTask();
          this.state.setMood('idle');
          
          if (error.message.includes('timeout')) {
            return {
              success: false,
              message: 'Navigation took too long after multiple attempts! Stopped.'
            };
          } else if (error.message.includes('no path')) {
            return {
              success: false,
              message: 'Cannot find a path to destination after multiple attempts!'
            };
          }

          return {
            success: false,
            message: `Navigation failed after ${maxRetries} attempts: ${error.message}`
          };
        }
        
        // Cancel current pathfinding goal before retry
        this.bot.pathfinder.setGoal(null);
        
        console.log(`🔄 Retrying navigation (${attempt}/${maxRetries})...`);
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Should never reach here, but just in case
    this.state.cancelTask();
    this.state.setMood('idle');
    return {
      success: false,
      message: 'Navigation failed after all retry attempts'
    };
  }

  async _handleDoors() {
    const doors = this.bot.findBlocks({
        matching: (block) => {
            return block.name.includes('door') && !block.name.includes('trapdoor');
        },
        maxDistance: 2,
        count: 4
    });

    for (const door of doors) {
        const block = this.bot.blockAt(door);
        if (block && block.stateId && !block.getProperties().open) {
            console.log(`🚪 Found a closed door at ${door.x}, ${door.y}, ${door.z}, attempting to open it.`);
            try {
                await this.bot.activateBlock(block);
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait half a second for the door to open
            } catch (error) {
                console.error(`Could not open door: ${error.message}`);
            }
        }
    }
}

  /**
   * Continuously follow a player
   * @param {string} username - The player to follow
   * @returns {Object} Result with success status and message
   */
  async followPlayer(username) {
    // Stop any existing follow behavior
    this.stopFollowing();

    const player = this.bot.players[username];
    if (!player || !player.entity) {
      return {
        success: false,
        message: `Cannot find player ${username}!`
      };
    }

    this.isFollowing = true;
    this.followTarget = username;
    this.state.setMood('following');
    this.state.owner = username;

    console.log(`👥 Following ${username}`);

    const followDistance = config.behavior.followDistance;
    const goal = new goals.GoalFollow(player.entity, followDistance);
    this.bot.pathfinder.setGoal(goal, true);

    return {
      success: true,
      message: `Now following ${username}! Use 'stop' to stop following.`
    };
  }
  


  /**
   * Stop following and all navigation
   * @returns {Object} Result with success status and message
   */
  stop() {
    const wasFollowing = this.isFollowing;
    
    this.stopFollowing();
    
    // Stop pathfinding
    this.bot.pathfinder.setGoal(null);
    
    this.state.cancelTask();
    this.state.setMood('idle');
    this.state.owner = null;

    console.log('🛑 Stopped all navigation');

    return {
      success: true,
      message: wasFollowing ? 'Stopped following!' : 'Stopped moving!'
    };
  }

  /**
   * Stop following behavior
   */
  stopFollowing() {
    if (this.followInterval) {
      clearInterval(this.followInterval);
      this.followInterval = null;
    }
    this.isFollowing = false;
    this.followTarget = null;
    this.lastPosition = null;
  }

  /**
   * Explore randomly in the area
   * @param {number} distance - Maximum distance to explore (default: 50)
   * @returns {Object} Result with success status and message
   */
  async explore(distance = 50) {
    try {
      this.state.setMood('exploring');
      this.state.setTask('explore', 'Exploring area');

      const currentPos = this.bot.entity.position;
      
      // Generate random position within distance
      const randomX = currentPos.x + (Math.random() - 0.5) * distance * 2;
      const randomZ = currentPos.z + (Math.random() - 0.5) * distance * 2;
      
      // Try to find ground level at target location
      const randomY = currentPos.y;

      console.log(`🗺️  Exploring to ${randomX.toFixed(0)}, ${randomY.toFixed(0)}, ${randomZ.toFixed(0)}`);

      const goal = new goals.GoalNear(randomX, randomY, randomZ, 3);

      await this.bot.pathfinder.goto(goal);

      this.state.completeTask();
      this.state.setMood('idle');

      console.log('✅ Exploration complete');
      return {
        success: true,
        message: 'Exploration complete!'
      };

    } catch (error) {
      this.state.cancelTask();
      this.state.setMood('idle');

      console.error('Exploration error:', error.message);
      return {
        success: false,
        message: `Exploration failed: ${error.message}`
      };
    }
  }

  /**
   * Get current position
   * @returns {Object} Position with x, y, z
   */
  getPosition() {
    const pos = this.bot.entity.position;
    return {
      x: Math.floor(pos.x),
      y: Math.floor(pos.y),
      z: Math.floor(pos.z)
    };
  }

  /**
   * Check if the bot is currently navigating
   * @returns {boolean} True if navigating
   */
  isNavigating() {
    return this.bot.pathfinder.isMoving() || this.isFollowing;
  }

  /**
   * Get the distance to a player
   * @param {string} username - Player username
   * @returns {number|null} Distance in blocks or null if not found
   */
  getDistanceToPlayer(username) {
    const player = this.bot.players[username];
    if (!player || !player.entity) {
      return null;
    }

    const distance = this.bot.entity.position.distanceTo(player.entity.position);
    return distance;
  }

  /**
   * Smart navigation that handles obstacles and recalculates path
   * @param {Object} goal - Pathfinder goal
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Object} Result with success status and message
   */
  async smartNavigate(goal, maxRetries = 3) {
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        await this.bot.pathfinder.goto(goal);
        
        return {
          success: true,
          message: 'Navigation successful!'
        };
      } catch (error) {
        attempts++;
        console.log(`Navigation attempt ${attempts} failed: ${error.message}`);

        if (attempts >= maxRetries) {
          return {
            success: false,
            message: `Navigation failed after ${maxRetries} attempts: ${error.message}`
          };
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Navigate to a block type (e.g., crafting_table, chest)
   * @param {string} blockName - Name of the block to find
   * @param {number} maxDistance - Maximum search distance
   * @returns {Object} Result with success status and message
   */
  async goToBlockType(blockName, maxDistance = 64) {
    try {
      const block = this.bot.findBlock({
        matching: (b) => b.name === blockName,
        maxDistance: maxDistance
      });

      if (!block) {
        return {
          success: false,
          message: `No ${blockName} found within ${maxDistance} blocks!`
        };
      }

      console.log(`🚶 Navigating to ${blockName} at ${block.position}`);

      const goal = new goals.GoalNear(block.position.x, block.position.y, block.position.z, 2);
      
      await this.bot.pathfinder.goto(goal);

      return {
        success: true,
        message: `Reached ${blockName}!`,
        block: block
      };

    } catch (error) {
      return {
        success: false,
        message: `Could not reach ${blockName}: ${error.message}`
      };
    }
  }

  /**
   * Cleanup method to stop all navigation activities
   */
  cleanup() {
    this.stop();
    console.log('🧹 Navigation behavior cleaned up');
  }
}

module.exports = NavigationBehavior;
