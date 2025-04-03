// wechat/utils/request.js
function request(options) {
  const token = wx.getStorageSync('userInfo').token;
  if (token) {
      options.header = options.header || {};
      options.header['Authorization'] = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
      wx.request({
          ...options,
          success: (res) => {
            console.log(res)
              if (res.data.error === '无效的令牌') {
                  // 清除本地存储的 token 和 role
                  wx.removeStorageSync('userInfo');
                  // 跳转到登录页面
                  wx.reLaunch({
                      url: '/pages/login/login'
                  });
                  reject(new Error('Token 已过期，请重新登录'));
              } else {
                  resolve(res.data);
              }
          },
          fail: (err) => {
            console.log(err)
              reject(err);
          }
      });
  });
}

module.exports = {
  request
};