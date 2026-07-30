# Endless Snake · 无限贪吃蛇

用 **React + Vite + TypeScript** 像素级复刻的极简风无限贪吃蛇，灵感来自 Steam 上的《Endless Snake》。所有素材均为 Canvas / SVG 手绘，无外部图片依赖。

## 玩法

### CLASSIC 经典模式
纯粹的贪吃蛇：吃苹果刷分，速度随苹果数不断提升，挑战极限高分。

### ROGUELITE 肉鸽模式
每吃 **5 个苹果**进化一次，从 3 张强化卡中三选一，构筑你的"蛇引擎"：

| 强化 | 效果 |
| --- | --- |
| Speed Demon | 速度 +12%，得分 +5% |
| Combo Master | 连击窗口 +1.6s，上限 +2 |
| Golden Touch | 金苹果出现率翻倍，金苹果分 +50% |
| Phase Trickster | 周期性获得相位，可穿过自身 |
| Magnet Core | 吸附附近苹果 |
| Shield Shell | 抵挡一次致命碰撞 |
| Slow Mo | 速度 -10%，得分 +15% |
| Apple Bloom | 苹果上限 +1，苹果分 +10% |
| Long Haul | 每个苹果额外 +1 节 |
| Second Wind | 死亡时复活一次 |
| Score Surge | 连击 ≥ ×2 时得分 +30% |
| Zen Garden | 金苹果存续 +4s |

### 通用规则
- **穿墙不死**：从一边穿出，从另一边穿入（"无限"的核心）
- **唯一死法**：咬到自己的身体
- **连击系统**：3.6 秒内连续吃苹果，连击倍率 ×1.1 → ×1.8+
- **金苹果**：随机出现，限时 7 秒，基础分 5 倍
- 三档难度：CHILL 20×14 / NORMAL 24×16 / INSANE 32×18
- 本地最高分 + 排行榜（localStorage 持久化）

## 操作

| 按键 | 功能 |
| --- | --- |
| ↑↓←→ / WASD | 转向 |
| SPACE / ESC | 暂停 |
| M | 静音 |
| R | 重开（结算/暂停界面） |
| 1 / 2 / 3 | 抽卡快捷选择 |
| 手机滑动 | 转向 |

## 10 套主题

DEFAULT / FOREST / DESERT / OCEAN / SUNSET / NEON / ARCADE / NORDIC / PAPER / MIDNIGHT，主菜单一键切换，全局即时生效。

## 技术要点

- **引擎与渲染分离**：`SnakeEngine` 纯逻辑（网格、碰撞、计分、perk），Canvas 渲染器负责插值动画
- **固定步长 + 插值**：逻辑按 tick 推进，渲染按 rAF 插值，蛇移动平滑无跳格
- **WebAudio 合成音效**：吃食音调随连击升高，零音频资源
- **粒子系统**：吃食爆裂、护盾破碎、金苹果光晕
- **手绘素材**：蛇、苹果（带梗和高光）、Logo 全部为代码绘制

## 运行

```bash
npm install
npm run dev      # 开发
npm run build    # 构建
npm run preview  # 预览构建产物
```
