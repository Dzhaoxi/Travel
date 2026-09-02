// pages/favorites/favorites.js
const storage = require('../../utils/storage.js');

Page({
  data: {
    favorites: []
  },

  onShow() {
    // 每次进入页面都刷新
    this.loadFavorites();
  },

  loadFavorites() {
    const favorites = storage.getAll();
    this.setData({ favorites });
  },

  onSpotTap(e) {
    const spot = e.currentTarget.dataset.spot;
    // 从收藏中构造完整数据传给详情页
    wx.navigateTo({
      url: `/pages/spot/spot?data=${encodeURIComponent(JSON.stringify({
        id: spot.id,
        name: spot.name,
        address: spot.address,
        location: spot.location,
        city: spot.city,
        type: spot.type || '',
        tel: spot.tel || ''
      }))}`
    });
  },

  onUnfavorite(e) {
    e.stopPropagation && e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要取消收藏吗？',
      success: (res) => {
        if (res.confirm) {
          storage.remove(id);
          this.loadFavorites();
        }
      }
    });
  },

  onClearAll() {
    if (this.data.favorites.length === 0) return;
    wx.showModal({
      title: '提示',
      content: '确定清空所有收藏吗？',
      success: (res) => {
        if (res.confirm) {
          storage.clear();
          this.loadFavorites();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  }
});
