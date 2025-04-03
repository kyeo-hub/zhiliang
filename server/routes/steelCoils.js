const express = require('express');
const router = express.Router();
const SteelCoil = require('../models/SteelCoil');
const { minioClient } = require('../utils/minio'); // 引入 MinIO 客户端

// const multer = require('multer');
const path = require('path');
const { isAdmin } = require('../middlewares/authMiddleware'); // 引入权限验证中间件
// const { uploadFile } = require('../utils/cos');
const { getPresignedPutUrl, getPresignedPostPolicy } = require('../utils/minio'); // 需自行实现
const mongoose = require('mongoose');


// 设置文件存储路径
// const storage = multer.diskStorage({
//   destination: './uploads/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// router.get('/sign-url', async (req, res) => {
//   try {
//     const fileName = req.query.name
//     const presignedUrl = await getPresignedPutUrl(fileName); 
//     res.json({ url: presignedUrl, fileName });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

router.get('/presigned-url', async (req, res) => {
  try {
    const fileName = req.query.name;
    // 改为调用PostPolicy版本
    const { url, fields } = await getPresignedPostPolicy(fileName);

    res.json({
      postEndpoint: url,  // 前端POST地址
      formData: fields,   // 包含policy/signature等认证字段
      objectKey: fileName // 保持文件名返回
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 添加钢卷记录
router.post('/add', async (req, res) => {
  try {
    const { tagNumber, qualityIssue, storageLocation, createBy, photos } = req.body;
    // const photoUrls = await Promise.all(
    //   req.files.map(async (file) => {
    //     const cloudPath = `${process.env.MINIO_PATH}/${file.filename}`;
    //     const url = await uploadFile(file.path, cloudPath,process.env.MINIO_BUCKET);
    //     return { url, description: '' }; // 可扩展为支持照片描述
    //   })
    // );

    const newRecord = new SteelCoil({
      tagNumber,
      qualityIssue,
      storageLocation,
      createBy,
      photos: photos
    });

    await newRecord.save();
    res.status(201).json({ message: '记录添加成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 查询钢卷记录，在steelCoils.js的GET /query路由中添加分页逻辑：
router.get('/query', async (req, res) => {
  try {
    const { 
      id,
      tagNumber, 
      startDate, 
      endDate, 
      isRepaired, 
      page = 1,      // 默认第一页
      pageSize = 10  // 每页数量
    } = req.query;

    const query = {}; // 构造查询条件
    if (id) {
      const isValidId = mongoose.Types.ObjectId.isValid(id);
      if (!isValidId) {
        return res.status(400).json({ error: "非法ID格式" });
      }else{
        query._id = id;
      }
    }

      
    if (tagNumber) query.tagNumber = tagNumber;
    if (startDate && endDate) {
      query.createdAt = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    if (isRepaired) query.isRepaired = isRepaired;

    // 分页参数处理
    const skip = (page - 1) * pageSize;
    const total = await SteelCoil.countDocuments(query); // 总记录数

    const records = await SteelCoil.find(query)
      .skip(skip)
      .limit(pageSize)
      .lean(); // 转换为普通对象

    res.status(200).json({
      data: records,
      total: total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新钢卷记录
router.post('/repair', async (req, res) => {
  // try {
  //   const { id, repairedLocation, repairedDescription, repairedPhotos, updateBy } = req.body
  //   const query = {}
  //   if (!id) {
  //     return res.status(400).json({ error: "缺少ID参数" });
  //   } else {
  //     const isValidId = mongoose.Types.ObjectId.isValid(id);
  //     if (!isValidId) {
  //       return res.status(400).json({ error: "非法ID格式" });
  //     } else {
  //       query._id = id
  //     }
  //   }
  //   await SteelCoil.findOneAndUpdate(query, { repairedLocation, repairedDescription, repairedPhotos, updateBy, isRepaired: true, updatedAt: new Date() }, { new: true });
  //   res.status(200).json({ message: '记录更新成功' })
  // } catch (err) {
  //   res.status(500).json({ error: err.message });
  // }
  try {
    const { id, repairedLocation, repairedDescription, repairedPhotos, updateBy } = req.body
    if (!id) return res.status(400).json({ error: "缺少ID参数" });

    const isValidId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidId) return res.status(400).json({ error: "非法ID格式" });

    const updateResult = await SteelCoil.findByIdAndUpdate(
      id,
      {
        $set: { // 明确使用$set操作符
          repairedLocation,
          repairedDescription,
          repairedPhotos,
          updateBy,
          isRepaired: true,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true } // 添加验证器
    );

    if (!updateResult) {
      return res.status(404).json({ error: "记录不存在" });
    }

    res.status(200).json({ message: '记录更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

})

// 删除钢卷记录
router.delete('/delete/:id', isAdmin, async (req, res) => {
  try {
      const id = req.params.id;
      const isValidId = mongoose.Types.ObjectId.isValid(id);
      if (!isValidId) {
          return res.status(400).json({ error: "非法 ID 格式" });
      }

      const record = await SteelCoil.findById(id);
      if (!record) {
          return res.status(404).json({ error: "记录不存在" });
      }

      // 删除 MinIO 中的图片
      const deletePromises = [];
      record.photos.forEach(photo => {
          const objectKey = path.basename(photo.url);
          deletePromises.push(new Promise((resolve, reject) => {
              minioClient.removeObject(process.env.MINIO_BUCKET, objectKey, (err) => {
                  if (err) {
                      console.error('删除 MinIO 图片失败:', err);
                      reject(err);
                  } else {
                      resolve();
                  }
              });
          }));
      });

      await Promise.all(deletePromises);

      // 删除数据库中的记录
      await SteelCoil.findByIdAndDelete(id);

      res.status(200).json({ message: '记录删除成功' });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

module.exports = router;