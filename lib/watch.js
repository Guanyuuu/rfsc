const fs = require("fs")
const path = require("path")
const chokidar = require("chokidar")
const Monitor = require("./watcher")
const {
    printLog,
    readLocalFileStats,
    writeLocalFileStats,
    accessStatsOfFile
} = require("./utils")
const {
    watchDir,
    targetDir,
    ignoreFile
} = require("./sshconfig")

async function execWatch(__push) {
    // 当用户安装完成后，把监听的文件放入时需要进行初始化，
    // 经过的步骤就是，与目标服务器文件夹进行diff，没有的则直接创建写入，其实也可以不用进行diff，初始化直接将本地文件全部
    // 当初始化完成之后，开始监听文件，对变化的目标文件进行对应的更改
    printLog("初始化上传原始目录")
    if (isFile(watchDir)) {
        await initializationSingleFile(__push)
    } else {
        await initialization(__push);
    }
    console.log("\n");
    // 开始监听整个目录，一旦有文件变化则
    listenFolder(watchDir, __push)
}

function isFile(p) {
    return fs.statSync(p).isFile()
}

function initialization(__push) {
    return new Promise(async res => {
        let watchFiles = fs.readdirSync(watchDir)
        const fileStatsMap = readLocalFileStats()
        await workLoop(watchDir, targetDir, watchFiles, __push, fileStatsMap)
        writeLocalFileStats(fileStatsMap)
        res("commpleted")
    })
}

function initializationSingleFile(__push) {
    return new Promise(async res => {
        let [source, target] = getC1AndC2(Array.of(watchDir))
        await __push("add", target, source)
        res("completed")
    })
}

function getC1AndC2(p) {
    let target = []
    for (let item of p) {
        target.push(path.join(targetDir, path.basename(item)))
    }
    return [p, target]
}

function workLoop(currentWatchDir, currentTargetDir, currentFiles, __push, fileStatsMap) {
    return new Promise(async res => {
        for (let i = 0; i < currentFiles.length; i++) {
            let c1 = path.join(currentTargetDir, currentFiles[i])
            let c2 = path.join(currentWatchDir, currentFiles[i])
            let stat = accessStatsOfFile(c2)
            if (isAnIgnoredFile(c2)) continue
            if (!fileStatsMap.hasOwnProperty(c2) ||
                (fileStatsMap.hasOwnProperty(c2) && fileStatsMap[c2] !== stat.mtimeMs)
            ) {
                if (isDir(c2)) {
                    await __push("addDir", Array.of(c1), Array.of(c2))
                    let watchFiles = fs.readdirSync(c2)
                    await workLoop(c2, c1, watchFiles, __push, fileStatsMap)
                } else {
                    await __push("add", Array.of(c1), Array.of(c2))
                }
            }
            // 记录文件变与不变的stats
            fileStatsMap[c2] = stat.mtimeMs
        }
        res("completed")
    })
}

function listenFolder(watchDir, __push) {
    printLog("文件监听中...", "listen")
    console.log("\n")
    const watcher = chokidar.watch(watchDir, {
        persistent: true,
        ignoreInitial: true,
        ignored: (path) => {
            return isAnIgnoredFile(path)
        }
    });
    const monitor = new Monitor()
    watcher.on("add", async(p) => {
        setMapEventAndPath("add", p)
        entryUpdate()
    })
    watcher.on("addDir", async(p) => {
        setMapEventAndPath("addDir", p)
        entryUpdate()
    })
    watcher.on("change", async(p) => {
        setMapEventAndPath("change", p)
        entryUpdate()
    });

    watcher.on("unlink", async(p) => {
        setMapEventAndPath("unlink", p)
        entryUpdate()
    })
    watcher.on("unlinkDir", async(p) => {
        setMapEventAndPath("unlinkDir", p)
        entryUpdate()
    });

    function setMapEventAndPath(event, path) {
        monitor.events.set(event, monitor.events.has(event) ?
            Array.of(...monitor.events.get(event), path) : Array.of(path))
    }

    let timer = null

    function entryUpdate() {
        // 通过下一个宏任务来实现，接受全部的事件触发类型
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
            monitor.start(__push)
            monitor.clearEvents()
            clearTimeout(timer)
        }, 1000);
    }
}

/**
 * @description utils
 */

function isAnIgnoredFile(file) {
    for (let i = 0; i < ignoreFile.length; i++) {
        // 全部都使用正则进行匹配
        let normalizeFilepath = path.normalize(file)
        if (new RegExp(ignoreFile[i], "g").test(normalizeFilepath)) return true
    }
    return false
}


function isDir(filepath) {
    try {
        let read = fs.statSync(filepath)
        return read.isDirectory()
    } catch (e) {
        console.log("监听文件路径有误：", e)
    }
}

module.exports = execWatch