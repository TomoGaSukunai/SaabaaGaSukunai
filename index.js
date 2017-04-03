const koa = require('koa')
const logger = require('koa-logger')
const serve = require('koa-static')
const bodyParser = require('koa-bodyparser')

var app = new koa()

app.use(logger())

app.use(bodyParser())

require('./api/cube')(app)

app.use(serve("./web"))
//debugger
app.listen(8080);
console.log(8080)