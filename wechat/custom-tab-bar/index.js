// custom-tab-bar/index.js
Component({
	data: {
		color: "#515151",
		selectedColor: "#DAA520",
		backgroundColor: "#ffffff",
		show: true,
		list: [{
				iconPath: "/assets/report-active.png",
				selectedIconPath: "/assets/report-active.png",
				pagePath: "/pages/report/index",
				text: "上报"
			},
			{
				iconPath: "/assets/recify-active.png",
				selectedIconPath: "/assets/recify-active.png",
				pagePath: "/pages/rectify/index",
				text: "整改"
			},
			{
				iconPath: "/assets/record-active.png",
				selectedIconPath: "/assets/record-active.png",
				pagePath: "/pages/record/index",
				text: "查询"
			}
		]
	},
	attached() {},
	methods: {
		switchTab(e) {
			const data = e.currentTarget.dataset
			const url = data.path
      wx.switchTab({url})
      this.setData({
        selected: data.index
      })
		}
	}
})