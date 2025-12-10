// Armor Commands - armor, equiparmor

module.exports = {
  registerCommands(handler) {
    const { bot, sendSafeMessage } = handler;

    return {
      armor: {
        description: 'Show current armor status',
        usage: 'armor',
        handler: () => handleArmorStatus(handler)
      },
      
      equiparmor: {
        description: 'Equip best available armor',
        usage: 'equiparmor',
        handler: () => handleEquipArmor(handler)
      }
    };
  }
};

function handleArmorStatus(handler) {
  try {
    const slots = handler.bot.inventory.slots;
    const armorSlots = {
      head: slots[5],    // Helmet slot
      torso: slots[6],   // Chestplate slot
      legs: slots[7],    // Leggings slot
      feet: slots[8]     // Boots slot
    };
    
    handler.sendSafeMessage('=== Armor Status ===');
    handler.sendSafeMessage(`Head: ${armorSlots.head ? armorSlots.head.name : 'empty'}`);
    handler.sendSafeMessage(`Torso: ${armorSlots.torso ? armorSlots.torso.name : 'empty'}`);
    handler.sendSafeMessage(`Legs: ${armorSlots.legs ? armorSlots.legs.name : 'empty'}`);
    handler.sendSafeMessage(`Feet: ${armorSlots.feet ? armorSlots.feet.name : 'empty'}`);
  } catch (error) {
    handler.sendSafeMessage('Error checking armor status: ' + error.message);
  }
}

async function handleEquipArmor(handler) {
  try {
    handler.bot.chat('Equipping best armor...');
    await handler.bot.armorManager.equipAll();
    handler.bot.chat('Armor equipped successfully!');
  } catch (error) {
    handler.bot.chat('Failed to equip armor: ' + error.message);
  }
}
