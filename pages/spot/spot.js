// pages/spot/spot.js
const amap = require('../../utils/amap.js');
const storage = require('../../utils/storage.js');

const app = getApp();

Page({
  data: {
    spot: {},
    detail: null,
    loading: true,
    favorited: false
  },

  onLoad(options) {
    let spot = {};
    try {
      spot = JSON.parse(decodeURIComponent(options.data || '{}'));
    } catch (e) {
      spot = {};
    }
    this.setData({
      spot,
      favorited: storage.has(spot.id)
    });
    this.loadDetail(spot.id);
  },

  async loadDetail(id) {
    if (!id) {
      this.setData({ loading: false });
      return;
    }
    try {
      const res = await amap.getPoiDetail(id);
      const detail = (res && res.pois && res.pois[0]) || null;
      this.setData({ detail, loading: false });
    } catch (e) {
      console.error('加载详情失败', e);
      this.setData({ loading: false });
    }
  },

  onToggleFavorite() {
    const { spot, detail } = this.data;
    const data = {
      id: spot.id,
      name: spot.name,
      address: spot.address,
      location: spot.location,
      city: spot.city,
      intro: detail ? (detail.intro || detail.business || '') : '',
      tel: spot.tel,
      image: detail && detail.photos && detail.photos[0] ? detail.photos[0].url : ''
    };
    const nowFavorited = storage.toggle(data);
    this.setData({ favorited: nowFavorited });
  },

  onOpenMap() {
    const { spot } = this.data;
    const [lng, lat] = (spot.location || '').split(',');
    if (!lng || !lat) {
      wx.showToast({ title: '坐标缺失', icon: 'none' });
      return;
    }
    wx.openLocation({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      name: spot.name,
      address: spot.address,
      scale: 16
    });
  }
});
