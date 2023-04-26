const path = require("path");
// 开始寻找rfsc.config.json
function findRfscConfigjsonPath() {
    const fs = require("fs")
    let configPath = path.join(process.cwd(), "rfsc.config.json")
    if (fs.existsSync(configPath)) {
        return configPath
    } else {
        throw Error("缺少项目配置文件，请在node.js进程目录添加rfsc.config.json配置文件")
    }
}
// 处理config.json
const config = require(findRfscConfigjsonPath())

function handleWatchPathOfConfig(config) {
    const { watchDir } = config
    if (isAbsolutePath(watchDir)) {
        return {
            ...config,
            rootDir: getRootpath()
        }
    } else {
        return {
            ...config,
            watchDir: getAbsolute(watchDir),
            rootDir: getRootpath()
        }
    }
}



function isAbsolutePath(watchDir) {
    return path.isAbsolute(watchDir)
}

function getAbsolute(watchDir) {
    return path.join(getRootpath(), watchDir)
}

function getRootpath() {
    return process.cwd()
}

module.exports = handleWatchPathOfConfig(config)