# GitHub 贡献者 Twitter / X 检测工具

React 应用：输入 GitHub 仓库，批量检查贡献者是否在个人资料中填写了 Twitter / X 用户名。

## 功能

- 支持完整仓库 URL 或 `owner/repo` 简写
- 自动分页获取全部贡献者（不再限制在首屏 100 人）
- 并发拉取用户资料（默认 5 路），展示进度条与可取消请求
- 显示 GitHub API 剩余额度
- 筛选（全部 / 有 X / 无 X）、排序、导出 CSV
- 可选 Personal Access Token（Bearer，保存在 sessionStorage）
- 支持分享链接：`?repo=owner/repo`

> 说明：已移除浏览器直连 Twitter 的“账号是否存活”探测（CORS/重定向导致结果不可靠）。现在以 GitHub 资料字段为准。

## 技术栈

- React + TypeScript
- Styled Components
- Axios
- GitHub REST API
- React Toastify

## 安装与运行

```bash
npm install
npm start
```

浏览器打开 `http://localhost:3000`。

## 使用方法

1. 输入仓库，例如 `https://github.com/facebook/react` 或 `facebook/react`
2. （可选）在高级设置中填入 GitHub Token 以提高 API 额度
3. 点击「检查」，等待贡献者列表与资料加载完成
4. 使用筛选 / 排序查看结果，需要时可导出 CSV

## 注意事项

- 未认证请求约 60 次/小时；大仓库建议使用 Token
- 仅统计 GitHub 公开资料中的 `twitter_username` 字段

## 许可证

MIT
