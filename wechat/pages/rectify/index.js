Component({
  data: {
    steelList: [], // 完整数据
    filteredList: [], // 筛选后数据
    searchKey: '', // 搜索关键词
    loading: false
  },
  attached: function () {
    this.refresh(); // 刷新数据
  },
  methods: {
    refresh() {
      this.loadData(); // 刷新数据
    },

    // 加载数据
    async loadData() {
      this.setData({
        loading: true
      });
      try {
        const res = await new Promise((resolve, reject) => {
          wx.request({
            url: 'https://zl-api.kyeo.top/api/steel-coils/query?isRepaired=false',
            method: 'GET',
            success: resolve,
            fail: reject
          });
        });

        res.data.data.forEach(item => {
          item.createdAt = this.formatDate(item.createdAt);
          item.repairedInfo = item.isRepaired ? '已修复' : '未整改';
        });

        this.setData({
          steelList: res.data.data,
          filteredList: res.data.data
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

    // 搜索输入
    onSearchInput(e) {
      this.setData({
        searchKey: e.detail.value
      });
      this.filterList();
    },

    // 执行筛选
    filterList() {
      const keyword = this.data.searchKey.trim().toLowerCase();
      const filtered = this.data.steelList.filter(item =>
        item.tagNumber.toLowerCase().includes(keyword)
      );
      this.setData({
        filteredList: filtered
      });
    },

    // 格式化日期
    formatDate(isoString) {
      const date = new Date(isoString);
      return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
    },

    // 跳转详情
    navigateToDetail(e) {
      const id = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `/pages/repair/repair?id=${id}`
      });
    }
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' &&
        this.getTabBar()) {
        this.getTabBar().setData({
          selected: 1
        })
      }
    }
  }
})