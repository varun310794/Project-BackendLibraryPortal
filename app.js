var express=require("express");
var app=express();
var bodyParser=require("body-parser");
//var mongoose=require("mongoose");

var methodOverride = require("method-override");
app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));

//mongoose.connect('mongodb://varun:database1@ds155293.mlab.com:55293/lms', { useNewUrlParser: true });
// homepage----------------------------------------
app.get("/", function(req, res){
    res.render("homepage.ejs");
});
//new books------------------------------------------
app.get("/books", function(req, res){
    res.render("books.ejs");
});
//new 
app.get("/customers", function(req, res){
    res.render("customers.ejs");
});

app.get("/employees", function(req, res){
    res.render("employees.ejs");
});



app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The server has started");
});