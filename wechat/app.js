// app.js

App({
  onLaunch() {
    // 1. 检查本地是否已有用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      // 已授权，直接使用缓存信息
      this.globalData.userInfo = userInfo;
    } else {
      // 未授权，显示引导界面（需配合页面 UI）
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },
  
  globalData: {
    userInfo: null
  }
})