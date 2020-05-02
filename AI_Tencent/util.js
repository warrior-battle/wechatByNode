const md5 = require('md5');
// 获取签名
function getReqSign(params, appkey) {
  let sortParams = jsonSort(params);
  let str = "";
  for (const key in sortParams) {
    if (sortParams[key]) {
      str = str + key + "=" + encodeURI(sortParams[key]) + "&"
    }
  }
  str = str + "app_key=" + appkey;
  let sign = md5(str).toUpperCase();
  return sign;
}
// key升序
function jsonSort(jsonData) {
  try {
    let tempJsonObj = {};
    let sdic = Object.keys(jsonData).sort();
    sdic.map((item, index) => {
      tempJsonObj[item] = jsonData[sdic[index]]
    })
    return tempJsonObj;
  } catch (e) {
    return jsonData;
  }
}
// 随机字符串
function randomString(len = 32) {
  const $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
  let maxPos = $chars.length;
  let pwd = '';
  for (let i = 0; i < len; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));

  }
  return pwd;
}
module.exports = {
  getReqSign,
  randomString,
}
