const req = require('../../utils/req.js')
Component({
  data: {
    resetButtonVisible: false, // 控制重置按钮显示（可选）
    steelList: [], // 完整数据
    total: 0, // 总记录数
    page: 1, // 当前页码
    pageSize: 10, // 每页数量
    pageTotal: 0,
    searchKey: '', // 搜索关键词
    filterPanelVisible: false,
    selectedStatus: '',
    startDate: '',
    endDate: '',
    isRepaired: null,
    loading: false
  },
  attached: function () {
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({
      userInfo: userInfo
    })
    this.loadData();
  },
  methods: {

    // 加载数据
    async loadData() {
      this.setData({
        loading: true
      });
      // 在 loadData 中过滤掉值为 undefined 或 "undefined" 的参数
      const buildQueryParams = () => {
        const params = {
          tagNumber: this.data.searchKey,
          startDate: this.data.startDate,
          endDate: this.data.endDate,
          isRepaired: this.data.isRepaired, // 传递 null 或空字符串
          page: this.data.page,
          pageSize: this.data.pageSize
        };

        // 过滤空值和无效参数
        Object.keys(params).forEach(key => {
          if (
            params[key] === undefined ||
            params[key] === null ||
            params[key] === ''
          ) {
            delete params[key];
          }
        });
        return params;
      };
      const params = buildQueryParams()
      try {
        const res = await new Promise((resolve, reject) => {
          wx.request({
            url: 'https://zl-api.kyeo.top/api/steel-coils/query',
            method: 'GET',
            data: params,
            success: resolve,
            fail: reject
          });
        });
        res.data.data.forEach(item => {
          item.createdAt = this.formatDate(item.createdAt);
        });
        const {
          data,
          total,
          pageSize
        } = res.data;
        const totalpage = Math.ceil(parseInt(total) / parseInt(pageSize))
        this.setData({
          steelList: data,
          total: total,
          pageTotal: totalpage
        });

      } catch (err) {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.setData({
          loading: false
        });
      }
    },
    // // 添加分页控件方法（如上拉加载更多）
    // onLoadMore() {
    //   const newPage = this.data.page + 1;
    //   this.setData({
    //     page: newPage
    //   }, () => this.loadData());
    // },

    // 搜索输入
    onSearchInput(e) {
      this.setData({
        searchKey: e.detail.value
      });
    },
    resetFilters() {
      this.setData({
        selectedStatus: '', // 重置状态选择
        startDate: '', // 重置开始日期
        endDate: '', // 重置结束日期
        searchKey: '', // 重置搜索关键词（可选）
        page: 1, // 重置到第一页
        isRepaired: null // 重置isRepaired参数
      });
    },


    // 新增方法：
    toggleFilterPanel() {
      this.setData({
        filterPanelVisible: !this.data.filterPanelVisible
      });
    },

    onStatusChange(e) {
      const status = ['全部', '未整改', '已修复'][e.detail.value];
      this.setData({
        selectedStatus: status
      });
    },

    onStartDateChange(e) {
      this.setData({
        startDate: e.detail.value
      });
    },

    onEndDateChange(e) {
      this.setData({
        endDate: e.detail.value
      });
    },

    applyFilters() {
      const {
        selectedStatus,
        startDate,
        endDate
      } = this.data;
      this.setData({
        searchKey: '',
        isRepaired: selectedStatus === '未整改' ? false : (selectedStatus === '已修复' ? true : null), // 这里可能需要调整
        startDate: startDate || '', // 改为空字符串而非 undefined
        endDate: endDate || '', // 改为空字符串而非 undefined
        page: 1,
        filterPanelVisible: false
      }, () => this.loadData());
    },

    prevPage() {
      const newPage = Math.max(1, this.data.page - 1);
      this.setData({
        page: newPage
      }, () => this.loadData());
    },

    nextPage() {
      const newPage = this.data.page + 1;
      this.setData({
        page: newPage
      }, () => this.loadData());
    },

    // 格式化日期
    formatDate(isoString) {
      const date = new Date(isoString);
      return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
    },

    // 跳转详情
    navigateToDetail(e) {
      const id = e.currentTarget.dataset.id;
      // console.log(tagNumber)
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
    },
    // 删除记录
    deleteRecord(e) {
      const id = e.currentTarget.dataset.id;
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条记录吗？',
        success: (res) => {
          if (res.confirm) {
            req.request({
              url: `https://zl-api.kyeo.top/api/steel-coils/delete/${id}`,
              method: 'DELETE'
            }).then((res) => {
              if (res.error) {
                wx.showToast({
                  title: res.error,
                  icon: 'none'
                });
              } else {
                wx.showToast({
                  title: '删除成功'
                });
                this.loadData(); // 重新加载记录
              }
            }).catch((err) => {
              wx.showToast({
                title: err.message,
                icon: 'none'
              });
            })
          }
        }
      });
    }
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' &&
        this.getTabBar()) {
        this.getTabBar().setData({
          selected: 2
        })
      }
    }
  }
})