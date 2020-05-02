const http = require("./http");
/**
 * 
 *   'app_id'     => '10000',
    'time_stamp' => '1493449657',
    'nonce_str'  => '20e3408a79',
    'sign'       => 'sdfasdkljapsd245';
 */
exports.translate = function (text) {
  return new Promise(function (resolve,reject) {
    http
      .post("/nlp/nlp_textchat ", {
        question: text,
        session: "10000",
      })
      .then((result) => {
        resolve(result);
      })
  });
};
