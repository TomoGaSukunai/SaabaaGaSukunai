const fs = require("fs")
const CubeData = require('./cube-data')

function getR2(code){
    return Math.floor(code / 40320)
}

function getZCode(code){
    return (code % 40320) + Math.floor(code / 40320 / 3) * 40320
}

function travesalFullfill(array, levelDepth){

    let begin = last = Date.now()
    let coded = 0
    let known = {}    
    let ways = transers.map((x,i)=>1<<i)
    let seeked = ways.reduce((a,b)=> a|b)
    let level = 0
    let que_now 
    let que_next = []
    que_next.push(0)
    array[0] = 0
    while (que_next.length){
        level++        
        que_now = que_next
        que_next = []

        while(que_now.length){
            let nkcs = que_now.pop()
            if (known[nkcs] != seeked){
                if (known[nkcs] === undefined){
                    known[nkcs] = 0
                }
                let kcs = CubeData.getBytes(nkcs)
                for(let i=0; i<transers.length; i++){
                    if ((known[nkcs] & ways[i]) == 0){
                        let ncs = transers[i](kcs)
                        let nncs = CubeData.getCode(ncs)
                        coded++
                        if (known[nncs] === undefined){
                            known[nncs] = 0
                            que_next.push(nncs)
                            var r1 = nncs % 40320
                            var r2 = Math.floor(nncs / 40320 / 3)
                            var idx = r1 + r2*40320
                            array[idx] = level
                        }
                        known[nkcs] += ways[i]
                        known[nncs] += ways[(i + 6)%12]
                    }
                }
            }
        }
        let now = Date.now()
        console.log("T:" + (now-last) + "ms", "Coded:" + coded)
        console.log("L:" + level,"Q:" + que_now.length, "N:" + que_next.length)        
        if (level == levelDepth){
            break
        }
    }
    // let end = Date.now()
    // console.log((end-begin)+"ms")
}

function initDistributionFromZipR2s(){
    var buff = fs.readFileSync(__dirname + "/zipped.data")
    var zipped /*= data.ziped*/ = new Uint8Array(buff)
    var distribution /*= data.distribution*/ = unzipuntranseDistribution(zipped)    
    travesalFullfill(distribution, 6)
    buff = fs.readFileSync(__dirname + "/r2s.data")
    var r2s /*= data.r2s*/ = new Uint16Array(buff.buffer.slice(buff.offset, buff.offset + buff.length))
    return{
        r2s,
        distribution,
    }
}

function unzipuntranseDistribution(ziped){
    var nn = ziped.length/3
    var nn2 = nn + nn
    var unzip = new Uint8Array(nn * 8)
    var bits = new Uint8Array([0,1,2,3,4,5,6,7].map(x=>1<<x))    
    var idx = 0
    for (var i=0; i<nn; i++){
        for(var j=0; j<8; j++){
            unzip[idx] = 14
            unzip[idx] -= (ziped[i] & bits[j]) ? 1:0 
            unzip[idx] -= (ziped[i + nn] & bits[j]) ? 2:0
            unzip[idx] -= (ziped[i + nn2] & bits[j]) ? 4:0            
            idx++
        }
    }
    return unzip
}

const getTranser = function (maplet){
    let _maplet = maplet
    return function(bytes){
        let ret = new Uint8Array(bytes)
        for (let m of _maplet){
            ret[m.dst] = bytes[m.src]
            ret[m.dst + 8] = (bytes[m.src + 8] + m.inc) % 3
        }
        return ret
    }
}

let lt = []
let rt = []
for (let maplet of CubeData.mapping){
    let clw = maplet.map(x=>{return {src: x[0], dst: x[1], inc: x[2]}})
    let acw = maplet.map(x=>{return {src: x[1], dst: x[0], inc: (3-x[2])%3}})

    lt.push(getTranser(clw))
    rt.push(getTranser(acw))

}

const transers = [...lt, ...rt]

Ret = {
    init(){
        if (Ret.inited){
            return
        }
        try {
            obj = initDistributionFromZipR2s()
            Ret.r2s = obj.r2s
            Ret.distribution = obj.distribution
            Ret.inited = true
        } catch (error) {
            console.log(error)
        }
    },
    seekSolve(code){
        if (!this.inited){
            return {
                result: false,
                msg: "solver not inited",
            }

        }
        let r2 = getR2(code)
        if (r2 !== this.r2s[Math.floor(r2 / 3)]){
            return {
                result: false,
                msg: "illegal code r2",
            }
        }
        var path = []
        var bytes = CubeData.getBytes(code)
        var dist = this.distribution[getZCode(code)]
        for (; dist>0;){        
            for (var i=0; i<transers.length; i++){
                var next_bytes = transers[i](bytes)
                var c = CubeData.getCode(next_bytes)
                var next_dist  = this.distribution[getZCode(c)]
                if (next_dist < dist){
                    path.push(i)
                    bytes = next_bytes
                    dist = next_dist
                    break
                }
            }
        }
        return {
            result: true,
            msg: JSON.stringify(path),
        }
    }
}

module.exports = Ret