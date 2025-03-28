// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    motto: '本程序只服务于记录武钢物流外贸码头的钢卷质量信息，会获取记录上传人的微信头像和昵称用于记录上传人信息，不会记录其他与此无关的信息，如果对此有异议可以选择取消，程序会删除您的用户名和头像缓存。',
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },
  bindViewTap() {
    if (this.data.hasUserInfo) {
      wx.setStorageSync('userInfo', this.data.userInfo)
      wx.switchTab({
        url: "/pages/report/index"
      })
    } else {
      wx.showToast({
        title: '未登录！',
        icon: 'none'
      });
    }
  },
  bindCancelTap() {
    this.setData({
      userInfo: {
        avatarUrl: defaultAvatarUrl,
        nickName: ''
      }
    })
    wx.showToast({
      title: '取消登录！',
      icon: 'none'
    });
    wx.switchTab({
      url: '/pages/record/index',
    })

  },
  onChooseAvatar(e) {
    const {
      avatarUrl
    } = e.detail
    const {
      nickName
    } = this.data.userInfo
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  onInputChange(e) {
    const nickName = e.detail.value
    const {
      avatarUrl
    } = this.data.userInfo
    this.setData({
      "userInfo.nickName": nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
})