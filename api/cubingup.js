const fs = require("fs")
const CubeData = require("./cube-data")

const Timer = {
    timeStamp: Date.now(),
    set() {
        this.timeStamp = Date.now()
    },
    tic() {
        console.log(Date.now() - this.timeStamp)
    },
    tac() {
        this.tic()
        this.set()
    }
}


const TOTAL_NODES = 1 * 2 * 3 * 4 * 5 * 6 * 7 * 8 * Math.pow(3, 8)
// console.log(TOTAL_NODES)
const ZIPPED_NODES = TOTAL_NODES / 3
// travesal all available nodes

const transers = (function () {
    const getTranser = function (maplet) {
        let _maplet = maplet
        return function (bytes) {
            let ret = new Uint8Array(bytes)
            for (let m of _maplet) {
                ret[m.dst] = bytes[m.src]
                ret[m.dst + 8] = (bytes[m.src + 8] + m.inc) % 3
            }
            return ret
        }
    }

    let lt = []
    let rt = []
    for (let maplet of CubeData.mapping) {
        let clw = maplet.map(x => { return { src: x[0], dst: x[1], inc: x[2] } })
        let acw = maplet.map(x => { return { src: x[1], dst: x[0], inc: (3 - x[2]) % 3 } })

        lt.push(getTranser(clw))
        rt.push(getTranser(acw))

    }
    return [...lt, ...rt]
}())


let known = new Uint16Array(TOTAL_NODES)
console.log(known[0])
const ways = transers.map((x, i) => 1 << i)
const seeked = ways.reduce((a, b) => a | b)

const levelDepth = 20 // force stop depth
let begin = last = Date.now()
let coded = 0


let ques = [[]]

let level = 0
ques[0].push(0)

while (ques[level].length) {
    const que_now = ques[level++]
    const que_next = []
    for (const nkcs of que_now) {
        if (known[nkcs] != seeked) {
            const kcs = CubeData.getBytes(nkcs)
            for (let i = 0; i < transers.length; i++) {
                if ((known[nkcs] & ways[i]) == 0) {
                    const ncs = transers[i](kcs)
                    const nncs = CubeData.getCode(ncs)
                    coded++
                    if (known[nncs] === 0) {
                        que_next.push(nncs)
                    }
                    known[nkcs] += ways[i]
                    known[nncs] += ways[(i + 6) % 12]
                }
            }
        }
    }
    ques.push(que_next)
    let now = Date.now()
    console.log("T:" + (now - last) + "ms", "Coded:" + coded)
    console.log("L:" + level, "Q:" + que_now.length, "N:" + que_next.length)
    if (level == levelDepth) {
        console.error("touch over depth")
        break
    }
}
known = null
console.log((Date.now() - begin) + "ms")


// leveled Que To transed Distribution

const distribution = new Uint8Array(ZIPPED_NODES)

function getZCode(code) {
    return (code % 40320) + Math.floor(code / 40320 / 3) * 40320
}

for (let level = 0; level < ques.length; level++) {
    const que = ques[level]
    const trans = level < 7 ? 7 : 14 - level
    for (const node of que) {
        distribution[getZCode(node)] = trans
    }
}


// r2s from que
const r2s = new Uint16Array(Math.pow(3, 7))
for (const que of ques){
    for (const code of que) {
        const r2 = Math.floor(code / 40320)
        const r2z = Math.floor(r2 / 3)
        if (!r2s[r2z]) {
            r2s[r2z] = r2
        }
    }
}
fs.writeFileSync(__dirname + '/r2s.data', r2s, "binary")
ques = null


//zipping
const nn = distribution.length / 8
const zipped = new Uint8Array(distribution.length / 8 * 3)
const bits = new Uint8Array([...Array(8).keys()].map(x => 1 << x))
let idx = 0
for (let i = 0; i < nn; i++) {
    const i2 = i + nn, i3 = i2 + nn
    for (let j = 0; j < 8; j++) {
        zipped[i] |= (distribution[idx] & 1) ? bits[j] : 0
        zipped[i2] |= (distribution[idx] & 2) ? bits[j] : 0
        zipped[i3] |= (distribution[idx] & 4) ? bits[j] : 0
        idx++
    }
}

fs.writeFileSync(__dirname + '/zipped.data', zipped, "binary")






