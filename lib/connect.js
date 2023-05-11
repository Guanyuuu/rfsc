const { Client } = require("ssh2")
const fs = require("fs")
const execWatch = require("./watch")
const {
    targetDir,
    connectConfig
} = require("./sshconfig")
const {
    printLog,
    readLocalFileStats,
    writeLocalFileStats
} = require("./utils")
const conn = new Client()


function connect() {
    try {
        printLog("正在连接远程服务器...")
        conn.on("ready", async() => {
            printLog("Client ready !!!", "green");
            printLog("文件远程初始化项目目录")
            await initTargetDir(targetDir)
            printLog("文件远程初始化项目目录完成", "green")
            await execWatch(pushfilesToTheSpecifiedServer)
        }).connect(connectConfig)
        conn.on("error", (err) => {
            console.log("\n")
            printLog("连接失败，请恢复文件的修改", "red")
            throw err
        })
    } catch (e) {
        console.log(e)
    }
}

function pushfilesToTheSpecifiedServer(type, targetPaths, filePaths) {
    return new Promise(res => {
        // 推送文件到远程服务器
        if (type === "add" || type === "change") {
            addAndChangeEvent(res, targetPaths, filePaths)
        } else if (type === "addDir") {
            addDirEvent(res, targetPaths)
        } else if (type === "unlink") {
            unlinkEvent(res, targetPaths, filePaths)
        } else if (type === "unlinkDir") {
            unlinkDirEvent(res, targetPaths)
        } else if (type === "rename") {
            renameEvent(res, targetPaths, filePaths)
        }
    })
}

async function addAndChangeEvent(res, targetPaths, filePaths) {
    let i = 0
    for (let targetPath of targetPaths) {
        printLog(`开始推送文件${filePaths[i]} 到 ${targetPath}`)
        await new Promise(async(resolve) => {
            conn.sftp(async(err, sftp) => {
                if (err) {
                    console.log("addAndChangeEvent is incorrect")
                    throw err
                }
                let wirtableStream = sftp.createWriteStream(targetPath);
                // 这里是要读取本地的文件流，所以不能使用sftp来操作可以使用fs模块
                let readableStream = fs.createReadStream(filePaths[i])
                readableStream.pipe(wirtableStream)
                wirtableStream.on("close", function() {
                    printLog("文件推送成功", "green")
                    console.log("\n");
                    // 需要进行正确的关闭
                    sftp.end()
                    resolve("sucess")
                    i++
                })
            })
        })
    }
    // 结束之后的
    res()
}

async function addDirEvent(res, targetPaths) {
    for (let targetPath of targetPaths) {
        await initTargetDir(targetPath)
        printLog(`创建文件夹成功:${targetPath}`, "green")
        console.log("\n")
    }
    res()
}

async function unlinkEvent(res, targetPaths, filePaths) {
    let i = 0
    for (let targetPath of targetPaths) {
        await new Promise((resolve) => {
            conn.sftp((err, sftp) => {
                if (err) {
                    console.log("unlinkEvent is incorrect")
                    throw err
                }
                sftp.unlink(targetPath, (err) => {
                    if (err) throw err
                    printLog(`文件成功删除:${targetPath}`, "green")
                    console.log("\n")
                    removeLocalFileStat(filePaths[i])
                    resolve("sucess")
                    i++
                    sftp.end()
                })
            })
        })
    }
    res()
}

async function unlinkDirEvent(res, targetPaths) {
    for (let targetPath of targetPaths) {
        await new Promise((resolve) => {
            conn.sftp((err, sftp) => {
                sftp.rmdir(targetPath, (err) => {
                    if (err) {
                        console.log("unlinkDirEvent is incorrect")
                        throw err
                    }
                    printLog(`文件夹成功删除:${targetPath}`, "green")
                    console.log("\n")
                    resolve("sucess")
                    sftp.end()
                })
            })
        })
    }
    res()
}

async function renameEvent(res, targetPaths, filePaths) {
    conn.sftp((err, sftp) => {
        if (err) {
            console.log("unlinkEvent is incorrect")
            throw err
        }
        sftp.rename(filePaths[0], targetPaths[0], (err) => {
            if (err) throw err
            printLog(`重命名文件成功: 由${filePaths[0]}重命名为${targetPaths[0]}`, "green")
            console.log("\n")
            sftp.end()
            res()
        })
    })
}

function initTargetDir(dir) {
    // 如果服务器上没有需要存储的文件夹，则进行初始化创建
    return new Promise((res) => {
        conn.sftp((err, sftp) => {
            if (err) throw err
            sftp.readdir(dir, (err) => {
                if (err) {
                    sftp.mkdir(dir, () => {
                        res()
                        sftp.end()
                    })
                } else {
                    res()
                    sftp.end()
                }
            })
        })
    })
}

function removeLocalFileStat(p) {
    let fileStats = readLocalFileStats()
    console.log(fileStats)
    p = p.replace(/\\/g, "\\\\")
    console.log(p === 'D:\\桌面\\code\\dir\\g\\g.js')
    delete fileStats[p]
    console.log(fileStats)
    writeLocalFileStats(fileStats)
}

module.exports = connect