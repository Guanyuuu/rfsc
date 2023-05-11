const path = require("path")
const fs = require("fs")

function debounce(fn, wait) {
    let timer = null
    return function(...arg) {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
            fn(...arg)
            clearTimeout(timer)
        }, wait);
    }
}

function printTime() {
    let date = new Date()
    return `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`
}

function printLog(msg, color) {
    switch (color) {
        case "green":
            console.log("\u001b[32m%s\x1b[0m", `${printTime()}  ${msg}`)
            break;
        case "red":
            console.log("\u001b[31m%s\x1b[0m", `${printTime()}  ${msg}`)
            break;
        case "listen":
            console.log("\033[30;42m%s\033[0m", `${printTime()}  ${msg}`)
            break;
        default:
            console.log(`${printTime()}  ${msg}`)
    }
}

function readLocalFileStats() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "./stats.json")))
}

function writeLocalFileStats(data) {
    fs.writeFileSync(path.join(__dirname, "./stats.json"), JSON.stringify(data))
}

function accessStatsOfFile(p) {
    let fd = fs.openSync(p, "r+")
    let stat = fs.fstatSync(fd)
    fs.closeSync(fd)
    return stat
}

module.exports = {
    debounce,
    printTime,
    printLog,
    readLocalFileStats,
    writeLocalFileStats,
    accessStatsOfFile
}