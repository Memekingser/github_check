# GitHub贡献者Twitter检测工具

这是一个React应用，用于检查GitHub仓库贡献者是否在其个人资料中提供了Twitter链接。

## 功能

- 输入任意GitHub仓库链接
- 自动获取该仓库的贡献者列表
- 检查每个贡献者的个人资料中是否有Twitter链接
- 显示带有Twitter链接的贡献者统计信息
- 提供贡献者的直接链接到GitHub和Twitter

## 技术栈

- React
- TypeScript
- Styled Components
- Axios
- GitHub API
- React Toastify

## 安装与运行

1. 克隆此仓库:
```bash
git clone https://github.com/yourusername/github-contributors-twitter-checker.git
cd github-contributors-twitter-checker
```

2. 安装依赖:
```bash
npm install
```

3. 启动开发服务器:
```bash
npm start
```

4. 在浏览器中访问 `http://localhost:3000`

## 使用方法

1. 在输入框中输入一个GitHub仓库的URL，例如：`https://github.com/facebook/react`
2. 点击"检查"按钮
3. 应用将自动获取仓库的贡献者信息，并检查每个贡献者是否在GitHub个人资料中提供了Twitter链接
4. 查看统计信息和每个贡献者的Twitter链接状态

## 注意事项

- GitHub API有速率限制，如果在短时间内多次请求，可能会遇到API限制
- 该应用目前获取最多100名贡献者（GitHub API的每页限制）

## 许可证

MIT
