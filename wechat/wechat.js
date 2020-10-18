"use strict"; //设置为严格模式

const crypto = require("crypto"), //引入加密模块
  https = require("https"), //引入 htts 模块
  util = require("util"), //引入 util 工具包
  fs = require("fs"), //引入 fs 模块
  urltil = require("url"), //引入 url 模块
  accessTokenJson = require("./access_token"), //引入本地存储的 access_token
  menus = require("./menus"), //引入微信菜单配置
  parseString = require("xml2js").parseString, //引入xml2js包
  msg = require("./msg"), //引入消息处理模块
  CryptoGraphy = require("./cryptoGraphy"), //微信消息加解密模块
  path = require("path"), //路径模块包
  request = require("request"),
  subscribe = require("./data_config/subscribe"), //事件相关消息
  text = require("./data_config/text"), //文本相关消息
  user = require("./get/userAccount"),
  aiTencent = require("../AI_Tencent/index");
/**
 * 构建 WeChat 对象 即 js中 函数就是对象
 * @param {JSON} config 微信配置文件
 */
var WeChat = function (config) {
  //设置 WeChat 对象属性 config
  this.config = config;
  //设置 WeChat 对象属性 token
  this.token = config.token;
  //设置 WeChat 对象属性 appID
  this.appID = config.appID;
  //设置 WeChat 对象属性 appScrect
  this.appScrect = config.appScrect;
  //设置 WeChat 对象属性 apiDomain
  this.apiDomain = config.apiDomain;
  //获得weather对象属性
  this.weather = config.weather;
  //设置 WeChat 对象属性 apiURL
  this.apiURL = config.apiURL;

  /**
   * 用于处理 https Get请求方法
   * @param {String} url 请求地址
   */
  this.requestGet = function (url) {
    return new Promise(function (resolve, reject) {
      https
        .get(url, function (res) {
          var buffer = [],
            result = "";
          //监听 data 事件
          res.on("data", function (data) {
            buffer.push(data);
          });
          //监听 数据传输完成事件
          res.on("end", function () {
            result = Buffer.concat(buffer).toString("utf-8");
            //将最后结果返回
            resolve(result);
          });
        })
        .on("error", function (err) {
          reject(err);
        });
    });
  };

  /**
   * 用于处理 https Post请求方法
   * @param {String} url  请求地址
   * @param {JSON} data 提交的数据
   */
  this.requestPost = function (url, data) {
    return new Promise(function (resolve, reject) {
      //解析 url 地址
      var urlData = urltil.parse(url);
      //设置 https.request  options 传入的参数对象
      var options = {
        //目标主机地址
        hostname: urlData.hostname,
        //目标地址
        path: urlData.path,
        //请求方法
        method: "POST",
        //头部协议
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(data, "utf-8"),
        },
      };

      var req = https
        .request(options, function (res) {
          var buffer = [],
            result = "";
          //用于监听 data 事件 接收数据
          res.on("data", function (data) {
            buffer.push(data);
          });
          //用于监听 end 事件 完成数据的接收
          res.on("end", function () {
            result = Buffer.concat(buffer).toString("utf-8");
            resolve(result);
          });
        })
        //监听错误事件
        .on("error", function (err) {
          console.log(err);
          reject(err);
        });
      //传入数据
      req.write(data);
      req.end();
    });
  };
};

/**
 * 微信接入验证
 * @param {Request} req Request 对象
 * @param {Response} res Response 对象
 */
WeChat.prototype.auth = function (req, res) {
  this.CreateMenu();

  //1.获取微信服务器Get请求的参数 signature、timestamp、nonce、echostr
  var signature = req.query.signature, //微信加密签名
    timestamp = req.query.timestamp, //时间戳
    nonce = req.query.nonce, //随机数
    echostr = req.query.echostr; //随机字符串

  //2.将token、timestamp、nonce三个参数进行字典序排序
  var array = [this.token, timestamp, nonce];
  array.sort();

  //3.将三个参数字符串拼接成一个字符串进行sha1加密
  var tempStr = array.join("");
  const hashCode = crypto.createHash("sha1"); //创建加密类型
  var resultCode = hashCode.update(tempStr, "utf8").digest("hex"); //对传入的字符串进行加密

  //4.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
  if (resultCode === signature) {
    res.send(echostr);
  } else {
    res.send("mismatch");
  }
};

/**
 * 获取微信 access_token
 */
WeChat.prototype.getAccessToken = function () {
  var that = this;
  return new Promise(function (resolve, reject) {
    //获取当前时间
    var currentTime = new Date().getTime();
    //格式化请求地址
    var url = util.format(
      that.apiURL.accessTokenApi,
      that.apiDomain,
      that.appID,
      that.appScrect
    );
    //判断 本地存储的 access_token 是否有效
    if (
      accessTokenJson.access_token === "" ||
      accessTokenJson.expires_time < currentTime
    ) {
      that.requestGet(url).then(function (data) {
        var result = JSON.parse(data);
        if (data.indexOf("errcode") < 0) {
          accessTokenJson.access_token = result.access_token;
          accessTokenJson.expires_time =
            new Date().getTime() + (parseInt(result.expires_in) - 200) * 1000;
          //更新本地存储的
          console.log("这是令牌" + accessTokenJson.access_token);
          fs.writeFile(
            "./wechat/access_token.json",
            JSON.stringify(accessTokenJson),
            function (err, written, buffer) { }
          );
          //将获取后的 access_token 返回
          resolve(accessTokenJson.access_token);
        } else {
          //将错误返回
          resolve(result);
        }
      });
    } else {
      //将本地存储的 access_token 返回
      resolve(accessTokenJson.access_token);
    }
  });
};

/**
 * 微信消息处理
 * @param {Request} req Request 对象
 * @param {Response} res Response 对象
 */
WeChat.prototype.handleMsg = function (req, res) {
  var buffer = [],
    that = this;
  //实例微信消息加解密
  var cryptoGraphy = new CryptoGraphy(that.config, req);
  //监听 data 事件 用于接收数据
  req.on("data", function (data) {
    buffer.push(data);
  });
  //监听 end 事件 用于处理接收完成的数据
  req.on("end", function () {
    var msgXml = Buffer.concat(buffer).toString("utf-8");
    //解析xml
    parseString(msgXml, { explicitArray: false }, function (err, result) {
      if (!err) {
        result = result.xml;
        //判断消息加解密方式
        if (req.query.encrypt_type == "aes") {
          //对加密数据解密
          result = cryptoGraphy.decryptMsg(result.Encrypt);
        }
        var toUser = result.ToUserName; //接收方微信
        var fromUser = result.FromUserName; //发送仿微信
        let reportMsg = ""; //声明回复消息的变量
        //判断消息类型
        if (result.MsgType.toLowerCase() === "event") {
          //判断事件类型
          switch (result.Event.toLowerCase()) {
            case "subscribe":
              var content = subscribe.content;
              reportMsg = msg.txtMsg(fromUser, toUser, content);
              that.msgSend(res, req, reportMsg, cryptoGraphy);
              break;
            case "click":
              //回复图文消息
              if (result.EventKey == 'today_recommend') {
                reportMsg = msg.graphicMsg(
                  fromUser,
                  toUser,
                  subscribe.contentArr);
                that.msgSend(res, req, reportMsg, cryptoGraphy);
              } else if (result.EventKey == 'user_token') {
                var users = new user();
                users.userAuth();
              };
              console.log(result);
              break;
          }
        } else {
          //判断消息类型为 文本消息
          if (result.MsgType.toLowerCase() === "text") {
            //根据消息内容返回消息信息
            switch (result.Content) {
              case "1":
                reportMsg = msg.txtMsg(fromUser, toUser, text.text.one);
                that.msgSend(res, req, reportMsg, cryptoGraphy);
                break;
              case "2":
                reportMsg = msg.txtMsg(fromUser, toUser, text.text.two);
                that.msgSend(res, req, reportMsg, cryptoGraphy);
                break;
              case "文章":
                //回复图文消息
                reportMsg = msg.graphicMsg(fromUser, toUser, text.text.article);
                that.msgSend(res, req, reportMsg, cryptoGraphy);
                break;
              case "女神":
                var urlPath = path.join(__dirname, text.text.woman);
                that.uploadFile(urlPath, "image").then(function (mdeia_id) {
                  reportMsg = msg.imgMsg(fromUser, toUser, mdeia_id);
                  that.msgSend(res, req, reportMsg, cryptoGraphy);
                });
                break;

              case "天气":
                that.getUserInfomation(fromUser).then(function (city) {
                  if (city) {
                    // 获取的城市名为中文，不能直接访问，得通过encode编码一下
                    var url = encodeURI(util.format(that.weather, city));
                    request(url, function (err, response, body) {
                      var obj = JSON.parse(body).data.forecast;
                      // 拼接字符串
                      var str = util.format(
                        text.text.weather.succeed,
                        JSON.parse(body).city,
                        obj[0].high,
                        obj[0].low,
                        obj[0].type,
                        obj[0].notice
                      );
                      console.log(str);
                      reportMsg = msg.txtMsg(fromUser, toUser, str);
                      console.log("得到天气信息");
                    });
                  } else {
                    reportMsg = msg.txtMsg(
                      fromUser,
                      toUser,
                      text.text.weather.err
                    );
                  }
                  that.msgSend(res, req, reportMsg, cryptoGraphy);
                });
                break;
              default:
                aiTencent.translate(result.Content).then(function (data) {
                  reportMsg = msg.txtMsg(fromUser, toUser, data.data.answer);
                  console.log(data.data.answer);
                  that.msgSend(res, req, reportMsg, cryptoGraphy);
                });

                break;
            }
          }
        }
      } else {
        //打印错误
        console.log(err);
      }
    });
  });
};

//由于promise方式嵌套，外部在里面的变量都会被杀掉，封装发送消息函数
WeChat.prototype.msgSend = function (res, req, reportMsg, cryptoGraphy) {
  //判断消息加解密方式，如果未加密则使用明文，对明文消息进行加密
  reportMsg =
    req.query.encrypt_type == "aes"
      ? cryptoGraphy.encryptMsg(reportMsg)
      : reportMsg;
  //返回给微信服务器
  res.send(reportMsg);
};
// 素材上传
WeChat.prototype.uploadFile = function (urlPath, type) {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.getAccessToken().then(function (data) {
      var form = {
        //构造表单
        media: fs.createReadStream(urlPath),
      };
      var url = util.format(that.apiURL.uploadFile, that.apiDomain, data, type);
      that.requestMeDia(url, form).then(function (result) {
        resolve(JSON.parse(result).media_id);
      });
    });
  });
};
// 封装一个post请求方法---专门用于得到临时素材
WeChat.prototype.requestMeDia = function (url, data) {
  return new Promise(function (resolve, reject) {
    request.post({ url: url, formData: data }, function (
      err,
      httpResponse,
      body
    ) {
      resolve(body);
    });
  });
};
// 获取用户信息
WeChat.prototype.getUserInfomation = function (openid) {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.getAccessToken().then(function (data) {
      var url = util.format(that.apiURL.username, that.apiDomain, data, openid);
      that.requestGet(url).then(function (result) {
        resolve(JSON.parse(result).city);
      });
    });
  });
};

/**
 * 自定义菜单查询接口
 */
WeChat.prototype.getCurrentMenu = function () {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.getAccessToken().then(function (data) {
      var url = util.format(
        that.apiURL.getCurrentSelfmenu,
        that.apiDomain,
        data
      );
      request.get(url, function (err, httpResponse, body) {
        resolve(body);
      });
    });
  });
};
/**
 * 自定义菜单创建接口
 */
WeChat.prototype.CreateMenu = function () {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.getAccessToken().then(function (data) {
      //格式化请求连接
      var url = util.format(that.apiURL.createMenu, that.apiDomain, data);
      //使用 Post 请求创建微信菜单
      that
        .requestPost(url, JSON.stringify(menus))
        .then(function (data) {
          //将结果打印
          console.log(data);
        });
    });
  });
};

//暴露可供外部访问的接口
module.exports = WeChat;
