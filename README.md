# nokey-tinypng-webpack-loader
运用tinypng的能力，模拟浏览器的上传和下载功能对本地图片进行压缩处理，需要配合url-loader进行处理

# Install
```
$ npm i nokey-tinypng-webpack-loader --save-dev
或者
$ yarn add nokey-tinypng-webpack-loader -D
```
# Usage
本loader主要是在url-loader之前对图片资源进行压缩优化的解决方案，所以配合url-loader使用能达到最佳效果
```javascript
const nokey_tinypng_loader = require.resolve('nokey-tinypng-loader');
const url_loader = require.resolve('url-loader');
// ... other conf
module: {
    rules: [
        {
            test: [/\.jpe?g$/, /\.png$/],
            use: [
                {
                    loader: url_loader,
                    options: {
                        limit: 1000
                    }
                },
                {
                    loader: nokey_tinypng_loader,
                    option: {
                        cacheFileName: '.tiny.cache.json'
                    }
                }
            ]
        }
    ]
}
```

# Options
### cacheFileName
type: `String`   
Default: `.tiny.cache.json`   

用于缓存已压缩过的文件的Map文件(会在项目根目录下生成该文件，建议将该文件与项目代码一起提交)