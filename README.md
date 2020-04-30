# wechatByNode
一个基于node的微信公众号开发项目


![node version](https://img.shields.io/badge/node-7.5.0-brightgreen.svg)
![npm version](https://img.shields.io/badge/npm-4.1.2-brightgreen.svg)
![express version](https://img.shields.io/badge/express-4.15.3-blue.svg)
![xml2js](https://img.shields.io/badge/xml2js-0.4.17-orange.svg)

# 项目结构
<pre>
.
├── README.md           
├── package.json               // 构建项目与工具包依赖
├── config.json               // 项目配置文件
├── app.js                   // 项目启动入口
├── wechat                 // 微信模块文件夹
│   ├── access_token.json // accessToken存储文件
│   ├── menus.json       // 菜单配置文件
│   ├── msg.js          // 消息模块
│   └── wechat.js      // 微信模块
</pre>

# 目标功能
- [x] 微信接入功能
- [x] access_token的获取、存储及更新
- [x] 自定义微信菜单
- [x] 消息被动回复
- [x] 消息加解密

# 构建项目
 1. 将项目 clone 到本地
    ```
    git clone git@github.com:SilenceHVK/wechatByNode.git
    ```

 2. 打开项目配置文件 config.json


 3. 进入 wechatByNode 文件并运行 app.js
