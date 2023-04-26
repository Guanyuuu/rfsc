const { Client } = require("ssh2")
const fs = require("fs")
const execWatch = require("./watch")
const {
    targetDir,
    connectConfig
} = require("./sshconfig")
const { printLog } = require("./utils")
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
    } catch (e) {
        console.log(e)
    }
}

function pushfilesToTheSpecifiedServer(type, targetPaths, filePaths) {
    return new Promise(res => {
        // 推送文件到远程服务器
        conn.sftp(async(err, sftp) => {
            if (err) throw err
            try {
                // 远程增加文件
                if (type === "add" || type === "change") {
                    addAndChangeEvent(sftp, res, targetPaths, filePaths)
                } else if (type === "addDir") {
                    addDirEvent(sftp, res, targetPaths)
                } else if (type === "unlink") {
                    unlinkEvent(sftp, res, targetPaths)
                } else if (type === "unlinkDir") {
                    unlinkDirEvent(sftp, res, targetPaths)
                } else if (type === "rename") {
                    renameEvent(sftp, res, targetPaths, filePaths)
                }
            } catch (e) {
                console.log("文件推送失败：", e)
            }
        })
    })
}

async function addAndChangeEvent(sftp, res, targetPaths, filePaths) {
    let i = 0
    for (let targetPath of targetPaths) {
        printLog(`开始推送文件${filePaths[i]} 到 ${targetPath}`)
        const readData = fs.readFileSync(filePaths[i], { encoding: "utf-8" })
        await new Promise((resolve) => {
            sftp.writeFile(targetPath, readData, { encoding: "utf-8" }, (err) => {
                if (err) {
                    printLog("远程写入文件出错")
                    throw err
                }
                printLog("文件推送成功", "green")
                console.log("\n")
                resolve("sucess")
                i++
            })
        })
    }
    sftp.end()
    res()
}

async function addDirEvent(sftp, res, targetPaths) {
    for (let targetPath of targetPaths) {
        await initTargetDir(targetPath)
        printLog(`创建文件夹成功:${targetPath}`, "green")
        console.log("\n")
    }
    sftp.end()
    res()
}

async function unlinkEvent(sftp, res, targetPaths) {
    for (let targetPath of targetPaths) {
        await new Promise((resolve) => {
            sftp.unlink(targetPath, (err) => {
                if (err) throw err
                printLog(`文件成功删除:${targetPath}`, "green")
                console.log("\n")
                resolve("sucess")
            })
        })
    }
    sftp.end()
    res()
}

async function unlinkDirEvent(sftp, res, targetPaths) {
    for (let targetPath of targetPaths) {
        await new Promise((resolve) => {
            sftp.rmdir(targetPath, (err) => {
                if (err) throw err
                printLog(`文件夹成功删除:${targetPath}`, "green")
                console.log("\n")
                resolve("sucess")
            })
        })
    }
    sftp.end()
    res()
}

async function renameEvent(sftp, res, targetPaths, filePaths) {
    sftp.rename(filePaths[0], targetPaths[0], (err) => {
        if (err) throw err
        printLog(`重命名文件成功: 由${filePaths[0]}重命名为${targetPaths[0]}`, "green")
        console.log("\n")
        sftp.end()
        res()
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
                    sftp.end
                }
            })
        })
    })
}


module.exports = connect