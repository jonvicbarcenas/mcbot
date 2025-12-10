// Farm Commands - Sugarcane harvesting
const Farmer = require('../behaviors/farmer');
const dataManager = require('../utils/dataManager');

function registerCommands(chatHandler) {
  const farmer = new Farmer(chatHandler.bot, chatHandler.state);

  const farmCommand = {
    name: 'farm',
    description: 'Harvest nearby mature sugarcane.',
    handler: async (args, username) => {
      const result = await farmer.executeHarvest();
      if (result && result.message) {
        chatHandler.sendSafeMessage(result.message);
      }
    }
  };

  const autofarmCommand = {
    name: 'autofarm',
    description: 'Toggle automatic sugarcane farming mode.',
    usage: 'autofarm [on|off]',
    handler: (args, username) => {
      const mode = args[0] ? args[0].toLowerCase() : null;
      
      if (mode === 'on') {
        dataManager.saveAutoFarm(true);
        chatHandler.sendSafeMessage('🌾 Auto-farm enabled! I will continuously harvest sugarcane.');
      } else if (mode === 'off') {
        dataManager.saveAutoFarm(false);
        chatHandler.sendSafeMessage('🌾 Auto-farm disabled.');
      } else {
        const status = dataManager.loadAutoFarm() ? 'enabled' : 'disabled';
        chatHandler.sendSafeMessage(`Auto-farm is currently ${status}`);
        chatHandler.sendSafeMessage('Usage: autofarm [on|off]');
      }
    }
  };

  return {
    farm: farmCommand,
    autofarm: autofarmCommand
  };
}

module.exports = {
  registerCommands
};