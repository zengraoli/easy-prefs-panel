

## Scrapling 可视化配置生成器

为非程序员打造的中文界面，通过表单交互生成 Scrapling 的 Python 配置代码和 CLI 命令。

### 页面结构

**首页（引导页）**
- 简洁介绍 Scrapling 是什么
- 三个入口卡片：单页抓取、爬虫配置、代理配置
- 中文界面，友好的图标和说明

**单页抓取配置页 `/fetcher`**
- 步骤式向导（Step 1-4）：
  1. **选择抓取方式**：Fetcher（快速）/ StealthyFetcher（隐秘绕过反爬）/ DynamicFetcher（动态页面）- 用卡片展示，附带通俗解释
  2. **基本设置**：目标 URL、是否无头模式、是否绕过 Cloudflare、超时时间、模拟浏览器类型等
  3. **数据选择器**：CSS 选择器 / XPath / 文本搜索，支持多条规则，每条可命名
  4. **高级选项**：HTTP/3、DNS 防泄漏、域名屏蔽、广告屏蔽等开关

- 右侧实时预览生成的 Python 代码，带语法高亮
- 一键复制代码 + 一键复制 CLI 命令

**爬虫（Spider）配置页 `/spider`**
- 向导式表单：
  1. 爬虫名称、起始 URL（支持多个）
  2. 并发数、下载延迟、最大深度
  3. Session 类型选择（单 Session / 多 Session）
  4. 数据选择器配置（同上）
  5. 导出格式（JSON / JSONL）
  6. 高级：暂停恢复（crawldir）、robots.txt 遵守、开发模式

- 实时生成完整的 Spider 类代码

**代理配置页 `/proxy`**
- 代理列表管理：添加/删除代理地址
- 轮换策略选择：轮询 / 自定义
- 生成 ProxyRotator 配置代码
- 可与 Fetcher/Spider 配置联动

**Session 管理配置页 `/session`**
- 选择 Session 类型：FetcherSession / StealthySession / DynamicSession / Async 版本
- 配置参数：impersonate、headless、max_pages 等
- 生成 Session 管理代码

### 交互设计
- 所有技术术语附带中文解释和 tooltip
- 表单使用开关/下拉/卡片选择，避免手动输入技术参数
- 代码预览区实时更新，带语法高亮和复制按钮
- 响应式布局，支持移动端
- 配置可导出为 JSON 文件保存，也可从 JSON 导入恢复

### 视觉风格
- 浅色主题，清爽专业
- 使用 shadcn/ui 组件
- 步骤指示器显示当前进度

