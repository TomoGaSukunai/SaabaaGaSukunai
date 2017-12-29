var myCanvas = document.getElementById("myCanvas")
myCanvas.width = myCanvas.clientWidth
myCanvas.height = myCanvas.clientHeight

function getEye() {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]
}
function get_projection(angle, a, zMin, zMax) {
    var ang = Math.tan((angle * 0.5) * Math.PI / 180)
    return [
        0.5 / ang, 0, 0, 0,
        0, 0.5 * a / ang, 0, 0,
        0, 0, -(zMax + zMin) / (zMax - zMin), -1,
        0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0,
    ]
}

addEventListener("resize", function () {
    myCanvas.width = myCanvas.clientWidth
    myCanvas.height = myCanvas.clientHeight
    project_matrix = get_projection(40, myCanvas.width / myCanvas.height, 1, 100)
})

function initGL(canvas) {
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    if (gl === null) {
        alert("Your broswer does not support webgl")
        throw new Error("no gl error")
    }
    return gl
}

function createBlocks(CubeData) {
    var senpaiFace = 5
    var Blocks = []
    for (var i in CubeData.vertices_f) {
        //color part
        var vertices = []
        var colors = []
        var indices = []
        //tex part
        var vertices2 = []
        var uvs = []
        var indices2 = []

        var v0 = CubeData.vertices[i]
        //create 3 outer faces
        for (var j = 0; j < 3; j++) {

            var face = CubeData.faces[CubeData.vertices_f[i][j]]
            var face_prev = CubeData.faces[CubeData.vertices_f[i][(j + 2) % 3]]
            var face_next = CubeData.faces[CubeData.vertices_f[i][(j + 1) % 3]]
            vertices.push(v0)
            vertices.push(face.map((x, k) => x + face_prev[k]))
            vertices.push(face)
            vertices.push(face.map((x, k) => x + face_next[k]))

            if (CubeData.vertices_f[i][j] === senpaiFace){

                var xyz = face.indexOf(face.reduce((a,b)=>a+b))
                indices2.push(CubeData.quad_indices.map(k => k + vertices2.length))
                vertices2.push(...vertices.slice(-4))
                uvs.push(... (vertices2.slice(-4).map(x=>x.slice(0,xyz).concat(x.slice(xyz+1)))))

            }else{
                //with color of face
                indices.push(CubeData.quad_indices.map(k => k + vertices.length - 4))
            }
            var c = CubeData.faces_color[CubeData.vertices_f[i][j]]
            colors.push(c, c, c, c)
        }
        // create inner faces
        //
        indices.push(CubeData.conner_indices.map(k => k + vertices.length))
        //
        vertices.push([0, 0, 0])
        for (var j = 0; j < 3; j++) {
            vertices.push(vertices[4 * j + 1])
            vertices.push(vertices[4 * j + 2])
        }
        //

        var c = [0.9, 0.9, 0.9]
        colors.push(c, c, c, c, c, c, c)

        //move block a bit away from origin point
        vertices = vertices.map(v => v.map((k, i) => k + v0[i] * 0.1))
        vertices2 = vertices2.map(v => v.map((k, i) => k + v0[i] * 0.1))
        //
        vertices = vertices.reduce((a, b) => [...a, ...b])
        indices = indices.reduce((a, b) => [...a, ...b])
        colors = colors.reduce((a, b) => [...a, ...b])
        vertices2 = vertices2.reduce((a, b) => [...a, ...b],[])
        indices2 = indices2.reduce((a, b) => [...a, ...b],[])
        uvs = uvs.reduce((a,b)=>[...a,...b],[])
        uvs = uvs.map(x=>(1 - x)/2)
        var Block = { vertices, indices, colors , vertices2, indices2 , uvs }
        Block.idx = parseInt(i)
        //console.log(uvs)
        Blocks.push(Block)
    }

    return Blocks
}

function bufferInit(Obj, gl = gl) {
    Obj.move_matrix = getEye()

    var vertex_buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Obj.vertices), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    var color_buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Obj.colors), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    var index_buffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Obj.indices), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    Obj.vertex_buffer = vertex_buffer
    Obj.color_buffer = color_buffer
    Obj.index_buffer = index_buffer


    var vertex_buffer2 = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer2)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Obj.vertices2), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    var uv_buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, uv_buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Obj.uvs), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    var index_buffer2 = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer2)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Obj.indices2), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    Obj.vertex_buffer2 = vertex_buffer2
    Obj.uv_buffer = uv_buffer
    Obj.index_buffer2 = index_buffer2
}

function textureInit(img){

    var texit = function(){
        var tex = gl.createTexture()
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, tex)

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST)
        gl.generateMipmap(gl.TEXTURE_2D)
        console.log("texture ready")
    }
    if (img.complete){
        texit()
    }else{
        img.onload = texit
    }
}


function shaderInit(vertSource, fragSource, gl = gl) {
    var vertShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertShader, vertSource)
    gl.compileShader(vertShader)

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragShader, fragSource)
    gl.compileShader(fragShader)

    var shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertShader)
    gl.attachShader(shaderProgram, fragShader)
    gl.linkProgram(shaderProgram)
    gl.useProgram(shaderProgram)

    return shaderProgram
}

function rotateZ(m, angle) {
    var c = Math.cos(angle)
    var s = Math.sin(angle)
    var mv0 = m[0], mv4 = m[4], mv8 = m[8];
    m[0] = c * m[0] - s * m[1]
    m[4] = c * m[4] - s * m[5]
    m[8] = c * m[8] - s * m[9]
    m[1] = c * m[1] + s * mv0
    m[5] = c * m[5] + s * mv4
    m[9] = c * m[9] + s * mv8
}
function rotateX(m, angle) {
    var c = Math.cos(angle)
    var s = Math.sin(angle)
    var mv1 = m[1], mv5 = m[5], mv9 = m[9];
    m[1] = c * m[1] - s * m[2]
    m[5] = c * m[5] - s * m[6]
    m[9] = c * m[9] - s * m[10]
    m[2] = c * m[2] + s * mv1
    m[6] = c * m[6] + s * mv5
    m[10] = c * m[10] + s * mv9
}
function rotateY(m, angle) {
    var c = Math.cos(angle)
    var s = Math.sin(angle)
    var mv2 = m[2], mv6 = m[6], mv10 = m[10];
    m[2] = c * m[2] - s * m[0]
    m[6] = c * m[6] - s * m[4]
    m[10] = c * m[10] - s * m[8]
    m[0] = c * m[0] + s * mv2
    m[4] = c * m[4] + s * mv6
    m[8] = c * m[8] + s * mv10
}

function draw() {
    gl.viewport(0, 0, myCanvas.width, myCanvas.height)
    gl.enable(gl.DEPTH_TEST)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    var now = Date.now()
    var dt = now - timeStamp
    timeStamp = now

    //rotateY(move_matrix, 0.01*60/1000*dt)
    rotateY(move_matrix, rY)
    rotateX(move_matrix, rX)

    if (!keyState.lock && keyState.f) {
        var bool = true
        var axis = 0
        var rot = false
        if (animation_que.length == 0)
            rot = true
        switch (keyState.code) {
            case "KeyQ": case "Q": bool = false
            case "KeyA": case "A": axis = 0
                break
            case "KeyW": case "W": bool = false
            case "KeyS": case "S": axis = 1
                break
            case "KeyE": case "E": bool = false
            case "KeyD": case "D": axis = 2
                break
            case "KeyR": case "R": bool = false
            case "KeyF": case "F": axis = 3
                break
            case "KeyT": case "T": bool = false
            case "KeyG": case "G": axis = 4
                break
            case "KeyY": case "Y": bool = false
            case "KeyH": case "H": axis = 5
                break
            case "ArrowLeft":
            case "LEFT":
                rY -= 0.1
                rot = false
                break
            case "ArrowRight":
            case "RIGHT":
                rY += 0.1
                rot = false
                break
            case "ArrowUp":
            case "UP":
                rX = Math.max(-Math.PI / 3, rX - 0.1)
                rot = false
                break
            case "ArrowDown":
            case "DOWN":
                rX = Math.min(Math.PI / 3, rX + 0.1)
                rot = false
                break
            case "Space":
            case " ":
                //TODO
                keyState.lock = true
                xhrTest()
                rot = false
                break
            default: {
                rot = false
                console.log(keyState.code)
            }
        }
        if (rot) {
            rotateCubeAnimation(axis, bool)
        } else {
            //console.log(rX,rY)
        }
        keyState.f = false
    }

    if (animation_que.length > 0) {
        if (animation_que[0](dt)) {
            animation_que.splice(0, 1)
        }
    } else {
        keyState.lock = false
    }

    //color part
    gl.useProgram(shaderProgram)
    gl.uniformMatrix4fv(Pmatrix, false, project_matrix)
    gl.uniformMatrix4fv(Vmatrix, false, view_matrix)
    gl.uniformMatrix4fv(Mmatrix, false, move_matrix)


    for (var idx in Blocks) {

        var Block = Blocks[idx]

        gl.uniformMatrix4fv(Lmatrix, false, Block.move_matrix)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Block.index_buffer)

        gl.bindBuffer(gl.ARRAY_BUFFER, Block.vertex_buffer)
        gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0)

        gl.bindBuffer(gl.ARRAY_BUFFER, Block.color_buffer)
        gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0)

        gl.drawElements(gl.TRIANGLES, Block.indices.length, gl.UNSIGNED_SHORT, 0)


    }
    //texture part
    gl.useProgram(shaderProgram2)
    gl.uniformMatrix4fv(Pmatrix2, false, project_matrix)
    gl.uniformMatrix4fv(Vmatrix2, false, view_matrix)
    gl.uniformMatrix4fv(Mmatrix2, false, move_matrix)


    for (var idx in Blocks) {

        var Block = Blocks[idx]

        gl.uniformMatrix4fv(Lmatrix2, false, Block.move_matrix)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Block.index_buffer2)

        gl.bindBuffer(gl.ARRAY_BUFFER, Block.vertex_buffer2)
        gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0)

        gl.bindBuffer(gl.ARRAY_BUFFER, Block.uv_buffer)
        gl.vertexAttribPointer(texture, 2, gl.FLOAT, false, 0, 0)

        gl.uniform1i(sampler, 0)

        gl.drawElements(gl.TRIANGLES, Block.indices2.length, gl.UNSIGNED_SHORT, 0)
    }

    move_matrix = getEye()

    requestAnimationFrame(draw)
}


function rotateCubeAnimation(i, b = true) {
    var f = function (dt) {
        var face = CubeData.faces[i]
        var t0 = 120
        var r = (b ? -1 : 1) / t0
        var t = t0
        return function (dt) {
            var dt = Math.min(t, dt)
            t -= dt
            for (var maplet of CubeData.mapping[i]) {
                var src = b ? maplet[0] : maplet[1]
                var Block = Blocks[src]
                rotateX(Block.move_matrix, Math.PI / 2 * face[0] * r * dt)
                rotateY(Block.move_matrix, Math.PI / 2 * face[1] * r * dt)
                rotateZ(Block.move_matrix, Math.PI / 2 * face[2] * r * dt)
            }
            if (t == 0) {
                var tBlocks = Blocks.map(x => x);
                for (var maplet of CubeData.mapping[i]) {
                    var src = b ? maplet[0] : maplet[1]
                    var dst = b ? maplet[1] : maplet[0]
                    tBlocks[dst] = Blocks[src]
                }
                Blocks = tBlocks
                cubeStatus = mappingStatus(i, b, cubeStatus)
                //blocksCheck()
                return true
            }
            return false
        }
    }()
    animation_que.push(f)
}

function mappingStatus(i, b, status) {
    var nextStatus = status.map(x => x)
    for (var maplet of CubeData.mapping[i]) {
        var src = b ? maplet[0] : maplet[1]
        var dst = b ? maplet[1] : maplet[0]
        var inc = b ? maplet[2] : (3 - maplet[2]) % 3
        nextStatus[dst] = status[src]
        nextStatus[dst + 8] = (status[src + 8] + inc) % 3
    }
    return nextStatus;
}

var Blocks

var project_matrix = get_projection(40, myCanvas.width / myCanvas.height, 1, 100)
var view_matrix = getEye()
view_matrix[14] = view_matrix[14] - 6
var move_matrix = getEye()


var shaderProgram

var coord
var color

var Pmatrix
var Vmatrix
var Mmatrix
var Lmatrix

var shaderProgram2
var coord2
var texture

var Pmatrix2
var Vmatrix2
var Mmatrix2
var Lmatrix2

var timeStamp = Date.now()
var rY = -0.5
var rX = 0.5
var animation_que = []
var cubeStatus = CubeData.getBytes(0)
var keyState = { f: false, lock: false }





function main() {
    var gl = initGL(myCanvas)

    Blocks = createBlocks(CubeData)
    for (var Block of Blocks) {
        bufferInit(Block, gl)
    }

    textureInit(document.getElementById("tex-senpai"))

    var vertSource = document.getElementById("shader-vs").text
    var fragSource = document.getElementById("shader-fs").text
    shaderProgram = shaderInit(vertSource, fragSource, gl)

    coord = gl.getAttribLocation(shaderProgram, "coordinates")
    gl.enableVertexAttribArray(coord)

    color = gl.getAttribLocation(shaderProgram, "color")
    gl.enableVertexAttribArray(color)

    Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix")
    Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix")
    Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix")
    Lmatrix = gl.getUniformLocation(shaderProgram, "Lmatrix")

    var vertSource2 = document.getElementById("shader-vs2").text
    var fragSource2 = document.getElementById("shader-fs2").text
    shaderProgram2 = shaderInit(vertSource2, fragSource2, gl)

    coord2 = gl.getAttribLocation(shaderProgram2, "coordinates")
    gl.enableVertexAttribArray(coord2)

    texture = gl.getAttribLocation(shaderProgram2, "uvs")
    gl.enableVertexAttribArray(texture)

    Pmatrix2 = gl.getUniformLocation(shaderProgram2, "Pmatrix")
    Vmatrix2 = gl.getUniformLocation(shaderProgram2, "Vmatrix")
    Mmatrix2 = gl.getUniformLocation(shaderProgram2, "Mmatrix")
    Lmatrix2 = gl.getUniformLocation(shaderProgram2, "Lmatrix")

    sampler = gl.getUniformLocation(shaderProgram2,"uSampler")

    window.addEventListener("keydown", function (e) {
        keyState.f = true
        keyState.code = e.code || e.key.toUpperCase()
        //console.log(e)
    })

    var vkeys = document.querySelector("#vkeys")
    var QWERTY = "QWERTY ASDFGH "
    for (var i = 0; i < QWERTY.length; i++) {
        var k = QWERTY[i]
        if (k !== " ") {
            var but = document.createElement("button")
            but.className = "vkey"
            but.innerHTML = k
            but.onclick = function () {
                var x = k
                return function () {
                    keyState.f = true
                    keyState.code = x
                }
            }()
            vkeys.appendChild(but)
        } else {
            var br = document.createElement("br")
            vkeys.appendChild(br)
        }
    }
    var space = document.createElement("button")
    space.className = "vkey2"
    space.innerHTML = "Space"
    space.onclick = function () {
        keyState.f = true
        keyState.code = " "
    }
    vkeys.appendChild(space)
    draw()
}

main()


var info = document.getElementById("info")

function xhrTest() {
    var xhr = new XMLHttpRequest()
    xhr.timeout = 5000
    xhr.open("POST", "/api/cube", true)
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
    xhr.send("code=" + CubeData.getCode(cubeStatus))
    info.style.display = "block"
    info.innerHTML = "Recieving solution..."
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            info.style.display = "none"
            JSON.parse(xhr.response).map(x => rotateCubeAnimation(x % 6, x < 6))
        } else if (xhr.readyState == 4 && xhr.status != 200) {
            info.innerHTML = "failed to get solve from sevice, please retry"
            setTimeout(function () {
                info.style.display = "none"
            }, 2000);
        }
    }
}