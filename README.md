# 无限域 (Infinite Domain)

一个创新的分支小说创作平台，让每个故事都有无限的可能。

## 项目概述

无限域是一个基于分支创作理念的小说网站，用户可以：
- 创建具有分支剧情的小说
- 在任意章节后创建新的故事分支
- 选择不同的阅读路径体验故事
- 与全球创作者一起协作创作

## 技术栈

后端：https://github.com/LoosePrince/Unlimited-Domains-server<br>
前端：https://github.com/LoosePrince/Unlimited-Domains-client

### 后端
- **Node.js** + **Express** - 服务器框架
- **PostgreSQL** - 数据库（使用postgres包连接）
- **JWT** - 用户认证
- **bcryptjs** - 密码加密
- **express-validator** - 数据验证

### 前端
- **React 18** - 用户界面框架
- **React Router** - 路由管理
- **Tailwind CSS** - 样式框架
- **Axios** - HTTP客户端
- **Vite** - 构建工具


## 部署说明

### 生产环境配置
1. 设置 `NODE_ENV=production`
2. 配置生产环境数据库连接
3. 设置安全的JWT密钥
4. 配置CORS策略

### Docker部署（可选）
项目支持Docker容器化部署，具体配置请参考Docker相关文档。

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 打开 Pull Request

## 许可证

本项目前后端采用不同许可证 - 前端查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请通过以下方式联系：
- 项目Issues: [GitHub Issues](https://github.com/LoosePrince/Unlimited-Domains-client/issues)
- 邮箱: pfingan@foxmail.com