var fs = require("fs")
var path = require("path")
try{
var pics = fs.readdirSync(path.join(__dirname, "web", "pic"))
console.log(pics)
var str =""
str += "<meta charset='utf=8'>\n"
str += "<html>\n"
str += "<style>a{font: 40px;}</style>"

for (var pic of pics){
    str+="<a href='./pic/" + pic + "'>"+pic.split(".")[0]+"</a>\n"
}

str += "</html>\n"

console.log(str)
fs.writeFile(path.join(__dirname,"web","pic.html") ,str)
}catch(err){
    console.log(err)
}
