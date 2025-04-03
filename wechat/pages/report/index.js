Component({
  // 需要启用页面组件模式
  options: {
    multipleSlots: true, // 可选，如果需要slot支持
    styleIsolation: 'shared' // 可选，样式隔离配置
  },
  attached: function () {
    // 1. 检查本地是否已有用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      })
    } else {
      // 未授权，显示引导界面（需配合页面 UI）
      wx.reLaunch({
        url: '/pages/login/login'
      });
    }
  },

  data: {
    userInfo: wx.getStorageSync('userInfo'),
    images: [], // 图片列表
    photoUrls: []
  },

  methods: {
    // 监听输入框变化
    onTagNumberInput(e) {
      this.setData({
        tagNumber: e.detail.value
      });
    },
    onstorageLocationInput(e) {
      this.setData({
        storageLocation: e.detail.value
      });
    },
    onqualityDescriptionInput(e) {
      this.setData({
        qualityDescription: e.detail.value
      });
    },
    // 扫码功能
    scanCode() {
      const that = this;
      wx.scanCode({
        onlyFromCamera: false, // 是否只能从相机扫码（false 表示可以从相册选择）
        success(res) {
          const scannedCode = res.result; // 获取扫码结果
          that.setData({
            tagNumber: scannedCode // 将扫码结果填充到输入框
          });
        },
        fail(err) {
          wx.showToast({
            title: '扫码失败，请重试',
            icon: 'none'
          });
        }
      });
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
    quit(){
      wx.clearStorageSync()
      wx.reLaunch({
        url: '/pages/record/index',
      })
    },
    async formSubmit(e) {
      const that = this;
      wx.showLoading({
        title: '提交中...',
        mask: true
      });
      try {
        // 基础表单验证
        if (!this.data.tagNumber) {
          return wx.showToast({
            title: '钢卷编号不能为空',
            icon: 'none'
          });
        }
        const photoUrl = await Promise.all(
          this.data.images.map(filePath =>
            that.uploadSingleImage(filePath)
            .then(url => ({
              url,
              description: '质量缺陷照片'
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
          photoUrls: photoUrl
        })
        // 2. 提交主数据
        await wx.request({
          url: 'https://zl-api.kyeo.top/api/steel-coils/add',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            tagNumber: this.data.tagNumber,
            qualityIssue: this.data.qualityDescription, // 根据实际表单控件修改
            storageLocation: this.data.storageLocation, // 根据实际表单控件修改
            createBy: this.data.userInfo.nickName, // 需替换真实用户信息
            photos: this.data.photoUrls
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
                /* 清空字段 */ });
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
        wx.hideLoading();
      }
    }
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 0
        });
      }
    }
  }
});