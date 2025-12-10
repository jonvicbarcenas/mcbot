// Storage Commands - deposit, depositall, findchest

module.exports = {
  registerCommands(handler) {
    const { bot, sendSafeMessage } = handler;

    return {
      deposit: {
        description: 'Deposit all logs into nearest chest',
        usage: 'deposit',
        handler: () => handleDeposit(handler)
      },
      
      depositall: {
        description: 'Deposit all items (except tools) into nearest chest',
        usage: 'depositall',
        handler: () => handleDepositAll(handler)
      },
      
      findchest: {
        description: 'Find nearest chest',
        usage: 'findchest',
        handler: () => handleFindChest(handler)
      }
    };
  }
};

async function handleDeposit(handler) {
  const Storage = require('../behaviors/storage');
  const storage = new Storage(handler.bot, handler.state);

  handler.bot.chat('Looking for chest to deposit logs...');
  const result = await storage.depositLogs();
  handler.bot.chat(result.message);
}

async function handleDepositAll(handler) {
  const Storage = require('../behaviors/storage');
  const storage = new Storage(handler.bot, handler.state);

  handler.bot.chat('Looking for chest to deposit all items...');
  const result = await storage.depositAll();
  handler.bot.chat(result.message);
}

function handleFindChest(handler) {
  const Storage = require('../behaviors/storage');
  const storage = new Storage(handler.bot, handler.state);

  const chest = storage.findNearestChest();

  if (chest) {
    const pos = chest.position;
    const distance = handler.bot.entity.position.distanceTo(pos);
    handler.sendSafeMessage(`Found ${chest.name} at ${pos.x}, ${pos.y}, ${pos.z}`);
    handler.sendSafeMessage(`Distance: ${distance.toFixed(1)} blocks`);
  } else {
    handler.sendSafeMessage('No chest found within 64 blocks!');
  }
}
