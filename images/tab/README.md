# TabBar 图标占位

需要准备 4 个 PNG 图标（81x81 像素）：

- `search.png` - 搜索（未选中）
- `search-active.png` - 搜索（选中）
- `favorite.png` - 收藏（未选中）
- `favorite-active.png` - 收藏（选中）

**临时方案**（在拿到正式图标前）：
1. 打开 `app.json`
2. 删掉每个 tab 的 `iconPath` 和 `selectedIconPath` 字段（保留 text 即可）

或者先在微信开发者工具里随便画两个占位图，路径替换即可。
