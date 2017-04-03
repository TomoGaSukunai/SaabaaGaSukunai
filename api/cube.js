const Router = require('koa-router')


const router = Router()

router.post("/api/cube",async(ctx, next)=>{
    //console.log(ctx.req)
    console.log(ctx.request.body['code'])
    ctx.status = 200
    var res = []
    for(var i=0; i<ctx.request.body['code']; i++){
        res.push(i)
    }        
    ctx.body = res// JSON.stringify(res)
    await next()
})

module.exports = (app) => {
    app.use(router.routes())
}