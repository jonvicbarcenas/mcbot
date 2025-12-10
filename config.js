// Bot Configuration
module.exports = {
  // Server connection settings
  server: {
    host: '47.130.100.107',
    port: 25565,
    version: '1.21.8'
  },
  
  // Bot identity
  bot: {
    username: 'baekyoung',
  },
  
  // Behavior settings
  behavior: {
    autoChop: false,           // Automatically chop logs when seen
    autoReplant: false,        // Automatically replant saplings
    chopRadius: 64,            // Maximum distance to search for logs
    farmRadius: 200,            // Maximum distance to search for farmable crops
    farmCheckInterval: 100,    // Check for sugarcane every 0.5 seconds
    followDistance: 1,         // Distance to maintain when following
    idleTimeout: 30000,        // Time before considering bot idle (ms)
    autoDefend: true,          // Automatically defend against monsters
    combatRadius: 16,          // Maximum distance to detect monsters
    retreatHealth: 6,          // Health (hearts) to retreat at
    attackRange: 3,            // Melee attack range
    bowRange: 32,              // Bow attack range
    chestLocation: { x: 10, y: 63, z: -55 },  // Chest location for deposits
    chestSearchRadius: 10,     // Radius to search for chests
    sugarcaneDepositThreshold: 64,  // Deposit when sugarcane >= this amount
  },

  // Crafting priorities
  crafting: {
    axePriority: ['netherite_axe', 'diamond_axe', 'iron_axe', 'golden_axe', 'stone_axe', 'wooden_axe'],
    autoCraftAxe: true,        // Automatically craft axe when needed
  },
  
  // Armor priorities
  armor: {
    materialPriority: ['netherite', 'diamond', 'iron', 'chainmail', 'golden', 'leather'],
    autoEquip: true,           // Automatically equip best armor
  },
  
  // Combat priorities
  combat: {
    weaponPriority: ['netherite_axe', 'diamond_axe', 'netherite_sword', 'diamond_sword', 
                     'iron_axe', 'iron_sword', 'stone_axe', 'stone_sword', 
                     'golden_axe', 'golden_sword', 'wooden_axe', 'wooden_sword'],
    useShield: true,           // Use shield if available
    useBow: true,              // Use bow for ranged combat
    autoEquipWeapon: true,     // Automatically equip best weapon on spawn
  },
  
  // Tool priorities
  tools: {
    pickaxePriority: ['netherite_pickaxe', 'diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'golden_pickaxe', 'wooden_pickaxe'],
    axePriority: ['netherite_axe', 'diamond_axe', 'iron_axe', 'stone_axe', 'golden_axe', 'wooden_axe'],
    shovelPriority: ['netherite_shovel', 'diamond_shovel', 'iron_shovel', 'stone_shovel', 'golden_shovel', 'wooden_shovel'],
    hoePriority: ['netherite_hoe', 'diamond_hoe', 'iron_hoe', 'stone_hoe', 'golden_hoe', 'wooden_hoe'],
    autoEquipTool: false,      // Automatically equip tool based on context
  },
  
  // Auto-eat settings
  autoEat: {
    enabled: true,             // Automatically eat when health or hunger is not full
    checkInterval: 1000,       // Check every 1 second
  },
  
  // Home position settings
  home: {
    enabled: true,             // Return home after completing tasks
    position: null,            // Home position {x, y, z} - set with 'sethome' command
    returnAfterChop: true,     // Return home after chopping logs
    returnAfterDeposit: false, // Return home after depositing items
  },
  
  // Chat settings
  chat: {
    prefix: '',                // Command prefix (empty for direct commands)
    enableLogging: true,       // Log chat messages to console
    announceActions: true,     // Announce actions in chat
    messageDelay: 600,         // Delay between messages in ms (to avoid spam kick)
  },
  
  // Log types the bot can chop
  logTypes: [
    'oak_log',
    'birch_log',
    'spruce_log',
    'jungle_log',
    'acacia_log',
    'dark_oak_log',
    'cherry_log',
    'mangrove_log'
  ]
};
