// pages/index/index.js
const amap = require('../../utils/amap.js');
const routeUtil = require('../../utils/route.js');

const app = getApp();

Page({
  data: {
    origin: '',
    destination: '',
    mode: 'transit', // 默认公交（含火车）
    modeOptions: [
      { value: 'driving', label: '驾车' },
      { value: 'transit', label: '公交' },
      { value: 'walking', label: '步行' }
    ],
    originSuggestions: [],
    destinationSuggestions: [],
    originLocation: '',
    destinationLocation: '',
    searching: false,
    activeField: '' // 'origin' | 'destination' | ''
  },

  onLoad() {
    this.checkKey();
  },

  checkKey() {
    if (app.globalData.amapKey === 'YOUR_AMAP_KEY_HERE') {
      wx.showModal({
        title: '配置提示',
        content: '请先在 app.js 中配置高德地图 Key（globalData.amapKey）',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  onModeChange(e) {
    this.setData({ mode: e.currentTarget.dataset.value });
  },

  onFieldFocus(e) {
    this.setData({ activeField: e.currentTarget.dataset.field });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({ [field]: value });
    this.debounceSearch(value, field);
  },

  debounceSearch: null,

  onLoad() {
    // 防抖搜索
    this.debounceSearch = this.debounce((keyword, field) => {
      this.searchPlaces(keyword, field);
    }, 300);
  },

  debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  async searchPlaces(keyword, field) {
    if (!keyword || keyword.length < 2) {
      this.setData({
        [`${field}Suggestions`]: []
      });
      return;
    }
    this.setData({ searching: true });
    try {
      // 高德输入提示 API
      const key = (app && app.globalData && app.globalData.amapKey) || '';
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://restapi.amap.com/v3/assistant/inputtips',
          method: 'GET',
          data: {
            key: key,
            keywords: keyword,
            type: '城市|区县|地名|商圈|热点|建筑物',
            output: 'json'
          },
          success: resolve,
          fail: reject
        });
      });
      if (res.data && res.data.status === '1') {
        this.setData({
          [`${field}Suggestions`]: (res.data.tips || []).slice(0, 10)
        });
      } else {
        this.setData({ [`${field}Suggestions`]: [] });
      }
    } catch (e) {
      console.error('搜索失败', e);
      this.setData({ [`${field}Suggestions`]: [] });
    } finally {
      this.setData({ searching: false });
    }
  },

  onSelectSuggestion(e) {
    const field = e.currentTarget.dataset.field;
    const item = e.currentTarget.dataset.item;
    this.setData({
      [field]: item.name,
      [`${field}Location`]: item.location,
      [`${field}Suggestions`]: [],
      activeField: ''
    });
  },

  onClear(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: '',
      [`${field}Location`]: '',
      [`${field}Suggestions`]: []
    });
  },

  async onSearch() {
    const { origin, destination, mode, originLocation, destinationLocation } = this.data;
    if (!origin || !destination) {
      wx.showToast({ title: '请输入起终点', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '路线计算中...', mask: true });

    try {
      // 1. 提取城市名（从 location 或 input 中）
      const originName = origin.replace(/市$|省$|自治区$|特别行政区$/, '').trim();
      const destName = destination.replace(/市$|省$|自治区$|特别行政区$/, '').trim();

      // 2. 获取途经城市
      const waypoints = await routeUtil.getWaypointCities({
        originName,
        destinationName: destName,
        originLocation,
        destinationLocation,
        mode
      });

      // 3. 跳转到路线页
      wx.hideLoading();
      wx.navigateTo({
        url: `/pages/route/route?waypoints=${encodeURIComponent(JSON.stringify(waypoints))}&mode=${mode}`
      });
    } catch (e) {
      wx.hideLoading();
      console.error('查询失败', e);
      wx.showToast({ title: '查询失败，请重试', icon: 'none' });
    }
  }
});
