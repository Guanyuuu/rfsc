const path = require("path")
const { watchDir, targetDir } = require("./sshconfig")
const { printLog } = require("./utils")


const Monitor = function() {
    function MonitorFile() {
        this.events = new Map()
        this.typeUpdate = null
    }

    const prototype = MonitorFile.prototype

    prototype.add = async function(__push) {
        let { source, target } = this.typeUpdate
        await __push("add", target, source)
        this.allLog()
    }
    prototype.addDir = async function(__push) {
        let { source, target } = this.typeUpdate
        await __push("addDir", target, source)
        this.allLog()
    }
    prototype.rename = async function(__push) {
        let { source, target } = this.typeUpdate
        await __push("rename", target, source)
        this.allLog()
    }
    prototype.unlink = async function(__push) {
        let { source, target } = this.typeUpdate
        await __push("unlink", target, source)
        this.allLog()
    }
    prototype.unlinkDir = async function(__push) {
        let { source, target } = this.typeUpdate
        await __push("unlinkDir", target, source)
        this.allLog()
    }
    prototype.change = async function(__push) {
        let { source, target } = this.typeUpdate
        await __push("change", target, source)
        this.allLog()
    }
    prototype.allLog = function() {
        printLog("文件监听中...", "listen")
        console.log("\n")
    }
    prototype.start = function(__push) {
        this.typeUpdate = this.getEventsType()
        this[this.typeUpdate.typeName](__push)
    }
    prototype.getEventsType = function() {
        const events = this.events
        let typeUpdate
        if (
            events.size === 1 &&
            events.has("unlink")
        ) {
            // 删除文件的情况
            let [source, target] = getC1AndC2(events.get("unlink"))
            typeUpdate = creatTypeUpdateInstance("unlink", source, target)
        } else if (!events.has("add") &&
            !events.has("addDir") &&
            events.has("unlinkDir")
        ) {
            // 删除文件夹的情况
            let [source, target] = getC1AndC2(events.get("unlinkDir"))
            typeUpdate = creatTypeUpdateInstance("unlinkDir", source, target)
        } else if (
            events.size === 1 &&
            events.has("add")
        ) {
            // 增加文件的情况
            let [source, target] = getC1AndC2(events.get("add"))
            typeUpdate = creatTypeUpdateInstance("add", source, target)
        } else if (
            events.size === 1 &&
            events.has("addDir")
        ) {
            // 增加单个空的文件夹
            let [source, target] = getC1AndC2(events.get("addDir"))
            typeUpdate = creatTypeUpdateInstance("addDir", source, target)
        } else if (
            events.size === 1 &&
            events.has("change")
        ) {
            // 文件的内容进行修改
            let [source, target] = getC1AndC2(events.get("change"))
            typeUpdate = creatTypeUpdateInstance("change", source, target)
        } else if (
            events.size === 2 &&
            events.has("add") &&
            events.has("unlink")
        ) {
            // 重命名文件情况
            let [_, targetUnlink] = getC1AndC2(events.get("unlink"))
            let [__, targetAdd] = getC1AndC2(events.get("add"))
            typeUpdate = creatTypeUpdateInstance("rename", targetUnlink, targetAdd)
        } else {
            // 重命名文件夹情况
            let [_, targetUnlinkDir] = getC1AndC2(events.get("unlinkDir"))
            let [__, targetAddDir] = getC1AndC2(events.get("addDir"))
            typeUpdate = creatTypeUpdateInstance("rename", targetUnlinkDir, targetAddDir)
        }
        return typeUpdate
    }
    prototype.clearEvents = function() {
        this.events = new Map()
    }

    return MonitorFile
}()



function creatTypeUpdateInstance(typeName, source, target) {
    let o = Object.create(null)
    o.typeName = typeName
    o.source = source
    o.target = target
    return o
}

function getC1AndC2(p) {
    let target = []
    for (let item of p) {
        if (isFile(watchDir)) {
            // 监听单个文件的
            target.push(path.join(targetDir, path.basename(item)))
        } else {
            target.push(path.join(targetDir, item.slice(watchDir.length)))
        }
    }
    return [p, target]
}

function isFile(p) {
    const fs = require("fs")
    return fs.statSync(p).isFile()
}


module.exports = Monitor