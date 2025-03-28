Page({
  data: {
    detail: null
  },

  onLoad(options) {
    this.loadDetail(options.id);
  },

  // 加载详情数据
  async loadDetail(id) {
    wx.showLoading({
      title: '加载中'
    });
    try {
      const that = this
      await wx.request({
        url: `https://zl-api.kyeo.top/api/steel-coils/query?id=${id}`,
        method: 'GET',
        success(res) {
          if (res.data.data) {
            const detail_data = res.data.data[0]
            detail_data.createdAt = that.formatDate(detail_data.createdAt)
            if (detail_data.updatedAt){
              detail_data.updatedAt = that.formatDate(detail_data.updatedAt)
            }
            that.setData({
              detail: detail_data
            });
          }
        }
      });

    } catch (err) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
    wx.hideLoading();
  },

  // 图片预览
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    const urls = this.data.detail.photos.map(p => p.url);
    wx.previewImage({
      current: urls[index],
      urls: urls
    });
  },
  preview_Image(e) {
    const index = e.currentTarget.dataset.index;
    const urls = this.data.detail.repairedPhotos.map(p => p.url);
    wx.previewImage({
      current: urls[index],
      urls: urls
    });
  },

  // 日期格式化
  formatDate(isoString) {
    const date = new Date(isoString);

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '无效的日期';
    }
    const year = date.getFullYear();
    const month = this.padZero(date.getMonth() + 1); // getMonth() 返回0-11
    const day = this.padZero(date.getDate());
    const hours = this.padZero(date.getHours());
    const minutes = this.padZero(date.getMinutes());
    const seconds = this.padZero(date.getSeconds());

    // 返回格式化的日期字符串
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },
  // 补零函数
  padZero(num) {
    return num.toString().padStart(2, '0');
  }
});