const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: './index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.png/,
                use: [
                    {
                        loader: require.resolve('url-loader'),
                        options: {
                            limit: 5000
                        }
                    },
                    {
                        loader: require.resolve('nokey-tinypng-web-loader') // 图片压缩的loader,一定是在url-loader之前执行的，顺序不能错
                    }
                ]
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        'css-loader',
                        'postcss-loader'
                    ]
                })
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin("index.css")
    ]
};