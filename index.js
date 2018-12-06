
const loaderUtils = require('loader-utils');
const rp = require('request-promise');
const fs = require('fs')
const crypto = require('crypto');
const chalk = require('chalk');
const cacheFileName = '.tiny.cache.json';

const basePath = process.cwd();

// TODO 图片数量较大时候该如何处理(每次最多只能20张图片)(就是连续请求20次以后就会报错)

module.exports = function (content) {
    this.cacheable && this.cacheable();
    const callback = this.async();
    const options = loaderUtils.getOptions(this) || {};
    const CACHE_FILE = options.cacheFileName || cacheFileName;

    // 缓存标识文件就只需要读取一次 
    !tc.flag && tc.setCacheData(CACHE_FILE);

    // 用来做缓存hash的key
    const resourceRelativePath = this.resourcePath.split(basePath)[1];

    // 生成当前的hash
    const curHash = crypto.createHash('md5').update(content).digest('hex');
    // 获取缓存的hash
    const cacheHash = tc.getCacheHash(resourceRelativePath);
    if (curHash === cacheHash) {
        console.log(chalk.green(`[tiny]: ${resourceRelativePath} from disk cache`))
        callback(null, content);
        return;
    }

    // 看是否已经压缩过，压缩过的话 从缓存里去，就不走上传和下载了
    const compressItem = tc.getCompressItem(resourceRelativePath)
    if(compressItem) {
        callback(null, compressItem);
        return;
    }

    uploadImageToTiny(content).then(res => {
        const uploadRes = JSON.parse(res);
        if(!uploadRes.input || !uploadRes.output || !uploadRes.output.url) {
            throw new Error('upload image fail!');
        }
        console.log(chalk.green(`[tiny][${resourceRelativePath}]: ${createLogInfo(uploadRes)}`));
        return downloadImageFromTiny(uploadRes.output.url);
    }).then(dres => {
        // 覆盖原文件
        reWriteImageFile(this.resourcePath, dres);
        const tempBuf = new Buffer(dres);
        // 缓存hash
        const newHash = crypto.createHash('md5').update(tempBuf).digest('hex');
        tc.updateCache(resourceRelativePath, newHash).updateCompress(resourceRelativePath, tempBuf);
        callback(null, tempBuf);
        return;
    }).catch(e => {
        // 上传失败
        this.emitError(e);
        this.emitError(`${this.resourcePath} || 压缩失败~`);
        // 上传失败不做任何处理 直接返回centent
        callback(null, content);
    });


}

module.exports.raw = true;

class TinyController {
    constructor() {
        this.flag = false;
        this.cache = {};
        this.COMPRESSED = {}; // 用于缓存已经上传过的图片，发现loader会被执行两遍，暂时没找到原因
    }

    setCacheData(file) {
        this.cacheFile = `${basePath}/${file}`;
        try {
            this.flag = true;
            const data = fs.readFileSync(this.cacheFile, 'utf-8');
            if (data) {
                this.cache = JSON.parse(data);
            }
        } catch (e) {
            // 读取文件出错 不做任何处理，就当没有缓存
            if (e.errno !== -2) {
                console.warn(chalk.yellow(e.message + '\n'));
            }
        }
        return this;
    }

    getCacheHash(key) {
        return this.cache[key];
    }

    updateCache(key, value) {
        this.cache[key] = value;
        // 缓存以后直接重写json文件
        this.outputCacheToFile();
        return this;
    }

    getCompressItem(key) {
        return this.COMPRESSED[key];
    }

    updateCompress(key, value) {
        this.COMPRESSED[key] = value;
        return this;
    }

    outputCacheToFile() {
        try {
            fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache));
        } catch (e) {
            throw e;
        }
    }
}
const tc = new TinyController();
/**
 * upload pic
 * @param {Buffer} content 
 */
function uploadImageToTiny(content) {
    return rp({
        url: 'https://tinypng.com/web/shrink',
        method: 'post',
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Connection': 'keep-alive',
            'Host': 'tinypng.com',
            'DNT': 1,
            'Referer': 'https://tinypng.com/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36'
        },
        body: content
    });
}

/**
 * download pic
 * @param {String} downLoadUrl 
 */
function downloadImageFromTiny(downLoadUrl) {
    return rp({
        url: downLoadUrl,
        encoding: null
    });
}

function createLogInfo(info) {
    const ratio = Math.ceil((1 - info.output.ratio) * 100);
    return `${info.input.size}B -> ${info.output.size}B [-${ratio}%]`;
}

function reWriteImageFile(path, stream) {
    try {
        const file = fs.createWriteStream(path);
        file.write(stream);
        file.end();
    } catch (e) {
        throw e;
    }
}