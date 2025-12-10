// Lumberjack Commands - chop

module.exports = {
  registerCommands(handler) {
    const { bot } = handler;

    return {
      chop: {
        description: 'Find and chop nearby logs',
        usage: 'chop [count]',
        handler: (args) => handleChop(handler, args)
      }
    };
  }
};

async function handleChop(handler, args) {
  const Lumberjack = require('../behaviors/lumberjack');
  const lumberjack = new Lumberjack(handler.bot, handler.state);

  const count = args[0] ? parseInt(args[0]) : 1;

  if (count > 1) {
    handler.bot.chat(`Chopping ${count} logs...`);
    const result = await lumberjack.chopArea(count);
    handler.bot.chat(result.message);
  } else {
    handler.bot.chat('Looking for logs to chop...');
    const result = await lumberjack.executeChop();
    handler.bot.chat(result.message);
  }
}
