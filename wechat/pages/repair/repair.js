Page({
  data: {
    userInfo: null,
    detail: null,
    repairedLocation: '', // 修复后库位
    repairedDescription: '', // 修复描述
    images: [], // 已选图片临时路径
    isSubmitting: false, // 提交状态
    coilId: '', // 钢卷ID
    repairedPhotos: [] //修复图片
  },

  onLoad(options) {
    // 1. 检查本地是否已有用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      // 已授权，直接使用缓存信息
      this.data.userInfo = userInfo
    } else {
      // 未授权，显示引导界面（需配合页面 UI）
      wx.reLaunch({
        url: '/pages/login/login'
      });
    }
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
          if (res.data.data[0]) {
            const detail_data = res.data.data[0]
            detail_data.createdAt = that.formatDate(detail_data.createdAt)
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
  // 表单输入处理
  repairedLocationInput(e) {
    this.setData({
      repairedLocation: e.detail.value
    });
  },

  repairedDescriptionInput(e) {
    this.setData({
      repairedDescription: e.detail.value
    });
  },
  // 选择图片
  chooseImage() {
    const that = this;
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        that.setData({
          images: that.data.images.concat(res.tempFilePaths)
        });
      }
    });
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
    const urls = this.data.images.map(p => p);
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
  },
  // 上传图片到MinIO
  async uploadToMinIO(filePath, presignedData) {
    // 封装 wx.uploadFile 为 Promise
    await new Promise((resolve, reject) => {
      wx.uploadFile({
        url: presignedData.formData.postURL,
        filePath: filePath,
        name: 'file',
        formData: presignedData.formData.formData,
        success: (res) => {
          if (res) {
            resolve(); // ✅ 上传成功时 resolve
          } else {
            reject(new Error('上传失败')); // 根据实际情况处理 HTTP 错误码
          }
        },
        fail: (err) => {
          reject(err); // ✅ 失败时 reject
        }
      });
    });
    // 确保上传完成后返回 URL
    return `${presignedData.formData.postURL}/${presignedData.objectKey}`;
  },

  // 新增：上传单张图片到MinIO
  async uploadSingleImage(filePath) {
    try {
      // 将 wx.request 封装为 Promise
      const presignedData = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://zl-api.kyeo.top/api/steel-coils/presigned-url',
          method: "GET",
          data: {
            name: filePath.replace(/^.*\/([^\/]+)$/, '$1')
          },
          success: (res) => {
            resolve(res.data); // ✅ 将结果传给外层
          },
          fail: (err) => {
            reject(err); // ✅ 失败时 reject
          }
        });
      });
      // 等待上传完成并返回 URL
      const url = await this.uploadToMinIO(filePath, presignedData);
      return url;
    } catch (err) {
      wx.showToast({
        title: '图片上传失败',
        icon: 'none'
      });
      throw err; // 抛出错误以便外层捕获
    }
  },

  // 提交表单
  async formSubmit(e) {
    if (this.data.isSubmitting) return;
    const that = this;
    // 简单表单验证
    if (!this.data.repairedLocation.trim()) {
      return wx.showToast({
        title: '请填写修复后库位',
        icon: 'none'
      });
    }
    that.setData({
      isSubmitting: true
    });
    try {
      // 基础表单验证
      if (!this.data.detail._id) {
        return wx.showToast({
          title: '钢卷信息不存在',
          icon: 'none'
        });
      }
      const photoUrl = await Promise.all(
        this.data.images.map(filePath =>
          that.uploadSingleImage(filePath)
          .then(url => ({
            url,
            description: '钢卷修复照片'
          }))
          // 可选：添加 catch 防止单个失败导致整个 Promise.all 失败
          .catch(error => {
            console.error('单个图片上传失败:', error)
            return {
              url: null,
              description: '上传失败'
            } // 返回兜底数据
          })
        )
      );
      this.setData({
        repairedPhotos: photoUrl
      })

      // 2. 提交主数据
      await wx.request({
        url: 'https://zl-api.kyeo.top/api/steel-coils/repair',
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          id: this.data.detail._id,
          repairedDescription: this.data.repairedDescription, // 根据实际表单控件修改
          repairedLocation: this.data.repairedLocation, // 根据实际表单控件修改
          updateBy: this.data.userInfo.nickName, // 需替换真实用户信息
          repairedPhotos: this.data.repairedPhotos
        },
        success: (res) => {
          if (res.data.error) {
            wx.showToast({
              title: res.data.error,
              icon: 'none'
            });
          } else {
            wx.showToast({
              title: '提交成功'
            });
            // 清空表单
            this.setData({
              /* 清空字段 */
            });
          }
        },
        fail(err) {
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          });
        }
      });
    } catch (err) {
      console.error('提交失败', err);
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({
        isSubmitting: false
      });    
    }
  }
});