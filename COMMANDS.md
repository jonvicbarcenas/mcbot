# 🎮 Bot Commands Reference

Complete list of all available commands for the Minecraft AI Bot.

---

## 📋 Table of Contents

- [General Commands](#general-commands)
- [Navigation Commands](#navigation-commands)
- [Lumberjack Commands](#lumberjack-commands)
- [Crafting Commands](#crafting-commands)
- [Storage Commands](#storage-commands)
- [Combat Commands](#combat-commands)
- [Debug Commands](#debug-commands)

---

## General Commands

### `help`
Show all available commands.

**Usage:**
```
help
```

**Output:**
- Lists all commands with descriptions

---

### `status`
Show bot status and statistics.

**Usage:**
```
status
```

**Output:**
- Current status (idle, working, following, etc.)
- Health and food levels
- Current task
- Statistics (logs chopped, axes crafted, mobs killed)
- Uptime

**Example Output:**
```
Status: idle
Health: 20/20 Food: 20/20
Logs chopped: 45
Axes crafted: 3
Mobs killed: 12
Uptime: 1234s
```

---

### `pos`
Show bot's current position.

**Usage:**
```
pos
```

**Output:**
```
I am at 100, 64, 200
```

---

### `inv`
List inventory contents.

**Usage:**
```
inv
```

**Output:**
- Lists all items with quantities
- Shows empty inventory if no items

**Example Output:**
```
Inventory:
oak_log: 32
oak_planks: 16
stick: 8
diamond_axe: 1
```

---

## Navigation Commands

### `come`
Bot comes to your location.

**Usage:**
```
come
```

**Features:**
- Navigates to your current position
- Opens and walks through doors automatically
- Maintains 2-block distance

**Output:**
```
Coming to you!
✅ Reached PlayerName!
```

---

### `follow`
Bot continuously follows you.

**Usage:**
```
follow
```

**Features:**
- Follows you continuously
- Maintains 3-block distance
- Walks through doors automatically
- Updates path every 500ms
- Use `stop` to stop following

**Output:**
```
Now following PlayerName! Use 'stop' to stop following.
```

---

### `stop`
Stop current action (movement, following, combat).

**Usage:**
```
stop
```

**Features:**
- Stops navigation
- Stops following
- Cancels current task

**Output:**
```
Stopped following!
```
or
```
Stopped moving!
```

---

### `goto`
Navigate to specific coordinates.

**Usage:**
```
goto <x> <y> <z>
```

**Parameters:**
- `x` - X coordinate (number)
- `y` - Y coordinate (number)
- `z` - Z coordinate (number)

**Examples:**
```
goto 100 64 200
goto -50 70 150
goto 0 80 0
```

**Features:**
- Pathfinds to coordinates
- Opens doors automatically
- 2-minute timeout protection
- Reports distance on arrival

**Output:**
```
Going to 100, 64, 200...
✅ Reached destination! (0.5 blocks away)
```

---

### `explore`
Explore randomly in the area.

**Usage:**
```
explore [distance]
```

**Parameters:**
- `distance` (optional) - Exploration radius in blocks (default: 50)

**Examples:**
```
explore          # Explores within 50 blocks
explore 100      # Explores within 100 blocks
explore 25       # Explores within 25 blocks
```

**Features:**
- Random exploration
- Walks through doors
- Safe pathfinding

**Output:**
```
Exploring area (50 blocks)...
✅ Exploration complete!
```

---

### `opendoor`
Find and open nearby doors.

**Usage:**
```
opendoor
```

**Features:**
- Finds doors within 16 blocks
- Navigates to each door
- Opens closed doors
- Walks through them

**Output:**
```
Looking for nearby doors...
Walked through 3 door(s)!
```

---

## Lumberjack Commands

### `chop`
Find and chop nearby logs.

**Usage:**
```
chop [count]
```

**Parameters:**
- `count` (optional) - Number of logs to chop (default: 1)

**Examples:**
```
chop         # Chops 1 log
chop 10      # Chops 10 logs
chop 50      # Chops 50 logs
```

**Features:**
- Finds nearest logs within 64 blocks
- Automatically equips best axe
- Crafts axe if none available
- Updates statistics

**Output:**
```
Looking for logs to chop...
✅ Chopped oak_log!
```
or
```
Chopping 10 logs...
✅ Chopped 10 logs successfully!
```

---

## Crafting Commands

### `craftaxe`
Craft an axe from available materials.

**Usage:**
```
craftaxe
```

**Features:**
- Checks for materials (planks + sticks)
- Finds or places crafting table
- Crafts best possible axe
- Priority: diamond > iron > stone > wooden

**Requirements:**
- 3 planks + 2 sticks
- Crafting table (will find or craft one)

**Output:**
```
Attempting to craft an axe...
✅ Crafted diamond_axe!
```

---

### `craftplanks`
Craft planks from logs.

**Usage:**
```
craftplanks
```

**Features:**
- Converts logs to planks (1 log = 4 planks)
- Works with any log type

**Requirements:**
- At least 1 log in inventory

**Output:**
```
Crafting planks from logs...
✅ Crafted 32 planks!
```

---

### `craftsticks`
Craft sticks from planks.

**Usage:**
```
craftsticks
```

**Features:**
- Converts planks to sticks (2 planks = 4 sticks)

**Requirements:**
- At least 2 planks in inventory

**Output:**
```
Crafting sticks from planks...
✅ Crafted 16 sticks!
```

---

### `crafttable`
Craft a crafting table.

**Usage:**
```
crafttable
```

**Features:**
- Crafts crafting table from planks

**Requirements:**
- At least 4 planks in inventory

**Output:**
```
Attempting to craft a crafting table...
✅ Crafted crafting_table!
```

---

### `findtable`
Find nearest crafting table.

**Usage:**
```
findtable
```

**Features:**
- Searches within 64 blocks
- Reports location and distance

**Output:**
```
Found crafting table at 105, 64, 201
Distance: 6.3 blocks
```
or
```
No crafting table found within 64 blocks!
```

---

## Storage Commands

### `deposit`
Deposit all logs into nearest chest.

**Usage:**
```
deposit
```

**Features:**
- Finds nearest chest within 64 blocks
- Navigates to chest
- Deposits all logs
- Reports count

**Requirements:**
- Chest within 64 blocks
- At least 1 log in inventory

**Output:**
```
Looking for chest to deposit logs...
✅ Deposited 32 logs into chest!
```

---

### `depositall`
Deposit all items (except tools) into nearest chest.

**Usage:**
```
depositall
```

**Features:**
- Finds nearest chest
- Deposits all items except tools
- Keeps axes, pickaxes, swords, etc.

**Requirements:**
- Chest within 64 blocks

**Output:**
```
Looking for chest to deposit all items...
✅ Deposited 64 items into chest!
```

---

### `findchest`
Find nearest chest.

**Usage:**
```
findchest
```

**Features:**
- Searches for chests within 64 blocks
- Reports location and distance
- Works with regular chests and trapped chests

**Output:**
```
Found chest at 98, 64, 195
Distance: 8.1 blocks
```
or
```
No chest found within 64 blocks!
```

---

## Combat Commands

### `defend`
Toggle auto-defend mode.

**Usage:**
```
defend [on|off]
```

**Parameters:**
- `on` - Enable auto-defend
- `off` - Disable auto-defend
- (no parameter) - Show current status

**Examples:**
```
defend           # Shows current status
defend on        # Enables auto-defend
defend off       # Disables auto-defend
```

**Features:**
- Automatically attacks hostile mobs
- Detects mobs within 16 blocks
- Uses best weapon available
- Retreats at low health

**Output:**
```
Auto-defend enabled! I will fight monsters automatically.
```
or
```
Auto-defend is currently enabled
Usage: defend [on|off]
```

---

### `combat`
Show combat status.

**Usage:**
```
combat
```

**Features:**
- Shows health and food
- Auto-defend status
- Combat statistics
- Nearby hostile mobs

**Output:**
```
=== Combat Status ===
Health: 20/20
Food: 18/20
Auto-defend: ON
Mobs killed: 15
Deaths: 2
No threats detected
```
or
```
⚠️ 3 hostile mob(s) nearby!
```

---

### `attack`
Attack nearest hostile mob.

**Usage:**
```
attack
```

**Features:**
- Finds nearest hostile mob
- Equips best weapon
- Engages in combat
- Works even if auto-defend is off

**Output:**
```
Attacking zombie!
```
or
```
No hostile mobs nearby to attack!
```

---

### `retreat`
Retreat from combat.

**Usage:**
```
retreat
```

**Features:**
- Stops attacking current target
- Moves away from threat
- Returns to idle state

**Output:**
```
Retreating from combat!
```
or
```
Not currently in combat.
```

---

## Debug Commands

### `debug`
Show debug information for crafting.

**Usage:**
```
debug
```

**Features:**
- Shows material counts
- Crafting possibilities
- Nearby crafting table info
- Useful for troubleshooting

**Output:**
```
=== Debug Info ===
Logs: 16, Planks: 8, Sticks: 4
Axes: 1, Tables: 0
Can craft: Planks=true, Sticks=true, Table=true, Axe=true
Crafting table found 12.5 blocks away!
```

---

## 📝 Command Categories Quick Reference

| Category | Commands |
|----------|----------|
| **Navigation** | `come`, `follow`, `stop`, `goto`, `explore`, `opendoor`, `pos` |
| **Lumberjack** | `chop` |
| **Crafting** | `craftaxe`, `craftplanks`, `craftsticks`, `crafttable`, `findtable` |
| **Storage** | `deposit`, `depositall`, `findchest` |
| **Combat** | `defend`, `combat`, `attack`, `retreat` |
| **Information** | `help`, `status`, `inv`, `pos`, `debug` |

---

## 💡 Command Tips

### Navigation Tips
- Use `stop` before giving new navigation commands
- `follow` updates every 500ms, so give the bot time to adjust
- Doors are automatically handled during navigation
- `goto` has a 2-minute timeout for very long paths

### Crafting Tips
- Use `debug` to check if you have enough materials
- Bot will automatically craft planks and sticks if needed for axe
- Bot finds crafting tables within 64 blocks
- Always check inventory before crafting commands

### Combat Tips
- Enable `defend on` for automatic protection
- Bot retreats at 6 hearts (3 health points)
- Works with both melee and ranged combat
- Best weapons are automatically selected

### Storage Tips
- Bot finds nearest chest within 64 blocks
- Tools are never deposited automatically
- Chests include regular and trapped chests
- Bot will navigate to chest before depositing

---

## 🔧 Configuration

Commands can be customized in `config.js`:

```javascript
chat: {
  prefix: '',              // Command prefix (empty = no prefix)
  enableLogging: true,     // Log chat to console
  announceActions: true,   // Announce actions in chat
  messageDelay: 600,       // Delay between messages (ms)
}
```

### Custom Prefix Example

If you set `prefix: '!'`:
```
!help
!come
!chop 10
```

### Without Prefix (Default)

```
help
come
chop 10
```

---

## ⚠️ Error Messages

Common error messages and what they mean:

| Error | Meaning | Solution |
|-------|---------|----------|
| `Cannot find player X!` | Player not online/visible | Check player name spelling |
| `No logs found nearby!` | No logs within 64 blocks | Move closer to trees |
| `Not enough materials!` | Missing items for crafting | Gather more resources |
| `No path found!` | Can't reach destination | Check for obstacles/water |
| `Navigation timeout!` | Path too long (>2 min) | Use closer waypoints |
| `No chest found!` | No chest within 64 blocks | Place a chest or move closer |

---

## 🎯 Command Combinations

### Auto-Lumberjack Setup
```
craftaxe      # Make sure you have an axe
chop 50       # Chop lots of logs
deposit       # Store logs in chest
```

### Follow and Protect
```
defend on     # Enable auto-defend
follow        # Follow player
```

### Crafting Workflow
```
chop 10       # Get logs
craftplanks   # Convert to planks
craftsticks   # Make sticks
craftaxe      # Craft an axe
```

### Exploration
```
explore 100   # Explore area
deposit       # Store findings
come          # Return to player
```

---

## 📊 Statistics Tracking

The bot automatically tracks:
- **Logs chopped** - Total logs broken
- **Axes crafted** - Total axes created
- **Mobs killed** - Combat victories
- **Deaths** - Times bot died
- **Tasks completed** - Successful task count
- **Uptime** - Time since bot started

View with `status` command!

---

## 🚀 Advanced Usage

### Chaining Commands
Commands must be sent one at a time. Wait for bot to complete current task before sending next command.

### Command Priorities
1. `stop` - Highest priority (interrupts everything)
2. Combat (if auto-defend enabled)
3. Navigation commands
4. Crafting/gathering commands

### Best Practices
- Always use `stop` before changing tasks
- Check `status` to see current task
- Use `debug` for crafting issues
- Enable `defend on` in dangerous areas

---

## 📚 Related Documentation

- **NAVIGATION.md** - Detailed navigation system documentation
- **DOOR_NAVIGATION_FIX.md** - Door handling technical details
- **README.md** - General bot information
- **STRUCTURE.md** - Code structure and architecture
- **config.js** - Configuration options

---

**Bot Version:** 2.0  
**Last Updated:** 2024  
**Total Commands:** 24

Need help? Type `help` in-game to see all available commands!
