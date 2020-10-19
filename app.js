const express = require('express'), //express 框架 
      wechat  = require('./wechat/wechat'), 
       config = require('./config');//引入配置文件
var app = express();//实例express框架

var wechatApp = new wechat(config); //实例wechat 模块

//用于处理所有进入 3000 端口 get 的连接请求
app.get('/',function(req,res){
    wechatApp.auth(req,res);
});

//用于处理所有进入 8888 端口 post 的连接请求
app.post('/',function(req,res){
    wechatApp.handleMsg(req,res);
});

//用于请求获取 access_token
app.get('/getAccessToken',function(req,res){
    wechatApp.getAccessToken().then(function(data){
        res.send(data);
    });    
});
//获取当前菜单样子
app.get('/cgi-bin/get_current_selfmenu_info',function(req,res){
    wechatApp.getCurrentMenu().then(function(data){
        res.send(data);
    });

})
//获取用户信息
app.get('/userInfo',function(req,res){
    console.log('userInfo_test');
    res.send('<p>some html</p>')
});

//监听3000端口
app.listen(8888);