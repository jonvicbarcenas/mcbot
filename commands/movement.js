// Movement Commands - come, follow, stop, goto, explore, opendoor

const { goals } = require('mineflayer-pathfinder');

module.exports = {
  registerCommands(handler) {
    const { bot, state, sendSafeMessage } = handler;

    return {
      come: {
        description: 'Come to you',
        usage: 'come',
        handler: (args, username) => handleCome(handler, username)
      },
      
      follow: {
        description: 'Follow you',
        usage: 'follow',
        handler: (args, username) => handleFollow(handler, username)
      },
      
      stop: {
        description: 'Stop current action',
        usage: 'stop',
        handler: () => handleStop(handler)
      },
      
      goto: {
        description: 'Go to coordinates',
        usage: 'goto <x> <y> <z>',
        handler: (args) => handleGoto(handler, args)
      },
      
      explore: {
        description: 'Explore randomly',
        usage: 'explore [distance]',
        handler: (args) => handleExplore(handler, args)
      },
      
      opendoor: {
        description: 'Open nearby doors',
        usage: 'opendoor',
        handler: () => handleOpenDoor(handler)
      }
    };
  }
};

async function handleCome(handler, username) {
  handler.bot.chat('Coming to you!');
  const result = await handler.navigation.goToPlayer(username);
  handler.bot.chat(result.message);
}

async function handleFollow(handler, username) {
  const result = await handler.navigation.followPlayer(username);
  handler.bot.chat(result.message);
}

function handleStop(handler) {
  const result = handler.navigation.stop();
  handler.bot.chat(result.message);
}

async function handleGoto(handler, args) {
  if (args.length < 3) {
    handler.bot.chat('Usage: goto <x> <y> <z>');
    return;
  }

  const x = parseFloat(args[0]);
  const y = parseFloat(args[1]);
  const z = parseFloat(args[2]);

  handler.bot.chat(`Going to ${x}, ${y}, ${z}...`);
  const result = await handler.navigation.goToPosition(x, y, z);
  handler.bot.chat(result.message);
}

async function handleExplore(handler, args) {
  const distance = args[0] ? parseInt(args[0]) : 50;

  handler.bot.chat(`Exploring area (${distance} blocks)...`);
  const result = await handler.navigation.explore(distance);
  handler.bot.chat(result.message);
}

async function handleOpenDoor(handler) {
  const { bot, sendSafeMessage } = handler;
  
  sendSafeMessage('Looking for nearby doors...');
  
  const doors = bot.findBlocks({
    matching: (block) => block.name.includes('door'),
    maxDistance: 5,
    count: 10
  });

  if (doors.length === 0) {
    sendSafeMessage('No doors found nearby!');
    return;
  }

  let opened = 0;
  for (const doorPos of doors) {
    try {
      const doorBlock = bot.blockAt(doorPos);
      if (doorBlock && doorBlock.name.includes('door')) {
        const isOpen = doorBlock.getProperties().open;
        if (!isOpen) {
          await bot.pathfinder.goto(new goals.GoalNear(doorPos.x, doorPos.y, doorPos.z, 2));
          await bot.activateBlock(doorBlock);
          opened++;
          await bot.waitForTicks(10);
        }
      }
    } catch (err) {
      // Continue to next door
    }
  }

  if (opened > 0) {
    sendSafeMessage(`Opened ${opened} door(s)!`);
  } else {
    sendSafeMessage('All nearby doors are already open.');
  }
}
