// Data Manager - Handles persistent storage in data/data.json
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/data.json');

/**
 * Load data from data.json file
 * @returns {Object} Parsed JSON data or default structure
 */
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const rawData = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(rawData);
      return data;
    } else {
      console.log('⚠️  data.json not found, using defaults');
      return getDefaultData();
    }
  } catch (error) {
    console.error('❌ Error loading data.json:', error.message);
    return getDefaultData();
  }
}

/**
 * Save data to data.json file
 * @param {Object} data - Data to save
 * @returns {boolean} Success status
 */
function saveData(data) {
  try {
    const dataDir = path.dirname(DATA_FILE);
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write data to file with pretty formatting
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 Saved data to data.json');
    return true;
  } catch (error) {
    console.error('❌ Error saving data.json:', error.message);
    return false;
  }
}

/**
 * Get default data structure
 * @returns {Object} Default data
 */
function getDefaultData() {
  return {
    home: null,
    autoattack: false,
    autofarm: false
  };
}

/**
 * Load home position from data.json
 * @returns {Object|null} Home position {x, y, z} or null
 */
function loadHomePosition() {
  const data = loadData();
  return data.home || null;
}

/**
 * Save home position to data.json
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @returns {boolean} Success status
 */
function saveHomePosition(x, y, z) {
  const data = loadData();
  data.home = { x, y, z };
  return saveData(data);
}

/**
 * Load auto-attack setting from data.json
 * @returns {boolean} Auto-attack enabled status
 */
function loadAutoAttack() {
  const data = loadData();
  return data.autoattack !== undefined ? data.autoattack : false;
}

/**
 * Save auto-attack setting to data.json
 * @param {boolean} enabled - Whether auto-attack should be enabled
 * @returns {boolean} Success status
 */
function saveAutoAttack(enabled) {
  const data = loadData();
  data.autoattack = enabled;
  return saveData(data);
}

/**
 * Load auto-farm setting from data.json
 * @returns {boolean} Auto-farm enabled status
 */
function loadAutoFarm() {
  const data = loadData();
  return data.autofarm !== undefined ? data.autofarm : false;
}

/**
 * Save auto-farm setting to data.json
 * @param {boolean} enabled - Whether auto-farm should be enabled
 * @returns {boolean} Success status
 */
function saveAutoFarm(enabled) {
  const data = loadData();
  data.autofarm = enabled;
  return saveData(data);
}

module.exports = {
  loadData,
  saveData,
  loadHomePosition,
  saveHomePosition,
  loadAutoAttack,
  saveAutoAttack,
  loadAutoFarm,
  saveAutoFarm,
  getDefaultData
};
