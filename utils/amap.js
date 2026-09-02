// utils/amap.js
// 高德地图 API 封装
// 文档：https://lbs.amap.com/api/webservice/guide/api

const app = getApp();

/**
 * 获取高德 Web API Key
 * 请在 app.js 的 globalData.amapKey 中填入你的实际 Key
 */
function getKey() {
  const key = (app && app.globalData && app.globalData.amapKey) || 'YOUR_AMAP_KEY_HERE';
  if (key === 'YOUR_AMAP_KEY_HERE') {
    console.error('[高德] 请先在 app.js 中配置你的高德 Key');
    wx.showToast({
      title: '请先配置高德 Key',
      icon: 'none',
      duration: 3000
    });
  }
  return key;
}

/**
 * 通用请求方法
 */
function request(url, data = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: 'GET',
      data: data,
      success: (res) => {
        if (res.data && res.data.status === '1') {
          resolve(res.data);
        } else {
          reject(res.data || { info: '请求失败' });
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 路径规划（驾车/公交/步行）
 * @param {Object} options
 * @param {string} options.origin - 起点坐标 "lng,lat" 或 名称
 * @param {string} options.destination - 终点坐标 "lng,lat" 或 名称
 * @param {string} options.mode - 'driving' | 'walking' | 'transit' | 'bicycling'
 * @returns {Promise<Object>}
 */
function routePlan(options) {
  const { origin, destination, mode = 'driving' } = options;
  const typeMap = {
    driving: 'driving',
    walking: 'walking',
    transit: 'transit/integrated',
    bicycling: 'bicycling'
  };
  const url = `https://restapi.amap.com/v3/direction/${typeMap[mode] || 'driving}`;
  return request(url, {
    key: getKey(),
    origin: origin,
    destination: destination,
    extensions: 'base',
    output: 'json'
  });
}

/**
 * POI 关键词搜索（搜索景点）
 * @param {Object} options
 * @param {string} options.keywords - 搜索关键词，如 "景区"、"景点"
 * @param {string} options.city - 限定城市，如 "漠河"
 * @param {string} options.types - POI 类型，可选
 * @param {number} options.offset - 每页条数（默认 20）
 * @param {number} options.page - 页码（默认 1）
 * @returns {Promise<Object>}
 */
function searchPOI(options) {
  const { keywords, city, types = '110000|110100|110200|110300', offset = 20, page = 1 } = options;
  return request('https://restapi.amap.com/v3/place/text', {
    key: getKey(),
    keywords: keywords,
    city: city,
    types: types,
    offset: offset,
    page: page,
    extensions: 'base',
    output: 'json'
  });
}

/**
 * POI 周边搜索（在某坐标附近搜景点）
 * @param {Object} options
 * @param {string} options.location - 中心点 "lng,lat"
 * @param {string} options.keywords - 搜索关键词
 * @param {number} options.radius - 搜索半径（米），默认 5000
 */
function aroundSearch(options) {
  const { location, keywords, radius = 5000, offset = 20, page = 1 } = options;
  return request('https://restapi.amap.com/v3/place/around', {
    key: getKey(),
    location: location,
    keywords: keywords,
    radius: radius,
    offset: offset,
    page: page,
    extensions: 'base',
    output: 'json'
  });
}

/**
 * 获取地点详情
 * @param {string} id - POI 唯一标识
 */
function getPoiDetail(id) {
  return request('https://restapi.amap.com/v3/place/detail', {
    key: getKey(),
    id: id,
    extensions: 'all',
    output: 'json'
  });
}

/**
 * 地理编码：地址 → 坐标
 * @param {string} address - 结构化地址，如 "黑龙江省哈尔滨市"
 * @param {string} city - 城市，可选
 */
function geocode(address, city = '') {
  return request('https://restapi.amap.com/v3/geocode/geo', {
    key: getKey(),
    address: address,
    city: city,
    output: 'json'
  });
}

/**
 * 逆地理编码：坐标 → 地址
 * @param {string} location - "lng,lat"
 */
function regeocode(location) {
  return request('https://restapi.amap.com/v3/geocode/regeo', {
    key: getKey(),
    location: location,
    extensions: 'base',
    output: 'json'
  });
}

/**
 * 解析路径规划结果，提取途经点（polyline 中的城市）
 * 注意：路径规划返回的 polyline 是坐标串，需要进一步处理
 * 简化方案：直接用 origin/destination 的坐标 + 用户输入的中途城市
 */
function extractWaypoints(routeData, mode) {
  // 高德路径规划主要返回 path（坐标串）和 distance/duration
  // 真正的"途经城市"需要用 polyline 解析，或者依赖用户输入
  // 这里返回原始数据，由调用方处理
  if (!routeData || !routeData.route) {
    return [];
  }
  const route = routeData.route;
  const paths = route.paths || [];
  if (paths.length === 0) return [];
  return paths[0].steps || [];
}

module.exports = {
  routePlan,
  searchPOI,
  aroundSearch,
  getPoiDetail,
  geocode,
  regeocode,
  extractWaypoints
};
