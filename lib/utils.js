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


module.exports = {
    debounce,
    printTime,
    printLog
}