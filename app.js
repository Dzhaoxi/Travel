// app.js
App({
  onLaunch() {
    // 启动时检查本地存储的收藏数据
    const favorites = wx.getStorageSync('favorites') || [];
    this.globalData.favorites = favorites;

    // 高德地图 Key 校验提示
    if (!wx.getStorageSync('amapKeyConfigured')) {
      console.warn('[配置提示] 请先在 utils/amap.js 中填入高德地图 Key');
    }
  },

  onShow() {
    // 小程序从后台进入前台
  },

  onHide() {
    // 小程序从前台进入后台
  },

  globalData: {
    // 高德地图 Web API Key（请替换为你的实际 Key）
    // 申请地址：https://lbs.amap.com/dev/key/app
    amapKey: 'YOUR_AMAP_KEY_HERE',

    // 用户偏好
    userInfo: null,

    // 收藏列表（运行时缓存）
    favorites: []
  }
});
