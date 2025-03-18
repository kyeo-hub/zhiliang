const Minio = require('minio');
require('dotenv').config();

// 初始化 MinIO 客户端
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT, // MinIO 服务地址（如 localhost 或域名）
  port: parseInt(process.env.MINIO_PORT, 10),                     // MinIO 端口（默认 9000）
  useSSL: process.env.MINIO_SSL === 'true',                  // 是否使用 SSL（如果启用了 HTTPS，则设置为 true）
  accessKey: process.env.MINIO_ACCESS_KEY,   // MinIO 访问密钥
  secretKey: process.env.MINIO_SECRET_KEY    // MinIO 密钥
});

async function uploadFile(filePath, cloudPath, bucketName) {
    return new Promise((resolve, reject) => {
      // 检查存储桶是否存在，如果不存在则创建
      minioClient.bucketExists(bucketName, (err, exists) => {
        if (err) return reject(err);
        if (!exists) {
          minioClient.makeBucket(bucketName, '', (err) => {
            if (err) return reject(err);
            console.log(`Bucket ${bucketName} created successfully.`);
          });
        }
      });
      
  
      // 上传文件到 MinIO
      minioClient.fPutObject(bucketName, cloudPath, filePath, (err, objInfo) => {
        if (err) return reject(err);
        const protocol = minioClient.protocol ? 'https' : 'http';
        let fileUrl;
        if (minioClient.protocol){
          fileUrl = `${protocol}://${minioClient.host}/${bucketName}/${cloudPath}`
        }else{
          fileUrl = `${protocol}://${minioClient.host}:${minioClient.port}/${bucketName}/${cloudPath}`
        }
        
        resolve(fileUrl); // 返回文件 URL
      });
    });
  }
  
  module.exports = { uploadFile };