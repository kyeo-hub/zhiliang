// server/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 从环境变量中读取管理员用户列表
const adminUsers = process.env.ADMIN_USERS.split(',');
// 登录接口
router.post('/login', (req, res) => {
  const { nickName } = req.body;
  if (nickName === undefined) {
    return res.status(400).json({ error: '请提供用户名' });
  } else {
    // 判断用户是否为管理员
    const isAdmin = adminUsers.includes(nickName);
    const role = isAdmin ? 'admin' : 'user';

    // 生成 token
    const token = jwt.sign({ nickName, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role });
  }

});

module.exports = router;