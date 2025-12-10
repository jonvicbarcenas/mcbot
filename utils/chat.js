// Chat Handler - Process commands and messages
const config = require('../config');

// Import command modules
const infoCommands = require('../commands/info');
const movementCommands = require('../commands/movement');
const lumberjackCommands = require('../commands/lumberjack');
const inventoryCommands = require('../commands/inventory');
const armorCommands = require('../commands/armor');
const craftingCommands = require('../commands/crafting');
const combatCommands = require('../commands/combat');
const storageCommands = require('../commands/storage');
const farmCommands = require('../commands/farm');

class ChatHandler {
  constructor(bot, state) {
    this.bot = bot;
    this.state = state;
    this.commands = new Map();
    this.messageQueue = [];
    this.isProcessingQueue = false;
    
    // Initialize persistent behavior instances
    const Navigation = require('../behaviors/navigation');
    this.navigation = new Navigation(this.bot, this.state);
    
    this.setupCommands();
  }

  // Safe message sending with queue to prevent spam kicks
  sendSafeMessage(message) {
    this.messageQueue.push(message);
    if (!this.isProcessingQueue) {
      this.processMessageQueue();
    }
  }

  async processMessageQueue() {
    if (this.messageQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const message = this.messageQueue.shift();
    
    try {
      this.bot.chat(message);
    } catch (error) {
      console.error('Error sending message:', error);
    }

    // Wait before sending next message
    await new Promise(resolve => setTimeout(resolve, config.chat.messageDelay || 600));
    
    // Process next message
    this.processMessageQueue();
  }

  setupCommands() {
    // Register commands from all modules
    const commandModules = [
      infoCommands,
      movementCommands,
      lumberjackCommands,
      inventoryCommands,
      armorCommands,
      craftingCommands,
      combatCommands,
      storageCommands,
      farmCommands
    ];

    // Register all commands
    commandModules.forEach(module => {
      const commands = module.registerCommands(this);
      Object.entries(commands).forEach(([name, command]) => {
        this.commands.set(name, command);
      });
    });
  }

  async handleMessage(username, message) {
    if (username === this.bot.username) return;

    // Log chat if enabled
    if (config.chat.enableLogging) {
      console.log(`[Chat] ${username}: ${message}`);
    }

    // Parse command
    const trimmed = message.trim();
    const withoutPrefix = config.chat.prefix 
      ? trimmed.startsWith(config.chat.prefix) 
        ? trimmed.slice(config.chat.prefix.length) 
        : null
      : trimmed;

    if (!withoutPrefix) return;

    const parts = withoutPrefix.split(' ');
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const command = this.commands.get(commandName);

    if (command) {
      try {
        await command.handler(args, username);
      } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        this.bot.chat(`Error: ${error.message}`);
      }
    }
  }
}

module.exports = ChatHandler;
