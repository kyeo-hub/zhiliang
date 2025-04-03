const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const steelCoilsRoute = require('./routes/steelCoils');
const auth = require('./routes/auth');


require('dotenv').config(); // 加载环境变量

const app = express();

// 连接 MongoDB
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const mongoURI = `mongodb://${process.env.MONGO_USER}:${password}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=${process.env.MONGO_AUTH_SOURCE}`;
mongoose.connect(mongoURI).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 路由
app.use('/api/steel-coils', steelCoilsRoute);
app.use('/api/auth', auth);


// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});