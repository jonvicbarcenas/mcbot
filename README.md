# Minecraft AI Lumberjack Bot v2.0

A modular, AI-like Minecraft bot for version 1.21.5 that can break logs, craft axes, navigate, and manage its state intelligently.

## 🎯 Features

- **Intelligent Lumberjacking**: Finds and chops logs automatically with best tool selection
  - **Smart Crafting**: Automatically crafts an axe before chopping if none available
- **Auto-Crafting**: Crafts axes when materials are available
- **Navigation System**: Pathfinding, following players, exploring
- **State Management**: Tracks mood, tasks, inventory, and statistics
- **Modular Architecture**: Easy to edit and extend with separate behavior files

## 📁 Project Structure

```
mcbot/
├── bot.js                    # Main entry point
├── config.js                 # Configuration settings (edit this!)
├── state.js                  # Bot state management
├── behaviors/
│   ├── lumberjack.js        # Logging behavior
│   ├── crafting.js          # Crafting behavior
│   └── navigation.js        # Movement behavior
└── utils/
    ├── inventory.js         # Inventory management
    └── chat.js              # Chat command handler
```

## 🚀 Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Configure the bot** (edit `config.js`):
```javascript
server: {
  host: '47.130.100.107',  // Change server IP
  port: 25565,
  version: '1.21.5'
},
bot: {
  username: 'LumberjackBot'  // Change bot name
}
```

3. **Run the bot**:
```bash
npm start
```

## 🎮 Commands

Once in-game, use these chat commands:

| Command | Description | Usage |
|---------|-------------|-------|
| `help` | Show all commands | `help` |
| `chop` | Chop nearby logs | `chop` or `chop 10` |
| `craftaxe` | Craft an axe | `craftaxe` |
| `come` | Bot comes to you | `come` |
| `follow` | Bot follows you | `follow` |
| `stop` | Stop current action | `stop` |
| `pos` | Show bot position | `pos` |
| `inv` | List inventory | `inv` |
| `status` | Show bot status | `status` |
| `goto` | Go to coordinates | `goto 100 64 200` |
| `explore` | Explore randomly | `explore 50` |

## ⚙️ Configuration

### Easy Editing

All bot behaviors can be customized by editing these files:

- **`config.js`**: Server settings, behavior toggles, chat settings
- **`behaviors/lumberjack.js`**: How the bot chops logs
- **`behaviors/crafting.js`**: What and how the bot crafts
- **`behaviors/navigation.js`**: How the bot moves
- **`state.js`**: What the bot remembers and tracks

### Example: Enable Auto-Chop

Edit `config.js`:
```javascript
behavior: {
  autoChop: true,  // Bot will auto-chop logs when seen
  chopRadius: 64,
}
```

### Example: Change Bot Mood

The bot has different "moods" that affect its behavior:
- `idle` - Waiting for commands
- `working` - Actively chopping/crafting
- `exploring` - Moving around
- `following` - Following a player
- `crafting` - Making items

## 🧠 State Management

The bot tracks:
- **Current task** and mood
- **Inventory** (logs, planks, sticks, tools)
- **Statistics** (logs chopped, axes crafted, uptime)
- **Memory** (player locations, crafting tables, visited areas)
- **Goals** (queued tasks with priorities)

View state anytime with the `status` command.

## 🔧 Adding New Behaviors

1. Create a new file in `behaviors/` folder
2. Export a class with methods
3. Import and use in `utils/chat.js` for commands

Example:
```javascript
// behaviors/mining.js
class Mining {
  constructor(bot, state) {
    this.bot = bot;
    this.state = state;
  }
  
  async mineStone() {
    // Your logic here
  }
}
module.exports = Mining;
```

## 📊 Statistics Tracking

The bot automatically tracks:
- Total logs chopped
- Axes crafted
- Distance traveled
- Tasks completed
- Uptime

## 🐛 Troubleshooting

**Bot won't connect?**
- Check server IP in `config.js`
- Ensure server is running and accepts connections
- Check if authentication is needed

**Bot can't find logs?**
- Increase `chopRadius` in `config.js`
- Make sure there are logs within range

**Commands not working?**
- Check `config.chat.prefix` setting
- Make sure you're not the bot itself (it ignores its own messages)

## 📝 License

MIT
