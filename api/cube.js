const Router = require('koa-router')
const router = Router()
const Solver = require("./cube-data-init")
Solver.init()

router.post("/api/cube", async(ctx, next)=>{
    //console.log(ctx.req)
    console.log(ctx.request.body['code'])
    const seeked = Solver.seekSolve(ctx.request.body['code'])
    ctx.status = seeked.result ? 200 : 500    
    ctx.body = seeked.msg
    await next()
})

module.exports = (app) => {
    app.use(router.routes())
}