const chalk = require('chalk');
const qs = require('qs');
const axios = require('axios');
const util = require('./util');
const config = require('./config');
axios.defaults.baseURL = "https://api.ai.qq.com/fcgi-bin/";
// 请求拦截器
axios.interceptors.request.use(req => {
  let dataObj = {
    ...req.data
  };
  dataObj["time_stamp"] = Date.parse(new Date()) / 1000;
  dataObj["app_id"] = Number(config.appid);
  dataObj["nonce_str"] = util.randomString();
  dataObj["sign"] = util.getReqSign(dataObj, config.appkey);
  req.data = qs.stringify(dataObj);
  return req;
}, err => {
  return Promise.reject(err);
});
// 响应拦截器
axios.interceptors.response.use(res => {
  let data = res.data;
  if (data.ret === 0) {
    console.log(chalk.green("请求成功"));
    return Promise.resolve(data);
  } else {
    console.log(chalk.red("请求出错:", data.msg, "错误代码:", data.ret, "代码定义:", "https://ai.qq.com/doc/returncode.shtml"));
    return Promise.reject(data);
  }
}, err => {
  return Promise.reject(err);
});

module.exports = axios;
