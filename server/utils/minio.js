const Minio = require('minio');
require('dotenv').config();


// 初始化MinIO客户端
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT, // 例如 'play.min.io'
    port: parseInt(process.env.MINIO_PORT, 10),
    useSSL: process.env.MINIO_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

// 生成预签名PUT URL
// exports.getPresignedPutUrl = async (fileName, expiry = 7 * 60) => { // 默认7分钟
//     return new Promise((resolve, reject) => {
//         minioClient.presignedPutObject(
//             process.env.MINIO_BUCKET,  // 存储桶名称
//             fileName,                  // 对象路径
//             expiry,                    // 有效期（秒）
//             (err, presignedUrl) => {
//                 if (err) return reject(err);
//                 resolve(presignedUrl);
//             }
//         );
//     });
// };
// 生成预签名POST策略（更安全可控的上传方式）
exports.getPresignedPostPolicy = async (fileName, expiry = 7 * 60) => {
    const policy = new Minio.PostPolicy()
    
    // 设置策略参数
    policy.setBucket(process.env.MINIO_BUCKET)
    policy.setKey(fileName)
    policy.setExpires(new Date(Date.now() + expiry * 1000))
    
    // 可选：添加上传限制条件
    policy.setContentType('image/*') // 限制文件类型
    policy.setContentLengthRange(1024, 10485760) // 限制文件大小（1KB~10MB）

    return new Promise((resolve, reject) => {
        minioClient.presignedPostPolicy(
            policy,
            (err, presignedData) => {
                if (err) return reject(err)
                resolve({
                    url: `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${process.env.MINIO_BUCKET}`,
                    fields: presignedData
                })
            }
        )
    })
};


// 可选：初始化存储桶（首次运行时创建）
const initBucket = async () => {
    const bucketExists = await minioClient.bucketExists(process.env.MINIO_BUCKET)
    if (!bucketExists) {
        await minioClient.makeBucket(process.env.MINIO_BUCKET, '', (err) => {
            if (err) return reject(err);
            console.log(`Bucket ${bucketName} created successfully.`);
        });
    }
};

initBucket().catch(console.error);