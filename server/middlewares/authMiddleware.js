// server/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 验证用户是否为管理员
const isAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: '未提供令牌' });
    }
    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: '没有权限进行此操作' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: '无效的令牌' });
    }
};

module.exports = {
    isAdmin
};