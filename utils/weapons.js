// Weapon Management Utilities

// Get weapon attack damage for ranking
function getWeaponDamage(weaponName) {
  // Attack damage values based on Minecraft weapon stats
  const damageValues = {
    // Axes (higher damage, slower attack speed)
    'netherite_axe': 10,
    'diamond_axe': 9,
    'iron_axe': 9,
    'stone_axe': 9,
    'golden_axe': 7,
    'wooden_axe': 7,
    
    // Swords (lower damage, faster attack speed)
    'netherite_sword': 8,
    'diamond_sword': 7,
    'iron_sword': 6,
    'stone_sword': 5,
    'golden_sword': 4,
    'wooden_sword': 4,
    
    // Other weapons
    'trident': 9,
  };
  
  return damageValues[weaponName] || 1; // Default to 1 (fist damage)
}

// Equip best weapon for combat
async function equipBestWeapon(bot) {
  try {
    console.log('⚔️  Equipping best weapon...');
    
    const items = bot.inventory.items();
    const weapons = items.filter(item => {
      return item.name.includes('_sword') || 
             item.name.includes('_axe') || 
             item.name === 'trident';
    });
    
    if (weapons.length === 0) {
      return {
        success: false,
        message: 'No weapons found in inventory'
      };
    }
    
    // Sort by damage (best first)
    weapons.sort((a, b) => getWeaponDamage(b.name) - getWeaponDamage(a.name));
    
    const bestWeapon = weapons[0];
    const currentItem = bot.inventory.slots[bot.quickBarSlot];
    
    // Check if already holding a better weapon
    if (currentItem && getWeaponDamage(currentItem.name) >= getWeaponDamage(bestWeapon.name)) {
      return {
        success: true,
        message: `Already holding ${currentItem.name}`,
        alreadyEquipped: true,
        weapon: currentItem.name,
        damage: getWeaponDamage(currentItem.name)
      };
    }
    
    await bot.equip(bestWeapon, 'hand');
    console.log(`✅ Equipped ${bestWeapon.name} (${getWeaponDamage(bestWeapon.name)} damage)`);
    
    return {
      success: true,
      weapon: bestWeapon.name,
      damage: getWeaponDamage(bestWeapon.name),
      message: `Equipped ${bestWeapon.name} (${getWeaponDamage(bestWeapon.name)} damage)`
    };
    
  } catch (error) {
    console.error('Error equipping weapon:', error.message);
    return {
      success: false,
      message: `Failed to equip weapon: ${error.message}`
    };
  }
}

// Get current weapon/tool status
function getWeaponStatus(bot) {
  const currentItem = bot.inventory.slots[bot.quickBarSlot];
  
  if (!currentItem) {
    return {
      holding: 'empty',
      damage: 1,
      type: 'none'
    };
  }
  
  let type = 'other';
  if (currentItem.name.includes('_sword') || currentItem.name.includes('_axe') || currentItem.name === 'trident') {
    type = 'weapon';
  } else if (currentItem.name.includes('_pickaxe') || currentItem.name.includes('_shovel') || currentItem.name.includes('_hoe')) {
    type = 'tool';
  }
  
  const { getToolEfficiency } = require('./tools');
  
  return {
    holding: currentItem.name,
    damage: getWeaponDamage(currentItem.name),
    efficiency: getToolEfficiency(currentItem.name),
    type: type,
    count: currentItem.count
  };
}

// List all weapons in inventory
function listWeapons(bot) {
  const items = bot.inventory.items();
  const weapons = items.filter(item => {
    return item.name.includes('_sword') || 
           item.name.includes('_axe') || 
           item.name === 'trident';
  });
  
  const weaponList = weapons.map(weapon => ({
    name: weapon.name,
    damage: getWeaponDamage(weapon.name),
    count: weapon.count
  }));
  
  // Sort by damage
  weaponList.sort((a, b) => b.damage - a.damage);
  
  return {
    success: true,
    weapons: weaponList,
    count: weaponList.length
  };
}

module.exports = {
  equipBestWeapon,
  getWeaponStatus,
  getWeaponDamage,
  listWeapons
};
