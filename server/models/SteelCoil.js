const mongoose = require('mongoose');

const steelCoilSchema = new mongoose.Schema({
  tagNumber: { type: String, required: true, unique: true }, // 标签号
  qualityIssue: { type: String, required: true },          // 质量问题描述
  storageLocation: { type: String, required: true },       // 入库库位
  photos: [{ url: String, description: String }],          // 照片信息
  createBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },            // 创建时间
  updatedAt: { type: Date, default: Date.now },             // 更新时间
  isRepaired: { type: Boolean, default: false },
  repairedLocation: { type: String },
  repairedDescription: { type: String },
  repairedPhotos: [{ url: String, description: String }],
  updateBy: { type: String },
});

module.exports = mongoose.model('SteelCoil', steelCoilSchema);