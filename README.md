# nokey-tinypng-webpack-loader
运用tinypng的能力，模拟浏览器的上传和下载功能对本地图片进行压缩处理，需要配合url-loader进行处理

# Install
```
$ npm i nokey-tinypng-webpack-loader --save-dev
或者
$ yarn add nokey-tinypng-webpack-loader -D
```
# Use
本loader主要是在url-loader之前对图片资源进行压缩优化的解决方案，所以配合url-loader使用能达到最佳效果