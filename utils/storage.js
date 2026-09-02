// utils/storage.js
// 本地存储管理（收藏）

const FAVORITES_KEY = 'favorites';

/**
 * 获取所有收藏
 */
function getAll() {
  try {
    return wx.getStorageSync(FAVORITES_KEY) || [];
  } catch (e) {
    console.error('读取收藏失败', e);
    return [];
  }
}

/**
 * 添加收藏
 * @param {Object} spot - 景点对象
 *   { id, name, address, location, city, intro, image }
 */
function add(spot) {
  const list = getAll();
  // 去重：按 id
  if (list.some(item => item.id === spot.id)) {
    wx.showToast({ title: '已收藏', icon: 'none' });
    return false;
  }
  list.unshift({
    ...spot,
    favoriteTime: Date.now()
  });
  wx.setStorageSync(FAVORITES_KEY, list);
  // 同步到全局
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.favorites = list;
  }
  wx.showToast({ title: '收藏成功', icon: 'success' });
  return true;
}

/**
 * 取消收藏
 * @param {string} id - 景点 id
 */
function remove(id) {
  let list = getAll();
  list = list.filter(item => item.id !== id);
  wx.setStorageSync(FAVORITES_KEY, list);
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.favorites = list;
  }
  wx.showToast({ title: '已取消收藏', icon: 'none' });
  return true;
}

/**
 * 判断是否已收藏
 * @param {string} id
 */
function has(id) {
  const list = getAll();
  return list.some(item => item.id === id);
}

/**
 * 切换收藏状态
 */
function toggle(spot) {
  if (has(spot.id)) {
    remove(spot.id);
    return false; // 返回 false 表示当前未收藏
  } else {
    add(spot);
    return true; // 返回 true 表示当前已收藏
  }
}

/**
 * 清空所有收藏
 */
function clear() {
  wx.setStorageSync(FAVORITES_KEY, []);
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.favorites = [];
  }
}

module.exports = {
  getAll,
  add,
  remove,
  has,
  toggle,
  clear
};
