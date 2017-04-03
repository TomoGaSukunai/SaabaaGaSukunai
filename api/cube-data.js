module.exports = function(){
    return {
        getBytes(code){                
            let r1 = code % 40320
            let r2 = Math.floor(code / 40320)
            let t = 40320
            let ret = new Uint8Array(16)
            let used = ret.slice(0,8).map(x=>false)
            for(let i=0; i<8; i++){
                t /= (8-i)
                ret[i] = Math.floor(r1/t)
                ret[15-i] = r2 % 3
                r1 %= t
                r2 /= 3
            }
            for(let i=0; i<8; i++){
                for (let j=0; j<=ret[i]; j++){
                    if(used[j]){
                        ret[i]++
                    }
                }
                used[ret[i]] = true
            }
            return ret
        },
        getCode(bytes){
            let r1 = 0
            let r2 = 0        
            for(let i=0; i<8; i++){
                let t = bytes[i]
                for(let j=0; j<i; j++){
                    if(bytes[i] > bytes[j]){
                        t--
                    }
                }
                r2 = (r2 *3 + bytes[8+i])
                r1 = (r1*(8-i) + t)
            }
            return (r1 + 40320 *r2)
        },
        mapping: [
            [[0,2,0],[1,0,1],[2,3,0],[3,1,2]],
            [[0,1,0],[1,5,1],[4,0,2],[5,4,0]],
            [[0,4,2],[2,0,1],[4,6,2],[6,2,1]],
            [[4,5,1],[5,7,1],[6,4,2],[7,6,2]],
            [[2,6,0],[3,2,1],[6,7,2],[7,3,0]],
            [[1,3,2],[3,7,1],[5,1,0],[7,5,0]],
        ],

    }
}()