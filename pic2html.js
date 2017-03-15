var fs = require("fs")
var path = require("path")
var pics = fs.readdirSync(path.join(__dirname, "web", "pic"))
console.log(pics)
var str =""
str += "<meta charset='utf=8'>"
str += "<html>"

for (var pic of pics){
    str+="<a href='./pic/" + pic + "'>"+pic.split(".")[0]+"</a>"
}

str += "</html>"

console.log(str)
fs.writeFile(path.join(__dirname,"web","pic.html") ,str)