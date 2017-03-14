'use strict'
var koa = require('koa');
var serve = require('koa-static');

var app = koa();

app.use(serve("./web"));
//debugger
app.listen(8080);
console.log(8080)