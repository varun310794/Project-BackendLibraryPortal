var express=require("express");
var app=express();
var bodyParser=require("body-parser");
var mongoose=require("mongoose");
var passport=require("passport");
var localStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var methodOverride = require("method-override");
var expressValidator=require("express-validator");
var flash=require("connect-flash");
var async=require("async");
var nodeMailer=require("nodemailer");
var crypto=require("crypto");

app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressValidator());
app.use(methodOverride("_method"));
app.use(flash());

mongoose.connect("mongodb://localhost/lms",{useNewUrlParser: true});

//BookSchema------------------------------------------

var bookSchema=new mongoose.Schema({
    name:String,
    author:String,
    id:Number,
    img:String,
    type:String,
    summary:String,
    published:Number,
    cook:[
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "cook"
                }
        ],
    aspen:[
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "aspen"
                }
        ],    
    customers:[
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "customer"
                }
        ]
});

var book=mongoose.model("book",bookSchema);


//-------------------------------------------------
//Cook library Schema
var cookSchema=new mongoose.Schema({
        books:[
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "book"
                }
              ],
        id:Number,
        count:Number,
        location:String,
        shelf:String
});

var cook=mongoose.model("cook", cookSchema);
//-------------------------------------------------
//Aspen Schema
var aspenSchema=new mongoose.Schema({
        books:[
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "book"
                }
              ],
        id:Number,
        count:Number,
        location:String,
        shelf:String
});

var aspen=mongoose.model("aspen", aspenSchema);

//-------------------------------------------------

var customerSchema=new mongoose.Schema({
    name:String,
    id:Number,
    books:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "book"
        }
    ]
});
var customer=mongoose.model("customer", customerSchema);
//-------------------------------------------------

var userSchema=new mongoose.Schema({
    username:String,
    firstname:String,
    lastname:String,
    password:String,
    resetPasswordToken:String,
    resetPasswordExpires:Date
});
userSchema.plugin(passportLocalMongoose);
var user=mongoose.model("user", userSchema);

//passport configuration
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   next();
});


// homepage----------------------------------------

app.get("/",isLoggedIn, function(req, res){
    res.render("login.ejs", {message:req.flash("err")});
});

app.get("/homepage",isLoggedIn, function(req, res){
    res.render("homepage.ejs",{message:req.flash('success')});
});

//books
app.get("/books/new",isLoggedIn, function(req, res){
    res.render("newbooks.ejs");
});

app.get("/books", isLoggedIn, function(req, res){
     var noMatch = null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        
        book.find({$or: [{name: regex,}, {author: regex}, {type: regex}]}, function(err, allbooks){
           if(err){
               console.log(err);
           } else {
              if(allbooks.length < 1) {
                  noMatch = "Sorry! Looks like we do not have that book";
              }
              res.render("books.ejs",{allbooks:allbooks, noMatch: noMatch});
           }
        });
    }else{
        var noMatch = null
    book.find({}, function(err, allbooks){
        if(err){
            console.log(err);
        }else{
            res.render("books.ejs",{allbooks:allbooks,noMatch: noMatch});
        }
    });
}
});

app.post("/books",isLoggedIn, function(req, res){
    var name=req.body.name;
    var author=req.body.author;
    var id=req.body.id;
    var type=req.body.type;
    var img=req.body.img;
    var summary=req.body.summary;
    var published=req.body.published;
    var count=req.body.count;
    var location=req.body.locations;
    var shelf=req.body.shelf;
    var newBook={name:name, author: author, id: id, type:type, img:img, summary:summary, published:published};
    var bookData={id:id, count:count, location:location, shelf:shelf};
    book.findOne({name:req.body.name, author:req.body.author}, function(err, foundBook){
        if(!foundBook){
            console.log(err);
                 book.create(newBook,function(err, theBook){
        if(err){
            console.log(err);
        }else{
             if(req.body.locations==="Cook Library"){   
               cook.create(bookData, function(err, bookData){
                if(err){
                    console.log(err);
                }else{
                    theBook.cook.push(bookData);
                    theBook.save(function(err){
                        if(err){
                            console.log(err);
                        }else{
                            bookData.books.push(theBook);
                            bookData.save(function(err){
                                if(err){
                                    console.log(err);
                                }else{
                                    res.redirect("/books");
                                }
                            });
                        }
                    });
                }
            }); 
            }else{
                aspen.create(bookData, function(err, bookData){
                if(err){
                    console.log(err);
                }else{
                    theBook.aspen.push(bookData);
                    theBook.save(function(err){
                        if(err){
                            console.log(err);
                        }else{
                            bookData.books.push(theBook);
                            bookData.save(function(err){
                                if(err){
                                    console.log(err);
                                }else{
                                    res.redirect("/books");
                                }
                            });
                        }
                    });
                }
            }); 
            }
        }
    });
            } else if(foundBook){
                if(req.body.locations==="Cook Library"){
                cook.findById(foundBook.cook[0], function(err, foundCook){
                    if(err){
                        console.log(err);
                    }else{
                        
                            if(foundBook.cook.length===0){
                                 cook.create(bookData, function(err, bookData){
                    if(err){
                        console.log(err);
                    }else{
                        foundBook.cook.push(bookData);
                        foundBook.save(function(err){
                            if(err){
                                console.log(err);
                            }else{
                                bookData.books.push(foundBook);
                                bookData.save(function(err){
                                    if(err){
                                        console.log(err);
                                    }else{
                                        res.redirect("/books");
                                    }
                                });
                            }
                        });
                    }
                }); 
                            }else{
                       var count=foundCook.count;
                       var newCount=Number(count)+Number(req.body.count);
                       cook.findByIdAndUpdate({_id:foundBook.cook[0]}, {$set:{count:newCount}}, function(err, foundCook){
                           if(err){
                               console.log(err);
                           }else{
                               foundCook.save(function(err){
                                   if(err){
                                       console.log(err);
                                   }else{
                                        res.redirect("/books");       
                                   }
                               });
                                
                           }
                       });
                   }
                    }
                });
                   
                }else{
                   aspen.findById(foundBook.aspen[0], function(err, foundAspen){
                    if(err){
                        console.log(err);
                    }else{
                        
                            if(foundBook.aspen.length===0){
                                 aspen.create(bookData, function(err, bookData){
                    if(err){
                        console.log(err);
                    }else{
                        foundBook.aspen.push(bookData);
                        foundBook.save(function(err){
                            if(err){
                                console.log(err);
                            }else{
                                bookData.books.push(foundBook);
                                bookData.save(function(err){
                                    if(err){
                                        console.log(err);
                                    }else{
                                        res.redirect("/books");
                                    }
                                });
                            }
                        });
                    }
                }); 
                            }else{
                       var count=foundAspen.count;
                       var newCount=Number(count)+Number(req.body.count);
                       aspen.findByIdAndUpdate({_id:foundBook.aspen[0]}, {$set:{count:newCount}}, function(err, foundAspen){
                           if(err){
                               console.log(err);
                           }else{
                               foundAspen.save(function(err){
                                   if(err){
                                       console.log(err);
                                   }else{
                                        res.redirect("/books");       
                                   }
                               });
                                
                           }
                       });
                   }
                    }
                }); 
                }
                
            }
    });
    
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

app.get("/books/:id", function(req, res){
    book.findById(req.params.id, function(err, foundbook){
        if(err){
            console.log(err);
        }else{
            cook.findById(foundbook.cook[0], function(err, foundcook){
                if(err){
                    console.log(err);
                }else{
                    aspen.findById(foundbook.aspen[0], function(err, foundaspen){
                        if(err){
                            console.log(err);
                        }else{
                            res.render("showb.ejs", {foundbook:foundbook, foundcook:foundcook, foundaspen:foundaspen});                            
                        }
                    });
                }
            });
                        
        }
    });
});




app.delete("/:id",isLoggedIn, function(req, res){
   //res.send("hi");
   book.findByIdAndRemove(req.params.id, function(err, removedbook){
       if(err){
           console.log(err);
       }else{
           res.redirect("/books");
       }
   }); 
});
//------------------------------------------------------------

app.get("/customers/new",isLoggedIn, function(req, res){
    res.render("newcustomers.ejs");
});

app.get("/customers", isLoggedIn, function(req, res){
     var noMatch = null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        
        customer.find({$or: [{name: regex,}]}, function(err, allcustomers){
           if(err){
               console.log(err);
           } else {
              if(allcustomers.length < 1) {
                  noMatch = "Sorry! Looks like we do not have that customer in our system";
              }
              res.render("customers.ejs",{allcustomers:allcustomers, noMatch: noMatch});
           }
        });
    }else{
        var noMatch = null
    customer.find({}, function(err, allcustomers){
        if(err){
            console.log(err);
        }else{
            res.render("customers.ejs",{allcustomers:allcustomers,noMatch: noMatch});
        }
    });
}
});



app.post("/customers",isLoggedIn, function(req, res){
    var name=req.body.name;
    var id=req.body.id;
    var newcustomer={name:name, id: id};
    customer.create(newcustomer,function(err, thecustomer){
        if(err){
            console.log(err);
        }else{
            res.redirect("/customers");
        }
    });
});

app.delete("/customers/:id",isLoggedIn, function(req, res){
   //res.send("hi");
   customer.findByIdAndRemove(req.params.id, function(err, removedcustomer){
       if(err){
           console.log(err);
       }else{
           res.redirect("/customers");
       }
   }); 
});

//----------------------------------------------------

app.get("/customers/:id",isLoggedIn, function(req, res){
    customer.findById(req.params.id).populate("books").exec(function(err, fcustomer){
        if(err){
            console.log(err);
        }
        else{
            
            res.render("show.ejs", {fcustomer:fcustomer, error:req.flash("error"), message:req.flash("message"), errorr:req.flash("errorr")});
        }
    });    
});

   

//--------------------------------------------------------
app.post("/customers/:id/checkout",isLoggedIn, function(req, res){
    if(req.body.id===""){
        req.flash("error", "Please enter a valid book id.");
        res.redirect("/customers/" + req.params.id);
    }else{
    customer.findById(req.params.id, function(err, foundcustomer){
        if(err){
            console.log(err);
        }else{
            var fid=req.body.id;
            book.findOne({id:fid}, function(err, foundbook){
                if(!foundbook){
                   req.flash("message", "Sorry!No corresponding book found on that ID.");
                   res.redirect("/customers/" + req.params.id);    
                }else{
                if(err){
                    console.log(err);
                }else{
                    
                    if(req.body.locations==="Cook Library"){
                        cook.findById(foundbook.cook[0], function(err, foundcook){
                        if(!foundcook){
                            console.log(err);
                            req.flash("errorr", "Sorry! This book is not available.");
                            res.redirect("/customers/" + req.params.id);
                        }else{
                            var count=Number(foundcook.count);
                            var newCount=count-1;
                            cook.findByIdAndUpdate({_id:foundbook.cook[0]}, {$set:{count:newCount}}, function(err, foundCook){
                             if(err){
                                console.log(err);
                             }else{
                                foundcustomer.books.push(foundbook);
                    foundcustomer.save(function(err, data){
                        if(err){
                            console.log(err);
                        }
                    foundbook.customers.push(foundcustomer);
                    foundbook.save(function(err, data){
                        if(err){
                            console.log(err);
                        }else{
                            res.redirect("/customers/" + req.params.id);
                        }
                    });
                    }); 
                                
                        }
                    });
                        }
                    });    
                    }else{
                        aspen.findById(foundbook.aspen[0], function(err, foundaspen){
                        if(!foundaspen){
                            console.log(err);
                            req.flash("errorr", "Sorry! This book is not available.");
                            res.redirect("/customers/" + req.params.id);
                        }else{
                            var count=Number(foundaspen.count);
                            var newCount=count-1;
                            aspen.findByIdAndUpdate({_id:foundbook.aspen[0]}, {$set:{count:newCount}}, function(err, foundaspen){
                             if(err){
                                console.log(err);
                             }else{
                                 foundcustomer.books.push(foundbook);
                    foundcustomer.save(function(err, data){
                        if(err){
                            console.log(err);
                        }
                    foundbook.customers.push(foundcustomer);
                    foundbook.save(function(err, data){
                        if(err){
                            console.log(err);
                        }else{
                             res.redirect("/customers/" + req.params.id);
                        }
                    });
                    });
        
                        }
                    });
                        }
                    }); 
                    }    
                    
                        
                    
                    
                }
            }});
            
        }
    });    
    }    
    });

//---------------------------------------------------------
 app.post("/customers/:cid/:bid/checkin",isLoggedIn, function(req, res){
    
customer.findById(req.params.cid, function(err, foundcustomer){
        if(err){
            console.log(err);
        }else{
            book.findById(req.params.bid, function(err, foundbook){
                
                if(err){
                    console.log(err);
                }else{
                    foundcustomer.books.pull(foundbook);
                    foundcustomer.save(function(err, data){
                        if(err){
                            console.log(err);
                        }
                        foundbook.customers.pull(foundcustomer);
                        foundbook.save(function(err, data){
                        if(err){
                            console.log(err);
                        }else{
                            res.redirect("/customers/" + req.params.cid);    
                        }
                    });
                    });
                }
            });
        }
    });
    
});

app.get("/employees", isLoggedIn, function(req, res){
    user.find({}, function(err, data){
        if(err){
            console.log(err);
        }else{
            res.render("employees.ejs", {data:data});
        }
    });
});

// Authentication-------------------------------------------------------
//show sign up form
 app.get("/register", function(req, res, next){
    res.render("register.ejs", {message:req.flash("errors"),mes:req.flash("error")});
    
 });

//Sign UP logic
app.post("/register", function(req, res){
    req.check('firstname', 'Please enter your First Name').isLength({min: 1});
    req.check('lastname', 'Please enter your Last Name').isLength({min: 1});
    req.check('password', 'Passwords must be greater than 6 charecters').isLength({min: 6});
    req.check('confirmpassword', 'passwords do not match').equals(req.body.password);
   
    var errors = req.validationErrors();
      
      if (errors) {
        console.log(errors);
        req.flash("errors", errors);
        res.redirect("/register");
        
      } else {
        var newUser = new user(
        {
            firstname: req.body.firstname,
            lastname:  req.body.lastname,
            username:  req.body.username
        }
        );
    
            user.register(newUser, req.body.password, function(err, user){
            if(err){
                console.log(err);
               req.flash("error", "Sorry! User with this email already exists.");
                return res.render("register.ejs",{message:req.flash("errors"), mes:req.flash("error")});
            }
            passport.authenticate("local")(req, res, function(){
            res.redirect("/"); 
        });
        });
      }
   
    
});

// show login form
app.get("/login", function(req, res){
   res.render("login.ejs",{message:req.flash("error")}); 
});

// login logic
//app.post("/login", passport.authenticate("local", {successRedirect: "/homepage",failureRedirect: "/login"}), function(req, res){}); 

app.post('/login', function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      return console.log(err);
    }
    if (!user) {
      console.log(info);// this will print the IncorrectUsernameError: Password or username is incorrect
      req.flash('error', info.message );
      return res.redirect('/login');
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect('/homepage');
    });
  })(req, res, next);
});

// logout route
app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/login");
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

//forgotPassword
app.get("/forgot", function(req, res){
    res.render("forgot.ejs", {forgotError:req.flash("error"), forgotSuccess:req.flash("success") });
});

app.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      user.findOne({ username: req.body.username }, function(err, user) {
        if(err){
            console.log(err);
        }else{  
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }}

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodeMailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'librarymanagementsystem745@gmail.com',
          pass: 'librarymanagementsystem'
        }
      });
      var mailOptions = {
        to: user.username,
        from: 'librarymanagementsystem745@gmail.com',
        subject: 'LMS Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.username + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

app.get('/reset/:token', function(req, res) {
  user.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if(err){
        console.log(err);
    }else{
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }}
    res.render('reset.ejs', {token: req.params.token, message:req.flash('error'), message1:req.flash('error1'), message2:req.flash('error2')});
  });
});

app.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      user.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if(err){
            console.log(err);
        }
        if (!user) {
          req.flash('error1', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirmpassword) {
          user.setPassword(req.body.password, function(err) {
              if(err){
                  console.log(err);
              }
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
                if(err){
                    console.log(err);
                }
              req.logIn(user, function(err) {
                if(err){
                    console.log(err);
                }
                
                    done(err, user);
              });
            });
          });
        } else {
            req.flash("error2", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodeMailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'librarymanagementsystem745@gmail.com',
          pass: 'librarymanagementsystem'
        }
      });
      var mailOptions = {
        to: user.username,
        from: 'librarymanagementsystem745@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
          if(err){
              console.log(err);
          }
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
      if(err){
          console.log(err);
      }
    res.redirect('/homepage');
  });
});

//-----------------------------------------------------
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The server has started");
});

