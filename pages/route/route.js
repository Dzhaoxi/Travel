// pages/route/route.js
const amap = require('../../utils/amap.js');
const storage = require('../../utils/storage.js');

const app = getApp();

Page({
  data: {
    waypoints: [],
    mode: 'transit',
    citySpots: [], // [{ city, spots: [], loading, error }]
    loading: true,
    expanded: {} // 记录每个城市是否展开
  },

  onLoad(options) {
    let waypoints = [];
    try {
      waypoints = JSON.parse(decodeURIComponent(options.waypoints || '[]'));
    } catch (e) {
      waypoints = [];
    }
    const mode = options.mode || 'transit';
    this.setData({ waypoints, mode });

    if (waypoints.length === 0) {
      this.setData({ loading: false });
      wx.showToast({ title: '路线数据为空', icon: 'none' });
      return;
    }

    this.loadAllCitySpots();
  },

  async loadAllCitySpots() {
    const { waypoints } = this.data;
    const citySpots = waypoints.map(city => ({
      city: city.name,
      location: city.location,
      spots: [],
      loading: true,
      error: null
    }));
    this.setData({ citySpots });

    // 逐个城市查询景点
    for (let i = 0; i < citySpots.length; i++) {
      try {
        const res = await amap.searchPOI({
          keywords: '景区|景点|公园|博物馆|古镇',
          city: citySpots[i].city,
          offset: 20,
          page: 1
        });
        const pois = (res && res.pois) || [];
        const spots = pois.map(p => ({
          id: p.id,
          name: p.name,
          address: p.address,
          location: p.location,
          type: p.type,
          tel: p.tel || '',
          distance: p.distance || '',
          city: citySpots[i].city
        }));
        citySpots[i].spots = spots;
        citySpots[i].loading = false;
      } catch (e) {
        console.error(`查询 ${citySpots[i].city} 失败`, e);
        citySpots[i].error = e.info || '查询失败';
        citySpots[i].loading = false;
      }
      this.setData({ [`citySpots[${i}]`]: citySpots[i] });
    }

    this.setData({ loading: false });
  },

  onToggleCity(e) {
    const idx = e.currentTarget.dataset.idx;
    const expanded = { ...this.data.expanded };
    expanded[idx] = !expanded[idx];
    this.setData({ expanded });
  },

  onSpotTap(e) {
    const spot = e.currentTarget.dataset.spot;
    wx.navigateTo({
      url: `/pages/spot/spot?data=${encodeURIComponent(JSON.stringify(spot))}`
    });
  },

  onOpenMap(e) {
    e.stopPropagation && e.stopPropagation();
    const spot = e.currentTarget.dataset.spot;
    const [lng, lat] = (spot.location || '').split(',');
    if (!lng || !lat) {
      wx.showToast({ title: '坐标缺失', icon: 'none' });
      return;
    }
    // 唤起高德地图
    wx.openLocation({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      name: spot.name,
      address: spot.address,
      scale: 16
    });
  }
});
