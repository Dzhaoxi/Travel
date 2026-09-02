// utils/route.js
// 路线解析工具
// 负责从高德路径规划结果中提取"途经城市"

const amap = require('./amap.js');

/**
 * 常见沿线城市清单（用于补充高德未覆盖的中小城市）
 * 数据可由用户后续手动维护
 */
const COMMON_CITIES = {
  // 哈尔滨 ↔ 漠河 沿线
  '哈尔滨-漠河': ['哈尔滨', '大庆', '齐齐哈尔', '嫩江', '塔河', '漠河'],
  // 哈尔滨 ↔ 牡丹江 沿线
  '哈尔滨-牡丹江': ['哈尔滨', '尚志', '海林', '牡丹江'],
  // 哈尔滨 ↔ 佳木斯 沿线
  '哈尔滨-佳木斯': ['哈尔滨', '方正', '依兰', '佳木斯'],
  // 哈尔滨 ↔ 黑河 沿线
  '哈尔滨-黑河': ['哈尔滨', '北安', '黑河']
};

/**
 * 根据起终点匹配已知路线
 * @param {string} origin - 起点城市名
 * @param {string} destination - 终点城市名
 */
function matchKnownRoute(origin, destination) {
  const key1 = `${origin}-${destination}`;
  const key2 = `${destination}-${origin}`;
  if (COMMON_CITIES[key1]) return COMMON_CITIES[key1];
  if (COMMON_CITIES[key2]) return COMMON_CITIES[key2].slice().reverse();
  return null;
}

/**
 * 解析坐标串 polyline 为可读城市
 * 简化方案：调用逆地理编码，对 polyline 采样几个点，提取城市名
 *
 * @param {string} polyline - "lng,lat;lng,lat;..."
 * @returns {Promise<Array<{name, location}>>}
 */
async function parsePolylineCities(polyline, maxSamples = 5) {
  if (!polyline) return [];
  const points = polyline.split(';').filter(Boolean);
  if (points.length === 0) return [];

  // 采样：起点、终点 + 中间均分
  const samples = [];
  const step = Math.max(1, Math.floor(points.length / (maxSamples + 1)));
  for (let i = 0; i < points.length && samples.length < maxSamples + 2; i += step) {
    samples.push(points[i]);
  }
  if (samples[samples.length - 1] !== points[points.length - 1]) {
    samples.push(points[points.length - 1]);
  }

  // 并发调用逆地理编码
  const promises = samples.map(p => amap.regeocode(p).catch(() => null));
  const results = await Promise.all(promises);

  // 提取城市名（去重保序）
  const cities = [];
  const seen = new Set();
  results.forEach((res, idx) => {
    if (res && res.regeocode && res.regeocode.addressComponent) {
      const comp = res.regeocode.addressComponent;
      // 优先 city，若空则用 province
      const cityName = comp.city && comp.city.length > 0
        ? comp.city.replace(/市$/, '')
        : (comp.province || '').replace(/省|自治区|特别行政区$/, '');
      if (cityName && !seen.has(cityName)) {
        seen.add(cityName);
        cities.push({
          name: cityName,
          location: samples[idx]
        });
      }
    }
  });

  return cities;
}

/**
 * 主入口：获取起终点之间的途经城市
 * 策略：先用已知路线匹配，匹配不到再用 API 解析
 *
 * @param {Object} params
 * @param {string} params.originName - 起点城市名
 * @param {string} params.destinationName - 终点城市名
 * @param {string} params.originLocation - 起点坐标 "lng,lat"
 * @param {string} params.destinationLocation - 终点坐标 "lng,lat"
 * @param {string} params.mode - 出行方式
 * @returns {Promise<Array<{name, location}>>}
 */
async function getWaypointCities(params) {
  const { originName, destinationName, originLocation, destinationLocation, mode } = params;

  // 策略 1：匹配已知路线（快、准）
  const known = matchKnownRoute(originName, destinationName);
  if (known && known.length >= 2) {
    // 已知路线没有坐标，需要给每个城市查坐标
    // 简化：先返回名字，使用时再按需 geocode
    return known.map((name, idx) => ({
      name,
      location: idx === 0 ? originLocation : (idx === known.length - 1 ? destinationLocation : '')
    }));
  }

  // 策略 2：调用高德路径规划 + 逆地理编码
  try {
    const routeRes = await amap.routePlan({
      origin: originLocation || originName,
      destination: destinationLocation || destinationName,
      mode: mode
    });
    if (routeRes && routeRes.route && routeRes.route.paths && routeRes.route.paths[0]) {
      const polyline = routeRes.route.paths[0].polyline;
      const cities = await parsePolylineCities(polyline, 4);
      if (cities.length >= 2) {
        return cities;
      }
    }
  } catch (e) {
    console.error('路径规划失败', e);
  }

  // 兜底：只返回起终点
  return [
    { name: originName, location: originLocation },
    { name: destinationName, location: destinationLocation }
  ];
}

module.exports = {
  getWaypointCities,
  COMMON_CITIES
};
